import { type NextRequest, NextResponse } from "next/server";
import {
  EVENTS,
  isEventName,
  type EventName,
  type TrackContext,
  type TrackedEvent,
  type TrackRequestBody,
  type VariantKey,
} from "@/lib/analytics/events";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasServiceRoleKey, isSupabaseConfigured } from "@/lib/supabase/config";

/* Service-role writes must run on Node, never the edge. */
export const runtime = "nodejs";

const VISITOR_COOKIE = "pb_vid";
const VARIANTS: ReadonlySet<string> = new Set(["a", "b", "c", "d"]);
const SCALES: ReadonlySet<string> = new Set(["yes", "maybe", "no"]);

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asVariant(value: unknown): VariantKey | null {
  return typeof value === "string" && VARIANTS.has(value)
    ? (value as VariantKey)
    : null;
}

function asScale(value: unknown): string | null {
  return typeof value === "string" && SCALES.has(value) ? value : null;
}

/** Parse the body from JSON or a sendBeacon text/plain blob. */
async function parseBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    try {
      const text = await request.text();
      return text ? JSON.parse(text) : null;
    } catch {
      return null;
    }
  }
}

function validate(raw: unknown): TrackRequestBody | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Record<string, unknown>;

  const sessionId = asString(body.sessionId);
  if (!sessionId) return null;

  const rawContext = (body.context ?? {}) as Record<string, unknown>;
  const context: TrackContext = {
    path: asString(rawContext.path) ?? "/",
    referrer: asString(rawContext.referrer) ?? undefined,
    utm:
      rawContext.utm && typeof rawContext.utm === "object"
        ? (rawContext.utm as TrackContext["utm"])
        : undefined,
  };

  if (!Array.isArray(body.events)) return null;
  const events: TrackedEvent[] = [];
  for (const item of body.events) {
    if (!item || typeof item !== "object") continue;
    const ev = item as Record<string, unknown>;
    if (!isEventName(ev.name)) continue;
    events.push({
      name: ev.name,
      properties:
        ev.properties && typeof ev.properties === "object"
          ? (ev.properties as Record<string, unknown>)
          : {},
      occurredAt: asString(ev.occurredAt) ?? new Date().toISOString(),
    });
  }
  if (events.length === 0) return null;

  return {
    visitorId: asString(body.visitorId) ?? undefined,
    sessionId,
    variant: asVariant(body.variant) ?? undefined,
    context,
    events,
  };
}

/* Route a high-value event into its normalized projection table. The generic
   `events` row is still written as the single source of truth. */
function projectionFor(
  event: TrackedEvent,
  base: {
    visitor_id: string;
    session_id: string;
    user_id: string | null;
    variant: VariantKey | null;
  },
): { table: string; row: Record<string, unknown> } | null {
  const p = event.properties ?? {};
  switch (event.name) {
    case EVENTS.FEEDBACK_SUBMITTED:
      return {
        table: "feedback_submissions",
        row: {
          visitor_id: base.visitor_id,
          session_id: base.session_id,
          user_id: base.user_id,
          variant: base.variant,
          context: asString(p.context),
          liked: asString(p.liked),
          disliked: asString(p.disliked),
          helps: asScale(p.helps),
          would_pay: asScale(p.wouldPay),
          monthly_price: asString(p.monthlyPrice),
        },
      };
    case EVENTS.EMAIL_SUBSCRIBED: {
      const email = asString(p.email);
      if (!email) return null;
      return {
        table: "email_subscriptions",
        row: {
          email,
          visitor_id: base.visitor_id,
          user_id: base.user_id,
          variant: base.variant,
          source: asString(p.source),
        },
      };
    }
    case EVENTS.CONTACT_SUBMITTED: {
      const message = asString(p.message);
      if (!message) return null;
      return {
        table: "contact_messages",
        row: {
          email: asString(p.email),
          message,
          visitor_id: base.visitor_id,
          user_id: base.user_id,
          variant: base.variant,
        },
      };
    }
    case EVENTS.DONATE_CLICKED:
      return {
        table: "donations",
        row: {
          visitor_id: base.visitor_id,
          user_id: base.user_id,
          variant: base.variant,
          amount: typeof p.amount === "number" ? p.amount : null,
          currency: asString(p.currency) ?? "USD",
          status: "intent",
        },
      };
    case EVENTS.ONBOARDING_COMPLETED: {
      const responses =
        p.responses && typeof p.responses === "object" ? p.responses : null;
      if (!responses) return null;
      return {
        table: "onboarding_responses",
        row: {
          visitor_id: base.visitor_id,
          session_id: base.session_id,
          user_id: base.user_id,
          variant: base.variant,
          responses,
        },
      };
    }
    case EVENTS.CHAT_MESSAGE_SENT: {
      const conversationId = asString(p.conversationId);
      const content = asString(p.content);
      const role = p.role === "assistant" ? "assistant" : "user";
      if (!conversationId || !content) return null;
      return {
        table: "chat_messages",
        row: {
          conversation_id: conversationId,
          role,
          content,
          visitor_id: base.visitor_id,
          session_id: base.session_id,
          user_id: base.user_id,
          variant: base.variant,
        },
      };
    }
    default:
      return null;
  }
}

export async function POST(request: NextRequest) {
  // Quietly accept-and-drop if the backend isn't wired up, so the client
  // helper degrades to a no-op rather than erroring in the console.
  if (!isSupabaseConfigured() || !hasServiceRoleKey()) {
    return new NextResponse(null, { status: 204 });
  }

  const body = validate(await parseBody(request));
  if (!body) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  // Authoritative visitor id comes from the HTTP-only cookie; fall back to the
  // client-echoed value only when the cookie hasn't propagated yet.
  const visitorId =
    request.cookies.get(VISITOR_COOKIE)?.value ?? body.visitorId ?? null;
  if (!visitorId) {
    return NextResponse.json({ error: "no visitor" }, { status: 400 });
  }

  // Resolve the authenticated user (if any) from the session cookie.
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    userId = null;
  }

  const admin = createAdminClient();
  const { sessionId, variant, context, events } = body;
  const base = {
    visitor_id: visitorId,
    session_id: sessionId,
    user_id: userId,
    variant: variant ?? null,
  };

  const hasStart = events.some((e) => e.name === EVENTS.SESSION_START);
  const endEvent = events.find((e) => e.name === EVENTS.SESSION_END);
  const maxScroll = events.reduce<number | null>((max, e) => {
    if (e.name !== EVENTS.SCROLL_DEPTH) return max;
    const pct = Number((e.properties ?? {}).pct);
    if (!Number.isFinite(pct)) return max;
    return Math.max(max ?? 0, pct);
  }, null);

  try {
    // 1) Upsert the visitor (back-fills user_id once they authenticate).
    await admin.from("visitors").upsert(
      {
        visitor_id: visitorId,
        last_seen_at: new Date().toISOString(),
        user_id: userId,
        first_variant: variant ?? null,
        first_referrer: context.referrer ?? null,
        first_utm: context.utm ?? null,
      },
      { onConflict: "visitor_id", ignoreDuplicates: false },
    );

    // 2) Session: insert on session_start, otherwise patch the rollup fields.
    if (hasStart) {
      await admin.from("sessions").upsert(
        {
          session_id: sessionId,
          visitor_id: visitorId,
          user_id: userId,
          variant: variant ?? null,
          entry_path: context.path,
          referrer: context.referrer ?? null,
          utm: context.utm ?? null,
          last_event_at: new Date().toISOString(),
        },
        { onConflict: "session_id", ignoreDuplicates: false },
      );
    }

    if (endEvent) {
      const durationMs = Number((endEvent.properties ?? {}).durationMs);
      await admin
        .from("sessions")
        .update({
          ended_at: new Date().toISOString(),
          last_event_at: new Date().toISOString(),
          duration_ms: Number.isFinite(durationMs) ? durationMs : null,
          ...(maxScroll != null ? { max_scroll_pct: Math.round(maxScroll) } : {}),
        })
        .eq("session_id", sessionId);
    } else {
      await admin
        .from("sessions")
        .update({
          last_event_at: new Date().toISOString(),
          ...(maxScroll != null ? { max_scroll_pct: Math.round(maxScroll) } : {}),
        })
        .eq("session_id", sessionId);
    }

    // 3) Bulk-insert the raw event stream.
    const rows = events.map((e) => ({
      event_name: e.name as EventName,
      variant: variant ?? null,
      visitor_id: visitorId,
      session_id: sessionId,
      user_id: userId,
      properties: e.properties ?? {},
      path: context.path,
      referrer: context.referrer ?? null,
      utm_source: context.utm?.source ?? null,
      utm_medium: context.utm?.medium ?? null,
      utm_campaign: context.utm?.campaign ?? null,
      utm_term: context.utm?.term ?? null,
      utm_content: context.utm?.content ?? null,
      occurred_at: e.occurredAt,
    }));
    await admin.from("events").insert(rows);

    // 4) Side-effect routing into normalized projections.
    const byTable = new Map<string, Record<string, unknown>[]>();
    for (const e of events) {
      const projection = projectionFor(e, base);
      if (!projection) continue;
      const list = byTable.get(projection.table) ?? [];
      list.push(projection.row);
      byTable.set(projection.table, list);
    }
    await Promise.all(
      Array.from(byTable.entries()).map(([table, list]) => {
        if (table === "email_subscriptions") {
          return admin
            .from(table)
            .upsert(list, { onConflict: "email", ignoreDuplicates: true });
        }
        return admin.from(table).insert(list);
      }),
    );
  } catch {
    // Never surface ingest errors to the client; analytics is best-effort.
    return new NextResponse(null, { status: 204 });
  }

  return new NextResponse(null, { status: 204 });
}
