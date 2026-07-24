
do $$
declare
  legacy_bgis_2026 uuid := 'c8dbd80e-457f-4f86-9e0d-eec96c51c9b5';
begin
  delete from public.team_match_results
  where match_id in (
    select id from public.matches
    where tournament_id = legacy_bgis_2026
      and external_id like 'seed-bgis-2026-match-%'
      and source = 'manual_pending_verification'
  );

  delete from public.player_match_stats
  where match_id in (
    select id from public.matches
    where tournament_id = legacy_bgis_2026
      and external_id like 'seed-bgis-2026-match-%'
      and source = 'manual_pending_verification'
  );

  delete from public.matches
  where tournament_id = legacy_bgis_2026
    and external_id like 'seed-bgis-2026-match-%'
    and source = 'manual_pending_verification';
end $$;

create temporary table tournament_merge_map (
  legacy_id uuid primary key,
  canonical_id uuid not null,
  legacy_name text not null,
  legacy_slug text not null
) on commit drop;

insert into tournament_merge_map (legacy_id, canonical_id, legacy_name, legacy_slug) values
('8753a534-97de-4b34-a961-e7933f2ac736','54e7995e-a0c9-42e9-b5a3-866a99083190','BMIC 2025','bmic-2025'),
('73bae456-f847-41c3-8efe-20f0fc46aa16','b488f527-6105-441c-aee8-d2710e302544','BGMI India Series 2025','bgis-2025'),
('17f91440-e07c-4e3c-86af-b92ce29ee678','f11e0e51-61f5-4971-9231-d16688a074d7','BGMI Pro Series 2025','bmps-2025'),
('c8dbd80e-457f-4f86-9e0d-eec96c51c9b5','adcb2d38-18bc-4a3a-b4eb-e2cba600738c','BGMI India Series 2026','bgis-2026'),
('4078634b-e9e8-4e5b-aefd-dca7d88e1a6d','fea7c5eb-acda-434b-bba8-b97c49a97ce0','BGMI Pro Series 2026','bmps-2026');

insert into public.tournament_aliases (tournament_id,alias,alias_slug,source,verified)
select canonical_id,legacy_name,legacy_slug,'legacy_playrank_slug',true
from tournament_merge_map m
where not exists (
  select 1 from public.tournament_aliases a where a.alias_slug=m.legacy_slug
);

update public.matches m
set tournament_id=x.canonical_id
from tournament_merge_map x
where m.tournament_id=x.legacy_id;

update public.tournament_standings s
set tournament_id=x.canonical_id
from tournament_merge_map x
where s.tournament_id=x.legacy_id;

update public.tournament_participants p
set tournament_id=x.canonical_id
from tournament_merge_map x
where p.tournament_id=x.legacy_id;

update public.bgmi_import_rows r
set tournament_id=x.canonical_id
from tournament_merge_map x
where r.tournament_id=x.legacy_id;

delete from public.tournaments t
using tournament_merge_map x
where t.id=x.legacy_id
  and not exists (select 1 from public.matches m where m.tournament_id=t.id)
  and not exists (select 1 from public.tournament_standings s where s.tournament_id=t.id)
  and not exists (select 1 from public.tournament_participants p where p.tournament_id=t.id);

update public.tournaments
set name='BGMI Masters Series Season 4',
    slug='bgmi-masters-series-season-4'
where id='e7785f68-fc08-4c23-a031-aeada0f99fa6'
  and name='BGMI Masters Series<br> Season 4';

with verified_ranges as (
  select tournament_id,min(date)::date min_date,max(date)::date max_date
  from public.matches
  where verified=true and source='liquipedia_import' and tournament_id is not null
  group by tournament_id
)
update public.tournaments t
set start_date=v.min_date,end_date=v.max_date,status='completed'
from verified_ranges v
where t.id=v.tournament_id
  and (t.start_date is distinct from v.min_date
    or t.end_date is distinct from v.max_date
    or lower(coalesce(t.status,'')) <> 'completed');
;
