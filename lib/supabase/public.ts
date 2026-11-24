import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseKey, supabaseUrl } from "./env";

/**
 * Client anonyme, sans cookies : sert aux lectures publiques de la boutique en ligne.
 * Comme il ne dépend pas de la requête, ses résultats peuvent être mis en cache.
 */
export function createPublicClient() {
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
