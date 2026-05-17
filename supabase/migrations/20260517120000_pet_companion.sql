create table if not exists pet_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  species text not null check (species in ('raccoon', 'fox', 'squirrel', 'finance_squirrel')),
  name text not null default 'Cikgu',
  xp int not null default 0,
  level int not null default 1,
  mood text not null default 'happy' check (mood in ('happy', 'worried', 'celebrating', 'sleepy', 'warning', 'neutral')),
  equipped_accessories text[] not null default '{}',
  streak int not null default 0,
  total_saves_rm numeric not null default 0,
  walk_away_count int not null default 0,
  selected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists pet_xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  xp_earned int not null,
  amount_rm numeric,
  context text,
  created_at timestamptz not null default now()
);

create table if not exists pet_accessories_catalog (
  id text primary key,
  name text not null,
  emoji text not null,
  slot text not null check (slot in ('hat', 'badge', 'trail', 'aura')),
  unlock_xp int not null,
  description text not null,
  species_exclusive text
);

create table if not exists user_pet_accessories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  accessory_id text not null references pet_accessories_catalog(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique (user_id, accessory_id)
);

alter table pet_profiles enable row level security;
alter table pet_xp_events enable row level security;
alter table pet_accessories_catalog enable row level security;
alter table user_pet_accessories enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'pet_profiles' and policyname = 'pet_profiles_select_own'
  ) then
    create policy pet_profiles_select_own on pet_profiles for select to authenticated using (user_id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'pet_profiles' and policyname = 'pet_profiles_insert_own'
  ) then
    create policy pet_profiles_insert_own on pet_profiles for insert to authenticated with check (user_id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'pet_profiles' and policyname = 'pet_profiles_update_own'
  ) then
    create policy pet_profiles_update_own on pet_profiles for update to authenticated using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'pet_xp_events' and policyname = 'pet_xp_events_select_own'
  ) then
    create policy pet_xp_events_select_own on pet_xp_events for select to authenticated using (user_id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'pet_xp_events' and policyname = 'pet_xp_events_insert_own'
  ) then
    create policy pet_xp_events_insert_own on pet_xp_events for insert to authenticated with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'pet_accessories_catalog' and policyname = 'pet_accessories_catalog_select_authenticated'
  ) then
    create policy pet_accessories_catalog_select_authenticated on pet_accessories_catalog for select to authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'user_pet_accessories' and policyname = 'user_pet_accessories_select_own'
  ) then
    create policy user_pet_accessories_select_own on user_pet_accessories for select to authenticated using (user_id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'user_pet_accessories' and policyname = 'user_pet_accessories_insert_own'
  ) then
    create policy user_pet_accessories_insert_own on user_pet_accessories for insert to authenticated with check (user_id = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_updated_at_pet_profiles'
  ) then
    create trigger set_updated_at_pet_profiles
      before update on pet_profiles
      for each row execute function set_updated_at();
  end if;
end $$;

insert into pet_accessories_catalog (id, name, emoji, slot, unlock_xp, description, species_exclusive) values
  ('wizard_hat',      'Wizard Hat',       '🧙',  'hat',   0,    'A mystical hat for the financially wise.',   null),
  ('cap_bajet',       'Cap Bajet',        '🧢',  'hat',   0,    'The classic budget-conscious cap.',           null),
  ('crown_jimat',     'Crown Jimat',      '👑',  'hat',   500,  'Wear the crown of savings.',                 null),
  ('topi_raya',       'Topi Raya',        '🎩',  'hat',   1000, 'Celebrate your financial wins in style.',    null),
  ('legendary_helm',  'Legendary Helm',   '⛑️',  'hat',   2000, 'Only true budget legends wear this.',       null),
  ('first_save',      'First Save',       '🥇',  'badge', 200,  'Badge of honour for your first big save.',  null),
  ('streak_7',        'Streak 7',         '🔥',  'badge', 300,  'Seven days of financial discipline.',        null),
  ('legend_badge',    'Legend Badge',     '🏆',  'badge', 2000, 'Reserved for the legends of savings.',       null),
  ('coin_trail',      'Coin Trail',       '🪙',  'trail', 100,  'Leave a trail of coins wherever you go.',   null),
  ('star_trail',      'Star Trail',       '⭐',  'trail', 400,  'Your path shines with stars.',               null),
  ('flame_trail',     'Flame Trail',      '🔥',  'trail', 800,  'Blaze a trail of financial fire.',           null),
  ('rainbow_trail',   'Rainbow Trail',    '🌈',  'trail', 1500, 'A rainbow follows every budget victory.',    null),
  ('green_aura',      'Green Aura',       '💚',  'aura',  150,  'The aura of a healthy budget.',              null),
  ('gold_aura',       'Gold Aura',        '✨',  'aura',  700,  'Radiate golden financial energy.',           null),
  ('legendary_aura',  'Legendary Aura',   '🌟',  'aura',  1800, 'An aura that transcends ordinary finance.',  null)
on conflict (id) do nothing;
