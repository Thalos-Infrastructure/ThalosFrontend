"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Inicia el flujo OAuth desde el servidor para que el code_verifier de PKCE
 * se guarde en cookies. Así /auth/callback puede leerlo al hacer exchangeCodeForSession.
 * Si se inicia desde el cliente, el verifier puede quedar en localStorage y el servidor
 * no lo ve, dando "PKCE code verifier not found".
 */
export async function signInWithOAuthAction(
  provider: "google" | "github",
  redirectTo: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error) throw error;
  if (data?.url) redirect(data.url);
  throw new Error("Could not start sign-in");
}
