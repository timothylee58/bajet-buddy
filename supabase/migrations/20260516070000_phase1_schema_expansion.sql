-- BajetBuddy Phase 1 schema expansion
-- Adds the missing product tables needed for BNPL tracking, wishlists,
-- freezes, personas, social challenges, and nudge auditability.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'category_budgets'
  ) then
    alter table public.category_budgets
      add column if not exists updated_at timestamptz not null default now();
  end if;
end $$;

create table if not exists public.bnpl_commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  merchant text not null,
  provider text not null default '',
  item_name text not null,
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  outstanding_amount numeric(12, 2) not null check (outstanding_amount >= 0),
  monthly_payment numeric(12, 2) not null default 0 check (monthly_payment >= 0),
  installments_total integer not null default 1 check (installments_total > 0),
  installments_remaining integer not null default 0 check (installments_remaining >= 0),
  next_due_date date,
  status text not null default 'active' check (status in ('active', 'completed', 'late', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_name text not null,
  merchant text not null default '',
  category text not null default 'shopping',
  current_price numeric(12, 2) not null default 0 check (current_price >= 0),
  target_price numeric(12, 2) check (target_price is null or target_price >= 0),
  review_after date,
  source_platform text not null default '',
  status text not null default 'active' check (status in ('active', 'purchased', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.freeze_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  freeze_type text not null check (freeze_type in ('soft', 'hard')),
  trigger_source text not null check (trigger_source in ('auto', 'manual', 'buddy', 'system')),
  reason_code text not null default '',
  note text,
  started_at timestamptz not null default now(),
  ends_at timestamptz,
  released_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.persona_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  persona_code text not null,
  persona_name text not null,
  confidence integer not null default 0 check (confidence between 0 and 100),
  explanation text not null,
  suggested_intervention_rule text not null,
  top_signals jsonb not null default '[]'::jsonb,
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.buddy_relationships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  buddy_user_id uuid not null references public.profiles (id) on delete cascade,
  invited_by uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'blocked')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_id <> buddy_user_id)
);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null default '',
  challenge_type text not null default 'spending_limit',
  rule_code text not null default '',
  reward_xp integer not null default 0 check (reward_xp >= 0),
  status text not null default 'draft' check (status in ('draft', 'active', 'completed', 'cancelled')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.challenge_participants (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'participant' check (role in ('owner', 'participant')),
  status text not null default 'invited' check (status in ('invited', 'accepted', 'declined', 'completed')),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (challenge_id, user_id)
);

create table if not exists public.nudge_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  transaction_id uuid references public.transactions (id) on delete set null,
  verdict text not null check (verdict in ('BOLEH', 'FIKIR_DULU', 'JANGAN_DULU')),
  risk_score integer not null default 0 check (risk_score between 0 and 100),
  tone_mode text not null default 'friendly' check (tone_mode in ('professional', 'friendly', 'manglish', 'strict', 'encouraging')),
  language_code text not null default 'bm' check (language_code in ('bm', 'en', 'manglish')),
  short_nudge text not null,
  explanation text not null default '',
  tradeoff text not null default '',
  alternative_action text not null default '',
  recommended_action text not null default '',
  cta_buttons jsonb not null default '[]'::jsonb,
  reason_codes jsonb not null default '[]'::jsonb,
  purchase_amount numeric(12, 2) not null default 0 check (purchase_amount >= 0),
  merchant text not null default '',
  category text not null default '',
  transaction_context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_bnpl_commitments_user_status_due
  on public.bnpl_commitments (user_id, status, next_due_date);

create index if not exists idx_wishlists_user_status_review
  on public.wishlists (user_id, status, review_after);

create index if not exists idx_freeze_events_user_started
  on public.freeze_events (user_id, started_at desc);

create index if not exists idx_persona_snapshots_user_captured
  on public.persona_snapshots (user_id, captured_at desc);

create unique index if not exists idx_buddy_relationships_pair
  on public.buddy_relationships (
    least(user_id, buddy_user_id),
    greatest(user_id, buddy_user_id)
  );

create index if not exists idx_challenges_owner_status
  on public.challenges (owner_user_id, status);

create index if not exists idx_challenge_participants_user_status
  on public.challenge_participants (user_id, status);

create index if not exists idx_nudge_events_user_created
  on public.nudge_events (user_id, created_at desc);

alter table public.bnpl_commitments enable row level security;
alter table public.wishlists enable row level security;
alter table public.freeze_events enable row level security;
alter table public.persona_snapshots enable row level security;
alter table public.buddy_relationships enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.nudge_events enable row level security;

create policy "bnpl_commitments_all_own" on public.bnpl_commitments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "wishlists_all_own" on public.wishlists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "freeze_events_all_own" on public.freeze_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "persona_snapshots_all_own" on public.persona_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "nudge_events_all_own" on public.nudge_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "buddy_relationships_select_involved" on public.buddy_relationships
  for select using (
    auth.uid() = user_id
    or auth.uid() = buddy_user_id
    or auth.uid() = invited_by
  );

create policy "buddy_relationships_insert_owner" on public.buddy_relationships
  for insert with check (
    auth.uid() = user_id
    and auth.uid() = invited_by
    and auth.uid() <> buddy_user_id
  );

create policy "buddy_relationships_update_involved" on public.buddy_relationships
  for update using (
    auth.uid() = user_id
    or auth.uid() = buddy_user_id
  ) with check (
    auth.uid() = user_id
    or auth.uid() = buddy_user_id
  );

create policy "buddy_relationships_delete_owner" on public.buddy_relationships
  for delete using (auth.uid() = user_id);

create policy "challenges_select_owner" on public.challenges
  for select using (auth.uid() = owner_user_id);

create policy "challenges_insert_owner" on public.challenges
  for insert with check (auth.uid() = owner_user_id);

create policy "challenges_update_owner" on public.challenges
  for update using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);

create policy "challenges_delete_owner" on public.challenges
  for delete using (auth.uid() = owner_user_id);

create policy "challenge_participants_select_visible" on public.challenge_participants
  for select using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.challenges c
      where c.id = challenge_participants.challenge_id
        and c.owner_user_id = auth.uid()
    )
  );

create policy "challenge_participants_insert_visible" on public.challenge_participants
  for insert with check (
    auth.uid() = user_id
    or exists (
      select 1
      from public.challenges c
      where c.id = challenge_participants.challenge_id
        and c.owner_user_id = auth.uid()
    )
  );

create policy "challenge_participants_update_visible" on public.challenge_participants
  for update using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.challenges c
      where c.id = challenge_participants.challenge_id
        and c.owner_user_id = auth.uid()
    )
  ) with check (
    auth.uid() = user_id
    or exists (
      select 1
      from public.challenges c
      where c.id = challenge_participants.challenge_id
        and c.owner_user_id = auth.uid()
    )
  );

create policy "challenge_participants_delete_visible" on public.challenge_participants
  for delete using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.challenges c
      where c.id = challenge_participants.challenge_id
        and c.owner_user_id = auth.uid()
    )
  );

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'profiles'
  ) then
    drop trigger if exists set_profiles_updated_at on public.profiles;
    create trigger set_profiles_updated_at
      before update on public.profiles
      for each row execute function public.set_updated_at();
  end if;

  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'user_gamification'
  ) then
    drop trigger if exists set_user_gamification_updated_at on public.user_gamification;
    create trigger set_user_gamification_updated_at
      before update on public.user_gamification
      for each row execute function public.set_updated_at();
  end if;

  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'category_budgets'
  ) then
    drop trigger if exists set_category_budgets_updated_at on public.category_budgets;
    create trigger set_category_budgets_updated_at
      before update on public.category_budgets
      for each row execute function public.set_updated_at();
  end if;
end $$;

drop trigger if exists set_bnpl_commitments_updated_at on public.bnpl_commitments;
create trigger set_bnpl_commitments_updated_at
  before update on public.bnpl_commitments
  for each row execute function public.set_updated_at();

drop trigger if exists set_wishlists_updated_at on public.wishlists;
create trigger set_wishlists_updated_at
  before update on public.wishlists
  for each row execute function public.set_updated_at();

drop trigger if exists set_buddy_relationships_updated_at on public.buddy_relationships;
create trigger set_buddy_relationships_updated_at
  before update on public.buddy_relationships
  for each row execute function public.set_updated_at();

drop trigger if exists set_challenges_updated_at on public.challenges;
create trigger set_challenges_updated_at
  before update on public.challenges
  for each row execute function public.set_updated_at();

drop trigger if exists set_challenge_participants_updated_at on public.challenge_participants;
create trigger set_challenge_participants_updated_at
  before update on public.challenge_participants
  for each row execute function public.set_updated_at();
