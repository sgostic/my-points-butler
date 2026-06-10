"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSiteUrl, isSupabaseConfigured } from "@/lib/supabase/config";
import { EVENTS, track } from "@/lib/analytics";

export type AuthMode = "sign-in" | "sign-up";

export function getAuthCallbackUrl() {
  const origin =
    typeof window === "undefined" ? getSiteUrl() : window.location.origin;
  const next =
    typeof window === "undefined"
      ? "/"
      : `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const callbackUrl = new URL("/auth/callback", origin.replace(/\/$/, ""));
  callbackUrl.searchParams.set("next", next);

  return callbackUrl.toString();
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Authentication failed.";
}

export function useAuth() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("sign-up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    if (!isConfigured) {
      return;
    }

    let isMounted = true;
    let authSubscription: { unsubscribe: () => void } | undefined;

    Promise.resolve()
      .then(async () => {
        const supabase = createClient();
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          if (isMounted) {
            setUserEmail(session?.user.email ?? "");
          }
        });
        authSubscription = subscription;
        return supabase.auth.getUser();
      })
      .then(({ data }) => {
        if (isMounted) {
          setUserEmail(data.user?.email ?? "");
        }
      })
      .catch(() => {
        // Not signed in is fine on the landing page.
      });

    return () => {
      isMounted = false;
      authSubscription?.unsubscribe();
    };
  }, [isConfigured]);

  function openAuthModal(mode: AuthMode) {
    track(EVENTS.AUTH_MODAL_OPENED, { mode });
    setAuthMode(mode);
    setIsAuthOpen(true);
    setMessage(
      isConfigured
        ? ""
        : "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local to enable authentication.",
    );
    setError("");
  }

  async function handleEmailAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!isConfigured) {
      setError("Supabase environment variables are not configured.");
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || password.length < 6) {
      setError("Enter an email and a password with at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();

      if (authMode === "sign-up") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: { emailRedirectTo: getAuthCallbackUrl() },
        });
        if (signUpError) throw signUpError;

        if (data.session) {
          track(EVENTS.SIGNUP_COMPLETED, { method: "email" });
          setIsAuthOpen(false);
          return;
        }
        setMessage("Check your email to confirm your account, then sign in.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (signInError) throw signInError;

      track(EVENTS.SIGNIN_COMPLETED, { method: "email" });
      setIsAuthOpen(false);
    } catch (authError) {
      setError(getErrorMessage(authError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleAuth() {
    setMessage("");
    setError("");

    if (!isConfigured) {
      setError("Supabase environment variables are not configured.");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: getAuthCallbackUrl() },
      });
      if (googleError) throw googleError;
    } catch (authError) {
      setError(getErrorMessage(authError));
      setIsSubmitting(false);
    }
  }

  async function handleSignOut() {
    if (!isConfigured) {
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      track(EVENTS.SIGNOUT_COMPLETED);
      setUserEmail("");
    } catch {
      // Ignore sign-out errors.
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    isAuthOpen,
    setIsAuthOpen,
    authMode,
    setAuthMode,
    email,
    setEmail,
    password,
    setPassword,
    userEmail,
    isSubmitting,
    message,
    error,
    setMessage,
    setError,
    isConfigured,
    openAuthModal,
    handleEmailAuth,
    handleGoogleAuth,
    handleSignOut,
  };
}

export function PBSignupGate({
  isSignedIn,
  onSignUp,
  title,
  body,
  ctaLabel = "Sign up to unlock",
  note = "Free account. No card credentials required.",
  className = "",
  children,
}: {
  isSignedIn: boolean;
  onSignUp: () => void;
  title: string;
  body: string;
  ctaLabel?: string;
  note?: string;
  className?: string;
  children: ReactNode;
}) {
  if (isSignedIn) {
    return <>{children}</>;
  }

  return (
    <div className={"pb-gate" + (className ? " " + className : "")}>
      <div className="pb-gate-preview" aria-hidden="true" inert>
        {children}
      </div>
      <div className="pb-gate-panel">
        <span className="pb-gate-kicker">Account required</span>
        <h3>{title}</h3>
        <p>{body}</p>
        <button
          type="button"
          className="pb-gate-btn"
          onClick={() => {
            track(EVENTS.GATE_UNLOCK_CLICKED, {
              gateContext: className || title,
            });
            onSignUp();
          }}
        >
          {ctaLabel}
        </button>
        <span className="pb-gate-note">{note}</span>
      </div>
    </div>
  );
}

type AuthModalProps = Pick<
  ReturnType<typeof useAuth>,
  | "authMode"
  | "setAuthMode"
  | "email"
  | "setEmail"
  | "password"
  | "setPassword"
  | "isSubmitting"
  | "message"
  | "error"
  | "setMessage"
  | "setError"
  | "setIsAuthOpen"
  | "handleEmailAuth"
  | "handleGoogleAuth"
>;

export function AuthModal(props: AuthModalProps) {
  const {
    authMode,
    setAuthMode,
    email,
    setEmail,
    password,
    setPassword,
    isSubmitting,
    message,
    error,
    setMessage,
    setError,
    setIsAuthOpen,
    handleEmailAuth,
    handleGoogleAuth,
  } = props;

  return (
    <div
      className="pb-auth-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pb-auth-title"
    >
      <div className="pb-auth-card">
        <div className="pb-auth-head">
          <div>
            <h2 id="pb-auth-title">
              {authMode === "sign-up"
                ? "Start your account"
                : "Sign in to continue"}
            </h2>
            <p>Use email or continue with Google.</p>
          </div>
          <button
            className="pb-auth-x"
            type="button"
            onClick={() => setIsAuthOpen(false)}
            aria-label="Close"
          >
            Close
          </button>
        </div>

        <div className="pb-auth-tabs">
          <button
            type="button"
            aria-pressed={authMode === "sign-up"}
            onClick={() => {
              setAuthMode("sign-up");
              setMessage("");
              setError("");
            }}
          >
            Sign up
          </button>
          <button
            type="button"
            aria-pressed={authMode === "sign-in"}
            onClick={() => {
              setAuthMode("sign-in");
              setMessage("");
              setError("");
            }}
          >
            Sign in
          </button>
        </div>

        <form className="pb-auth-form" onSubmit={handleEmailAuth}>
          <label>
            <span className="pb-auth-label">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
          <label>
            <span className="pb-auth-label">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create or enter password"
              autoComplete={
                authMode === "sign-up" ? "new-password" : "current-password"
              }
            />
          </label>

          {error ? <p className="pb-auth-msg is-error">{error}</p> : null}
          {message ? <p className="pb-auth-msg is-ok">{message}</p> : null}

          <button
            type="submit"
            className="pb-auth-submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Working..."
              : authMode === "sign-up"
                ? "Create account"
                : "Sign in with email"}
          </button>

          <button
            type="button"
            className="pb-auth-google"
            onClick={handleGoogleAuth}
            disabled={isSubmitting}
          >
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M2.4 7.7v8.8c0 1 .8 1.8 1.8 1.8h2.9V10.5L2.4 7.7Z"
                fill="#4285F4"
              />
              <path
                d="M16.9 18.3h2.9c1 0 1.8-.8 1.8-1.8V7.7l-4.7 2.8v7.8Z"
                fill="#34A853"
              />
              <path
                d="M16.9 4.8 12 8.4 7.1 4.8 6.7 8l5.3 3.9L17.3 8l-.4-3.2Z"
                fill="#EA4335"
              />
              <path
                d="M2.4 7.7 7.1 11V4.8L4 2.5A1 1 0 0 0 2.4 3.3v4.4Z"
                fill="#C5221F"
              />
              <path
                d="M16.9 11 21.6 7.7V3.3A1 1 0 0 0 20 2.5l-3.1 2.3V11Z"
                fill="#FBBC04"
              />
            </svg>
            Continue with Google
          </button>
        </form>
      </div>
    </div>
  );
}
