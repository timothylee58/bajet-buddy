-- Alt-credit scoring engine (P11) — read-only score history for the lending referral layer.
CREATE TABLE IF NOT EXISTS public.credit_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INTEGER CHECK (score BETWEEN 300 AND 850),
  band TEXT CHECK (band IN ('Poor', 'Fair', 'Good', 'Very Good', 'Excellent')),
  insufficient_history BOOLEAN NOT NULL DEFAULT false,
  factors_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  model_version TEXT NOT NULL DEFAULT 'v1'
);

CREATE INDEX IF NOT EXISTS idx_credit_scores_user_computed
  ON public.credit_scores (user_id, computed_at DESC);

ALTER TABLE public.credit_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_credit_score_read" ON public.credit_scores
  FOR SELECT USING (auth.uid() = user_id);
-- No user INSERT/UPDATE policy — scores are only written by the service role via the scoring job.
