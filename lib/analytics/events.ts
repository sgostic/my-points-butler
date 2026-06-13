/* Canonical analytics event taxonomy.

   This is the single source of truth for event names on the client. It MUST
   stay in sync with the `event_name` enum in
   supabase/migrations/0001_analytics.sql — adding an event means adding it in
   both places. See docs/ANALYTICS.md. */

export const EVENTS = {
  // cross-cutting / auto-captured by the provider
  PAGE_VIEW: "page_view",
  SESSION_START: "session_start",
  SESSION_END: "session_end",
  RETURNING_VISITOR: "returning_visitor",
  SCROLL_DEPTH: "scroll_depth",
  CTA_CLICKED: "cta_clicked",
  VARIANT_SWITCHED: "variant_switched",

  // points / wallet
  POINTS_ENTERED: "points_entered",
  CARD_ADDED: "card_added",
  CARD_REMOVED: "card_removed",

  // goals (variant c)
  GOAL_ADDED: "goal_added",
  GOAL_REMOVED: "goal_removed",
  GOAL_REORDERED: "goal_reordered",

  // discovery / filtering
  INTEREST_TOGGLED: "interest_toggled",
  FITS_ONLY_TOGGLED: "fits_only_toggled",
  RESULT_TAB_SWITCHED: "result_tab_switched",
  RESULT_FILTERED: "result_filtered",
  MAP_PIN_CLICKED: "map_pin_clicked",
  TRIP_MODAL_OPENED: "trip_modal_opened",
  VERDICT_VIEWED: "verdict_viewed",

  // auth / gating
  AUTH_MODAL_OPENED: "auth_modal_opened",
  GATE_UNLOCK_CLICKED: "gate_unlock_clicked",
  SIGNUP_COMPLETED: "signup_completed",
  SIGNIN_COMPLETED: "signin_completed",
  SIGNOUT_COMPLETED: "signout_completed",

  // feedback / monetization
  FEEDBACK_OPENED: "feedback_opened",
  FEEDBACK_SUBMITTED: "feedback_submitted",
  PAY_INTENT: "pay_intent",
  ALERT_CREATED: "alert_created",

  // not-yet-built features (tables + ingest ready; UI wired later)
  SHARE_CLICKED: "share_clicked",
  CHAT_OPENED: "chat_opened",
  CHAT_MESSAGE_SENT: "chat_message_sent",
  CONTACT_SUBMITTED: "contact_submitted",
  EMAIL_SUBSCRIBED: "email_subscribed",
  DONATE_CLICKED: "donate_clicked",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

/** Every valid event name, for server-side validation. */
export const EVENT_NAMES: readonly EventName[] = Object.values(EVENTS);

const EVENT_NAME_SET = new Set<string>(EVENT_NAMES);

export function isEventName(value: unknown): value is EventName {
  return typeof value === "string" && EVENT_NAME_SET.has(value);
}

/* Events flushed to the server immediately rather than waiting for the batch
   timer — high-value conversions we never want to lose to a closed tab. */
export const IMPORTANT_EVENTS: ReadonlySet<EventName> = new Set<EventName>([
  EVENTS.SIGNUP_COMPLETED,
  EVENTS.SIGNIN_COMPLETED,
  EVENTS.FEEDBACK_SUBMITTED,
  EVENTS.PAY_INTENT,
  EVENTS.ALERT_CREATED,
  EVENTS.EMAIL_SUBSCRIBED,
  EVENTS.CONTACT_SUBMITTED,
  EVENTS.DONATE_CLICKED,
  EVENTS.CHAT_MESSAGE_SENT,
]);

export type VariantKey = "a" | "b" | "c" | "d";
export type Scale = "yes" | "maybe" | "no";

/* The wire shape a single tracked event takes in the POST body. */
export interface TrackedEvent {
  name: EventName;
  properties?: Record<string, unknown>;
  occurredAt: string; // ISO timestamp (client clock)
}

/* Context captured once per batch and applied to every event in it. */
export interface TrackContext {
  path: string;
  referrer?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
}

/* Full POST /api/track request body. */
export interface TrackRequestBody {
  visitorId?: string;
  sessionId: string;
  variant?: VariantKey;
  context: TrackContext;
  events: TrackedEvent[];
}
