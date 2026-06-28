-- PlayRank PUBG Promotion Safety Patch
-- Date: 2026-06-28
-- Purpose:
-- 1. Prevent public/AI PUBG matches from entering PlayRank core data.
-- 2. Require full player mapping before promotion.
-- 3. Require mapped players to have teams.
-- 4. Require roster-safe players before promotion.
-- 5. Keep promotion_allowed false unless the match is safe for core data.

create or replace view public.pubg_match_promotion_readiness as
with readiness as (
  select
    m.external_match_id,
    m.shard,
    m.map_name,
    m.game_mode,
    m.created_at_api,

    count(distinct p.id) as total_participants,

    count(distinct p.id)
      filter (where p.player_account_id like 'ai.%') as ai_participants,

    count(distinct p.id)
      filter (where p.player_account_id not like 'ai.%') as human_participants,

    count(distinct pm.player_id)
      filter (where pm.player_id is not null) as mapped_players,

    count(distinct pl.id)
      filter (where pl.team_id is not null) as mapped_players_with_team,

    count(distinct pl.team_id)
      filter (where pl.team_id is not null) as mapped_teams,

    count(distinct rh.player_id)
      filter (where rh.promotion_safe = true) as roster_safe_players,

    count(distinct pl.team_id)
      filter (where rh.promotion_safe = true and pl.team_id is not null) as roster_safe_teams

  from pubg_api_matches m
  left join pubg_api_participants p
    on p.external_match_id = m.external_match_id
  left join pubg_player_mappings pm
    on pm.pubg_player_account_id = p.player_account_id
  left join players pl
    on pl.id = pm.player_id
  left join player_roster_health rh
    on rh.player_id = pl.id
  group by
    m.external_match_id,
    m.shard,
    m.map_name,
    m.game_mode,
    m.created_at_api
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

  round(
    mapped_players::numeric / nullif(total_participants, 0)::numeric * 100,
    2
  ) as mapped_player_percentage,

  case
    when total_participants = 0
      then 'not_ready_no_participants'
    when ai_participants > 0
      then 'not_ready_contains_ai_participants'
    when mapped_players < total_participants
      then 'not_ready_unmapped_players'
    when mapped_players_with_team < total_participants
      then 'not_ready_players_without_team'
    when roster_safe_players < total_participants
      then 'not_ready_roster_health'
    when roster_safe_teams < 2
      then 'not_ready_not_enough_safe_teams'
    else 'ready_for_core_promotion'
  end as promotion_status,

  case
    when total_participants > 0
      and ai_participants = 0
      and mapped_players = total_participants
      and mapped_players_with_team = total_participants
      and roster_safe_players = total_participants
      and roster_safe_teams >= 2
    then true
    else false
  end as promotion_allowed,

  roster_safe_players,
  roster_safe_teams,
  greatest(total_participants - mapped_players, 0) as unmapped_players,
  greatest(total_participants - roster_safe_players, 0) as unsafe_roster_players,
  ai_participants,
  human_participants

from readiness;