"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/types";

function str(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function safeNext(value: string) {
  // Seuls les chemins internes sont acceptés après connexion
  return value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

function authErrorMessage(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "Email ou mot de passe incorrect.";
  if (m.includes("email not confirmed"))
    return "Confirmez d'abord votre email : ouvrez le lien que nous vous avons envoyé.";
  if (m.includes("already registered")) return "Un compte existe déjà avec cet email. Connectez-vous.";
  if (m.includes("rate limit")) return "Trop de tentatives. Réessayez dans quelques minutes.";
  if (m.includes("password")) return "Le mot de passe doit contenir au moins 8 caractères.";
  return "La connexion au service a échoué. Vérifiez votre connexion internet et réessayez.";
}

export async function signIn(_prev: FormState, form: FormData): Promise<FormState> {
  const email = str(form, "email");
  const password = String(form.get("password") ?? "");
  const fields = { email };

  if (!email || !password) return { error: "Renseignez votre email et votre mot de passe.", fields };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: authErrorMessage(error.message), fields };

  redirect(safeNext(str(form, "suite")));
}

export async function signUp(_prev: FormState, form: FormData): Promise<FormState> {
  const fullName = str(form, "full_name");
  const email = str(form, "email");
  const password = String(form.get("password") ?? "");
  const fields = { full_name: fullName, email };

  if (!fullName) return { error: "Indiquez votre nom.", fields };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Cette adresse email n'est pas valide.", fields };
  if (password.length < 8)
    return { error: "Le mot de passe doit contenir au moins 8 caractères.", fields };

  const h = await headers();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? h.get("origin") ?? `https://${h.get("host") ?? "localhost:3000"}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/auth/confirm?suite=/onboarding`,
    },
  });
  if (error) return { error: authErrorMessage(error.message), fields };

  // Si la confirmation d'email est désactivée dans Supabase, la session existe déjà.
  if (data.session) redirect("/onboarding");
  return { ok: true, fields };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}
