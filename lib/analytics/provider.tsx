"use client";

/* Mounts once (in app/layout.tsx) and auto-captures the cross-cutting signals:
   session start, page views, scroll depth, time-on-page (session_end via
   sendBeacon on unload), and links visitor → user on auth state changes.
   Per-interaction events are tracked explicitly from each component's handler. */

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { resolveVariant } from "@/components/pages";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ensureSession, flush, setVariant, track } from "./client";
import { EVENTS } from "./events";

const SCROLL_THRESHOLDS = [25, 50, 75, 100] as const;

export function AnalyticsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const variant = resolveVariant(searchParams.get("variant") ?? undefined);
  const startedAtRef = useRef<number>(0);
  const maxScrollRef = useRef<number>(0);
  const firedThresholdsRef = useRef<Set<number>>(new Set());

  // Keep the active variant on the client so every event is tagged with it.
  useEffect(() => {
    setVariant(variant);
  }, [variant]);

  // Session start + page view.
  useEffect(() => {
    startedAtRef.current = Date.now();
    const { isNew } = ensureSession();
    if (isNew) {
      track(EVENTS.SESSION_START, {
        variant,
        referrer: typeof document !== "undefined" ? document.referrer : undefined,
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      });
    }
    track(EVENTS.PAGE_VIEW, { variant });
    // Intentionally run once per mount; variant changes within the SPA are
    // reported via variant_switched from the nav, not a new page_view here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll depth (throttled via rAF) + time-on-page on unload.
  useEffect(() => {
    let ticking = false;

    const computeScroll = () => {
      ticking = false;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const pct =
        scrollable <= 0
          ? 100
          : Math.min(100, Math.round((doc.scrollTop / scrollable) * 100));
      if (pct > maxScrollRef.current) maxScrollRef.current = pct;
      for (const threshold of SCROLL_THRESHOLDS) {
        if (pct >= threshold && !firedThresholdsRef.current.has(threshold)) {
          firedThresholdsRef.current.add(threshold);
          track(EVENTS.SCROLL_DEPTH, { pct: threshold });
        }
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(computeScroll);
    };

    const endSession = () => {
      track(EVENTS.SESSION_END, {
        durationMs: Date.now() - startedAtRef.current,
        maxScrollPct: maxScrollRef.current,
      });
      flush(true);
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") endSession();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", endSession);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", endSession);
    };
  }, []);

  // Link visitor → user when auth state changes (server resolves user_id from
  // the session cookie; the flush just nudges the next batch to carry it).
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        flush();
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return <>{children}</>;
}
