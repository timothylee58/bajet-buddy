-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.bnpl_commitments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  merchant text NOT NULL,
  provider text NOT NULL DEFAULT ''::text,
  item_name text NOT NULL,
  total_amount numeric NOT NULL CHECK (total_amount >= 0::numeric),
  outstanding_amount numeric NOT NULL CHECK (outstanding_amount >= 0::numeric),
  monthly_payment numeric NOT NULL DEFAULT 0 CHECK (monthly_payment >= 0::numeric),
  installments_total integer NOT NULL DEFAULT 1 CHECK (installments_total > 0),
  installments_remaining integer NOT NULL DEFAULT 0 CHECK (installments_remaining >= 0),
  next_due_date date,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'late'::text, 'cancelled'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bnpl_commitments_pkey PRIMARY KEY (id),
  CONSTRAINT bnpl_commitments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.buddy_relationships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  buddy_user_id uuid NOT NULL,
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text, 'blocked'::text])),
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT buddy_relationships_pkey PRIMARY KEY (id),
  CONSTRAINT buddy_relationships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT buddy_relationships_buddy_user_id_fkey FOREIGN KEY (buddy_user_id) REFERENCES public.profiles(id),
  CONSTRAINT buddy_relationships_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.category_budgets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_id text NOT NULL,
  allocated numeric NOT NULL DEFAULT 0,
  spent numeric NOT NULL DEFAULT 0,
  month date NOT NULL DEFAULT (date_trunc('month'::text, now()))::date,
  CONSTRAINT category_budgets_pkey PRIMARY KEY (id),
  CONSTRAINT category_budgets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.challenge_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'participant'::text CHECK (role = ANY (ARRAY['owner'::text, 'participant'::text])),
  status text NOT NULL DEFAULT 'invited'::text CHECK (status = ANY (ARRAY['invited'::text, 'accepted'::text, 'declined'::text, 'completed'::text])),
  joined_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT challenge_participants_pkey PRIMARY KEY (id),
  CONSTRAINT challenge_participants_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id),
  CONSTRAINT challenge_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT ''::text,
  challenge_type text NOT NULL DEFAULT 'spending_limit'::text,
  rule_code text NOT NULL DEFAULT ''::text,
  reward_xp integer NOT NULL DEFAULT 0 CHECK (reward_xp >= 0),
  status text NOT NULL DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'completed'::text, 'cancelled'::text])),
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT challenges_pkey PRIMARY KEY (id),
  CONSTRAINT challenges_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.freeze_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  freeze_type text NOT NULL CHECK (freeze_type = ANY (ARRAY['soft'::text, 'hard'::text])),
  trigger_source text NOT NULL CHECK (trigger_source = ANY (ARRAY['auto'::text, 'manual'::text, 'buddy'::text, 'system'::text])),
  reason_code text NOT NULL DEFAULT ''::text,
  note text,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ends_at timestamp with time zone,
  released_at timestamp with time zone,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT freeze_events_pkey PRIMARY KEY (id),
  CONSTRAINT freeze_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.macro_market_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  affected_category text NOT NULL,
  estimated_cost_increase numeric NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT macro_market_alerts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.nudge_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  transaction_id uuid,
  verdict text NOT NULL CHECK (verdict = ANY (ARRAY['BOLEH'::text, 'FIKIR_DULU'::text, 'JANGAN_DULU'::text])),
  risk_score integer NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  tone_mode text NOT NULL DEFAULT 'friendly'::text CHECK (tone_mode = ANY (ARRAY['professional'::text, 'friendly'::text, 'manglish'::text, 'strict'::text, 'encouraging'::text])),
  language_code text NOT NULL DEFAULT 'bm'::text CHECK (language_code = ANY (ARRAY['bm'::text, 'en'::text, 'manglish'::text])),
  short_nudge text NOT NULL,
  explanation text NOT NULL DEFAULT ''::text,
  tradeoff text NOT NULL DEFAULT ''::text,
  alternative_action text NOT NULL DEFAULT ''::text,
  recommended_action text NOT NULL DEFAULT ''::text,
  cta_buttons jsonb NOT NULL DEFAULT '[]'::jsonb,
  reason_codes jsonb NOT NULL DEFAULT '[]'::jsonb,
  purchase_amount numeric NOT NULL DEFAULT 0 CHECK (purchase_amount >= 0::numeric),
  merchant text NOT NULL DEFAULT ''::text,
  category text NOT NULL DEFAULT ''::text,
  transaction_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT nudge_events_pkey PRIMARY KEY (id),
  CONSTRAINT nudge_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT nudge_events_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id)
);
CREATE TABLE public.persona_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  persona_code text NOT NULL,
  persona_name text NOT NULL,
  confidence integer NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  explanation text NOT NULL,
  suggested_intervention_rule text NOT NULL,
  top_signals jsonb NOT NULL DEFAULT '[]'::jsonb,
  captured_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT persona_snapshots_pkey PRIMARY KEY (id),
  CONSTRAINT persona_snapshots_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text,
  full_name text NOT NULL DEFAULT ''::text,
  monthly_income numeric NOT NULL DEFAULT 0,
  avatar_emoji text DEFAULT '😊'::text,
  persona_last_reroll_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.tabungs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  target_amount numeric NOT NULL CHECK (target_amount > 0::numeric),
  current_amount numeric NOT NULL DEFAULT 0 CHECK (current_amount >= 0::numeric),
  is_locked boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tabungs_pkey PRIMARY KEY (id),
  CONSTRAINT tabungs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  category text NOT NULL,
  merchant text NOT NULL DEFAULT ''::text,
  note text,
  verdict text NOT NULL CHECK (verdict = ANY (ARRAY['boleh'::text, 'fikir_dulu'::text, 'jangan_dulu'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_gamification (
  user_id uuid NOT NULL,
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  streak_days integer NOT NULL DEFAULT 0,
  last_active_date date,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_gamification_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_gamification_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.wishlists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_name text NOT NULL,
  merchant text NOT NULL DEFAULT ''::text,
  category text NOT NULL DEFAULT 'shopping'::text,
  current_price numeric NOT NULL DEFAULT 0 CHECK (current_price >= 0::numeric),
  target_price numeric,
  review_after date,
  source_platform text NOT NULL DEFAULT ''::text,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'purchased'::text, 'dismissed'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT wishlists_pkey PRIMARY KEY (id),
  CONSTRAINT wishlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
