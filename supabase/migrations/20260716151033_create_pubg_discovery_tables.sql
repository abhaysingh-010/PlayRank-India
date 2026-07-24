begin;

create table if not exists public.pubg_player_watchlist (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.players(id) on delete cascade,
  pubg_account_id text not null,
  shard text not null default 'steam'
    check (shard in ('steam', 'kakao', 'xbox', 'psn')),
  active boolean not null default true,
  last_checked_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shard, pubg_account_id)
);

create table if not exists public.pubg_match_discovery_queue (
  id uuid primary key default gen_random_uuid(),
  external_match_id text not null,
  shard text not null
    check (shard in ('steam', 'kakao', 'xbox', 'psn')),
  source_account_id text not null,
  status text not null default 'discovered'
    check (
      status in (
        'discovered',
        'importing',
        'imported',
        'skipped',
        'failed'
      )
    ),
  attempts integer not null default 0 check (attempts >= 0),
  discovered_at timestamptz not null default now(),
  imported_at timestamptz,
  last_error text,
  unique (shard, external_match_id)
);

create index if not exists pubg_player_watchlist_active_idx
  on public.pubg_player_watchlist (active, last_checked_at);

create index if not exists pubg_match_discovery_queue_status_idx
  on public.pubg_match_discovery_queue (status, discovered_at);

alter table public.pubg_player_watchlist enable row level security;
alter table public.pubg_match_discovery_queue enable row level security;

revoke all on table public.pubg_player_watchlist
  from public, anon, authenticated;

revoke all on table public.pubg_match_discovery_queue
  from public, anon, authenticated;

grant select, insert, update, delete
  on table public.pubg_player_watchlist
  to service_role;

grant select, insert, update, delete
  on table public.pubg_match_discovery_queue
  to service_role;

commit;

notify pgrst, 'reload schema';;
