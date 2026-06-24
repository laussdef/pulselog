-- Run this once in the Supabase SQL Editor for your project.

create table public.logs (
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
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

alter table public.logs enable row level security;

create policy "Users manage their own logs"
  on public.logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
