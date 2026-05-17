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

insert into public.bnpl_commitments (
  user_id, merchant, provider, item_name,
  total_amount, outstanding_amount, monthly_payment,
  installments_total, installments_remaining, next_due_date, status
)
select
  p.id,
  v.merchant,
  v.provider,
  v.item_name,
  v.total_amount,
  v.outstanding_amount,
  v.monthly_payment,
  v.installments_total,
  v.installments_remaining,
  (date_trunc('month', now()) + v.due_offset::interval)::date,
  v.status
from public.profiles p
cross join (
  values
    ('Shopee', 'Atome', 'Samsung Galaxy Buds2 Pro', 600.00::numeric, 400.00::numeric, 200.00::numeric, 3, 2, '15 days', 'active'),
    ('Zalora', 'Split', 'Nike Air Max 270', 459.00::numeric, 153.00::numeric, 153.00::numeric, 3, 1, '22 days', 'active'),
    ('Harvey Norman', 'Grab PayLater', 'Dyson V15 Vacuum', 2199.00::numeric, 1099.50::numeric, 366.50::numeric, 6, 3, '8 days', 'active'),
    ('Lazada', 'Atome', 'Xiaomi Smart Air Purifier', 399.00::numeric, 0.00::numeric, 133.00::numeric, 3, 0, '0 days', 'completed'),
    ('AEON', 'Split', 'Casio G-Shock Watch', 348.00::numeric, 116.00::numeric, 116.00::numeric, 3, 1, '30 days', 'late')
) as v(merchant, provider, item_name, total_amount, outstanding_amount, monthly_payment, installments_total, installments_remaining, due_offset, status)
where p.id = (select id from public.profiles order by created_at asc limit 1);
