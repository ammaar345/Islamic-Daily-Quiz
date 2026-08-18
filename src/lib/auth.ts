import { isSupabaseConfigured } from "./supabase";
import type { AuthError } from "@supabase/supabase-js";

export type AuthMode = "supabase" | "demo";

/** Demo mode = local storage progress, no server. Switch to supabase by adding env keys. */
export function authMode(): AuthMode {
  return isSupabaseConfigured ? "supabase" : "demo";
}

export interface SignupInput {
  name: string;
  email: string;
  password: string;
}

/** Map common Supabase auth errors to plain, friendly messages. */
export function friendlyAuthError(error: AuthError | Error): string {
  const m = error.message.toLowerCase();
  if (m.includes("invalid login credentials")) {
    return "That email or password is wrong.";
  }
  if (m.includes("already registered")) {
    return "That email is already registered.";
  }
  if (m.includes("email not confirmed")) {
    return "Confirm your email first, then sign in.";
  }
  if (m.includes("rate limit")) {
    return "Too many attempts — wait a minute and try again.";
  }
  if (m.includes("password")) {
    return "Password is too weak — use at least 6 characters.";
  }
  return error.message;
}
