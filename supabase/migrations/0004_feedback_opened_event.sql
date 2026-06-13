-- 0004_feedback_opened_event.sql
--
-- Adds the `feedback_opened` event, fired when a user clicks the CTA that opens
-- the feedback modal (before they submit). Lets us measure open→submit drop-off
-- on the feedback form across every A/B variant.
--
-- IMPORTANT: keep this enum value in sync with the `EVENTS` map in
-- lib/analytics/events.ts. See docs/ANALYTICS.md.
--
-- Note: `alter type ... add value` cannot run inside a transaction block in
-- older Postgres, and the new value can't be used in the same transaction it's
-- created in. Run this migration on its own.

alter type public.event_name add value if not exists 'feedback_opened';
