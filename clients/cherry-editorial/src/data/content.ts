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
  eyebrow: "Cherry Candy & Gift Store",
  headline: "Gifts, wrapped with love.",
  subhead: "Hand-picked gift packages, flowers and care packs. Free gift box and card. Same-day delivery in Nairobi.",
  slides: [
    { type: "image", src: "/media/roses-rocher-bouquet.webp", alt: "Red roses and baby's breath in black wrapping with a box of Ferrero Rocher", caption: "Roses & Rocher" },
    { type: "image", src: "/media/mixed-bouquet.webp", alt: "Mixed bouquet of pink and plum chrysanthemums, roses, hypericum berries and baby's breath in white wrapping", caption: "Because you miss her" },
    { type: "image", src: "/media/love-box.webp", alt: "Pink 'I love you' gift box with a mini fan, facial brush, lip serum, hair clips and sweets", caption: "The Love Box" },
    { type: "image", src: "/media/lilac-pamper-box.webp", alt: "Gift box with a lilac mini fan, perfume, lip serum, shampoo brush and chocolate sticks", caption: "Lilac Pamper Box" },
    { type: "image", src: "/media/care-period-pack.webp", alt: "Care pack with sanitary pads, eye mask, loofah, tissues and chocolate", caption: "Care & Period Pack" },
  ] as Slide[],
};

export const intro =
  "A gift should feel chosen, never bought. So every package is hand-picked, wrapped in our Nairobi shop, boxed for free and finished with a card in your words.";

// The four reasons to order, shown as a row of small cards under the hero.
export const highlights = [
  { icon: "box", title: "Free gift box", text: "Every package arrives boxed and wrapped." },
  { icon: "card", title: "Free card message", text: "Tell us what to say. We write it for you." },
  { icon: "truck", title: "Same-day delivery", text: "Across Nairobi, and countrywide on request." },
  { icon: "tag", title: "From KSh 1,000", text: "Ready-made or built around your budget." },
] as const;

export const categories = ["Gift packages", "Flowers", "Care packs", "Cards"] as const;
export type Category = (typeof categories)[number];

/*
 * The collection: the one product showcase on the page.
 * Each product has either `image` or `video` (a short muted loop with a poster).
 * Leave `price` out to show "Ask for price".
 */
export type Product = {
  title: string;
  category: Category;
  price?: string;
  alt: string;
  image?: string;
  video?: { src: string; poster: string };
};

export const products: Product[] = [
  { title: "The Love Box", category: "Gift packages", price: "KSh 3,800", image: "/media/love-box.webp", alt: "Pink 'I love you' gift box with a mini fan, facial brush, lip serum, hair clips and sweets" },
  { title: "Roses & Rocher", category: "Flowers", image: "/media/roses-rocher-bouquet.webp", alt: "Red rose bouquet with baby's breath, black wrapping and Ferrero Rocher" },
  { title: "Blush Pamper Box", category: "Gift packages", video: { src: "/media/reel-blush-box.mp4", poster: "/media/reel-blush-box.webp" }, alt: "Pink pamper box with perfume, Vaseline, lip gloss, chocolate and hair clips" },
  { title: "Care & Period Pack", category: "Care packs", image: "/media/care-period-pack.webp", alt: "Care pack with pads, eye mask, eyebrow razors, loofah, tissues and chocolate" },
  { title: "Because You Miss Her", category: "Flowers", image: "/media/mixed-bouquet.webp", alt: "Mixed bouquet of chrysanthemums, roses, berries and baby's breath in white wrapping" },
  { title: "The Bow Box", category: "Gift packages", video: { src: "/media/reel-bow-box.mp4", poster: "/media/reel-bow-box.webp" }, alt: "Gift box with a pink bow headband, plush toy, brush and treats" },
  { title: "Lilac Pamper Box", category: "Gift packages", image: "/media/lilac-pamper-box.webp", alt: "Gift box with a lilac fan, perfume, lip serum, shampoo brush and Alpines chocolate" },
  { title: "Pop-up Cards", category: "Cards", video: { src: "/media/reel-popup-cards.mp4", poster: "/media/reel-popup-cards.webp" }, alt: "Pop-up greeting cards with balloons, flowers and a typewriter" },
];

export const about = {
  src: "/media/cherry-logo.webp",
  alt: "Cherry logo: two red cherries tied with a pink bow",
  heading: "A little shop with a big heart.",
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
  heading: "Place an order.",
  text: "Tell us who it's for, the occasion and your budget. We reply on WhatsApp with ideas, the total and delivery details.",
  occasions: ["Birthday", "Anniversary", "Get well / care", "Corporate", "Something else"],
};

// Ordering & delivery questions (from the shop's Instagram posts and policies).
export const faqs = [
  { q: "How do I order?", a: "Tap Order on any gift, or fill in the order form. It goes straight to our WhatsApp, where we confirm the total, delivery fee and payment details." },
  { q: "Do you deliver?", a: "Yes. Same-day delivery across Nairobi, and countrywide delivery on request. The delivery fee depends on your location." },
  { q: "Is wrapping included?", a: "Always. Every package comes wrapped, in a free gift box, with a free card message written for you." },
  { q: "Can I customise a package?", a: "Of course. Swap items, change colours, add flowers or chocolates, or build something from scratch around your budget." },
  { q: "How far ahead should I order?", a: "Same-day orders are often possible. For Valentine's, Mother's Day, Father's Day and other busy dates we take pre-orders, and slots fill quickly." },
  { q: "How do I pay?", a: "A deposit or full payment confirms your order. Custom orders are made fresh for you, so they can't be cancelled once confirmed." },
];
