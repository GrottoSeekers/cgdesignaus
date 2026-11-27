// Vercel Routing Middleware: splits visitors to "/" between variant A ("/")
// and variant B ("/v/b/") before the page is served, so there is no flicker.
// The choice is kept in a cookie so a visitor sees the same version every time.
// Settings live in src/ab-test.config.ts.
import { next, rewrite } from "@vercel/functions/middleware";
import { experiment, type Variant } from "./src/ab-test.config";

export const config = { matcher: ["/"] };

const COOKIE = `bw_ab_${experiment.id}`;
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days
// Search engines, link previews and site checkers always get A.
const BOT =
  /bot|crawl|spider|slurp|bingpreview|mediapartners|facebookexternalhit|facebot|embedly|quora link preview|pinterest|vkshare|whatsapp|telegram|skype|discord|slack|linkedin|lighthouse|pagespeed|headlesschrome|preview/i;

const readCookie = (req: Request, name: string) => {
  const raw = req.headers.get("cookie") || "";
  const hit = raw.split(/;\s*/).find((c) => c.startsWith(`${name}=`));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : null;
};
const setCookie = (value: string, maxAge = MAX_AGE) =>
  `${COOKIE}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure`;

export default function middleware(req: Request) {
  if (!experiment.enabled) return next();

  const url = new URL(req.url);
  const override = url.searchParams.get("variant");
  const isBot = BOT.test(req.headers.get("user-agent") || "");

  let variant: Variant;
  let cookie: string | null = null;

  if (override === "a" || override === "b") {
    // preview link: show that version and keep showing it on refresh
    variant = override;
    cookie = setCookie(variant);
  } else if (isBot) {
    variant = "a";
  } else {
    const saved = readCookie(req, COOKIE);
    if (override !== "reset" && (saved === "a" || saved === "b")) {
      variant = saved;
    } else {
      variant = Math.random() < experiment.splitToB ? "b" : "a";
      cookie = setCookie(variant);
    }
  }

  const headers: Record<string, string> = {};
  if (cookie) headers["Set-Cookie"] = cookie;

  if (variant === "b") return rewrite(new URL("/v/b/", url), { headers });
  return next({ headers });
}
