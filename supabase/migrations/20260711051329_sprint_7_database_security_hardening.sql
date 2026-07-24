-- Sprint 7 Phase 1A/1B - Database security hardening
-- Preserves public player comparison access while removing security-definer view behavior.
-- Keeps PUBG promotion audit data service-role only.

alter table public.pubg_core_promotions enable row level security;

revoke all on table public.pubg_core_promotions from public;
revoke all on table public.pubg_core_promotions from anon;
revoke all on table public.pubg_core_promotions from authenticated;

grant select, insert, update, delete
on table public.pubg_core_promotions
to service_role;

alter view public.player_analytics
set (security_invoker = true);

grant select on public.player_analytics to anon;
grant select on public.player_analytics to authenticated;
grant select on public.player_analytics to service_role;

alter function public.promote_pubg_api_match_to_playrank_core(text)
set search_path = public, pg_temp;

revoke all
on function public.promote_pubg_api_match_to_playrank_core(text)
from public;

revoke all
on function public.promote_pubg_api_match_to_playrank_core(text)
from anon;

revoke all
on function public.promote_pubg_api_match_to_playrank_core(text)
from authenticated;

grant execute
on function public.promote_pubg_api_match_to_playrank_core(text)
to service_role;
