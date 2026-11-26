// Every animation plays for everyone, Reduce Motion or not (the owner's choice; see home.css).
// Kept as a function so the scripts that ask still read clearly.
export const prefersReducedMotion = () => false;

export const SPRING_GENTLE = { type: "spring", stiffness: 300, damping: 20, mass: 1 };
export const SPRING_SNAPPY = { type: "spring", stiffness: 500, damping: 25, mass: 0.8 };
export const SPRING_BOUNCY = { type: "spring", stiffness: 400, damping: 12, mass: 1 };
