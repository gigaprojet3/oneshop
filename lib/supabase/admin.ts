import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";

/**
 * Client avec la clé secrète : contourne les règles RLS.
 * Réservé aux écritures que le commerçant ne doit pas pouvoir faire lui-même
 * (abonnements). À n'utiliser que dans du code serveur.
 */
export function createAdminClient() {
  const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !secret) {
    throw new Error(
      "SUPABASE_SECRET_KEY manquante dans .env.local (Supabase > Project Settings > API > Secret keys).",
    );
  }
  return createClient(supabaseUrl, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
