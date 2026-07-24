create or replace function public.refresh_playrank_rankings()
returns void
language plpgsql
security invoker
set search_path to 'public', 'pg_temp'
as $function$
begin
  if not pg_try_advisory_xact_lock(hashtext('refresh_playrank_rankings')) then
    raise exception 'refresh_playrank_rankings already running';
  end if;

  create temporary table tmp_old_rankings on commit drop as
  select entity_type, entity_id, rank, score
  from public.rankings
  where entity_type in ('team', 'player');

  create temporary table tmp_new_rankings (
    entity_type text not null,
    entity_id uuid not null,
    rank integer not null,
    score integer not null,
    primary key (entity_type, entity_id)
  ) on commit drop;

  with weighted_team_matches as (
    select
      tmr.team_id,
      case
        when m.date >= now() - interval '90 days' then 1.00::numeric
        when m.date >= now() - interval '180 days' then 0.75::numeric
        else 0.50::numeric
      end as weight,
      coalesce(tmr.total_points, 0)::numeric as points,
      coalesce(tmr.kills, 0)::numeric as kills,
      case when tmr.placement = 1 then 1::numeric else 0::numeric end as win
    from public.team_match_results tmr
    join public.matches m on m.id = tmr.match_id
    where m.date >= now() - interval '365 days'
      and m.date <= now() + interval '1 day'
  ),
  team_scores as (
    select
      t.id,
      t.name,
      count(*)::int as recent_matches,
      round(
        (
          sum(wtm.points * wtm.weight) / nullif(sum(wtm.weight), 0) * 10
          + sum(wtm.kills * wtm.weight) / nullif(sum(wtm.weight), 0) * 12
          + sum(wtm.win * wtm.weight) / nullif(sum(wtm.weight), 0) * 200
        )
        * (0.60 + 0.40 * least(1::numeric, sum(wtm.weight) / 12)),
        0
      )::int as score
    from public.teams t
    join weighted_team_matches wtm on wtm.team_id = t.id
    where coalesce(t.active, false) = true
    group by t.id, t.name
    having count(*) >= 6
  ),
  ranked_teams as (
    select
      id,
      row_number() over (
        order by score desc, recent_matches desc, name asc
      )::int as rank,
      score
    from team_scores
  )
  insert into tmp_new_rankings (entity_type, entity_id, rank, score)
  select 'team', id, rank, score
  from ranked_teams;

  with weighted_player_matches as (
    select
      pms.player_id,
      case
        when m.date >= now() - interval '90 days' then 1.00::numeric
        when m.date >= now() - interval '180 days' then 0.75::numeric
        else 0.50::numeric
      end as weight,
      coalesce(pms.kills, 0)::numeric as kills,
      coalesce(pms.damage, 0)::numeric as damage,
      case
        when coalesce(pms.mvp, false) or coalesce(pms.is_mvp, false)
          then 1::numeric
        else 0::numeric
      end as mvp
    from public.player_match_stats pms
    join public.matches m on m.id = pms.match_id
    where m.date >= now() - interval '365 days'
      and m.date <= now() + interval '1 day'
  ),
  player_scores as (
    select
      p.id,
      p.ign,
      count(*)::int as recent_matches,
      round(
        (
          sum(wpm.kills * wpm.weight) / nullif(sum(wpm.weight), 0) * 120
          + sum(wpm.damage * wpm.weight) / nullif(sum(wpm.weight), 0) * 0.50
          + sum(wpm.mvp * wpm.weight) / nullif(sum(wpm.weight), 0) * 200
        )
        * (0.50 + 0.50 * least(1::numeric, sum(wpm.weight) / 8)),
        0
      )::int as score
    from public.players p
    join weighted_player_matches wpm on wpm.player_id = p.id
    where coalesce(p.active, false) = true
    group by p.id, p.ign
  ),
  ranked_players as (
    select
      id,
      row_number() over (
        order by score desc, recent_matches desc, ign asc
      )::int as rank,
      score
    from player_scores
  )
  insert into tmp_new_rankings (entity_type, entity_id, rank, score)
  select 'player', id, rank, score
  from ranked_players;

  insert into public.rankings (
    entity_type, entity_id, rank, score, change, updated_at
  )
  select
    current.entity_type,
    current.entity_id,
    current.rank,
    current.score,
    coalesce(previous.rank - current.rank, 0),
    now()
  from tmp_new_rankings current
  left join tmp_old_rankings previous
    on previous.entity_type = current.entity_type
   and previous.entity_id = current.entity_id
  on conflict (entity_type, entity_id)
  do update set
    rank = excluded.rank,
    score = excluded.score,
    change = excluded.change,
    updated_at = excluded.updated_at;

  delete from public.rankings existing
  where existing.entity_type in ('team', 'player')
    and not exists (
      select 1
      from tmp_new_rankings current
      where current.entity_type = existing.entity_type
        and current.entity_id = existing.entity_id
    );

  insert into public.ranking_history (
    entity_type, entity_id, rank, score, snapshot_date
  )
  select entity_type, entity_id, rank, score, now()
  from tmp_new_rankings;

  update public.teams
  set global_rank = null;

  update public.teams team_record
  set global_rank = current.rank
  from tmp_new_rankings current
  where current.entity_type = 'team'
    and current.entity_id = team_record.id;
end;
$function$;

revoke execute on function public.refresh_playrank_rankings() from public, anon, authenticated;
grant execute on function public.refresh_playrank_rankings() to service_role;;
