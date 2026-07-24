-- PR-701: Add explicit country classification to tournaments.

alter table public.tournaments
add column if not exists country text;

comment on column public.tournaments.country is
  'Country represented by the tournament ecosystem or primary market. Required for public regional filtering.';

-- Existing tournaments were audited and use India or an Indian city.
update public.tournaments
set country = 'India'
where country is null
  and lower(trim(coalesce(location, ''))) in (
    'india',
    'delhi ncr',
    'delhi',
    'chennai',
    'bengaluru',
    'hyderabad',
    'ahmedabad',
    'jaipur',
    'kochi',
    'kolkata',
    'mumbai'
  );

create index if not exists tournaments_country_idx
on public.tournaments (country);

create or replace view public.tournament_public_coverage as
select
  t.id,
  t.name,
  t.slug,
  t.organizer,
  t.status,
  t.location,
  t.prize_pool,
  t.participating_teams,
  t.start_date,
  t.end_date,
  t.verified,
  t.source,
  t.source_url,
  coalesce(m.map_count, 0::bigint)::integer as map_count,
  coalesce(s.standing_count, 0::bigint)::integer as standing_count,
  coalesce(m.map_count, 0::bigint) > 0
    or coalesce(s.standing_count, 0::bigint) > 0 as has_coverage,
  t.country
from public.tournaments t
left join (
  select
    matches.tournament_id,
    count(*) as map_count
  from public.matches
  group by matches.tournament_id
) m on m.tournament_id = t.id
left join (
  select
    tournament_standings.tournament_id,
    count(*) as standing_count
  from public.tournament_standings
  group by tournament_standings.tournament_id
) s on s.tournament_id = t.id;