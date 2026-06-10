-- 0002_returning_visitor_event.sql
--
-- Adds the `returning_visitor` event, fired when a known visitor starts a new
-- session (a return visit). Identity is keyed off the durable client-side
-- `pb_visitor` record (localStorage) / `pb_vid` cookie.
--
-- IMPORTANT: keep this enum value in sync with the `EVENTS` map in
-- lib/analytics/events.ts. See docs/ANALYTICS.md.
--
-- Note: `alter type ... add value` cannot run inside a transaction block in
-- older Postgres, and the new value can't be used in the same transaction it's
-- created in. Run this migration on its own.

alter type public.event_name add value if not exists 'returning_visitor';
