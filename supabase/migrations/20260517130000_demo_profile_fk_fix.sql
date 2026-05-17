-- Fix: drop profiles → auth.users FK so demo profile (and service-key inserts) work.
-- The profiles_id_fkey prevents inserting a profile without a corresponding auth.users
-- row, which blocks the demo user UUID that doesn't have an auth entry.
-- RLS policies already guard profile access for normal clients; the service key
-- bypasses RLS and needs to be able to insert for demo / onboarding flows.

alter table public.profiles drop constraint if exists profiles_id_fkey;

-- Ensure demo profile exists after FK is dropped
insert into public.profiles (id, email, full_name, monthly_income)
values ('00000000-0000-0000-0000-000000000001', 'demo@bajetbuddy.local', 'Demo User', 3200)
on conflict (id) do nothing;
