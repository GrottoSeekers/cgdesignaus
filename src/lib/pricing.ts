// Every price on the site comes from this file: the packages, the quote builder,
// the quick jobs and the homepage teasers.

// ---- Website builds ----
// Each package's full price is the base plus what it includes; the founding price halves it.
export const BASE_PRICE = 580;
export const FOUNDING_DISCOUNT_RATE = 0.5;

export const pageOptions = [
  { id: "about", label: "About", price: 160 },
  { id: "services", label: "Services / Menu", price: 250 },
  { id: "gallery", label: "Gallery", price: 190 },
  { id: "blog", label: "Blog", price: 200 },
  { id: "booking-page", label: "Booking page", price: 100 },
];

// ---- Branding: one price, on its own or with any package (no founding discount) ----
export const brandIdentity = {
  name: "Logo & brand identity",
  price: 349,
  includes: ["Two logo concepts", "Colours and fonts", "One-page brand guide", "Files for print and web"],
};

// `fixed` extras keep their price in the quote builder: the founding discount doesn't apply.
export const featureOptions = [
  { id: "seo", label: "Local SEO", desc: "Google Business optimisation and local keyword targeting", price: 200, recurring: false, fixed: false },
  { id: "booking", label: "Online bookings", desc: "Real-time appointment, table, or callout booking", price: 300, recurring: false, fixed: false },
  { id: "store", label: "Online store", desc: "Product catalogue and checkout", price: 800, recurring: false, fixed: false },
  { id: "brand", label: "Logo & branding", desc: "Two logo concepts, colours, fonts and a brand guide", price: brandIdentity.price, recurring: false, fixed: true },
  { id: "maintenance", label: "Maintenance", desc: "Hosting, security updates, and small content changes", price: 60, recurring: true, fixed: false },
];

const priceById: Record<string, number> = Object.fromEntries(
  [...pageOptions, ...featureOptions].map((o) => [o.id, o.price])
);

export const aud = (n: number) => `$${Math.round(n).toLocaleString("en-AU")}`;
export const founding = (n: number) => Math.round(n * FOUNDING_DISCOUNT_RATE);

const tier1Full = BASE_PRICE;
const tier2Full = tier1Full + priceById.about + priceById.services + priceById.gallery;
const tier3Full = tier2Full + priceById.booking + priceById.seo + priceById["booking-page"];

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
    includes: ["Everything in Essentials", "About, Services / Menu, Gallery", "Enquiry form to your inbox", "Google Business profile tidy-up"],
    feature: true,
  },
  {
    id: "complete",
    name: "Complete",
    tagline: "Bookings and local search, done properly.",
    full: tier3Full,
    includes: ["Everything in Growth", "Online booking system", "Local SEO package", "Dedicated booking page"],
    feature: false,
  },
];

export const maintenancePrice = priceById.maintenance;
export const lowestPackagePrice = founding(tier1Full);

// ---- Quick jobs: fixed prices, paid upfront, no founding discount ----
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
    id: "email",
    name: "Business email",
    price: 79,
    desc: "you@yourbusiness.com.au, set up on your own domain and working on your phone and computer.",
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
    id: "brand-kit",
    name: "Logo tidy-up & brand kit",
    price: 149,
    desc: "Clean, sharp logo files for print and screen, plus your colours and fonts written down in one place.",
  },
];

export const starterBundle = {
  id: "starter-bundle",
  name: "Starter bundle",
  price: 299,
  includes: ["Google Business Profile setup", "Facebook + Instagram setup", "Business email", "Domain registered in your name"],
  // What the same jobs cost one by one (the domain registration on its own is $49 plus the domain).
  separately: 129 + 79 * 2 + 79 + 49,
};

export const lowestQuickJobPrice = Math.min(...quickJobs.map((j) => j.price));
