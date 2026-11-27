// A/B test settings. This is the only file to edit to run, change or stop a test.
//
// How it works: middleware.ts (project root) gives each visitor variant "a" or
// "b" before the page loads, remembers it in a cookie, and serves the matching
// pre-built page ("/" for A, "/v/b/" for B), so nobody sees the page swap.
// Search engine bots always get A. Preview either version with ?variant=a or
// ?variant=b on the URL (?variant=reset forgets the choice).
//
// Variant A is the page as written in src/components/SalesPage.astro.
// Variant B is A with the overrides below applied. Leave a field out to keep
// A's version. Test one idea at a time so the result tells you something.

export const experiment = {
  // Changing the id starts a fresh test: everyone is re-split and the results
  // are reported under the new id.
  id: "lead-first-01",
  // false = everyone sees A, nothing is split or reported per variant.
  enabled: true,
  // Share of new visitors who get B (0.5 = 50/50).
  splitToB: 0.5,
  // What this test is checking, for whoever reads the results later.
  hypothesis:
    "Leading with a free call (hero button + call box above the plans) gets more people to commit than sending them straight to checkout.",
};

export type Variant = "a" | "b";

export interface VariantOverrides {
  hero?: {
    headline?: { lead: string; highlight: string; close?: string };
    uppercut?: string;
    // "pricing" scrolls to the plans (direct checkout). "call" opens the free-call booking.
    cta?: { label: string; action: "pricing" | "call" };
  };
  pricing?: {
    // Which plan gets the glow, the yellow button and the flag.
    featured?: "monthly" | "3months";
    // Show the featured plan first (left on laptops, top on phones).
    featuredFirst?: boolean;
    flag?: string;
    // Button labels on the plan cards.
    ctaLabels?: { monthly?: string; "3months"?: string };
    // Move the "Still unsure? Book a call" box above the plans and make its button the yellow one.
    callFirst?: boolean;
    // Heading for that box (A says "Still unsure?").
    callTitle?: string;
  };
}

export const variants: Record<Variant, VariantOverrides> = {
  // Control: the page exactly as written.
  a: {},

  // Lead-first angle.
  b: {
    hero: {
      cta: { label: "Book a free call", action: "call" },
      // Other hero ideas to try in a later test (one at a time):
      // headline: { lead: "Get in the best shape of your life,", highlight: "and stay there." },
      // uppercut: "A training and nutrition plan built around your life, with weekly check-ins and a 12-week results guarantee.",
    },
    pricing: {
      callFirst: true,
      callTitle: "Not sure where to start? Let’s talk first.",
      // Other pricing ideas:
      // featured: "monthly", flag: "Most popular",
      // ctaLabels: { "3months": "Start my 12 weeks" },
    },
  },
};
