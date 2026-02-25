-- OrbitAI Initial Database Schema
-- Includes PostGIS setup and tables for Users, Missions, and Predictions

--------------------------------------------------------
-- 1. Enable PostGIS Extension
--------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS postgis;

--------------------------------------------------------
-- 2. Users Table
-- Extends Supabase Auth (auth.users)
--------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE,
  full_name TEXT,
  company_name TEXT,
  role TEXT CHECK (role IN ('admin', 'analyst', 'client')) DEFAULT 'client',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Setup Row Level Security (RLS) for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to automatically create a profile when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'client');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

--------------------------------------------------------
-- 3. Missions Table
-- Stores user created missions and target bounding boxes
--------------------------------------------------------
CREATE TABLE public.missions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_type TEXT NOT NULL, -- e.g., 'agriculture', 'monitoring', 'disaster'
  
  -- PostGIS Geography column to store the Bounding Box (Polygon)
  area_of_interest GEOGRAPHY(POLYGON, 4326) NOT NULL,
  
  status TEXT CHECK (status IN ('draft', 'analyzing', 'completed', 'failed')) DEFAULT 'draft' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Setup RLS for Missions
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own missions." ON public.missions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own missions." ON public.missions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own missions." ON public.missions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own missions." ON public.missions FOR DELETE USING (auth.uid() = user_id);

--------------------------------------------------------
-- 4. Predictions Table
-- Stores the ML-API inference results linked to a mission
--------------------------------------------------------
CREATE TABLE public.predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_id UUID REFERENCES public.missions(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- The overall calculated value score from ML-API (e.g. 85.5)
  value_score NUMERIC(5, 2) NOT NULL,
  
  -- JSON array of factors affecting the score [{"name": "cloud_cover", "impact": -5}]
  factors JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Optional reference to a generated PDF report in Supabase Storage
  report_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Setup RLS for Predictions
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view predictions for their missions." 
  ON public.predictions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.missions 
      WHERE public.missions.id = public.predictions.mission_id 
      AND public.missions.user_id = auth.uid()
    )
  );

-- Note: Inserting into predictions should ideally be done by a service role (ML-API Backend)
-- So we won't add an INSERT policy for normal auth users.
