-- Contextual micro-insurance nudges (P13) — BNPL default protection and
-- purchase protection, referred to a mocked partner (Etiqa-shaped). Never
-- surfaced on a jangan_dulu verdict — see apps/api/app/insurance/services.py.
CREATE TABLE IF NOT EXISTS public.insurance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_type TEXT NOT NULL CHECK (product_type IN ('bnpl_default_protection', 'purchase_protection')),
  partner_name TEXT NOT NULL DEFAULT 'Etiqa (mock)',
  premium NUMERIC(6,2) NOT NULL CHECK (premium > 0),
  coverage_amount NUMERIC(10,2) NOT NULL CHECK (coverage_amount > 0),
  linked_transaction_id UUID REFERENCES public.transactions(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'claimed', 'cancelled')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS public.insurance_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES public.insurance_policies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trigger_event TEXT NOT NULL CHECK (trigger_event IN ('bnpl_missed_payment', 'item_damaged', 'item_not_received')),
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected', 'paid')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_insurance_policies_user_status ON public.insurance_policies (user_id, status);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_policy ON public.insurance_claims (policy_id);

ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_policies" ON public.insurance_policies FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_claims" ON public.insurance_claims FOR ALL USING (auth.uid() = user_id);
