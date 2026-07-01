-- =====================================================================
-- 0002_onboarding_events.sql — /start onboarding funnel analytics
-- ---------------------------------------------------------------------
-- Adds the onboarding funnel event names and a normalized projection
-- (`onboarding_responses`) that captures a visitor's full questionnaire
-- answers as one queryable row.
--
-- WHY A MIGRATION IS REQUIRED:
--   `public.events.event_name` is a Postgres ENUM. Inserting any name that
--   isn't a member of the enum fails the INSERT, so the app/api/track route
--   would silently drop these events. New event names MUST be added to the
--   enum here AND to the EVENTS map in lib/analytics/events.ts (kept in sync).
--
-- NOTE: `ALTER TYPE ... ADD VALUE` cannot be used in the SAME transaction that
-- also consumes the value. This migration only adds values and creates a table
-- (it never inserts events using the new values), so it is safe to run as-is.
--
-- Run in the Supabase SQL editor or via `supabase db push`.
-- =====================================================================

-- ---------- New event names (drop-off funnel + Q&A capture) ----------
alter type public.event_name add value if not exists 'onboarding_started';
alter type public.event_name add value if not exists 'onboarding_step_viewed';
alter type public.event_name add value if not exists 'onboarding_question_answered';
alter type public.event_name add value if not exists 'onboarding_completed';
alter type public.event_name add value if not exists 'onboarding_email_submitted';
alter type public.event_name add value if not exists 'onboarding_skipped';
alter type public.event_name add value if not exists 'onboarding_exited';

-- ---------- Normalized projection: completed questionnaires ----------
-- One row per completed /start questionnaire. `responses` holds the full
-- answer set keyed by question id (e.g. { "priority": "Flights",
-- "rewards_held": ["Chase","Amex"] }); the raw `events` stream remains the
-- source of truth. Written by app/api/track on `onboarding_completed`.
create table public.onboarding_responses (
  id          bigint generated always as identity primary key,
  visitor_id  uuid references public.visitors (visitor_id) on delete set null,
  session_id  uuid references public.sessions (session_id) on delete set null,
  user_id     uuid references auth.users (id) on delete set null,
  variant     public.variant_key,
  responses   jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index onboarding_responses_visitor_idx on public.onboarding_responses (visitor_id);
create index onboarding_responses_gin on public.onboarding_responses using gin (responses);

-- Same lockdown as the rest of the analytics tables: RLS on, no anon/auth
-- policies (default-deny). Only the service-role /api/track route can write.
alter table public.onboarding_responses enable row level security;
