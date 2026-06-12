-- 0003_returning_visitor_views.sql
-- Returning-visitor metric, derived (not stored).
--
-- "Return visit" is the headline currency, but until now it only existed as a
-- client-fired `returning_visitor` event. This defines it server-side as a
-- queryable projection so reporting doesn't depend on the client guessing right.
--
-- Definition: a visitor is "returning" when they have sessions on 2+ distinct
-- UTC calendar days. Derived from the `sessions` projection (one row per
-- session_start) keyed by visitor_id.
--
-- security_invoker = on  → the view respects the underlying tables' RLS instead
-- of running as the (privileged) view owner. Combined with the explicit revoke
-- below this keeps reads service-role-only, matching the rest of the schema.

create or replace view public.visitor_return_metrics
with (security_invoker = on) as
select
  s.visitor_id,
  count(distinct s.session_id)                                as session_count,
  count(distinct (s.started_at at time zone 'utc')::date)     as active_days,
  min(s.started_at)                                           as first_session_at,
  max(s.started_at)                                           as last_session_at,
  (max((s.started_at at time zone 'utc')::date)
     - min((s.started_at at time zone 'utc')::date))          as day_span,
  (count(distinct (s.started_at at time zone 'utc')::date) >= 2) as is_returning
from public.sessions s
group by s.visitor_id;

comment on view public.visitor_return_metrics is
  'Per-visitor return metric derived from sessions: distinct active UTC days per visitor_id. is_returning = active on 2+ distinct days.';

-- Headline KPI rollup: returning visitors / total visitors.
create or replace view public.returning_visitor_summary
with (security_invoker = on) as
select
  count(*)                                       as total_visitors,
  count(*) filter (where is_returning)           as returning_visitors,
  round(
    count(*) filter (where is_returning)::numeric
      / nullif(count(*), 0), 4)                  as return_rate
from public.visitor_return_metrics;

comment on view public.returning_visitor_summary is
  'Headline KPI: returning_visitors / total_visitors, where a visitor is returning when active on 2+ distinct UTC days.';

-- Default-deny: reads only via the service-role key, like every other table.
revoke all on public.visitor_return_metrics from anon, authenticated;
revoke all on public.returning_visitor_summary from anon, authenticated;
