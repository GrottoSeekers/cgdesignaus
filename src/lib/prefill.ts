// Buttons elsewhere on the site ("Start with Growth", "Send me this quote", "Ask for this")
// open the contact page with the quote builder already set: which package (or "small" for
// quick jobs, branding and other extras on their own) and which options are ticked.
export interface Prefill {
  /** A package id ("essentials", "growth", "complete"), "small" or "check". */
  pkg: string;
  /** Option ids to tick, e.g. ["blog", "brand"] or ["job-google-profile"]. */
  items?: string[];
}

export function contactHref(base: string, p: Prefill) {
  const q = new URLSearchParams({ pkg: p.pkg });
  if (p.items?.length) q.set("items", p.items.join(","));
  return `${base}/contact?${q}`;
}

export function readPrefill(search: string): Prefill | null {
  const q = new URLSearchParams(search);
  const pkg = q.get("pkg");
  if (!pkg) return null;
  return { pkg, items: (q.get("items") ?? "").split(",").filter(Boolean) };
}
