// Tiny Supabase REST client for the public forms (no SDK on the public pages).
// The anon key is meant to be public; the rules in supabase/setup.sql only let it INSERT.
export const SUPABASE_URL = (import.meta.env.PUBLIC_SUPABASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
export const SUPABASE_ANON_KEY = (import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined) ?? "";
export const dbReady = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export async function insert(table: "onboarding" | "check_ins", row: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(`Save failed (${res.status})`);
}
