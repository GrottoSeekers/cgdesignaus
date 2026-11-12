// Content Ryan manages from /admin, stored in Supabase.
// The landing page reads it with plain fetch (no Supabase library on the
// public page); the admin page uses supabase-js to sign in and write.

export const SUPABASE_URL = (import.meta.env.PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
export const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? "";
export const BUCKET = "media";
export const hasBackend = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export type Workout = {
  id: string;
  name: string;
  note: string;
  moves: string; // one per line
  video_path: string;
  poster_path: string | null;
  instagram_url: string | null;
  position: number;
  published: boolean;
};

export type PhotoSlot = "hero" | "training" | "portrait";
export type SitePhoto = { slot: PhotoSlot; path: string; updated_at: string };

/** Paths starting with "/" are files that ship with the site (the original
 *  three workouts); anything else lives in the Supabase "media" bucket. */
export const isSiteFile = (path: string) => path.startsWith("/");

export const mediaUrl = (path: string) =>
  isSiteFile(path)
    ? path
    : `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;

export const movesList = (moves: string) =>
  moves
    .split("\n")
    .map((m) => m.trim())
    .filter(Boolean);

async function rest<T>(query: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    signal,
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  return res.json() as Promise<T>;
}

/** Published workouts and photo slots, or null if there's no backend or it fails. */
export async function loadPublicContent(timeoutMs = 6000) {
  if (!hasBackend) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const [workouts, photos] = await Promise.all([
      rest<Workout[]>("workouts?select=*&published=eq.true&order=position.asc,created_at.desc", ctrl.signal),
      rest<SitePhoto[]>("site_photos?select=slot,path,updated_at", ctrl.signal),
    ]);
    return { workouts, photos };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
