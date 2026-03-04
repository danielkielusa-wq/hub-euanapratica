/**
 * Shared config loader for Edge Functions.
 *
 * Reads multiple keys from `app_configs` table in a single query.
 * Uses service_role client (bypasses RLS).
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Load multiple config values from `app_configs` in one query.
 *
 * @param supabase - Service-role Supabase client
 * @param keys - Array of `app_configs.key` values to fetch
 * @returns Record mapping key → value (missing keys are omitted)
 */
export async function loadAppConfigs(
  supabase: SupabaseClient,
  keys: string[],
): Promise<Record<string, string>> {
  const { data: rows, error } = await supabase
    .from("app_configs")
    .select("key, value")
    .in("key", keys);

  if (error) {
  }

  const configs: Record<string, string> = {};
  for (const row of rows || []) {
    if (row.value) configs[row.key] = row.value;
  }
  return configs;
}
