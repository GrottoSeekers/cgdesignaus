/*
 * Insert here — every image, video and line of copy on the homepage.
 *
 * Swapping in real photography: drop files into public/media/ and change the `src`
 * values below. Keep roughly the same orientation (the `ratio` drives the layout).
 * Hero slides can be images or videos: { type: "video", src: "/media/hero.mp4", poster: "/media/hero-1.webp" }.
 * The current files are stand-in plates generated for layout and motion only.
 */

export const brand = {
  name: "Insert here",
  descriptor: "Gifts, florals & keepsakes",
  email: "studio@inserthere.com",
  instagram: "https://www.instagram.com/",
  instagramHandle: "@inserthere",
  city: "London",
  address: "By appointment · Studio address here",
};

export type Slide =
  | { type: "image"; src: string; alt: string; caption: string }
  | { type: "video"; src: string; poster: string; alt: string; caption: string };

export const hero = {
  eyebrow: "Gift studio — Est. 2026",
  // Each line is revealed separately; wrap a word in *asterisks* for italic.
  headline: ["Considered gifts,", "*quietly* given."],
  slides: [
    { type: "image", src: "/media/hero-1.webp", alt: "Still life of wrapped boxes and dried stems on linen", caption: "The Ivory Edit" },
    { type: "image", src: "/media/hero-2.webp", alt: "Blush still life with a ceramic vase and ribboned boxes", caption: "Blush, for June" },
    { type: "image", src: "/media/hero-3.webp", alt: "Sage-toned arrangement beside a wrapped keepsake", caption: "Garden Studies" },
  ] as Slide[],
};

export const intro =
  "A gift should feel chosen, never bought. Every piece is sourced from small makers, composed by hand in our studio and wrapped in paper we would keep ourselves, then delivered with a note in your own words.";

export type Piece = { src: string; alt: string; title: string; kind: string; ratio: "portrait" | "landscape" | "square" };

export const pieces: Piece[] = [
  { src: "/media/piece-1.webp", alt: "Terracotta vase with dried blooms beside a small box", title: "The Terracotta Box", kind: "Keepsakes", ratio: "portrait" },
  { src: "/media/piece-2.webp", alt: "Row of wrapped stone-grey gift boxes", title: "Stone Linen Set", kind: "Wrapped sets", ratio: "landscape" },
  { src: "/media/piece-3.webp", alt: "Ochre still life with stems and a ribboned box", title: "Late Summer", kind: "Florals", ratio: "square" },
  { src: "/media/piece-4.webp", alt: "Sage vase with a single stem", title: "Sage Study", kind: "Florals", ratio: "portrait" },
  { src: "/media/piece-5.webp", alt: "Plum-toned keepsake box and blooms", title: "Plum Keepsake", kind: "Keepsakes", ratio: "portrait" },
  { src: "/media/piece-6.webp", alt: "Blush wrapped boxes with stems", title: "The Wedding Table", kind: "Celebrations", ratio: "landscape" },
  { src: "/media/piece-7.webp", alt: "Ivory box with a white flower", title: "Ivory Note", kind: "Wrapped sets", ratio: "portrait" },
  { src: "/media/piece-8.webp", alt: "Terracotta box and vase on a warm table", title: "Hearth", kind: "Home", ratio: "square" },
];

export const marquee = ["Gifts", "Florals", "Keepsakes", "Occasions", "Wrapped by hand"];

export const services = [
  {
    n: "01",
    title: "Weddings & celebrations",
    text: "Guest gifts, bridal party boxes and table florals, designed around your day and delivered to the venue.",
    items: ["Guest favours", "Bridal party boxes", "Table florals"],
    src: "/media/service-1.webp",
    alt: "Blush still life prepared for a wedding table",
  },
  {
    n: "02",
    title: "Bespoke & personal",
    text: "Birthdays, anniversaries, new homes and difficult days. Tell us about them and we compose something that sounds like you.",
    items: ["Personal commissions", "Seasonal subscriptions", "Hand-written notes"],
    src: "/media/service-2.webp",
    alt: "Ivory wrapped gift with dried flowers",
  },
  {
    n: "03",
    title: "Corporate & editorial",
    text: "Client gifting, launches and props for shoots. Considered at scale, without losing the hand-finished detail.",
    items: ["Client & team gifting", "Launch & event boxes", "Prop styling for shoots"],
    src: "/media/service-3.webp",
    alt: "Stone-grey boxes and stems arranged for a shoot",
  },
];

export const about = {
  src: "/media/about.webp",
  alt: "Ochre-toned studio still life",
  heading: ["A small studio", "with a *long* memory."],
  body: [
    "Insert here began with a simple idea: the best gifts are edited, not accumulated. We keep a short list of makers, potters, perfumers and growers, and we know each of them by name.",
    "Everything is composed by hand in the studio and wrapped to order, so no two boxes are quite the same.",
  ],
  facts: [
    { k: "Wrapped", v: "By hand" },
    { k: "Delivery", v: "Same day" },
    { k: "Makers", v: "Small batch" },
  ],
};

// Placeholder words: replace with real client testimonials before launch.
export const testimonials = [
  { quote: "It arrived looking like a still life. My mother kept the paper, the ribbon and the card.", name: "Client name", role: "Personal commission" },
  { quote: "Two hundred guest gifts, and somehow every one of them felt individual. People are still talking about them.", name: "Client name", role: "Wedding, 2026" },
  { quote: "Our client gifting finally looks like our brand. Effortless to brief, beautiful to receive.", name: "Client name", role: "Creative director" },
];

export const inquiry = {
  heading: ["Begin an", "*inquiry.*"],
  text: "Tell us who it's for and what the moment is. We reply within one working day with ideas and a quote.",
  occasions: ["Wedding", "Personal", "Corporate", "Something else"],
  bg: "/media/inquiry.webp",
};

/** Turn "*word* rest" into HTML with <em>. */
export const em = (s: string) => s.replace(/\*(.+?)\*/g, "<em>$1</em>");
