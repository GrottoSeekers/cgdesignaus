// Every price on the site comes from this file: the packages, the quote builder,
// the website extras, branding, quick jobs and the homepage teasers.
//
// Pricing rule: nothing is cheaper bought on its own than as part of a website, so a
// website is always the better deal (e.g. Local SEO in a website > Google profile setup alone,
// online bookings in a website < the standalone booking setup).

// ---- Website builds ----
// Each package's full price is the base plus what it includes; the founding price halves it.
export const BASE_PRICE = 580;
export const FOUNDING_DISCOUNT_RATE = 0.5;
const STARTER_BUNDLE_PRICE = 299; // used by the bundle and by the Complete package note

export const pageOptions = [
  { id: "about", label: "About", price: 160 },
  { id: "services", label: "Services / Menu", price: 250 },
  { id: "gallery", label: "Gallery", price: 190 },
  { id: "blog", label: "Blog", price: 200 },
  { id: "booking-page", label: "Booking page", price: 50 },
];

// ---- Branding: one price each, on their own or with any package (no founding discount) ----
export const brandTidyUp = {
  name: "Logo tidy-up & brand kit",
  price: 149,
  desc: "Already have a logo? Clean, sharp files for print and screen, plus your colours and fonts in one place.",
};

export const brandIdentity = {
  name: "Logo & brand identity",
  price: 349,
  desc: "Two logo concepts, your colours and fonts, a one-page brand guide, and files for print and web.",
  includes: ["Two logo concepts", "Colours and fonts", "One-page brand guide", "Files for print and web"],
};

// ---- Your own admin login: a website extra ----
// The client signs in at their-site/admin with an email and password and updates their content
// themselves (see clients/kettlebaz for a working example).
export const selfEdit = {
  id: "admin-login",
  name: "Your own admin login",
  price: 199,
  includes: [
    "Sign in with your email and password",
    "Change text, photos, prices and opening hours",
    "Updates show on your site straight away",
  ],
};

// ---- Hosting & care plan ----
export const carePlan = {
  price: 60,
  changeHours: 1, // hours of changes included each month
  includes: "hosting, security, backups and up to 1 hour of changes a month",
  firstMonthFree: "First month free with any package",
};

// `fixed` extras keep their price in the quote builder: the founding discount doesn't apply.
export const featureOptions = [
  { id: "seo", label: "Local SEO", desc: "Google Business optimisation and local keyword targeting", price: 300, recurring: false, fixed: false },
  { id: "booking", label: "Online bookings", desc: "Real-time appointment, table, or callout booking", price: 250, recurring: false, fixed: false },
  { id: "store", label: "Online store", desc: "Product catalogue and checkout", price: 800, recurring: false, fixed: false },
  { id: "admin", label: "Admin login", desc: "Sign in and update your own text, photos and prices", price: selfEdit.price, recurring: false, fixed: true },
  { id: "brand", label: "Logo & branding", desc: "Two logo concepts, colours, fonts and a brand guide", price: brandIdentity.price, recurring: false, fixed: true },
  { id: "maintenance", label: "Hosting & care", desc: `Hosting, security, backups and up to ${carePlan.changeHours} hour of changes a month`, price: carePlan.price, recurring: true, fixed: false },
];

const priceById: Record<string, number> = Object.fromEntries(
  [...pageOptions, ...featureOptions].map((o) => [o.id, o.price])
);

export const aud = (n: number) => `$${Math.round(n).toLocaleString("en-AU")}`;
export const founding = (n: number) => Math.round(n * FOUNDING_DISCOUNT_RATE);

const tier1Full = BASE_PRICE;
const tier2Full = tier1Full + priceById.about + priceById.services + priceById.gallery;
const tier3Full = tier2Full + priceById.booking + priceById.seo + priceById["booking-page"];

// Growth and Complete also include some quick jobs, so the bigger packages are the clear best
// value: Complete covers everything in the Starter bundle.
export const tiers = [
  {
    id: "essentials",
    name: "Essentials",
    tagline: "A sharp one-pager that gets you found and called.",
    full: tier1Full,
    includes: ["Home + Contact pages", "Copywriting and images sourced", "Mobile-first build", "Live in under a week"],
    feature: false,
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "The full shopfront — services, story and gallery.",
    full: tier2Full,
    includes: ["Everything in Essentials", "About, Services / Menu, Gallery", "Enquiry form to your inbox", "Google Business Profile set up or tidied"],
    feature: true,
  },
  {
    id: "complete",
    name: "Complete",
    tagline: "Bookings and local search, done properly.",
    full: tier3Full,
    includes: ["Everything in Growth", "Online booking system and page", "Local SEO package", "Facebook + Instagram setup", "Review booster QR card"],
    note: `Includes everything in our $${STARTER_BUNDLE_PRICE} Starter bundle`,
    feature: false,
  },
];

export const maintenancePrice = carePlan.price;
export const lowestPackagePrice = founding(tier1Full);

// ---- Quick jobs: get found online without a website. Fixed prices, paid upfront ----
export const quickJobs = [
  {
    id: "google-profile",
    name: "Google Business Profile setup",
    price: 129,
    desc: "Created and verified, with photos, opening hours, services and categories, so you show up on Google Maps.",
  },
  {
    id: "social",
    name: "Social media setup",
    price: 79,
    per: "per platform",
    desc: "Facebook, Instagram and more: branded profile and cover images, a bio, your contact details and links.",
  },
  {
    id: "booking",
    name: "Online booking setup",
    price: 149,
    desc: "Fresha, Square or Calendly set up with your services, prices and hours. No website needed.",
  },
  {
    id: "reviews",
    name: "Review booster",
    price: 59,
    desc: "A QR code card or sticker and a direct “leave us a review” link, so happy customers can review you in seconds.",
  },
  {
    id: "domain",
    name: "Domain setup",
    price: 49,
    desc: "Your web address registered in your name, so it's yours and ready for a website. Domain cost extra.",
  },
];

const jobPrice = (id: string) => quickJobs.find((j) => j.id === id)?.price ?? 0;

export const starterBundle = {
  id: "starter-bundle",
  name: "Starter bundle",
  price: STARTER_BUNDLE_PRICE,
  includes: ["Google Business Profile setup", "Facebook + Instagram setup", "Review booster QR card", "Domain registered in your name"],
  // What the same jobs cost one by one (social is per platform, so twice).
  separately: jobPrice("google-profile") + jobPrice("social") * 2 + jobPrice("reviews") + jobPrice("domain"),
};

export const lowestQuickJobPrice = Math.min(...quickJobs.map((j) => j.price));
