-- Add commute and overtime fields to profiles for real hourly rate calculation
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS commute_hours_per_day  NUMERIC(4,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS overtime_hours_per_week NUMERIC(4,1) DEFAULT 0;
