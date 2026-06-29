-- Sprint 2 SQL Safety Hardening
-- Date: 2026-06-29
-- Scope:
-- 1. Core duplicate-prevention indexes
-- 2. PUBG promotion audit table
-- 3. Hardened readiness views
-- 4. Hardened promotion/ranking functions
-- 5. Disabled broad finalize function

-- ---------------------------------------------------------------------
-- 1. Core duplicate-prevention indexes
-- ---------------------------------------------------------------------

create unique index if not exists player_match_stats_match_player_unique_idx
on public.player_match_stats (match_id, player_id);

create unique index if not exists team_match_results_match_team_unique_idx
on public.team_match_results (match_id, team_id);

create unique index if not exists rankings_entity_unique_idx
on public.rankings (entity_type, entity_id);

-- ---------------------------------------------------------------------
-- 2. PUBG promotion audit table
-- ---------------------------------------------------------------------

create table if not exists public.pubg_core_promotions (
  id uuid primary key default gen_random_uuid(),
  external_match_id text not null,
  core_match_id uuid null references public.matches(id) on delete set null,
  status text not null,
  result jsonb null,
  error_message text null,
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone null,

  constraint pubg_core_promotions_status_check
  check (status in ('started', 'blocked', 'promoted', 'failed'))
);

create index if not exists pubg_core_promotions_external_match_idx
on public.pubg_core_promotions (external_match_id);

create index if not exists pubg_core_promotions_status_idx
on public.pubg_core_promotions (status);

create index if not exists pubg_core_promotions_created_at_idx
on public.pubg_core_promotions (created_at desc);

create unique index if not exists pubg_core_promotions_one_success_idx
on public.pubg_core_promotions (external_match_id)
where status = 'promoted';

-- ---------------------------------------------------------------------
-- 3. Hardened roster health view
-- ---------------------------------------------------------------------

create or replace view public.player_roster_health as
with active_rosters as (
  select
    tr.player_id,
    count(*) as active_roster_count,
    (max((tr.team_id)::text))::uuid as active_roster_team_id
  from public.team_rosters tr
  where tr.active = true
  group by tr.player_id
)
select
  p.id as player_id,
  p.ign,
  p.slug,
  p.team_id as player_team_id,
  t.name as player_team_name,
  ar.active_roster_count,
  ar.active_roster_team_id,
  rt.name as active_roster_team_name,
  case
    when coalesce(p.active, false) is not true then 'inactive_player'
    when p.team_id is not null and coalesce(t.active, false) is not true then 'inactive_player_team'
    when ar.active_roster_team_id is not null and coalesce(rt.active, false) is not true then 'inactive_active_roster_team'
    when p.team_id is null and coalesce(ar.active_roster_count, 0) = 0 then 'no_team_no_active_roster'
    when p.team_id is not null and coalesce(ar.active_roster_count, 0) = 0 then 'player_has_team_but_no_active_roster'
    when coalesce(ar.active_roster_count, 0) > 1 then 'multiple_active_rosters'
    when p.team_id is null and ar.active_roster_team_id is not null then 'active_roster_but_player_team_missing'
    when p.team_id is not null and ar.active_roster_team_id is not null and p.team_id <> ar.active_roster_team_id then 'player_team_roster_mismatch'
    else 'healthy'
  end as health_status,
  case
    when coalesce(p.active, false) = true
      and p.team_id is not null
      and coalesce(t.active, false) = true
      and coalesce(ar.active_roster_count, 0) = 1
      and ar.active_roster_team_id is not null
      and coalesce(rt.active, false) = true
      and p.team_id = ar.active_roster_team_id
    then true
    else false
  end as promotion_safe,
  coalesce(p.active, false) as player_active,
  coalesce(t.active, false) as player_team_active,
  coalesce(rt.active, false) as active_roster_team_active
from public.players p
left join public.teams t
  on t.id = p.team_id
left join active_rosters ar
  on ar.player_id = p.id
left join public.teams rt
  on rt.id = ar.active_roster_team_id;

-- ---------------------------------------------------------------------
-- 4. Hardened PUBG promotion readiness view
-- ---------------------------------------------------------------------

create or replace view public.pubg_match_promotion_readiness as
with participant_roster_counts as (
  select
    p.external_match_id,
    p.external_participant_id,
    count(rp.external_roster_id) as roster_link_count
  from public.pubg_api_participants p
  left join public.pubg_api_roster_participants rp
    on rp.external_match_id = p.external_match_id
   and rp.external_participant_id = p.external_participant_id
  group by
    p.external_match_id,
    p.external_participant_id
),
match_roster_link_health as (
  select
    external_match_id,
    count(*) filter (where roster_link_count = 1) as exactly_one_roster_participants,
    count(*) filter (where roster_link_count = 0) as unlinked_participants,
    count(*) filter (where roster_link_count > 1) as multi_roster_participants
  from participant_roster_counts
  group by external_match_id
),
winner_counts as (
  select
    external_match_id,
    count(*) filter (where won = true) as winner_roster_count
  from public.pubg_api_rosters
  group by external_match_id
),
readiness as (
  select
    m.external_match_id,
    m.shard,
    m.map_name,
    m.game_mode,
    m.created_at_api,

    count(distinct p.id) as total_participants,
    count(distinct p.id) filter (where p.player_account_id like 'ai.%') as ai_participants,
    count(distinct p.id) filter (where p.player_account_id not like 'ai.%') as human_participants,

    count(distinct pm.player_id) filter (where pm.player_id is not null) as mapped_players,
    count(distinct pm.player_id) filter (
      where pm.player_id is not null
        and coalesce(pm.verified, false) = true
    ) as verified_mapped_players,

    count(distinct pl.id) filter (
      where pl.team_id is not null
    ) as mapped_players_with_team,

    count(distinct pl.id) filter (
      where coalesce(pl.active, false) = true
    ) as active_mapped_players,

    count(distinct pl.team_id) filter (
      where pl.team_id is not null
    ) as mapped_teams,

    count(distinct pl.team_id) filter (
      where pl.team_id is not null
        and coalesce(pl.active, false) = true
        and coalesce(tm.active, false) = true
    ) as active_mapped_teams,

    count(distinct rh.player_id) filter (
      where rh.promotion_safe = true
    ) as roster_safe_players,

    count(distinct pl.team_id) filter (
      where rh.promotion_safe = true
        and pl.team_id is not null
    ) as roster_safe_teams,

    coalesce(mlh.exactly_one_roster_participants, 0) as exactly_one_roster_participants,
    coalesce(mlh.unlinked_participants, 0) as unlinked_participants,
    coalesce(mlh.multi_roster_participants, 0) as multi_roster_participants,

    coalesce(wc.winner_roster_count, 0) as winner_roster_count,
    coalesce(ri.processed, false) as raw_import_processed,
    cm.id as promoted_match_id

  from public.pubg_api_matches m
  left join public.raw_esports_imports ri
    on ri.id = m.raw_import_id
   and ri.source = 'pubg_developer_api'
   and ri.source_type = 'api_match'
  left join public.matches cm
    on cm.external_id = ('pubg-api-' || m.external_match_id)
  left join public.pubg_api_participants p
    on p.external_match_id = m.external_match_id
  left join public.pubg_player_mappings pm
    on pm.pubg_player_account_id = p.player_account_id
  left join public.players pl
    on pl.id = pm.player_id
  left join public.teams tm
    on tm.id = pl.team_id
  left join public.player_roster_health rh
    on rh.player_id = pl.id
  left join match_roster_link_health mlh
    on mlh.external_match_id = m.external_match_id
  left join winner_counts wc
    on wc.external_match_id = m.external_match_id
  group by
    m.external_match_id,
    m.shard,
    m.map_name,
    m.game_mode,
    m.created_at_api,
    mlh.exactly_one_roster_participants,
    mlh.unlinked_participants,
    mlh.multi_roster_participants,
    wc.winner_roster_count,
    ri.processed,
    cm.id
)
select
  external_match_id,
  shard,
  map_name,
  game_mode,
  created_at_api,
  total_participants,
  mapped_players,
  mapped_players_with_team,
  mapped_teams,
  round(((mapped_players::numeric / nullif(total_participants, 0)::numeric) * 100), 2) as mapped_player_percentage,

  case
    when promoted_match_id is not null then 'already_promoted'
    when raw_import_processed is not true then 'not_ready_raw_import_unprocessed'
    when total_participants = 0 then 'not_ready_no_participants'
    when human_participants < 8 then 'not_ready_too_few_human_participants'
    when ai_participants > 0 then 'not_ready_contains_ai_participants'
    when exactly_one_roster_participants < total_participants then 'not_ready_roster_link_coverage'
    when winner_roster_count <> 1 then 'not_ready_invalid_winner_count'
    when mapped_players < total_participants then 'not_ready_unmapped_players'
    when verified_mapped_players < total_participants then 'not_ready_unverified_mappings'
    when mapped_players_with_team < total_participants then 'not_ready_players_without_team'
    when active_mapped_players < total_participants then 'not_ready_inactive_players'
    when active_mapped_teams < 2 then 'not_ready_inactive_or_missing_teams'
    when roster_safe_players < total_participants then 'not_ready_roster_health'
    when roster_safe_teams < 2 then 'not_ready_not_enough_safe_teams'
    else 'ready_for_core_promotion'
  end as promotion_status,

  case
    when promoted_match_id is null
      and raw_import_processed is true
      and total_participants >= 8
      and human_participants >= 8
      and ai_participants = 0
      and exactly_one_roster_participants = total_participants
      and winner_roster_count = 1
      and mapped_players = total_participants
      and verified_mapped_players = total_participants
      and mapped_players_with_team = total_participants
      and active_mapped_players = total_participants
      and active_mapped_teams >= 2
      and roster_safe_players = total_participants
      and roster_safe_teams >= 2
    then true
    else false
  end as promotion_allowed,

  roster_safe_players,
  roster_safe_teams,
  greatest((total_participants - mapped_players), 0) as unmapped_players,
  greatest((total_participants - roster_safe_players), 0) as unsafe_roster_players,
  ai_participants,
  human_participants,

  verified_mapped_players,
  active_mapped_players,
  active_mapped_teams,
  exactly_one_roster_participants,
  unlinked_participants,
  multi_roster_participants,
  winner_roster_count,
  raw_import_processed,
  (promoted_match_id is not null) as already_promoted,
  promoted_match_id
from readiness;

-- ---------------------------------------------------------------------
-- 5. Hardened PUBG promotion function
-- ---------------------------------------------------------------------

create or replace function public.promote_pubg_api_match_to_playrank_core(
  target_external_match_id text
)
returns jsonb
language plpgsql
as $function$
declare
  readiness_row public.pubg_match_promotion_readiness%rowtype;
  api_match_row public.pubg_api_matches%rowtype;

  audit_id uuid;
  core_external_id text;
  core_match_id uuid;

  safe_player_count bigint := 0;
  safe_team_count bigint := 0;

  inserted_player_stats int := 0;
  inserted_team_results int := 0;

  result_payload jsonb;
begin
  if target_external_match_id is null or length(trim(target_external_match_id)) = 0 then
    return jsonb_build_object(
      'ok', false,
      'promoted', false,
      'blocked', true,
      'reason', 'missing_external_match_id'
    );
  end if;

  if not pg_try_advisory_xact_lock(
    hashtext('pubg_core_promotion'),
    hashtext(target_external_match_id)
  ) then
    return jsonb_build_object(
      'ok', false,
      'promoted', false,
      'blocked', true,
      'reason', 'promotion_already_running',
      'external_match_id', target_external_match_id
    );
  end if;

  insert into public.pubg_core_promotions (
    external_match_id,
    status,
    result,
    created_at
  )
  values (
    target_external_match_id,
    'started',
    jsonb_build_object(
      'external_match_id', target_external_match_id,
      'started_at', now()
    ),
    now()
  )
  returning id into audit_id;

  select *
  into readiness_row
  from public.pubg_match_promotion_readiness
  where external_match_id = target_external_match_id
  limit 1;

  if readiness_row.external_match_id is null then
    result_payload := jsonb_build_object(
      'ok', false,
      'promoted', false,
      'blocked', true,
      'reason', 'readiness_record_not_found',
      'external_match_id', target_external_match_id,
      'audit_id', audit_id
    );

    update public.pubg_core_promotions
    set
      status = 'blocked',
      result = result_payload,
      completed_at = now()
    where id = audit_id;

    return result_payload;
  end if;

  if readiness_row.promotion_allowed is not true then
    result_payload := jsonb_build_object(
      'ok', false,
      'promoted', false,
      'blocked', true,
      'reason', readiness_row.promotion_status,
      'external_match_id', target_external_match_id,
      'audit_id', audit_id,
      'readiness', jsonb_build_object(
        'total_participants', readiness_row.total_participants,
        'human_participants', readiness_row.human_participants,
        'ai_participants', readiness_row.ai_participants,
        'mapped_players', readiness_row.mapped_players,
        'verified_mapped_players', readiness_row.verified_mapped_players,
        'active_mapped_players', readiness_row.active_mapped_players,
        'mapped_teams', readiness_row.mapped_teams,
        'active_mapped_teams', readiness_row.active_mapped_teams,
        'roster_safe_players', readiness_row.roster_safe_players,
        'roster_safe_teams', readiness_row.roster_safe_teams,
        'winner_roster_count', readiness_row.winner_roster_count,
        'raw_import_processed', readiness_row.raw_import_processed,
        'already_promoted', readiness_row.already_promoted
      )
    );

    update public.pubg_core_promotions
    set
      status = 'blocked',
      result = result_payload,
      completed_at = now()
    where id = audit_id;

    return result_payload;
  end if;

  select *
  into api_match_row
  from public.pubg_api_matches
  where external_match_id = target_external_match_id
  limit 1;

  if api_match_row.external_match_id is null then
    result_payload := jsonb_build_object(
      'ok', false,
      'promoted', false,
      'blocked', true,
      'reason', 'pubg_api_match_not_found',
      'external_match_id', target_external_match_id,
      'audit_id', audit_id
    );

    update public.pubg_core_promotions
    set
      status = 'blocked',
      result = result_payload,
      completed_at = now()
    where id = audit_id;

    return result_payload;
  end if;

  select
    count(distinct participant.external_participant_id),
    count(distinct player_record.team_id)
  into
    safe_player_count,
    safe_team_count
  from public.pubg_api_participants participant
  join public.pubg_player_mappings mapping
    on mapping.pubg_player_account_id = participant.player_account_id
  join public.players player_record
    on player_record.id = mapping.player_id
  join public.teams team_record
    on team_record.id = player_record.team_id
  join public.player_roster_health roster_health
    on roster_health.player_id = player_record.id
  where participant.external_match_id = target_external_match_id
    and mapping.player_id is not null
    and coalesce(mapping.verified, false) = true
    and coalesce(player_record.active, false) = true
    and player_record.team_id is not null
    and coalesce(team_record.active, false) = true
    and roster_health.promotion_safe = true;

  if safe_player_count <> readiness_row.total_participants then
    result_payload := jsonb_build_object(
      'ok', false,
      'promoted', false,
      'blocked', true,
      'reason', 'safe_player_count_mismatch',
      'external_match_id', target_external_match_id,
      'audit_id', audit_id,
      'expected_participants', readiness_row.total_participants,
      'safe_player_count', safe_player_count
    );

    update public.pubg_core_promotions
    set
      status = 'blocked',
      result = result_payload,
      completed_at = now()
    where id = audit_id;

    return result_payload;
  end if;

  if safe_team_count < 2 then
    result_payload := jsonb_build_object(
      'ok', false,
      'promoted', false,
      'blocked', true,
      'reason', 'safe_team_count_too_low',
      'external_match_id', target_external_match_id,
      'audit_id', audit_id,
      'safe_team_count', safe_team_count
    );

    update public.pubg_core_promotions
    set
      status = 'blocked',
      result = result_payload,
      completed_at = now()
    where id = audit_id;

    return result_payload;
  end if;

  core_external_id := 'pubg-api-' || target_external_match_id;

  begin
    insert into public.matches (
      external_id,
      source,
      source_url,
      map_name,
      stage,
      date,
      verified,
      created_at
    )
    values (
      core_external_id,
      'pubg_developer_api',
      api_match_row.source_url,
      api_match_row.map_name,
      coalesce(api_match_row.game_mode, 'PUBG API Import'),
      api_match_row.created_at_api,
      false,
      now()
    )
    on conflict (external_id)
    do update set
      source = excluded.source,
      source_url = excluded.source_url,
      map_name = excluded.map_name,
      stage = excluded.stage,
      date = excluded.date,
      verified = false
    returning id into core_match_id;

    delete from public.player_match_stats
    where match_id = core_match_id;

    delete from public.team_match_results
    where match_id = core_match_id;

    insert into public.player_match_stats (
      match_id,
      player_id,
      team_id,
      kills,
      damage,
      placement,
      survival_time,
      headshots,
      assists,
      revives,
      knocks,
      mvp,
      is_mvp
    )
    select
      core_match_id,
      mapping.player_id,
      player_record.team_id,
      coalesce(participant.kills, 0),
      round(coalesce(participant.damage_dealt, 0))::int,
      coalesce(participant.placement, participant.win_place, 0),
      round(coalesce(participant.time_survived, 0))::int,
      coalesce(participant.headshot_kills, 0),
      coalesce(participant.assists, 0),
      coalesce(participant.revives, 0),
      coalesce(participant.dbnos, 0),
      false,
      false
    from public.pubg_api_participants participant
    join public.pubg_player_mappings mapping
      on mapping.pubg_player_account_id = participant.player_account_id
    join public.players player_record
      on player_record.id = mapping.player_id
    join public.teams team_record
      on team_record.id = player_record.team_id
    join public.player_roster_health roster_health
      on roster_health.player_id = player_record.id
    where participant.external_match_id = target_external_match_id
      and mapping.player_id is not null
      and coalesce(mapping.verified, false) = true
      and coalesce(player_record.active, false) = true
      and player_record.team_id is not null
      and coalesce(team_record.active, false) = true
      and roster_health.promotion_safe = true;

    get diagnostics inserted_player_stats = row_count;

    if inserted_player_stats <> readiness_row.total_participants then
      raise exception
        'inserted_player_stats_mismatch: inserted %, expected %, external_match_id %',
        inserted_player_stats,
        readiness_row.total_participants,
        target_external_match_id;
    end if;

    insert into public.team_match_results (
      match_id,
      team_id,
      placement,
      kills,
      placement_points,
      kill_points,
      total_points,
      survival_time,
      created_at
    )
    select
      core_match_id,
      player_record.team_id,
      coalesce(min(coalesce(participant.placement, participant.win_place)), 0) as placement,
      coalesce(sum(participant.kills), 0)::int as kills,
      0 as placement_points,
      coalesce(sum(participant.kills), 0)::int as kill_points,
      coalesce(sum(participant.kills), 0)::int as total_points,
      round(max(coalesce(participant.time_survived, 0)))::int as survival_time,
      now()
    from public.pubg_api_participants participant
    join public.pubg_player_mappings mapping
      on mapping.pubg_player_account_id = participant.player_account_id
    join public.players player_record
      on player_record.id = mapping.player_id
    join public.teams team_record
      on team_record.id = player_record.team_id
    join public.player_roster_health roster_health
      on roster_health.player_id = player_record.id
    where participant.external_match_id = target_external_match_id
      and mapping.player_id is not null
      and coalesce(mapping.verified, false) = true
      and coalesce(player_record.active, false) = true
      and player_record.team_id is not null
      and coalesce(team_record.active, false) = true
      and roster_health.promotion_safe = true
    group by player_record.team_id;

    get diagnostics inserted_team_results = row_count;

    if inserted_team_results < 2 then
      raise exception
        'inserted_team_results_too_low: inserted %, external_match_id %',
        inserted_team_results,
        target_external_match_id;
    end if;

  exception
    when others then
      result_payload := jsonb_build_object(
        'ok', false,
        'promoted', false,
        'blocked', false,
        'reason', 'promotion_failed',
        'external_match_id', target_external_match_id,
        'audit_id', audit_id
      );

      update public.pubg_core_promotions
      set
        status = 'failed',
        error_message = sqlerrm,
        result = result_payload,
        completed_at = now()
      where id = audit_id;

      return result_payload;
  end;

  result_payload := jsonb_build_object(
    'ok', true,
    'promoted', true,
    'blocked', false,
    'external_match_id', target_external_match_id,
    'core_external_id', core_external_id,
    'match_id', core_match_id,
    'inserted_player_stats', inserted_player_stats,
    'inserted_team_results', inserted_team_results,
    'audit_id', audit_id
  );

  update public.pubg_core_promotions
  set
    status = 'promoted',
    core_match_id = (result_payload->>'match_id')::uuid,
    result = result_payload,
    completed_at = now()
  where id = audit_id;

  return result_payload;
end;
$function$;

-- ---------------------------------------------------------------------
-- 6. Hardened player score recalculation function
-- ---------------------------------------------------------------------

create or replace function public.calculate_player_scores()
returns void
language plpgsql
as $function$
begin
  if not pg_try_advisory_xact_lock(hashtext('calculate_player_scores')) then
    raise exception 'calculate_player_scores already running';
  end if;

  with player_scores as (
    select
      p.id as player_id,
      row_number() over (
        order by
          (
            coalesce(sum(pms.kills * 10), 0)
            + coalesce(sum(pms.damage * 0.05), 0)
            + coalesce(sum((100 - pms.placement) * 2), 0)
            + (coalesce(p.recent_form, 0) * 20)
          ) desc,
          coalesce(sum(pms.kills), 0) desc,
          p.ign asc
      ) as player_rank,
      round(
        (
          coalesce(sum(pms.kills * 10), 0)
          + coalesce(sum(pms.damage * 0.05), 0)
          + coalesce(sum((100 - pms.placement) * 2), 0)
          + (coalesce(p.recent_form, 0) * 20)
        )::numeric,
        0
      )::int as final_score
    from public.players p
    left join public.player_match_stats pms
      on p.id = pms.player_id
    where coalesce(p.active, false) = true
    group by
      p.id,
      p.ign,
      p.recent_form
  )
  insert into public.rankings (
    entity_type,
    entity_id,
    rank,
    score,
    change,
    updated_at
  )
  select
    'player',
    player_id,
    player_rank,
    final_score,
    0,
    now()
  from player_scores
  on conflict (entity_type, entity_id)
  do update set
    rank = excluded.rank,
    score = excluded.score,
    updated_at = now();

  delete from public.rankings r
  where r.entity_type = 'player'
    and not exists (
      select 1
      from public.players p
      where p.id = r.entity_id
        and coalesce(p.active, false) = true
    );
end;
$function$;

-- ---------------------------------------------------------------------
-- 7. Disable broad import finalization function
-- ---------------------------------------------------------------------

create or replace function public.finalize_playrank_import()
returns void
language plpgsql
as $function$
begin
  raise exception
    'finalize_playrank_import() is disabled. Use targeted import finalization instead.';
end;
$function$;

-- ---------------------------------------------------------------------
-- 8. Hardened summary stats refresh function
-- ---------------------------------------------------------------------

create or replace function public.refresh_playrank_summary_stats()
returns void
language plpgsql
as $function$
begin
  if not pg_try_advisory_xact_lock(hashtext('refresh_playrank_summary_stats')) then
    raise exception 'refresh_playrank_summary_stats already running';
  end if;

  update public.teams
  set
    matches_played = 0,
    points = 0,
    kills = 0,
    wins = 0
  where coalesce(active, false) = true;

  update public.teams t
  set
    matches_played = coalesce(stats.matches_played, 0),
    kills = coalesce(stats.total_kills, 0),
    wins = coalesce(stats.total_wins, 0),
    points = coalesce(stats.total_points, 0)
  from (
    select
      tmr.team_id,
      count(*)::int as matches_played,
      coalesce(sum(tmr.kills), 0)::int as total_kills,
      coalesce(sum(tmr.total_points), 0)::int as total_points,
      count(*) filter (where tmr.placement = 1)::int as total_wins
    from public.team_match_results tmr
    join public.teams team_record
      on team_record.id = tmr.team_id
     and coalesce(team_record.active, false) = true
    group by tmr.team_id
  ) stats
  where stats.team_id = t.id
    and coalesce(t.active, false) = true;

  update public.players
  set
    matches_played = 0,
    total_kills = 0,
    avg_damage = 0,
    mvp_count = 0
  where coalesce(active, false) = true;

  update public.players p
  set
    matches_played = coalesce(stats.matches_played, 0),
    total_kills = coalesce(stats.total_kills, 0),
    avg_damage = coalesce(stats.avg_damage, 0),
    mvp_count = coalesce(stats.mvp_count, 0)
  from (
    select
      pms.player_id,
      count(*)::int as matches_played,
      coalesce(sum(pms.kills), 0)::int as total_kills,
      round(coalesce(avg(pms.damage), 0))::numeric as avg_damage,
      count(*) filter (
        where coalesce(pms.mvp, false) = true
           or coalesce(pms.is_mvp, false) = true
      )::int as mvp_count
    from public.player_match_stats pms
    join public.players player_record
      on player_record.id = pms.player_id
     and coalesce(player_record.active, false) = true
    group by pms.player_id
  ) stats
  where stats.player_id = p.id
    and coalesce(p.active, false) = true;
end;
$function$;

-- ---------------------------------------------------------------------
-- 9. Hardened ranking refresh function
-- ---------------------------------------------------------------------

create or replace function public.refresh_playrank_rankings()
returns void
language plpgsql
as $function$
begin
  if not pg_try_advisory_xact_lock(hashtext('refresh_playrank_rankings')) then
    raise exception 'refresh_playrank_rankings already running';
  end if;

  create temporary table tmp_old_rankings on commit drop as
  select
    entity_type,
    entity_id,
    rank,
    score
  from public.rankings
  where entity_type in ('team', 'player');

  with team_rankings as (
    select
      'team'::text as entity_type,
      ranked.id as entity_id,
      ranked.rank::int as rank,
      ranked.score::int as score
    from (
      select
        t.id,
        row_number() over (
          order by
            (
              coalesce(t.points, 0) * 2
              + coalesce(t.kills, 0) * 3
              + coalesce(t.wins, 0) * 15
            ) desc,
            coalesce(t.kills, 0) desc,
            t.name asc
        ) as rank,
        (
          coalesce(t.points, 0) * 2
          + coalesce(t.kills, 0) * 3
          + coalesce(t.wins, 0) * 15
        ) as score
      from public.teams t
      where coalesce(t.active, false) = true
    ) ranked
  ),
  player_rankings as (
    select
      'player'::text as entity_type,
      ranked.id as entity_id,
      ranked.rank::int as rank,
      ranked.score::int as score
    from (
      select
        p.id,
        row_number() over (
          order by
            (
              coalesce(p.total_kills, 0) * 8
              + coalesce(p.avg_damage, 0) * 0.25
              + coalesce(p.mvp_count, 0) * 20
            ) desc,
            coalesce(p.total_kills, 0) desc,
            p.ign asc
        ) as rank,
        round(
          (
            coalesce(p.total_kills, 0) * 8
            + coalesce(p.avg_damage, 0) * 0.25
            + coalesce(p.mvp_count, 0) * 20
          )::numeric,
          0
        ) as score
      from public.players p
      where coalesce(p.active, false) = true
    ) ranked
  ),
  combined_rankings as (
    select * from team_rankings
    union all
    select * from player_rankings
  )
  insert into public.rankings (
    entity_type,
    entity_id,
    rank,
    score,
    change,
    updated_at
  )
  select
    cr.entity_type,
    cr.entity_id,
    cr.rank,
    cr.score,
    coalesce(old.rank - cr.rank, 0) as change,
    now()
  from combined_rankings cr
  left join tmp_old_rankings old
    on old.entity_type = cr.entity_type
   and old.entity_id = cr.entity_id
  on conflict (entity_type, entity_id)
  do update set
    rank = excluded.rank,
    score = excluded.score,
    change = excluded.change,
    updated_at = now();

  delete from public.rankings r
  where r.entity_type = 'team'
    and not exists (
      select 1
      from public.teams t
      where t.id = r.entity_id
        and coalesce(t.active, false) = true
    );

  delete from public.rankings r
  where r.entity_type = 'player'
    and not exists (
      select 1
      from public.players p
      where p.id = r.entity_id
        and coalesce(p.active, false) = true
    );

  insert into public.ranking_history (
    entity_type,
    entity_id,
    rank,
    score,
    snapshot_date
  )
  select
    entity_type,
    entity_id,
    rank,
    score,
    now()
  from public.rankings
  where entity_type in ('team', 'player');

  update public.teams t
  set global_rank = r.rank
  from public.rankings r
  where r.entity_type = 'team'
    and r.entity_id = t.id
    and coalesce(t.active, false) = true;
end;
$function$;