/** Pastel tones taken from the category icons in the brand logo. */
export const categoryTone: Record<string, string> = {
  beauty: "bg-pastel-pink",
  skincare: "bg-pastel-green",
  fragrance: "bg-pastel-lavender",
  fashion: "bg-pastel-peach",
  shoes: "bg-pastel-blue",
  lifestyle: "bg-pastel-yellow",
  "food-wellness": "bg-pastel-green",
};

export const FACEBOOK_URL = "https://www.facebook.com/p/UK-Edit-BD-61595377911889/";
export const INSTAGRAM_URL = "https://www.instagram.com/ukeditbd";

/** Business contact & compliance details (address & DBID placeholders ready to update when available). */
export const BUSINESS_CONTACT = {
  legalName: "The UK Edit BD",
  address: "[House XX, Road XX, Area, Dhaka 12XX, Bangladesh]",
  phone: "01348-269394",
  email: "ukeditbd@gmail.com",
  dbid: "[DBID: Pending / Your DBID Number]",
  hours: "Saturday – Thursday, 10:00 AM – 8:00 PM (BST)",
} as const;

export const toneFor = (slug: string) => categoryTone[slug] ?? "bg-cream";
