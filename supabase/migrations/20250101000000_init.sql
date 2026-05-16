-- BajetBuddy Phase 0 schema (Supabase PostgreSQL + RLS)

create extension if not exists "pgcrypto";

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text not null default '',
  monthly_income numeric(12, 2) not null default 0,
  avatar_emoji text default '😊',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Gamification state
create table if not exists public.user_gamification (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  xp integer not null default 0,
  level integer not null default 1,
  streak_days integer not null default 0,
  last_active_date date,
  updated_at timestamptz not null default now()
);

-- Monthly category budgets
create table if not exists public.category_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id text not null,
  allocated numeric(12, 2) not null default 0,
  spent numeric(12, 2) not null default 0,
  month date not null default date_trunc('month', now())::date,
  unique (user_id, category_id, month)
);

-- Transactions
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(12, 2) not null,
  category text not null,
  merchant text not null default '',
  note text,
  verdict text not null check (verdict in ('boleh', 'fikir_dulu', 'jangan_dulu')),
  created_at timestamptz not null default now()
);

create index if not exists idx_transactions_user_created
  on public.transactions (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.user_gamification enable row level security;
alter table public.category_budgets enable row level security;
alter table public.transactions enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "gamification_all_own" on public.user_gamification
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "category_budgets_all_own" on public.category_budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "transactions_all_own" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  insert into public.user_gamification (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
