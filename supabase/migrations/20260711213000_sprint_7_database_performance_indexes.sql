begin;

-- Remove redundant slug indexes while preserving the indexes backing
-- the existing UNIQUE constraints: *_slug_key.
alter table public.players drop constraint if exists players_slug_unique;

alter table public.teams drop constraint if exists teams_slug_unique;
drop index if exists public.teams_slug_unique_idx;

alter table public.tournaments drop constraint if exists tournaments_slug_unique;
drop index if exists public.tournaments_slug_unique_idx;

-- Add covering indexes for foreign keys reported by the Supabase
-- performance advisor.

create index if not exists krafton_team_mappings_matched_team_id_idx
  on public.krafton_team_mappings (matched_team_id);

create index if not exists matches_mvp_player_id_idx
  on public.matches (mvp_player_id);

create index if not exists matches_team1_id_idx
  on public.matches (team1_id);

create index if not exists matches_team2_id_idx
  on public.matches (team2_id);

create index if not exists matches_tournament_id_idx
  on public.matches (tournament_id);

create index if not exists matches_winner_team_id_idx
  on public.matches (winner_team_id);

create index if not exists player_match_stats_player_id_idx
  on public.player_match_stats (player_id);

create index if not exists player_match_stats_team_id_idx
  on public.player_match_stats (team_id);

create index if not exists players_team_id_idx
  on public.players (team_id);

create index if not exists pubg_api_matches_raw_import_id_idx
  on public.pubg_api_matches (raw_import_id);

create index if not exists pubg_api_roster_participants_external_participant_id_idx
  on public.pubg_api_roster_participants (external_participant_id);

create index if not exists pubg_core_promotions_core_match_id_idx
  on public.pubg_core_promotions (core_match_id);

create index if not exists pubg_player_mappings_player_id_idx
  on public.pubg_player_mappings (player_id);

create index if not exists team_achievements_team_id_idx
  on public.team_achievements (team_id);

create index if not exists team_match_results_team_id_idx
  on public.team_match_results (team_id);

create index if not exists team_match_stats_match_id_idx
  on public.team_match_stats (match_id);

create index if not exists team_match_stats_team_id_idx
  on public.team_match_stats (team_id);

create index if not exists team_rosters_player_id_idx
  on public.team_rosters (player_id);

create index if not exists team_rosters_team_id_idx
  on public.team_rosters (team_id);

create index if not exists tournament_standings_team_id_idx
  on public.tournament_standings (team_id);

create index if not exists tournament_standings_tournament_id_idx
  on public.tournament_standings (tournament_id);

create index if not exists tournaments_mvp_player_id_idx
  on public.tournaments (mvp_player_id);

commit;
