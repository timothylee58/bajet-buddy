-- Seed demo user (00000000-0000-0000-0000-000000000001) with default data
-- so the dashboard, gamification, and budget hooks return real values.

-- 1. Gamification — XP, level, streak
insert into public.user_gamification (user_id, xp, level, streak_days, last_active_date)
values ('00000000-0000-0000-0000-000000000001', 420, 2, 7, current_date)
on conflict (user_id) do update
  set xp = 420, level = 2, streak_days = 7, last_active_date = current_date;

-- 2. Category budgets for the current month
insert into public.category_budgets (user_id, category_id, allocated, spent, month)
values
  ('00000000-0000-0000-0000-000000000001', 'food',          800,  680, date_trunc('month', now())::date),
  ('00000000-0000-0000-0000-000000000001', 'transport',     400,  320, date_trunc('month', now())::date),
  ('00000000-0000-0000-0000-000000000001', 'shopping',      600,  950, date_trunc('month', now())::date),
  ('00000000-0000-0000-0000-000000000001', 'entertainment', 200,  180, date_trunc('month', now())::date),
  ('00000000-0000-0000-0000-000000000001', 'utilities',     250,  210, date_trunc('month', now())::date)
on conflict (user_id, category_id, month) do update
  set allocated = excluded.allocated, spent = excluded.spent;

-- 3. Sample transactions (last 7 days) so the dashboard has recent items
-- Only insert if the demo user has no transactions yet (idempotent)
do $$
begin
  if not exists (select 1 from public.transactions where user_id = '00000000-0000-0000-0000-000000000001' limit 1) then
    insert into public.transactions (user_id, amount, category, merchant, note, verdict, created_at)
    values
      ('00000000-0000-0000-0000-000000000001', -18.50,  'food',          'Mamak Sri Melur',    'Roti canai + teh tarik',            'boleh',        now() - interval '1 hour'),
      ('00000000-0000-0000-0000-000000000001', -89.00,  'shopping',      'Shopee Malaysia',    'Phone case + screen protector',      'fikir_dulu',   now() - interval '5 hours'),
      ('00000000-0000-0000-0000-000000000001', -45.00,  'transport',     'Petronas Puchong',   'Ron 95 full tank',                  'boleh',        now() - interval '1 day'),
      ('00000000-0000-0000-0000-000000000001', -32.00,  'food',          'GrabFood',           'Nasi lemak + milo ais',             'boleh',        now() - interval '1 day'),
      ('00000000-0000-0000-0000-000000000001', -120.00, 'entertainment', 'GSC Mid Valley',     'Movie tickets x2',                  'fikir_dulu',   now() - interval '2 days'),
      ('00000000-0000-0000-0000-000000000001', -67.50,  'utilities',     'TNB',                'Electricity bill May 2026',          'jangan_dulu',  now() - interval '3 days'),
      ('00000000-0000-0000-0000-000000000001', -15.00,  'food',          'Tealive',            'Brown sugar milk tea',              'boleh',        now() - interval '3 days'),
      ('00000000-0000-0000-0000-000000000001', -210.00, 'shopping',      'Uniqlo KLCC',        '3 basic tees',                      'fikir_dulu',   now() - interval '4 days'),
      ('00000000-0000-0000-0000-000000000001', -28.00,  'food',          'Nasi Kandar Pelita', 'Nasi kandar ayam + limau ais',      'boleh',        now() - interval '5 days'),
      ('00000000-0000-0000-0000-000000000001', -55.00,  'transport',     'Touch ''n Go',       'Top up e-wallet',                   'boleh',        now() - interval '6 days');
  end if;
end $$;
