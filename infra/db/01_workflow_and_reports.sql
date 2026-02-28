-- OrbitAI Migration: generated_reports, mission_chat_*, predictions INSERT policy
-- Run this in Supabase SQL Editor after 00_init_schema.sql

--------------------------------------------------------
-- 1. generated_reports (Report Generator + Reports page)
--------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  mission_id UUID REFERENCES public.missions(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('processing', 'completed', 'failed')) DEFAULT 'processing',
  report_data JSONB,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports"
  ON public.generated_reports FOR SELECT
  USING (auth.uid() = user_id);

--------------------------------------------------------
-- 2. Mission Designer chat tables
--------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mission_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New session',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.mission_chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own mission chat sessions"
  ON public.mission_chat_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.mission_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.mission_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  result_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.mission_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage messages of own sessions"
  ON public.mission_chat_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.mission_chat_sessions
      WHERE mission_chat_sessions.id = mission_chat_messages.session_id
      AND mission_chat_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mission_chat_sessions
      WHERE mission_chat_sessions.id = mission_chat_messages.session_id
      AND mission_chat_sessions.user_id = auth.uid()
    )
  );

--------------------------------------------------------
-- 3. Allow INSERT into predictions for own missions
--------------------------------------------------------
CREATE POLICY "Users can insert predictions for own missions"
  ON public.predictions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.missions
      WHERE missions.id = mission_id AND missions.user_id = auth.uid()
    )
  );

--------------------------------------------------------
-- 4. RPC: create mission from bbox (returns mission id for prediction insert)
--------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_mission_from_bbox(
  p_sw_lat DOUBLE PRECISION,
  p_sw_lng DOUBLE PRECISION,
  p_ne_lat DOUBLE PRECISION,
  p_ne_lng DOUBLE PRECISION,
  p_user_id UUID,
  p_title TEXT,
  p_target_type TEXT DEFAULT 'default'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mission_id UUID;
BEGIN
  INSERT INTO public.missions (user_id, title, target_type, area_of_interest, status)
  VALUES (
    p_user_id,
    p_title,
    p_target_type,
    ST_GeomFromText(
      'POLYGON((' ||
      p_sw_lng || ' ' || p_sw_lat || ',' ||
      p_ne_lng || ' ' || p_sw_lat || ',' ||
      p_ne_lng || ' ' || p_ne_lat || ',' ||
      p_sw_lng || ' ' || p_ne_lat || ',' ||
      p_sw_lng || ' ' || p_sw_lat || '))',
      4326
    )::geography,
    'completed'
  )
  RETURNING id INTO v_mission_id;
  RETURN v_mission_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_mission_from_bbox(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_mission_from_bbox(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, UUID, TEXT, TEXT) TO service_role;
