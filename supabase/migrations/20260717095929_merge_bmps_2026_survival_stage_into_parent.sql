
insert into public.tournament_aliases (tournament_id,alias,alias_slug,source,verified)
select
 'fea7c5eb-acda-434b-bba8-b97c49a97ce0',
 name,
 slug,
 'merged_stage',
 true
from public.tournaments
where id='4efd4706-29a8-4f08-bc29-e3506e7b8af6'
and not exists (
 select 1 from public.tournament_aliases
 where alias_slug='battlegrounds-mobile-india-pro-series-2026-survival-stage'
);

update public.matches
set tournament_id='fea7c5eb-acda-434b-bba8-b97c49a97ce0'
where tournament_id='4efd4706-29a8-4f08-bc29-e3506e7b8af6';

update public.tournament_standings
set tournament_id='fea7c5eb-acda-434b-bba8-b97c49a97ce0'
where tournament_id='4efd4706-29a8-4f08-bc29-e3506e7b8af6';

update public.tournament_participants
set tournament_id='fea7c5eb-acda-434b-bba8-b97c49a97ce0'
where tournament_id='4efd4706-29a8-4f08-bc29-e3506e7b8af6';

update public.bgmi_import_rows
set tournament_id='fea7c5eb-acda-434b-bba8-b97c49a97ce0'
where tournament_id='4efd4706-29a8-4f08-bc29-e3506e7b8af6';

delete from public.tournaments
where id='4efd4706-29a8-4f08-bc29-e3506e7b8af6'
and not exists (
 select 1 from public.matches
 where tournament_id='4efd4706-29a8-4f08-bc29-e3506e7b8af6'
);

with event_range as (
 select min(date)::date start_date,max(date)::date end_date
 from public.matches
 where tournament_id='fea7c5eb-acda-434b-bba8-b97c49a97ce0'
)
update public.tournaments
set start_date=event_range.start_date,end_date=event_range.end_date
from event_range
where id='fea7c5eb-acda-434b-bba8-b97c49a97ce0';
;
