alter table public.profiles
  add column if not exists persona_last_reroll_at timestamp with time zone;
