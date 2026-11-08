// Buttons elsewhere on the site ("Start with Growth", "Send me this quote", "Ask for this")
// open the contact page with the choice already filled in, carried in the query string.
export interface Prefill {
  /** One of the contact form's "What do you need?" values. */
  service: string;
  /** Short label shown above the form, e.g. "Growth package". */
  pick: string;
  /** Price shown next to the label, e.g. "$590" or "$590 + $60/mo". */
  price: string;
  /** Full line sent with the enquiry. */
  details: string;
}

export function contactHref(base: string, p: Prefill) {
  const q = new URLSearchParams({ service: p.service, pick: p.pick, price: p.price, details: p.details });
  return `${base}/contact?${q}`;
}

export function readPrefill(search: string): Prefill | null {
  const q = new URLSearchParams(search);
  const service = q.get("service");
  const pick = q.get("pick");
  if (!service || !pick) return null;
  return { service, pick, price: q.get("price") ?? "", details: q.get("details") ?? pick };
}
