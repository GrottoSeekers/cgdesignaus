// Everything James might want to change lives here: links, prices, offer dates, copy lists.
// Pages import from this file, so a price changed here changes everywhere.

export const site = "https://www.jpicklesfitnesscoaching.com/";
export const brand = "J.Pickles Coaching";
export const coach = "James Pickles";

export const instagram = "https://www.instagram.com/jamespickles_fitness/";
export const handle = "@jamespickles_fitness";
// WhatsApp is James's main contact. Every "message James" button opens a chat with a
// ready-written first line (the client can edit it before sending).
export const email = "jpickles.coaching@outlook.com";
export const phoneDisplay = "07848 162640";
export const phoneIntl = "+447848162640";
export const wa = (text = "Hi James, I've just been on your website and have a question.") =>
  `https://wa.me/447848162640?text=${encodeURIComponent(text)}`;
export const dm = wa();
export const linktree = "https://linktr.ee/jpickles.coaching";
export const gym = { name: "Renegade Strength & Fitness", ig: "https://www.instagram.com/renegade_strengthfitness/" };
// Where James does 1:1 sessions: at Renegade in Westhoughton, and in and around Leigh.
export const areas = ["Westhoughton", "Leigh"];

// Black Friday: 50% off online coaching. Shown until the end date, then hidden automatically.
export const offer = {
  label: "Black Friday",
  headline: "50% off online coaching",
  detail: "Book by 27 November. Coaching starts 30 November.",
  ends: "2026-11-27T23:59:59+00:00",
  discount: 0.5,
};

export type Plan = {
  id: string;
  name: string;
  price: number;
  unit: string;
  note?: string;
  badge?: string;
  features: string[];
};

// Online coaching, per 4 weeks.
export const online: Plan[] = [
  {
    id: "bronze",
    name: "Bronze",
    price: 80,
    unit: "per 4 weeks",
    features: ["Personalised 4-week training programme", "Progressive overload", "Exercise demonstrations", "Programme updates every 4 weeks", "In-app messaging support"],
  },
  {
    id: "silver",
    name: "Silver",
    price: 100,
    unit: "per 4 weeks",
    badge: "Most popular",
    features: ["Personalised training programme", "Calorie and macro guidance", "Nutrition guidance", "Food tracking support", "2 check-ins per week", "Programme adjustments"],
  },
  {
    id: "gold",
    name: "Gold",
    price: 120,
    unit: "per 4 weeks",
    features: ["Everything in Silver", "Personalised meal plan", "Recipe ideas", "Shopping list (optional)", "Priority support", "Ongoing adjustments", "2 coaching check-ins per week"],
  },
  {
    id: "platinum",
    name: "Platinum",
    price: 200,
    unit: "per 4 weeks",
    badge: "Best value",
    features: ["Everything in Gold", "4 x 1:1 personal training sessions", "Technique coaching", "Exercise form analysis", "Accountability all month", "Priority support"],
  },
];

// 1:1 personal training. Sessions must be used within 4 weeks.
export const pt: Plan[] = [
  { id: "starter", name: "Starter", price: 55, unit: "2 sessions", note: "£27.50 a session", features: ["Personalised coaching", "Technique coaching", "Progress tracking", "Accountability"] },
  { id: "standard", name: "Standard", price: 100, unit: "4 sessions", note: "£25 a session", features: ["Personalised coaching", "Technique coaching", "Progress tracking", "Accountability"] },
  { id: "performance", name: "Performance", price: 160, unit: "8 sessions", note: "£20 a session", badge: "Most popular", features: ["Personalised coaching", "Technique coaching", "Progress tracking", "Accountability"] },
  { id: "payg", name: "Pay as you go", price: 30, unit: "1 session", note: "No package needed", features: ["One-off PT session", "Technique coaching", "No commitment"] },
];

export const ptTerms = [
  "Sessions must be used within 4 weeks.",
  "Give at least 24 hours' notice to cancel or move a session. Later than that, the session is charged in full and taken from your package.",
];

export const goals = ["Fat loss", "Strength", "HYROX", "Running", "Muscle gain", "Confidence", "Holiday prep", "A routine to follow", "Getting started in the gym"];

export const steps = [
  { verb: "Onboard", body: "One form: your goals, your week, your food. Ten minutes, on your phone." },
  { verb: "Train", body: "A programme written for you, with demos for every exercise." },
  { verb: "Check in", body: "Every Friday by 12pm. Weight, sessions, sleep, food. Under five minutes." },
  { verb: "Adjust", body: "I read every answer and change the plan before your next week starts." },
];

// Placeholder until James sends real reviews (Google Form going out now).
// Set `placeholder: false` and fill in the text when they arrive.
// Before/after photos (graded B&W, files in public/media: <slug>-<view>-<before|after>-<480|720>.webp).
// Only shown with the client's permission.
export const results = [
  { name: "Jilly", slug: "jilly", stat: "2.5", unit: "kg", label: "down", detail: "1:1 PT", views: ["front", "side"] as const },
];

// From James's testimonial form (both ticked permission to publish). Their own words; only
// spelling tidied. `name` follows each client's choice (full name or first name only).
export const reviews = [
  {
    name: "Jilly",
    detail: "1:1 PT, 1 to 3 months",
    rating: 5,
    text: "He is quick at getting back to you and very good at what he does. James is the guy! He helps you feel comfortable and not judged.",
  },
  {
    name: "Alex",
    detail: "Online coaching, 1 to 3 months",
    rating: 4,
    text: "The training is good and I’m enjoying the way the program is set up, and the app is really good. Stronger and feeling better about myself. You won’t regret starting, and in a few months you will be glad you did.",
  },
];

// Placeholder until James confirms. Shown as "to confirm" on the page.
export const qualifications = [
  { title: "Personal Trainer", detail: "Level 3" },
  { title: "Official HYROX Coach", detail: "Foundation & Level 1" },
  { title: "England Boxing Coach", detail: "Level 2" },
  { title: "First Aid", detail: "FREC 3" },
];

export const partners = [
  { name: "Applied Nutrition", role: "Coach", note: "Code PICKLES for 20% off" },
  { name: "Northern Gym Equipment", role: "Ambassador" },
  { name: "PWR Fitness", role: "Affiliate" },
];

export const event = {
  title: "Full HYROX simulation",
  date: "Saturday 2 January 2027",
  place: "Renegade Strength & Fitness",
  price: "£10 members, £15 non-members",
  detail: "Solo or doubles, open or pro. WhatsApp James to book a start time.",
  ends: "2027-01-02T23:59:59+00:00",
};

export const faqs = [
  { q: "Online or 1:1, which should I pick?", a: "Online if you train on your own and want a plan and accountability. 1:1 if you want me there for technique and a push. Platinum gives you both." },
  { q: "I'm a complete beginner. Is this for me?", a: "Yes. Plenty of clients start with \"I don't know how to use the gym\". The programme starts where you are." },
  { q: "Do I need a gym?", a: "It helps, but tell me what kit you have and I'll plan around it." },
  { q: "How do check-ins work?", a: "A short form every Friday by 12pm. I read it over the weekend and update your plan before Monday." },
  { q: "Can you help with HYROX?", a: "Yes. I race it myself and run HYROX classes and simulations. Your plan can build towards a race date." },
  { q: "Where are 1:1 sessions?", a: "I coach at Renegade Strength & Fitness in Westhoughton, and I'm also available in and around Leigh. WhatsApp me and we'll find a time that suits you." },
];

// CG Design & Co. credit strip (same as the other client sites).
export const cgLinks = [
  { label: "cgdesignaus.com", href: "https://cgdesignaus.com", external: true, icon: "world" },
  { label: "cgdesignaus@outlook.com", href: "mailto:cgdesignaus@outlook.com", external: false, icon: "mail" },
  { label: "WhatsApp", href: "https://wa.me/447306100251", external: true, icon: "whatsapp" },
  { label: "@cgdesignaus", href: "https://www.instagram.com/cgdesignaus", external: true, icon: "instagram" },
] as const;

export const gbp = (n: number) => `£${Number.isInteger(n) ? n : n.toFixed(2)}`;
