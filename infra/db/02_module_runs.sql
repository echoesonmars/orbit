-- OrbitAI Migration: module_runs for history across dashboard modules
-- Run in Supabase SQL Editor after 01_workflow_and_reports.sql

CREATE TABLE IF NOT EXISTS public.module_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_slug TEXT NOT NULL,
  title TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.module_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own module_runs"
  ON public.module_runs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_module_runs_user_slug ON public.module_runs(user_id, module_slug);
CREATE INDEX IF NOT EXISTS idx_module_runs_created ON public.module_runs(created_at DESC);
