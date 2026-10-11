/*
 * Cherry Candy & Gift Store — every image, video and line of copy on the homepage.
 *
 * Swapping photography: drop files into public/media/ and change the `src` values below.
 * Hero slides can be images or videos: { type: "video", src: "/media/clip.mp4", poster: "/media/still.webp", alt, caption }.
 * Original uploads are kept in assets/originals/.
 */

export const brand = {
  name: "Cherry",
  fullName: "Cherry Candy & Gift Store",
  descriptor: "Gifts, flowers & candy packs · Nairobi",
  logo: "/media/cherry-logo.webp",
  whatsapp: "https://wa.me/message/A6VZAFHWQFZHE1",
  // Shop's WhatsApp number, international format without "+", e.g. "254712345678".
  // When set, the order form opens WhatsApp with the message already typed.
  whatsappNumber: "",
  instagram: "https://www.instagram.com/cherry_gift_store/",
  instagramHandle: "@cherry_gift_store",
  address: "Dynamic Mall, 3rd Floor, Shop 142B · Nairobi",
};

export type Slide =
  | { type: "image"; src: string; alt: string; caption: string }
  | { type: "video"; src: string; poster: string; alt: string; caption: string };

export const hero = {
  eyebrow: "Cherry Candy & Gift Store — Nairobi",
  // Each line is revealed separately; wrap a word in *asterisks* for italic.
  headline: ["Gifts, wrapped", "with *love.*"],
  slides: [
    { type: "image", src: "/media/roses-rocher-bouquet.webp", alt: "Red roses and baby's breath in black wrapping with a box of Ferrero Rocher", caption: "Roses & Rocher" },
    { type: "image", src: "/media/love-box.webp", alt: "Pink 'I love you' gift box with a mini fan, facial brush, lip serum, hair clips and sweets", caption: "The Love Box" },
    { type: "image", src: "/media/lilac-pamper-box.webp", alt: "Gift box with a lilac mini fan, perfume, lip serum, shampoo brush and chocolate sticks", caption: "Lilac Pamper Box" },
    { type: "image", src: "/media/care-period-pack.webp", alt: "Care pack with sanitary pads, eye mask, loofah, tissues and chocolate", caption: "Care & Period Pack" },
  ] as Slide[],
};

export const intro =
  "A gift should feel chosen, never bought. Every package is hand-picked and wrapped in our Nairobi shop, boxed for free and finished with a card written in your words, then delivered the same day.";

export type Piece = { src: string; alt: string; title: string; kind: string; price?: string; ratio: "portrait" | "landscape" | "square" };

export const pieces: Piece[] = [
  { src: "/media/love-box.webp", alt: "Pink 'I love you' gift box with a mini fan, facial brush, lip serum, hair clips and sweets", title: "The Love Box", kind: "Gift packages", price: "KSh 3,800", ratio: "portrait" },
  { src: "/media/roses-rocher-bouquet.webp", alt: "Red rose bouquet with baby's breath, black wrapping and Ferrero Rocher", title: "Roses & Rocher", kind: "Flowers", ratio: "portrait" },
  { src: "/media/lilac-pamper-box.webp", alt: "Gift box with a lilac fan, perfume, lip serum, shampoo brush and Alpines chocolate", title: "Lilac Pamper Box", kind: "Gift packages", ratio: "portrait" },
  { src: "/media/care-period-pack.webp", alt: "Care pack with pads, eye mask, eyebrow razors, loofah, tissues and chocolate", title: "Care & Period Pack", kind: "Care packs", ratio: "portrait" },
];

export const marquee = ["Gift packages", "Flowers", "Candy packs", "Care packs", "Picnics", "Corporate"];

export const services = [
  {
    n: "01",
    title: "Gift & candy packages",
    text: "Ready-made and custom boxes for birthdays, anniversaries and just-because, from KSh 1,000. Always with a free gift box and wrapping.",
    items: ["Gift packages", "Candy packs", "Corporate orders"],
    src: "/media/lilac-pamper-box.webp",
    alt: "Lilac pamper gift box",
  },
  {
    n: "02",
    title: "Flowers & bouquets",
    text: "Red roses and baby's breath, custom-made around your budget, with chocolates or a gift added in. Same-day delivery in Nairobi.",
    items: ["Rose bouquets", "Custom arrangements", "Add a gift"],
    src: "/media/roses-rocher-bouquet.webp",
    alt: "Rose bouquet with Ferrero Rocher",
  },
  {
    n: "03",
    title: "Care & period packs",
    text: "Comfort for that time of the month, packed with her preferred pads, treats and little pampering extras.",
    items: ["Period packs", "Self-care boxes", "Get-well gifts"],
    src: "/media/care-period-pack.webp",
    alt: "Care and period pack",
  },
];

export const about = {
  src: "/media/cherry-logo.webp",
  alt: "Cherry logo: two red cherries tied with a pink bow",
  heading: ["A little shop", "with a *big heart.*"],
  body: [
    "Cherry Candy & Gift Store is a gift shop at Dynamic Mall in Nairobi. We put together gift packages, candy packs, flowers, care packs, picnics and corporate gifts for every kind of occasion.",
    "Every order is picked and wrapped by hand, comes in a free gift box, and carries a card message we write for you. We deliver the same day across Nairobi and countrywide on request.",
  ],
  facts: [
    { k: "Wrapping", v: "Free" },
    { k: "Card message", v: "Free" },
    { k: "Delivery", v: "Same day" },
  ],
};

// SAMPLES: replace with real customer reviews (WhatsApp, Instagram DMs, Google) before launch.
// While `sample: true`, a small "Sample review" note is shown under each quote.
export const testimonials = [
  { quote: "Replace with a real customer review: what they ordered, how it looked and how the person reacted.", name: "Customer name", role: "Gift package", sample: true },
  { quote: "Replace with a real review about the flowers, the wrapping or the same-day delivery.", name: "Customer name", role: "Rose bouquet", sample: true },
  { quote: "Replace with a real review from a corporate or custom order.", name: "Customer name", role: "Corporate order", sample: true },
];

export const inquiry = {
  heading: ["Place an", "*order.*"],
  text: "Tell us who it's for, the occasion and your budget. We reply on WhatsApp with ideas, the total and delivery details.",
  occasions: ["Birthday", "Anniversary", "Get well / care", "Corporate", "Something else"],
  bg: "/media/roses-rocher-bouquet.webp",
};

/** Turn "*word* rest" into HTML with <em>. */
export const em = (s: string) => s.replace(/\*(.+?)\*/g, "<em>$1</em>");
