"use client";

import { createClient } from "@/lib/supabase/client";

export type ModuleRunRow = {
  id: string;
  title: string;
  payload: Record<string, unknown>;
  created_at: string;
};

export async function saveRun(
  moduleSlug: string,
  title: string,
  payload: Record<string, unknown>
): Promise<{ error: Error | null }> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { error: userError ?? new Error("Not authenticated") };
  }
  const { error } = await supabase.from("module_runs").insert({
    user_id: user.id,
    module_slug: moduleSlug,
    title,
    payload: payload ?? {},
  });
  return { error: error ?? null };
}

export async function loadRuns(
  moduleSlug: string,
  limit = 20
): Promise<{ data: ModuleRunRow[]; error: Error | null }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("module_runs")
    .select("id, title, payload, created_at")
    .eq("module_slug", moduleSlug)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return { data: [], error };
  return {
    data: (data ?? []) as ModuleRunRow[],
    error: null,
  };
}
