"use client";

/* Browser-side analytics client. Buffers events in memory and POSTs them in
   batches to /api/track. Identity (visitor_id) comes from the `pb_vid_pub`
   cookie minted by the proxy middleware; session_id is minted here and stored
   in sessionStorage so it scopes to the tab/session.

   Degrades to a harmless no-op when running on the server or when the backend
   isn't configured (the route returns 204). */

import {
  EVENTS,
  IMPORTANT_EVENTS,
  type EventName,
  type TrackContext,
  type TrackedEvent,
  type VariantKey,
} from "./events";

const ENDPOINT = "/api/track";
const FLUSH_INTERVAL_MS = 5000;
const MAX_BUFFER = 20;
const SESSION_KEY = "pb_sid";

let buffer: TrackedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let cachedContext: TrackContext | null = null;
let currentVariant: VariantKey | undefined;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function getVisitorId(): string | null {
  return readCookie("pb_vid_pub");
}

/** Get (or mint) the per-tab session id. */
export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = window.sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/* Ensure a session id exists, reporting whether this call created it so the
   provider can decide to emit `session_start` exactly once per session. */
export function ensureSession(): { sessionId: string; isNew: boolean } {
  if (typeof window === "undefined") return { sessionId: "", isNew: false };
  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) return { sessionId: existing, isNew: false };
  const sessionId = crypto.randomUUID();
  window.sessionStorage.setItem(SESSION_KEY, sessionId);
  return { sessionId, isNew: true };
}

function buildContext(): TrackContext {
  if (cachedContext) return cachedContext;
  if (typeof window === "undefined") {
    return { path: "/" };
  }
  const params = new URLSearchParams(window.location.search);
  const utmEntries = (
    ["source", "medium", "campaign", "term", "content"] as const
  ).reduce<Record<string, string>>((acc, key) => {
    const value = params.get(`utm_${key}`);
    if (value) acc[key] = value;
    return acc;
  }, {});

  cachedContext = {
    path: window.location.pathname,
    referrer: document.referrer || undefined,
    utm: Object.keys(utmEntries).length ? utmEntries : undefined,
  };
  return cachedContext;
}

/** Keep the path fresh (SPA navigations) without rebuilding referrer/utm. */
function refreshPath() {
  if (cachedContext && typeof window !== "undefined") {
    cachedContext.path = window.location.pathname;
  }
}

export function setVariant(variant: VariantKey | undefined) {
  currentVariant = variant;
}

function scheduleFlush() {
  if (flushTimer != null) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flush();
  }, FLUSH_INTERVAL_MS);
}

/** Send buffered events. `useBeacon` survives page unload. */
export function flush(useBeacon = false): void {
  if (typeof window === "undefined" || buffer.length === 0) return;

  const visitorId = getVisitorId();
  const payload = {
    visitorId: visitorId ?? undefined,
    sessionId: getSessionId(),
    variant: currentVariant,
    context: buildContext(),
    events: buffer,
  };
  buffer = [];
  if (flushTimer != null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  const json = JSON.stringify(payload);

  if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
    // text/plain avoids a CORS preflight and matches the route's beacon parser.
    navigator.sendBeacon(ENDPOINT, new Blob([json], { type: "text/plain" }));
    return;
  }

  void fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: json,
    keepalive: true,
  }).catch(() => {
    // best-effort; drop on failure
  });
}

/** Record an event. Buffers locally; never blocks the UI. */
export function track(
  name: EventName,
  properties?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  refreshPath();
  buffer.push({
    name,
    properties: properties ?? {},
    occurredAt: new Date().toISOString(),
  });

  if (IMPORTANT_EVENTS.has(name) || buffer.length >= MAX_BUFFER) {
    flush();
  } else {
    scheduleFlush();
  }
}

/* ---- Typed convenience helpers ---------------------------------------- */
/* Most are wired into existing UI; the bottom group is ready for the
   not-yet-built features (share / subscribe / contact / donate / chat). */

export function trackPointsEntered(
  field: string,
  value: number,
  variant?: VariantKey,
) {
  track(EVENTS.POINTS_ENTERED, { field, value, variant });
}

/* Debounced variant for numeric inputs that fire on every keystroke — emits a
   single points_entered once the user pauses (per field/variant). */
const pointsTimers = new Map<string, ReturnType<typeof setTimeout>>();
export function trackPointsEnteredDebounced(
  field: string,
  value: number,
  variant?: VariantKey,
  delay = 600,
) {
  if (typeof window === "undefined") return;
  const key = `${variant ?? ""}:${field}`;
  const existing = pointsTimers.get(key);
  if (existing) clearTimeout(existing);
  pointsTimers.set(
    key,
    setTimeout(() => {
      pointsTimers.delete(key);
      trackPointsEntered(field, value, variant);
    }, delay),
  );
}

export function trackCardAdded(
  type: string,
  program: string,
  points: number,
) {
  track(EVENTS.CARD_ADDED, { type, program, points });
}

export function trackCardRemoved(id: number | string, program?: string, type?: string) {
  track(EVENTS.CARD_REMOVED, { id, program, type });
}

export function trackMapPin(
  destId: string,
  action: "select" | "toggle",
  variant?: VariantKey,
) {
  track(EVENTS.MAP_PIN_CLICKED, { destId, action, variant });
}

export function trackGate(gateContext: string, variant?: VariantKey) {
  track(EVENTS.GATE_UNLOCK_CLICKED, { gateContext, variant });
}

export function trackFeedback(props: {
  context?: string;
  liked?: string;
  disliked?: string;
  helps?: string | null;
  wouldPay?: string | null;
  monthlyPrice?: string | null;
}) {
  track(EVENTS.FEEDBACK_SUBMITTED, props);
  if (props.wouldPay && props.wouldPay !== "no") {
    track(EVENTS.PAY_INTENT, {
      wouldPay: props.wouldPay,
      monthlyPrice: props.monthlyPrice ?? null,
      context: props.context ?? null,
    });
  }
}

// --- Ready for features that don't exist yet (just call these once built) ---

export function trackShare(method: string, variant?: VariantKey) {
  track(EVENTS.SHARE_CLICKED, { method, variant });
}

export function trackSubscribe(email: string, source: string, variant?: VariantKey) {
  track(EVENTS.EMAIL_SUBSCRIBED, { email, source, variant });
}

export function trackContact(message: string, email?: string, variant?: VariantKey) {
  track(EVENTS.CONTACT_SUBMITTED, { message, email, variant });
}

export function trackDonateIntent(amount?: number, variant?: VariantKey) {
  track(EVENTS.DONATE_CLICKED, { amount, variant });
}

export function trackChatOpened(variant?: VariantKey) {
  track(EVENTS.CHAT_OPENED, { variant });
}

export function trackChatMessage(
  conversationId: string,
  content: string,
  role: "user" | "assistant" = "user",
) {
  track(EVENTS.CHAT_MESSAGE_SENT, { conversationId, content, role });
}
