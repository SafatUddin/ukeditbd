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

export const toneFor = (slug: string) => categoryTone[slug] ?? "bg-cream";
