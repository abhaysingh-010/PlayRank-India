
create or replace view public.tournament_public_coverage
with (security_invoker = true)
as
select
  t.id,
  t.name,
  t.slug,
  t.organizer,
  t.status,
  t.location,
  t.prize_pool,
  t.participating_teams,
  t.start_date,
  t.end_date,
  t.verified,
  t.source,
  t.source_url,
  coalesce(m.map_count, 0)::integer as map_count,
  coalesce(s.standing_count, 0)::integer as standing_count,
  (coalesce(m.map_count, 0) > 0 or coalesce(s.standing_count, 0) > 0) as has_coverage
from public.tournaments t
left join (
  select tournament_id, count(*) as map_count
  from public.matches
  group by tournament_id
) m on m.tournament_id = t.id
left join (
  select tournament_id, count(*) as standing_count
  from public.tournament_standings
  group by tournament_id
) s on s.tournament_id = t.id;

grant select on public.tournament_public_coverage to anon, authenticated;
;
