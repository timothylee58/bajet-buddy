-- Dev seed: category budgets for the first profile (run after at least one auth user exists).
-- Usage: supabase db reset (local) or run manually against a dev project.

insert into public.category_budgets (user_id, category_id, allocated, spent, month)
select
  p.id,
  v.category_id,
  v.allocated,
  v.spent,
  date_trunc('month', now())::date
from public.profiles p
cross join (
  values
    ('food', 800::numeric, 680::numeric),
    ('transport', 400::numeric, 320::numeric),
    ('shopping', 600::numeric, 950::numeric),
    ('entertainment', 200::numeric, 180::numeric),
    ('utilities', 250::numeric, 210::numeric)
) as v(category_id, allocated, spent)
where p.id = (select id from public.profiles order by created_at asc limit 1)
on conflict (user_id, category_id, month) do update
  set allocated = excluded.allocated,
      spent = excluded.spent;

update public.user_gamification g
set xp = 420, level = 2, streak_days = 7, last_active_date = current_date
where g.user_id = (select id from public.profiles order by created_at asc limit 1);

update public.profiles
set monthly_income = 3200, full_name = 'Sarah (Dev Seed)'
where id = (select id from public.profiles order by created_at asc limit 1);
