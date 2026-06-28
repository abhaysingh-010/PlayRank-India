-- PlayRank RLS Security Lockdown Patch
-- Date: 2026-06-28
-- Purpose:
-- 1. Remove public mutation privileges.
-- 2. Enable RLS on all public tables.
-- 3. Allow anon/authenticated read-only access only to safe public tables.
-- 4. Keep admin/staging/import/internal tables accessible only through service-role server routes.

begin;

revoke all privileges on all tables in schema public from anon;
revoke all privileges on all tables in schema public from authenticated;

revoke all privileges on all sequences in schema public from anon;
revoke all privileges on all sequences in schema public from authenticated;

revoke execute on all functions in schema public from anon;
revoke execute on all functions in schema public from authenticated;

grant usage on schema public to anon;
grant usage on schema public to authenticated;

grant select on table public.data_sources to anon, authenticated;
grant select on table public.game_maps to anon, authenticated;
grant select on table public.krafton_team_rankings to anon, authenticated;

grant select on table public.teams to anon, authenticated;
grant select on table public.players to anon, authenticated;
grant select on table public.tournaments to anon, authenticated;
grant select on table public.matches to anon, authenticated;

grant select on table public.rankings to anon, authenticated;
grant select on table public.ranking_history to anon, authenticated;

grant select on table public.team_achievements to anon, authenticated;
grant select on table public.team_match_results to anon, authenticated;
grant select on table public.player_match_stats to anon, authenticated;

grant select on table public.tournament_participants to anon, authenticated;
grant select on table public.tournament_stages to anon, authenticated;
grant select on table public.tournament_standings to anon, authenticated;

alter table public.data_sources enable row level security;
alter table public.game_maps enable row level security;
alter table public.krafton_team_rankings enable row level security;

alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.tournaments enable row level security;
alter table public.matches enable row level security;

alter table public.rankings enable row level security;
alter table public.ranking_history enable row level security;

alter table public.team_achievements enable row level security;
alter table public.team_match_results enable row level security;
alter table public.player_match_stats enable row level security;

alter table public.tournament_participants enable row level security;
alter table public.tournament_stages enable row level security;
alter table public.tournament_standings enable row level security;

drop policy if exists "public_read_data_sources" on public.data_sources;
create policy "public_read_data_sources"
on public.data_sources
for select
to anon, authenticated
using (true);

drop policy if exists "public_read_game_maps" on public.game_maps;
create policy "public_read_game_maps"
on public.game_maps
for select
to anon, authenticated
using (true);

drop policy if exists "public_read_krafton_team_rankings" on public.krafton_team_rankings;
create policy "public_read_krafton_team_rankings"
on public.krafton_team_rankings
for select
to anon, authenticated
using (true);

drop policy if exists "public_read_teams" on public.teams;
create policy "public_read_teams"
on public.teams
for select
to anon, authenticated
using (true);

drop policy if exists "public_read_players" on public.players;
create policy "public_read_players"
on public.players
for select
to anon, authenticated
using (true);

drop policy if exists "public_read_tournaments" on public.tournaments;
create policy "public_read_tournaments"
on public.tournaments
for select
to anon, authenticated
using (true);

drop policy if exists "public_read_matches" on public.matches;
create policy "public_read_matches"
on public.matches
for select
to anon, authenticated
using (true);

drop policy if exists "public_read_rankings" on public.rankings;
create policy "public_read_rankings"
on public.rankings
for select
to anon, authenticated
using (true);

drop policy if exists "public_read_ranking_history" on public.ranking_history;
create policy "public_read_ranking_history"
on public.ranking_history
for select
to anon, authenticated
using (true);

drop policy if exists "public_read_team_achievements" on public.team_achievements;
create policy "public_read_team_achievements"
on public.team_achievements
for select
to anon, authenticated
using (true);

drop policy if exists "public_read_team_match_results" on public.team_match_results;
create policy "public_read_team_match_results"
on public.team_match_results
for select
to anon, authenticated
using (true);

drop policy if exists "public_read_player_match_stats" on public.player_match_stats;
create policy "public_read_player_match_stats"
on public.player_match_stats
for select
to anon, authenticated
using (true);

drop policy if exists "public_read_tournament_participants" on public.tournament_participants;
create policy "public_read_tournament_participants"
on public.tournament_participants
for select
to anon, authenticated
using (true);

drop policy if exists "public_read_tournament_stages" on public.tournament_stages;
create policy "public_read_tournament_stages"
on public.tournament_stages
for select
to anon, authenticated
using (true);

drop policy if exists "public_read_tournament_standings" on public.tournament_standings;
create policy "public_read_tournament_standings"
on public.tournament_standings
for select
to anon, authenticated
using (true);

alter table public.api_import_jobs enable row level security;
alter table public.import_batches enable row level security;

alter table public.krafton_team_mappings enable row level security;

alter table public.player_aliases enable row level security;
alter table public.player_roster_history enable row level security;
alter table public.team_aliases enable row level security;
alter table public.team_rosters enable row level security;
alter table public.tournament_aliases enable row level security;

alter table public.pubg_api_matches enable row level security;
alter table public.pubg_api_participants enable row level security;
alter table public.pubg_api_rosters enable row level security;
alter table public.pubg_api_roster_participants enable row level security;
alter table public.pubg_player_mappings enable row level security;

alter table public.raw_esports_imports enable row level security;
alter table public.raw_matches enable row level security;

alter table public.team_match_stats enable row level security;

commit;