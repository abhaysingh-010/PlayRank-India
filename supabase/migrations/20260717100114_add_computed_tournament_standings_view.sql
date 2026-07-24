
create or replace view public.tournament_computed_standings
with (security_invoker = true)
as
select
  m.tournament_id,
  r.team_id,
  count(distinct r.match_id)::integer as matches_played,
  count(*) filter (where r.placement = 1)::integer as wins,
  coalesce(sum(r.kills),0)::integer as kills,
  coalesce(sum(r.placement_points),0)::integer as placement_points,
  coalesce(sum(r.kill_points),0)::integer as kill_points,
  coalesce(sum(r.total_points),0)::integer as points,
  round(avg(r.placement)::numeric,2) as average_placement,
  dense_rank() over (
    partition by m.tournament_id
    order by
      coalesce(sum(r.total_points),0) desc,
      coalesce(sum(r.kills),0) desc,
      avg(r.placement) asc
  )::integer as rank
from public.team_match_results r
join public.matches m on m.id=r.match_id
where m.tournament_id is not null
group by m.tournament_id,r.team_id;

grant select on public.tournament_computed_standings to anon,authenticated;
;
