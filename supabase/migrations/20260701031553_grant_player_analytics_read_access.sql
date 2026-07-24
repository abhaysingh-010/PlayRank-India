-- QA-MANUAL-003
-- Allow public read-only access for the player comparison page.
-- The /players/compare page uses the public Supabase anon client.

grant select on public.player_analytics to anon;
grant select on public.player_analytics to authenticated;
