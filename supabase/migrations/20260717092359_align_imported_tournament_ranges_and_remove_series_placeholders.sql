
with imported_ranges as (
  select tournament_id,min(date)::date min_date,max(date)::date max_date
  from public.matches
  where source='liquipedia_import' and tournament_id is not null
  group by tournament_id
)
update public.tournaments t
set start_date=v.min_date,end_date=v.max_date,status='completed'
from imported_ranges v
where t.id=v.tournament_id
  and (t.start_date is distinct from v.min_date
    or t.end_date is distinct from v.max_date
    or lower(coalesce(t.status,'')) <> 'completed');

delete from public.tournaments
where id in (
  '3f8cc5b3-3ce3-4bb9-962e-11abda740cec',
  '0dd3f30a-3463-467a-81b4-5843cb4a62ed'
)
and source='manual_pending_verification'
and start_date is null
and end_date is null
and not exists (
  select 1 from public.matches m where m.tournament_id=tournaments.id
);
;
