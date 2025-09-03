import { createClient } from "./supabase/server";
import { redirect } from "next/navigation";

export async function getSession() {
  const supabase = await createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Session error:", error);
    throw new Error("Failed to get session");
  }

  return session;
}

export async function requireAuth() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth/login");
  }

  return session;
}
