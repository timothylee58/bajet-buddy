-- Revert broad RLS changes — restore original policies, keep only what's needed for demo
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/tdtqiussvzmpeixntcoj/sql

-- 1. Restore original RLS policies (the ones from migrations)
drop policy if exists "transactions_all_own" on public.transactions;
create policy "transactions_all_own" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "gamification_all_own" on public.user_gamification;
create policy "gamification_all_own" on public.user_gamification
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "category_budgets_all_own" on public.category_budgets;
create policy "category_budgets_all_own" on public.category_budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2. Add demo-specific policy (allows operations for demo UUID without auth.uid())
drop policy if exists "transactions_demo_user" on public.transactions;
create policy "transactions_demo_user" on public.transactions
  for all using (user_id = '00000000-0000-0000-0000-000000000001')
  with check (user_id = '00000000-0000-0000-0000-000000000001');

-- 3. Restore transactions FK (the demo profile exists, so this will work)
-- NOTE: keep profiles_id_fkey dropped since demo user has no auth.users entry
alter table public.transactions drop constraint if exists transactions_user_id_fkey;
alter table public.transactions add constraint transactions_user_id_fkey
  foreign key (user_id) references public.profiles(id);

-- 4. Ensure demo profile still exists
insert into public.profiles (id, email, full_name, monthly_income)
values ('00000000-0000-0000-0000-000000000001', 'demo@bajetbuddy.local', 'Demo User', 3200)
on conflict (id) do nothing;
