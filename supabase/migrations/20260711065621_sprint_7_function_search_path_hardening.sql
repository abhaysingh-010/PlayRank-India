-- Sprint 7 Phase 1C - Harden remaining public function search paths.

alter function public.calculate_player_scores()
set search_path = public, pg_temp;

alter function public.finalize_playrank_import()
set search_path = public, pg_temp;

alter function public.normalize_pubg_api_match(text)
set search_path = public, pg_temp;

alter function public.recalculate_rank_changes()
set search_path = public, pg_temp;

alter function public.recalculate_rankings()
set search_path = public, pg_temp;

alter function public.recalculate_team_analytics()
set search_path = public, pg_temp;

alter function public.refresh_playrank_rankings()
set search_path = public, pg_temp;

alter function public.refresh_playrank_summary_stats()
set search_path = public, pg_temp;

alter function public.snapshot_rankings()
set search_path = public, pg_temp;
