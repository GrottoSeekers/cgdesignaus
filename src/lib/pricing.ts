// Every price on the site comes from this file: the packages, the quote builder,
// the website extras, branding, quick jobs and the homepage teasers.
//
// Pricing rule: nothing is cheaper bought on its own than as part of a website, so a
// website is always the better deal (e.g. Local SEO in a website > Google profile setup alone,
// online bookings in a website < the standalone booking setup).

// ---- Website builds ----
// Each package's full price is the base plus what it includes; the founding price halves it.
export const BASE_PRICE = 580;

// ---- Founding client offer ----
// Half price on website packages for quotes accepted by the end date below. It switches itself
// off at the first build after that moment (the deploy workflow rebuilds the site just after
// midnight Sydney time on 1 January), so the crossed-out prices are only ever a genuine, time-limited
// offer (Australian Consumer Law). To run a new offer, move the date and update the wording.
export const FOUNDING_ENDS = new Date("2026-12-31T23:59:59+11:00");
export const FOUNDING_ENDS_LABEL = "31 December 2026";
export const FOUNDING_ACTIVE = Date.now() <= FOUNDING_ENDS.getTime();
/** What a client pays as a share of the full price: 0.5 during the offer, 1 after it. */
export const FOUNDING_DISCOUNT_RATE = FOUNDING_ACTIVE ? 0.5 : 1;

// Shown wherever prices appear. ABN 25 672 082 550 is not registered for GST.
export const PRICE_NOTE = "All prices in Australian dollars (AUD). We're not registered for GST, so no GST is added.";
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
  desc: "Already have a logo? We tidy it up and pull your colours and fonts together.",
};

export const brandIdentity = {
  name: "Logo & brand identity",
  price: 349,
  desc: "A new logo, colours, fonts and a simple brand guide.",
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
};

// ---- Your web address (domain): a yearly fee on every website ----
// Registered in the client's business name and renewed by us each year.
export const webAddress = {
  name: "Your web address",
  price: 49,
  desc: "Registered in your business name and renewed every year, so it never lapses. It's yours to keep.",
};

// `fixed` extras keep their price in the quote builder: the founding discount doesn't apply.
export const featureOptions = [
  { id: "seo", label: "Local SEO", desc: "Google Business optimisation and local keyword targeting", price: 300, recurring: false, fixed: false },
  { id: "booking", label: "Online bookings", desc: "Real-time appointment, table, or callout booking", price: 250, recurring: false, fixed: false },
  { id: "store", label: "Online store", desc: "Product catalogue and checkout", price: 800, recurring: false, fixed: false },
  { id: "forms", label: "Client forms", desc: "Onboarding and weekly check-in forms, sent straight to your inbox", price: 199, recurring: false, fixed: true },
  { id: "admin", label: "Admin login", desc: "Sign in and update your own text, photos and prices", price: selfEdit.price, recurring: false, fixed: true },
  { id: "brand-tidy", label: "Logo tidy-up", desc: brandTidyUp.desc, price: brandTidyUp.price, recurring: false, fixed: true },
  { id: "brand", label: "Logo & branding", desc: "Two logo concepts, colours, fonts and a brand guide", price: brandIdentity.price, recurring: false, fixed: true },
  { id: "domain", label: "Web address", desc: webAddress.desc, price: webAddress.price, recurring: true, yearly: true, fixed: false },
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

// `parts` lists the quote-builder options a package already includes (they show as
// "Included" in the builder and can't be added twice).
// Growth and Complete also include some quick jobs, so the bigger packages are the clear best
// value: Complete covers everything in the Starter bundle.
export const tiers = [
  {
    id: "essentials",
    parts: [] as string[],
    domainYearFree: false,
    name: "Essentials",
    tagline: "A sharp one-pager that gets you found and called.",
    full: tier1Full,
    includes: ["Home + Contact pages", "Copywriting and images sourced", "Mobile-first build", "Live in under a week"],
    feature: false,
  },
  {
    id: "growth",
    parts: ["about", "services", "gallery", "job-google-profile"],
    domainYearFree: false,
    name: "Growth",
    tagline: "The full shopfront — services, story and gallery.",
    full: tier2Full,
    includes: ["Everything in Essentials", "About, Services / Menu, Gallery", "Enquiry form to your inbox", "Google Business Profile set up or tidied"],
    feature: true,
  },
  {
    id: "complete",
    parts: ["about", "services", "gallery", "booking", "seo", "booking-page", "job-google-profile", "job-social", "job-reviews"],
    domainYearFree: true,
    name: "Complete",
    tagline: "Bookings and local search, done properly.",
    full: tier3Full,
    includes: ["Everything in Growth", "Online booking system and page", "Local SEO package", "Facebook + Instagram setup", "Review booster QR card", "First year of your web address"],
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
    name: "Web address",
    price: webAddress.price,
    per: "a year",
    desc: "Your web address (yourbusiness.com.au) registered in your business name and renewed every year, so it never lapses. Yours to keep.",
  },
];

const jobPrice = (id: string) => quickJobs.find((j) => j.id === id)?.price ?? 0;

export const starterBundle = {
  id: "starter-bundle",
  name: "Starter bundle",
  price: STARTER_BUNDLE_PRICE,
  includes: ["Google Business Profile setup", "Facebook + Instagram setup", "Review booster QR card", "Web address, first year included"],
  // What the same jobs cost one by one (social is per platform, so twice).
  separately: jobPrice("google-profile") + jobPrice("social") * 2 + jobPrice("reviews") + jobPrice("domain"),
};

export const lowestQuickJobPrice = Math.min(...quickJobs.map((j) => j.price));
