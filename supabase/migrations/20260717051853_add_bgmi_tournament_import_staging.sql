begin;

create table if not exists public.bgmi_team_aliases (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  alias text not null,
  alias_slug text not null,
  source text not null default 'organizer_import',
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (alias_slug)
);

create table if not exists public.bgmi_import_rows (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid not null references public.import_batches(id) on delete cascade,
  row_number integer not null check (row_number > 0),
  record_type text not null check (record_type in ('team_result', 'player_stat')),
  external_match_id text not null,
  match_number integer check (match_number is null or match_number > 0),
  match_date timestamptz,
  tournament_name text,
  tournament_id uuid references public.tournaments(id) on delete set null,
  stage text,
  map_name text,
  team_name text not null,
  team_id uuid references public.teams(id) on delete set null,
  player_ign text,
  player_id uuid references public.players(id) on delete set null,
  placement integer check (placement is null or placement > 0),
  kills integer check (kills is null or kills >= 0),
  damage integer check (damage is null or damage >= 0),
  assists integer check (assists is null or assists >= 0),
  knocks integer check (knocks is null or knocks >= 0),
  revives integer check (revives is null or revives >= 0),
  survival_time integer check (survival_time is null or survival_time >= 0),
  placement_points integer check (placement_points is null or placement_points >= 0),
  kill_points integer check (kill_points is null or kill_points >= 0),
  total_points integer check (total_points is null or total_points >= 0),
  raw_payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'matched', 'unresolved', 'invalid', 'imported')),
  validation_errors jsonb not null default '[]'::jsonb,
  imported_match_id uuid references public.matches(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (import_batch_id, row_number)
);

create index if not exists bgmi_import_rows_batch_status_idx on public.bgmi_import_rows (import_batch_id, status);
create index if not exists bgmi_import_rows_match_idx on public.bgmi_import_rows (external_match_id);
create index if not exists bgmi_import_rows_team_name_idx on public.bgmi_import_rows (lower(team_name));
create index if not exists bgmi_import_rows_player_ign_idx on public.bgmi_import_rows (lower(player_ign)) where player_ign is not null;
create index if not exists bgmi_team_aliases_team_idx on public.bgmi_team_aliases (team_id);

alter table public.bgmi_team_aliases enable row level security;
alter table public.bgmi_import_rows enable row level security;

revoke all on table public.bgmi_team_aliases from public, anon, authenticated;
revoke all on table public.bgmi_import_rows from public, anon, authenticated;
grant select, insert, update, delete on table public.bgmi_team_aliases to service_role;
grant select, insert, update, delete on table public.bgmi_import_rows to service_role;

create or replace view public.bgmi_import_batch_summary as
select
  b.id as batch_id,
  b.batch_name,
  b.status as batch_status,
  count(r.id)::integer as total_rows,
  count(*) filter (where r.status = 'matched')::integer as matched_rows,
  count(*) filter (where r.status = 'unresolved')::integer as unresolved_rows,
  count(*) filter (where r.status = 'invalid')::integer as invalid_rows,
  count(*) filter (where r.status = 'imported')::integer as imported_rows
from public.import_batches b
left join public.bgmi_import_rows r on r.import_batch_id = b.id
where b.import_type = 'bgmi_tournament_results'
group by b.id, b.batch_name, b.status;

revoke all on public.bgmi_import_batch_summary from public, anon, authenticated;
grant select on public.bgmi_import_batch_summary to service_role;

commit;

notify pgrst, 'reload schema';

