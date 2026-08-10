-- Lending referral marketplace (P12) — offers/applications/repayments against
-- a mocked partner (CIMB-shaped adapter). BajetBuddy never holds these funds;
-- this is a referral/decisioning layer, not a lender.
CREATE TABLE IF NOT EXISTS public.loan_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  partner_name TEXT NOT NULL DEFAULT 'CIMB Octo (mock)',
  product_type TEXT NOT NULL CHECK (product_type IN ('salary_advance', 'bnpl_consolidation', 'micro_personal')),
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  apr NUMERIC(5,2) NOT NULL CHECK (apr >= 0),
  tenure_months INTEGER NOT NULL CHECK (tenure_months > 0),
  min_score_required INTEGER NOT NULL CHECK (min_score_required BETWEEN 300 AND 850),
  status TEXT NOT NULL DEFAULT 'offered' CHECK (status IN ('offered', 'expired', 'applied', 'withdrawn')),
  reason_json JSONB,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.loan_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.loan_offers(id),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected', 'disbursed', 'closed')),
  idempotency_key TEXT NOT NULL,
  partner_reference TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decision_at TIMESTAMPTZ,
  UNIQUE (offer_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS public.repayments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.loan_applications(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'paid', 'missed'))
);

CREATE INDEX IF NOT EXISTS idx_loan_offers_user_status ON public.loan_offers (user_id, status);
CREATE INDEX IF NOT EXISTS idx_loan_applications_user ON public.loan_applications (user_id);
CREATE INDEX IF NOT EXISTS idx_repayments_application ON public.repayments (application_id);

ALTER TABLE public.loan_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repayments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_loan_offers" ON public.loan_offers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_loan_applications" ON public.loan_applications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_repayments" ON public.repayments FOR SELECT USING (
  application_id IN (SELECT id FROM public.loan_applications WHERE user_id = auth.uid())
);
