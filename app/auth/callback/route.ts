import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getSafeRedirectPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeRedirectPath(requestUrl.searchParams.get("next"));
  // Set when the user came from a "sign up" CTA (see getAuthCallbackUrl).
  const signupIntent = requestUrl.searchParams.get("intent") === "signup";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const redirectUrl = new URL(next, requestUrl.origin);
      // Flag signups so the client can fire signup analytics (Meta Pixel
      // CompleteRegistration + signup_completed). We treat the return as a
      // signup when ANY of these hold:
      //   1. The user arrived via a "sign up" CTA (explicit intent).
      //   2. It's an email-confirmation exchange — those links are only ever
      //      used once, right after signup (returning password users use
      //      signInWithPassword and never reach this route).
      //   3. First-ever authentication — created_at and last_sign_in_at are
      //      within seconds of each other (fallback for sign-in-button signups).
      const user = data.user;
      const provider = user?.app_metadata?.provider;
      const isEmailConfirmation = provider === "email";

      let isFirstAuth = false;
      if (user?.created_at && user.last_sign_in_at) {
        const created = new Date(user.created_at).getTime();
        const signedIn = new Date(user.last_sign_in_at).getTime();
        isFirstAuth = Math.abs(signedIn - created) < 5000;
      }

      if (signupIntent || isEmailConfirmation || isFirstAuth) {
        redirectUrl.searchParams.set("signup", provider ?? "oauth");
      }
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.redirect(
    new URL("/auth/auth-code-error", requestUrl.origin),
  );
}
