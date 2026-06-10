-- =====================================================================
-- 0001_analytics.sql — My Points Butler analytics + structured capture
-- ---------------------------------------------------------------------
-- Append-only event stream (`events`) plus normalized projections for the
-- high-value records we want to query directly. Anonymous visitors are
-- identified by a durable `visitor_id` cookie; once they authenticate the
-- visitor row is linked to `auth.users`.
--
-- Writes happen ONLY through app/api/track, which uses the service-role key
-- (bypasses RLS). RLS is enabled with no anon/authenticated policies, so the
-- publishable key shipped to the browser can neither read nor write here.
--
-- Run in the Supabase SQL editor or via `supabase db push`.
-- IMPORTANT: the `event_name` enum below must stay in sync with
-- lib/analytics/events.ts (the EVENTS map).
-- =====================================================================

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ---------- Enums ----------
create type public.variant_key as enum ('a', 'b', 'c', 'd');

-- Canonical event names. Adding a new event = add a value here AND in
-- lib/analytics/events.ts.
create type public.event_name as enum (
  -- cross-cutting / auto-captured
  'page_view',
  'session_start',
  'session_end',
  'scroll_depth',
  'cta_clicked',
  'variant_switched',
  -- points / wallet
  'points_entered',
  'card_added',
  'card_removed',
  -- goals (variant c)
  'goal_added',
  'goal_removed',
  'goal_reordered',
  -- discovery / filtering
  'interest_toggled',
  'fits_only_toggled',
  'result_tab_switched',
  'result_filtered',
  'map_pin_clicked',
  'trip_modal_opened',
  'verdict_viewed',
  -- auth / gating
  'auth_modal_opened',
  'gate_unlock_clicked',
  'signup_completed',
  'signin_completed',
  'signout_completed',
  -- feedback / monetization
  'feedback_submitted',
  'pay_intent',
  'alert_created',
  -- not-yet-built features (tables + ingest ready; UI wired later)
  'share_clicked',
  'chat_opened',
  'chat_message_sent',
  'contact_submitted',
  'email_subscribed',
  'donate_clicked'
);

-- ---------- Visitors (returning-visitor + identity link) ----------
create table public.visitors (
  visitor_id    uuid primary key default gen_random_uuid(),
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  user_id       uuid references auth.users (id) on delete set null,
  first_variant public.variant_key,
  first_referrer text,
  first_utm     jsonb,
  session_count int not null default 0
);
create index visitors_user_id_idx on public.visitors (user_id);

-- ---------- Sessions (time-spent + per-session rollups) ----------
create table public.sessions (
  session_id     uuid primary key, -- minted client-side (sessionStorage)
  visitor_id     uuid not null references public.visitors (visitor_id) on delete cascade,
  user_id        uuid references auth.users (id) on delete set null,
  variant        public.variant_key,
  started_at     timestamptz not null default now(),
  last_event_at  timestamptz not null default now(),
  ended_at       timestamptz,
  duration_ms    bigint,
  max_scroll_pct smallint, -- 0..100
  event_count    int not null default 0,
  entry_path     text,
  referrer       text,
  utm            jsonb,
  user_agent     text
);
create index sessions_visitor_idx on public.sessions (visitor_id);
create index sessions_user_idx on public.sessions (user_id);
create index sessions_started_idx on public.sessions (started_at desc);

-- ---------- Generic append-only event stream (event sourcing) ----------
create table public.events (
  id           bigint generated always as identity primary key,
  event_name   public.event_name not null,
  variant      public.variant_key,
  visitor_id   uuid not null references public.visitors (visitor_id) on delete cascade,
  session_id   uuid references public.sessions (session_id) on delete set null,
  user_id      uuid references auth.users (id) on delete set null,
  properties   jsonb not null default '{}'::jsonb,
  path         text,
  referrer     text,
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  utm_term     text,
  utm_content  text,
  occurred_at  timestamptz not null, -- client clock (event time)
  received_at  timestamptz not null default now() -- server ingest time
);
create index events_name_idx on public.events (event_name);
create index events_variant_idx on public.events (variant);
create index events_visitor_idx on public.events (visitor_id);
create index events_session_idx on public.events (session_id);
create index events_user_idx on public.events (user_id);
create index events_occurred_idx on public.events (occurred_at desc);
create index events_props_gin on public.events using gin (properties);

-- ---------- Normalized high-value projections ----------

-- "How much would you pay" + qualitative feedback (feedback-modal.tsx)
create table public.feedback_submissions (
  id            bigint generated always as identity primary key,
  visitor_id    uuid references public.visitors (visitor_id) on delete set null,
  session_id    uuid references public.sessions (session_id) on delete set null,
  user_id       uuid references auth.users (id) on delete set null,
  variant       public.variant_key,
  context       text, -- e.g. "Book Tokyo"
  liked         text,
  disliked      text,
  helps         text check (helps in ('yes', 'maybe', 'no')),
  would_pay     text check (would_pay in ('yes', 'maybe', 'no')),
  monthly_price text, -- free text ("$5 / month")
  created_at    timestamptz not null default now()
);
create index feedback_user_idx on public.feedback_submissions (user_id);

-- Email subscription ("tell me when it's live" / deal alerts)
create table public.email_subscriptions (
  id         bigint generated always as identity primary key,
  email      text not null,
  visitor_id uuid references public.visitors (visitor_id) on delete set null,
  user_id    uuid references auth.users (id) on delete set null,
  variant    public.variant_key,
  source     text, -- 'footer','alert_cta','hero', etc.
  created_at timestamptz not null default now(),
  unique (email)
);

-- Contact / "email us a question"
create table public.contact_messages (
  id         bigint generated always as identity primary key,
  email      text,
  message    text not null,
  visitor_id uuid references public.visitors (visitor_id) on delete set null,
  user_id    uuid references auth.users (id) on delete set null,
  variant    public.variant_key,
  created_at timestamptz not null default now()
);

-- Donate intent (no payment processor yet — capture the intent/click)
create table public.donations (
  id         bigint generated always as identity primary key,
  visitor_id uuid references public.visitors (visitor_id) on delete set null,
  user_id    uuid references auth.users (id) on delete set null,
  variant    public.variant_key,
  amount     numeric(10, 2), -- nullable: may just be intent
  currency   text default 'USD',
  status     text not null default 'intent', -- 'intent' for now
  created_at timestamptz not null default now()
);

-- Chatbot messages
create table public.chat_messages (
  id              bigint generated always as identity primary key,
  conversation_id uuid not null, -- groups a chat thread
  role            text not null check (role in ('user', 'assistant')),
  content         text not null,
  visitor_id      uuid references public.visitors (visitor_id) on delete set null,
  session_id      uuid references public.sessions (session_id) on delete set null,
  user_id         uuid references auth.users (id) on delete set null,
  variant         public.variant_key,
  created_at      timestamptz not null default now()
);
create index chat_conversation_idx on public.chat_messages (conversation_id);

-- ---------- Row Level Security ----------
-- Enable RLS everywhere and define NO anon/authenticated policies. RLS on +
-- zero policies = default-deny: the browser's publishable/anon key cannot read
-- or write any of these tables. The /api/track route uses the SERVICE ROLE
-- key, which bypasses RLS, so inserts still succeed.
alter table public.visitors enable row level security;
alter table public.sessions enable row level security;
alter table public.events enable row level security;
alter table public.feedback_submissions enable row level security;
alter table public.email_subscriptions enable row level security;
alter table public.contact_messages enable row level security;
alter table public.donations enable row level security;
alter table public.chat_messages enable row level security;

-- Optional (future user dashboard): let a signed-in user read THEIR OWN
-- structured records. Keep raw `events` private — never add a select policy
-- there. Uncomment if/when a dashboard is built.
-- create policy "own feedback" on public.feedback_submissions
--   for select to authenticated using (user_id = auth.uid());
-- create policy "own chat" on public.chat_messages
--   for select to authenticated using (user_id = auth.uid());
