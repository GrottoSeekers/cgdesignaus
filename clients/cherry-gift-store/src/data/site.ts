/*
 * Cherry Candy & Gift Store — ALL editable website content lives in this file.
 *
 * To change a price, add a product, swap a photo or update the shop notice,
 * edit the values below and redeploy. No other file needs touching.
 *
 * Photos: drop a .webp/.jpg into public/images/ and set `image: "/images/your-file.webp"`.
 * Products without a photo show a branded illustration until one is added.
 */

export const business = {
  name: "Cherry Candy & Gift Store",
  shortName: "Cherry Gift Store",
  tagline: "Gifts, candy packs & flowers, wrapped with love in Nairobi",
  description:
    "Cherry Candy & Gift Store in Nairobi: gift packages from KSh 1,000, luxury rose bouquets, candy packs, care & period packs, corporate gifts and picnics. Free wrapping, free gift box and same-day delivery in Nairobi.",
  address: {
    street: "Dynamic Mall, 3rd Floor, Shop 142B",
    locality: "Nairobi CBD",
    region: "Nairobi",
    country: "KE",
  },
  // Google Maps search link for the shop.
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Dynamic+Mall+Nairobi",
  hours: "Orders taken daily on WhatsApp",
  instagram: "https://www.instagram.com/cherry_gift_store/",
  instagramHandle: "@cherry_gift_store",
  // TikTok, Facebook etc. Leave a value empty ("") to hide that icon.
  tiktok: "",
  facebook: "",
};

/*
 * WhatsApp
 * `link` is the shop's existing WhatsApp business link (from the Instagram bio).
 * Add the shop's number to `number` in international format with no "+" or spaces,
 * e.g. "254712345678". Once set, every Order button opens WhatsApp with the
 * order already typed out. While it's empty, the order details are copied to
 * the customer's clipboard and they paste them into the chat.
 */
export const whatsapp = {
  link: "https://wa.me/message/A6VZAFHWQFZHE1",
  number: "",
};

export function whatsappUrl(message?: string) {
  if (whatsapp.number && message) {
    return `https://wa.me/${whatsapp.number}?text=${encodeURIComponent(message)}`;
  }
  return whatsapp.link;
}

/* Thin bar across the top of every page. Set `show: false` to hide it. */
export const announcement = {
  show: true,
  text: "Our Dynamic Mall shop is closed for a refresh, but orders and deliveries carry on as normal.",
  linkLabel: "Order on WhatsApp",
};

/* The promises shown under the homepage intro and on product pages. */
export const perks = [
  { title: "Free wrapping", note: "Every package, beautifully wrapped" },
  { title: "Free gift box", note: "Included at no extra cost" },
  { title: "Free card message", note: "We write your personal note" },
  { title: "Same-day delivery", note: "Nairobi, plus countrywide" },
];

export type Category = { id: string; label: string; blurb: string };

export const categories: Category[] = [
  { id: "flowers", label: "Flowers", blurb: "Luxury rose bouquets and custom arrangements." },
  { id: "gift-packages", label: "Gift packages", blurb: "Curated boxes with free wrapping and gift box." },
  { id: "care-packs", label: "Care & period packs", blurb: "Thoughtful comfort packs for her." },
  { id: "for-him", label: "For him", blurb: "Gift packages he'll actually use." },
  { id: "candy-packs", label: "Candy packs", blurb: "Sweet treats, packed to impress." },
  { id: "corporate", label: "Corporate & events", blurb: "Staff, client and event gifting, plus picnics." },
];

export type Product = {
  slug: string;
  name: string;
  category: Category["id"];
  /** Price in KSh. Use null for "price on request". */
  price: number | null;
  /** Shows "From KSh …" when the price is a starting point. */
  from?: boolean;
  description: string;
  contents?: string[];
  image?: string;
  imageAlt?: string;
  /** Shown on the homepage "Customer favourites" row. */
  featured?: boolean;
  badge?: string;
};

export const products: Product[] = [
  {
    slug: "luxury-red-rose-bouquet",
    name: "Luxury Red Rose Bouquet",
    category: "flowers",
    price: 1000,
    from: true,
    description:
      "Deep red roses ringed with baby's breath, finished with ribbon and wrapping. Choose your budget and we build the bouquet around it.",
    contents: ["Fresh red roses", "Baby's breath trim", "Ribbon & wrapping included", "Pre-order recommended"],
    image: "/images/luxury-red-roses.webp",
    imageAlt: "Dome of deep red roses edged with white baby's breath",
    featured: true,
    badge: "Best seller",
  },
  {
    slug: "initial-rose-bouquet",
    name: "Personalised Initial Bouquet",
    category: "flowers",
    price: null,
    description:
      "Red roses framed in a cloud of baby's breath with their initial picked out in white blooms. Made to order for birthdays, anniversaries and proposals.",
    contents: ["Red roses", "Baby's breath border", "Initial or short name in flowers", "Gift wrapping"],
    image: "/images/initial-bouquet.webp",
    imageAlt: "Red rose bouquet with the letter N in white flowers, surrounded by baby's breath",
    featured: true,
    badge: "Custom",
  },
  {
    slug: "grand-rose-box",
    name: "Grand Rose Arrangement",
    category: "flowers",
    price: null,
    description:
      "A show-stopping arrangement of hundreds of red roses tied with a satin bow. Add a luxury gift on top, from perfume to the latest phone.",
    contents: ["Hundreds of red roses", "Satin ribbon", "Optional luxury gift add-on", "Delivered set up and ready"],
    image: "/images/grand-rose-box.webp",
    imageAlt: "Large arrangement of red roses with a burgundy bow and a boxed phone on top",
    featured: true,
    badge: "Luxury",
  },
  {
    slug: "queens-gift-set",
    name: "Queen's Gift Set",
    category: "gift-packages",
    price: 1200,
    description: "A little luxury that punches above its price. Comes in a gift bag with a complimentary card.",
    contents: ["Watch in a gift box", "Colourful brooch", "White coin purse", "Gift bag", "Complimentary card"],
    featured: true,
  },
  {
    slug: "sweet-pamper-box",
    name: "Sweet Pamper Box",
    category: "gift-packages",
    price: 1700,
    description: "Sweet treats meets self-care, wrapped and boxed for free.",
    contents: ["Shower gel", "Bubble gum", "3-in-1 Moana clips", "2 chocolate bars", "2 facial masks", "Yoghurt of your choice"],
  },
  {
    slug: "signature-gift-box",
    name: "Signature Gift Box",
    category: "gift-packages",
    price: 2400,
    description: "Our everyday favourite for birthdays and thank-yous. Free wrapping and gift box, cards available.",
    contents: ["Curated gift selection", "Free wrapping", "Free gift box", "Card available"],
  },
  {
    slug: "blush-gift-box",
    name: "Blush Gift Box",
    category: "gift-packages",
    price: 2850,
    description: "A fuller box with a pretty, girly finish. Free wrapping and gift box, cards available.",
    contents: ["Curated gift selection", "Free wrapping", "Free gift box", "Card available"],
  },
  {
    slug: "self-care-box",
    name: "Self-Care Box",
    category: "gift-packages",
    price: 2900,
    description: "Everything for a proper pamper night in. Some items can be swapped to her favourites (price may vary).",
    contents: [
      "Vaseline",
      "Apricot body scrub (your choice)",
      "3-in-1 Moana clip",
      "Shower gel (your choice)",
      "OMG band",
      "Lip gloss",
      "Tongue scraper",
      "Hand fan",
      "2 facial masks",
      "Mars chocolate",
    ],
    featured: true,
    badge: "Popular",
  },
  {
    slug: "deluxe-gift-box",
    name: "Deluxe Gift Box",
    category: "gift-packages",
    price: 4900,
    description: "Our biggest ready-made box, for the moments that need to land. Free wrapping and gift box, cards available.",
    contents: ["Premium gift selection", "Free wrapping", "Free gift box", "Card available"],
  },
  {
    slug: "care-period-pack",
    name: "Care & Period Pack",
    category: "care-packs",
    price: 2500,
    description:
      "A comfort pack for that time of the month, with her preferred pads and liners. Prices may vary with the brands you choose.",
    contents: [
      "Hand cream",
      "Vaseline",
      "Pads of her choice",
      "Large wipes",
      "Pant liners of her choice",
      "Mini fan",
      "Lip gloss",
      "Mini body splash",
      "Crunchy chocolate",
      "Chewing gum & lollipop",
    ],
    featured: true,
  },
  {
    slug: "gift-package-for-him",
    name: "Gift Package for Him",
    category: "for-him",
    price: 3000,
    from: true,
    description:
      "Ready-made packages for dads, partners and brothers, from KSh 3,000 up to premium hampers. Free personalised message writing.",
    contents: ["Curated men's gifts", "Gift wrapping", "Free personalised message", "Countrywide delivery"],
  },
  {
    slug: "candy-pack",
    name: "Candy Pack",
    category: "candy-packs",
    price: null,
    description: "A colourful pack of sweets, chocolates and lollipops. Pick a size and a theme and we'll pack it.",
    contents: ["Chocolates", "Lollipops", "Gummies & sweets", "Themed wrapping"],
  },
  {
    slug: "corporate-gift-package",
    name: "Corporate Gift Packages",
    category: "corporate",
    price: null,
    description:
      "Branded or themed gift boxes for staff, clients and events, in any quantity. Tell us the budget per person and we'll put together options.",
    contents: ["Bulk orders", "Custom branding & cards", "Budget per head", "Scheduled delivery"],
  },
  {
    slug: "picnic-setup",
    name: "Picnic Setup",
    category: "corporate",
    price: null,
    description:
      "A styled picnic for dates, birthdays and proposals: blankets, décor, treats and flowers, set up for you.",
    contents: ["Styled picnic setup", "Décor & flowers", "Treats & candy", "Ideal for dates and proposals"],
  },
];

export function formatPrice(p: Pick<Product, "price" | "from">) {
  if (p.price === null) return "Price on request";
  return `${p.from ? "From " : ""}KSh ${p.price.toLocaleString("en-KE")}`;
}

/* Occasions shown on the homepage. */
export const occasions = [
  "Birthdays",
  "Anniversaries",
  "Valentine's Day",
  "Girlfriends' Day",
  "Mother's Day",
  "Father's Day",
  "Proposals",
  "Get well soon",
  "Graduations",
  "Just because",
];

/* Custom order steps (Custom orders page and homepage). */
export const customSteps = [
  { title: "Tell us the occasion", text: "Who it's for, your budget and the date. A photo for inspiration helps too." },
  { title: "We design it", text: "We suggest items, flowers, colours and wrapping, and send you a preview." },
  { title: "Confirm & pay", text: "A deposit or full payment secures your slot. Pre-orders fill up fast before holidays." },
  { title: "We deliver", text: "Same-day delivery in Nairobi, countrywide delivery, or pick up." },
];

/*
 * Customer reviews.
 * IMPORTANT: the three below are SAMPLES to show the layout — they display a
 * "Sample" tag on the site. Replace them with real customer reviews (from
 * WhatsApp, Instagram DMs or Google) and delete `sample: true` before launch.
 */
export const reviews = [
  {
    quote: "Replace with a real customer review, e.g. what they ordered, how it looked and how the person reacted.",
    name: "Customer name",
    detail: "Rose bouquet",
    sample: true,
  },
  {
    quote: "Replace with a real customer review about delivery, wrapping or the personal message card.",
    name: "Customer name",
    detail: "Self-Care Box",
    sample: true,
  },
  {
    quote: "Replace with a real customer review from a custom or corporate order.",
    name: "Customer name",
    detail: "Corporate gifts",
    sample: true,
  },
];

export const faqs = [
  {
    q: "How do I place an order?",
    a: "Tap any Order button to message us on WhatsApp, or fill in the order form. Tell us what you'd like, the delivery date and the address, and we'll confirm the total.",
  },
  {
    q: "Do you deliver?",
    a: "Yes. We offer same-day delivery within Nairobi and countrywide delivery. Delivery fees depend on your location and are confirmed when you order.",
  },
  {
    q: "Is wrapping included?",
    a: "Yes. Gift packages come with free wrapping, a free gift box and a free personalised card message.",
  },
  {
    q: "Can I customise a package?",
    a: "Absolutely. Swap items, change colours, add flowers, chocolates or a luxury gift, or build a package from scratch around your budget.",
  },
  {
    q: "How far ahead should I order?",
    a: "Same-day orders are often possible, but for Valentine's, Mother's Day, Father's Day and other busy dates we take pre-orders only and slots are limited, so order early.",
  },
  {
    q: "How do I pay?",
    a: "A deposit or full payment confirms your order. We'll share payment details on WhatsApp. Confirmed custom orders are made fresh for you and are non-refundable.",
  },
];
