-- Run this once in the Supabase SQL Editor for your project.
-- Safe to re-run: creates the table if missing, and drops the old
-- one-entry-per-day constraint if it exists (PulseLog now supports
-- multiple check-ins per day, each timestamped via created_at).

create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  energy_level int not null check (energy_level between 0 and 10),
  focus_state int not null check (focus_state between 0 and 10),
  friction_type text,
  unshakable_fact text,
  hydration boolean not null default false,
  walk boolean not null default false,
  creative_play boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.logs drop constraint if exists logs_user_id_log_date_key;

create index if not exists logs_user_id_created_at_idx
  on public.logs (user_id, created_at desc);

alter table public.logs enable row level security;

drop policy if exists "Users manage their own logs" on public.logs;
create policy "Users manage their own logs"
  on public.logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
