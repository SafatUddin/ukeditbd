export type CatalogColor = { name: string; hex: string };
export type CatalogProduct = {
  slug: string;
  name: string;
  category: string;
  gender: "MEN" | "WOMEN" | "UNISEX";
  price: number;
  compareAtPrice?: number;
  sizes: string[];
  colors: CatalogColor[];
  material: string;
  description: string;
  featured?: boolean;
  tags?: string[];
  brand?: string;
  /** Per-size price overrides, e.g. { "100ml": 8900 } */
  sizePrices?: Record<string, number>;
  /** Can be ordered when out of stock; sourced from the UK on demand */
  preorder?: boolean;
};

export const categories = [
  { slug: "beauty", name: "Beauty", description: "Cult UK makeup — lashes, lips, palettes and nails.", image: "/products/eyeshadow-palette-with-mirror/1.webp" },
  { slug: "skincare", name: "Skincare", description: "Everyday rituals from Britain's best-loved skincare shelves.", image: "/products/olay-ultra-moisture-shea-butter-body-wash/1.webp" },
  { slug: "fragrance", name: "Fragrance", description: "Authentic designer perfumes, sourced straight from the UK.", image: "/products/dior-jadore-edp/1.webp" },
  { slug: "fashion", name: "Fashion", description: "Dresses, shirting and handbags from the UK high street and beyond.", image: "/products/cognac-hobo-bag/1.webp" },
  { slug: "shoes", name: "Shoes", description: "From sculpted heels to court-ready sneakers.", image: "/products/champagne-stiletto/1.webp" },
  { slug: "lifestyle", name: "Lifestyle", description: "Sunglasses, jewellery and timepieces to finish the look.", image: "/products/havana-clubmaster/1.webp" },
  { slug: "food-wellness", name: "Food & Wellness", description: "British pantry favourites and wellness essentials, imported fresh.", image: "/products/henrys-raw-organic-honey/1.webp" },
];

const legacyCategory: Record<string, string> = {
  menswear: "fashion",
  womenswear: "fashion",
  bags: "fashion",
  footwear: "shoes",
  eyewear: "lifestyle",
  jewellery: "lifestyle",
  watches: "lifestyle",
};

const APPAREL = ["XS", "S", "M", "L", "XL"];
const MENS = ["S", "M", "L", "XL", "XXL"];
const SHOES_M = ["40", "41", "42", "43", "44"];
const SHOES_W = ["36", "37", "38", "39", "40"];
const ONE = ["One Size"];

const ML = ["50ml", "100ml"];
const preorderSlugs = new Set(["aqua-saffiano-tote", "midnight-floral-gown", "heritage-moonphase-chronograph", "champagne-stiletto"]);

const newLines: CatalogProduct[] = [
  // Beauty
  { slug: "essence-lash-princess-mascara", name: "Lash Princess False Lash Effect Mascara", brand: "Essence", category: "beauty", gender: "WOMEN", price: 1450, sizes: ONE, colors: [{ name: "Black", hex: "#111111" }], material: "12ml · Conical fibre brush", description: "The UK's cult-favourite mascara for dramatic volume and length — a false-lash effect without the falsies. Bought from UK retail and shipped to Bangladesh.", featured: true, tags: ["bestseller"] },
  { slug: "eyeshadow-palette-with-mirror", name: "Smoky Nudes Eyeshadow Palette", brand: "Glamour Beauty", category: "beauty", gender: "WOMEN", price: 2950, sizes: ONE, colors: [{ name: "Smoky Nudes", hex: "#8a4b4b" }], material: "18 shades · Matte & shimmer", description: "Eighteen buttery mattes and shimmers with a full-size mirror, from soft daytime nudes to a sultry evening smoky eye.", tags: ["new"] },
  { slug: "powder-canister", name: "Velvet Touch Setting Powder", brand: "Velvet Touch", category: "beauty", gender: "WOMEN", price: 2250, sizes: ONE, colors: [{ name: "Translucent", hex: "#e8d6c3" }], material: "10g · Finely milled", description: "A weightless, finely milled setting powder that blurs pores and locks makeup in place all day — even in Dhaka humidity." },
  { slug: "red-lipstick", name: "Classic Red Satin Lipstick", brand: "Chic Cosmetics", category: "beauty", gender: "WOMEN", price: 1850, compareAtPrice: 2200, sizes: ONE, colors: [{ name: "Classic Red", hex: "#b3121f" }], material: "3.5g · Satin finish", description: "The perfect blue-based red with a creamy satin finish and long-lasting colour payoff.", tags: ["sale"] },
  { slug: "red-nail-polish", name: "Gloss Couture Nail Polish", brand: "Nail Couture", category: "beauty", gender: "WOMEN", price: 1150, sizes: ONE, colors: [{ name: "Rouge", hex: "#c0152a" }], material: "15ml · Chip-resistant", description: "High-shine, chip-resistant lacquer in a timeless rouge. Two coats for salon-perfect nails." },

  // Skincare
  { slug: "olay-ultra-moisture-shea-butter-body-wash", name: "Ultra Moisture Shea Butter Body Wash", brand: "Olay", category: "skincare", gender: "UNISEX", price: 1650, sizes: ONE, colors: [{ name: "Shea Butter", hex: "#f2a33a" }], material: "700ml · UK formula", description: "Olay's richest body wash with shea butter and vitamin B3 complex for noticeably softer, hydrated skin from the very first wash.", featured: true, tags: ["bestseller"] },
  { slug: "vaseline-men-body-and-face-lotion", name: "Men Fast Absorbing Body & Face Lotion", brand: "Vaseline", category: "skincare", gender: "MEN", price: 1250, sizes: ONE, colors: [{ name: "Original", hex: "#1c2a4a" }], material: "400ml · Non-greasy", description: "A lightweight, fast-absorbing lotion that hydrates face and body without the greasy feel." },
  { slug: "attitude-super-leaves-hand-soap", name: "Super Leaves Natural Hand Soap", brand: "Attitude", category: "skincare", gender: "UNISEX", price: 1350, sizes: ONE, colors: [{ name: "Olive Leaves", hex: "#7fa34b" }], material: "473ml · Plant-based, vegan", description: "A gentle, plant-based hand soap enriched with olive and grape leaves. EWG verified and kind to sensitive skin.", tags: ["new"] },

  // Fragrance
  { slug: "chanel-coco-noir-edp", name: "Coco Noir Eau de Parfum", brand: "Chanel", category: "fragrance", gender: "WOMEN", price: 16500, sizePrices: { "100ml": 23900 }, sizes: ML, colors: [{ name: "Eau de Parfum", hex: "#111111" }], material: "Grapefruit · Rose · Patchouli · Sandalwood", description: "An oriental, mysterious and elegant fragrance that reveals the darker side of Coco. 100% authentic, sourced from UK authorised retailers.", featured: true, preorder: true, tags: ["bestseller"] },
  { slug: "dior-jadore-edp", name: "J'adore Eau de Parfum", brand: "Dior", category: "fragrance", gender: "WOMEN", price: 13900, sizePrices: { "100ml": 19900 }, sizes: ML, colors: [{ name: "Eau de Parfum", hex: "#e8c37a" }], material: "Ylang-ylang · Damascus rose · Jasmine", description: "The iconic floral bouquet of Dior — luminous, sensual and timeless. Sourced from UK authorised retailers.", featured: true, preorder: true },
  { slug: "gucci-bloom-edp", name: "Bloom Eau de Parfum", brand: "Gucci", category: "fragrance", gender: "WOMEN", price: 11900, sizePrices: { "100ml": 16900 }, sizes: ML, colors: [{ name: "Eau de Parfum", hex: "#f2b8b0" }], material: "Tuberose · Jasmine · Rangoon creeper", description: "A rich white-floral scent that captures a garden in full bloom.", preorder: true, tags: ["new"] },
  { slug: "dolce-gabbana-dolce-shine-edp", name: "Dolce Shine Eau de Parfum", brand: "Dolce & Gabbana", category: "fragrance", gender: "WOMEN", price: 9900, sizePrices: { "100ml": 13500 }, compareAtPrice: 11500, sizes: ML, colors: [{ name: "Eau de Parfum", hex: "#f6e27a" }], material: "Mango · Jasmine · Blonde woods", description: "A radiant, fruity floral that bursts with mango and sunny jasmine.", tags: ["sale"] },
  // Food & Wellness
  { slug: "henrys-raw-organic-honey", name: "Raw Organic Honey", brand: "Henry's", category: "food-wellness", gender: "UNISEX", price: 1490, sizes: ["340g", "680g"], sizePrices: { "680g": 2650 }, colors: [{ name: "Raw", hex: "#e3a21a" }], material: "100% raw, unpasteurised honey", description: "Cold-extracted organic honey with a rich floral flavour. Imported from the UK — perfect in tea, on toast or straight from the spoon.", featured: true, tags: ["new"] },
  { slug: "nescafe-clasico-instant-coffee", name: "Clasico Instant Coffee", brand: "Nescafé", category: "food-wellness", gender: "UNISEX", price: 1250, sizes: ["100g", "200g"], sizePrices: { "200g": 2190 }, colors: [{ name: "Dark Roast", hex: "#5a2e1a" }], material: "100% pure coffee", description: "A bold, full-bodied dark roast instant coffee. UK stock with a long best-before date.", tags: ["bestseller"] },
  { slug: "on-performance-whey-protein", name: "Performance Whey Protein", brand: "Optimum Nutrition", category: "food-wellness", gender: "UNISEX", price: 8900, sizes: ["908g", "2.27kg"], sizePrices: { "2.27kg": 17900 }, colors: [{ name: "Double Rich Chocolate", hex: "#3b2417" }], material: "24g protein per serving", description: "Fast-absorbing whey protein for recovery and lean muscle. Sourced from authorised UK distributors.", preorder: true },

  { slug: "calvin-klein-ck-one", name: "CK One Eau de Toilette", brand: "Calvin Klein", category: "fragrance", gender: "UNISEX", price: 5900, sizePrices: { "100ml": 8900 }, sizes: ML, colors: [{ name: "Eau de Toilette", hex: "#d9dde0" }], material: "Bergamot · Green tea · Musk", description: "The original shared fragrance — fresh, clean and effortlessly modern." },
];

const baseProducts: CatalogProduct[] = [
  // Menswear
  { slug: "oxford-gingham-shirt", name: "Oxford Gingham Shirt", category: "menswear", gender: "MEN", price: 3490, sizes: MENS, colors: [{ name: "Navy Gingham", hex: "#2f4a7a" }], material: "100% long-staple cotton", description: "A wardrobe cornerstone cut from crisp Oxford cotton in a classic navy gingham. Button-down collar, curved hem and mother-of-pearl buttons.", featured: true, tags: ["new", "bestseller"] },
  { slug: "buffalo-check-flannel", name: "Buffalo Check Flannel", category: "menswear", gender: "MEN", price: 4290, compareAtPrice: 4990, sizes: MENS, colors: [{ name: "Crimson", hex: "#b3262e" }], material: "Brushed cotton flannel, 220gsm", description: "Double-brushed for a cloud-soft hand. A relaxed overshirt that layers effortlessly from autumn into winter.", tags: ["sale"] },
  { slug: "tropic-print-camp-shirt", name: "Tropic Print Camp Shirt", category: "menswear", gender: "MEN", price: 2990, sizes: MENS, colors: [{ name: "Ocean Blue", hex: "#2d5fa8" }], material: "Lightweight viscose", description: "An open camp collar and fluid drape make this resort shirt the definitive warm-weather statement.", featured: true, tags: ["new"] },
  { slug: "highland-check-shirt", name: "Highland Check Shirt", category: "menswear", gender: "MEN", price: 3790, sizes: MENS, colors: [{ name: "Teal Check", hex: "#4f7f7a" }], material: "Cotton twill", description: "Heritage tartan reimagined in a modern slim fit with chest pocket and reinforced placket." },

  // Womenswear
  { slug: "midnight-floral-gown", name: "Midnight Floral Gown", category: "womenswear", gender: "WOMEN", price: 14990, sizes: APPAREL, colors: [{ name: "Midnight", hex: "#1c1b2e" }], material: "Silk-blend chiffon", description: "A floor-sweeping strapless gown printed with nocturnal blooms. Boned bodice, concealed zip and a whisper-light skirt.", featured: true, tags: ["evening", "new"] },
  { slug: "scarlet-corset-maxi", name: "Scarlet Corset Maxi", category: "womenswear", gender: "WOMEN", price: 11990, sizes: APPAREL, colors: [{ name: "Scarlet", hex: "#c8102e" }], material: "Vegan leather bodice, satin skirt", description: "Sculpted corsetry meets a liquid satin skirt. Designed to command every room.", featured: true, tags: ["evening"] },
  { slug: "noir-corset-maxi", name: "Noir Corset Maxi", category: "womenswear", gender: "WOMEN", price: 10990, sizes: APPAREL, colors: [{ name: "Noir", hex: "#111111" }], material: "Crepe-back satin", description: "The quintessential black dress, elevated. Structured corset bodice flowing into a column skirt.", tags: ["evening", "bestseller"] },
  { slug: "polka-tea-dress", name: "Polka Tea Dress", category: "womenswear", gender: "WOMEN", price: 5490, sizes: APPAREL, colors: [{ name: "Ivory Dot", hex: "#f3ede4" }], material: "Cotton poplin", description: "A playful fit-and-flare with a sweetheart neckline and a bow-tied waist." },
  { slug: "bordeaux-colourblock-dress", name: "Bordeaux Colourblock Dress", category: "womenswear", gender: "WOMEN", price: 8990, compareAtPrice: 10990, sizes: APPAREL, colors: [{ name: "Bordeaux", hex: "#6d1a2a" }], material: "Merino jersey", description: "Bold fuchsia and ivory sleeves frame a bordeaux column silhouette. Effortless polish.", tags: ["sale"] },
  { slug: "azure-polka-skater", name: "Azure Polka Skater", category: "womenswear", gender: "WOMEN", price: 3990, sizes: APPAREL, colors: [{ name: "Azure", hex: "#8fb3e0" }], material: "Cotton sateen", description: "Cap sleeves, a fitted bodice and a full skater skirt in a cheerful azure polka." },
  { slug: "palm-leaf-cold-shoulder-dress", name: "Palm Leaf Cold-Shoulder Dress", category: "womenswear", gender: "WOMEN", price: 4790, sizes: APPAREL, colors: [{ name: "Monochrome Palm", hex: "#3a3a3a" }], material: "Linen-viscose", description: "A breezy cold-shoulder midi with graphic palm print, made for long summer evenings.", tags: ["new"] },
  { slug: "sage-button-midi", name: "Sage Button Midi", category: "womenswear", gender: "WOMEN", price: 5990, sizes: APPAREL, colors: [{ name: "Sage", hex: "#a7ad97" }], material: "Washed linen", description: "Front-buttoned and softly cinched, this linen midi is the epitome of quiet luxury.", featured: true, tags: ["bestseller"] },
  { slug: "seafoam-tiered-mini", name: "Seafoam Tiered Mini", category: "womenswear", gender: "WOMEN", price: 4490, sizes: APPAREL, colors: [{ name: "Seafoam", hex: "#6c9e9a" }], material: "Crinkle chiffon", description: "Tiered ruffles and a strapless neckline in a dreamy seafoam hue." },
  { slug: "tartan-bow-dress", name: "Tartan Bow Dress", category: "womenswear", gender: "WOMEN", price: 4990, sizes: APPAREL, colors: [{ name: "Charcoal Tartan", hex: "#4a4a4a" }], material: "Wool-blend tartan", description: "A preppy tartan silhouette finished with an oversized satin bow." },

  // Footwear
  { slug: "court-high-top", name: "Court High-Top", category: "footwear", gender: "MEN", price: 12990, sizes: SHOES_M, colors: [{ name: "Varsity Red", hex: "#c0272d" }], material: "Full-grain leather upper", description: "An icon of the court, crafted in premium leather with a cushioned cupsole.", featured: true, tags: ["bestseller"] },
  { slug: "arrow-low-sneaker", name: "Arrow Low Sneaker", category: "footwear", gender: "UNISEX", price: 10990, sizes: SHOES_M, colors: [{ name: "White / Red", hex: "#f5f5f5" }], material: "Leather and suede", description: "A low-profile sneaker with a signature arrow panel and chunky sole.", tags: ["new"] },
  { slug: "classic-court-sneaker", name: "Classic Court Sneaker", category: "footwear", gender: "UNISEX", price: 8990, sizes: SHOES_M, colors: [{ name: "Optic White", hex: "#fafafa" }], material: "Nappa leather", description: "Clean lines, tonal stitching and a red heel tab. The everyday sneaker, perfected." },
  { slug: "retro-runner", name: "Retro Runner", category: "footwear", gender: "UNISEX", price: 7990, compareAtPrice: 9490, sizes: SHOES_M, colors: [{ name: "Multi", hex: "#f2c94c" }], material: "Mesh and suede", description: "Archival runner styling in a joyful colourway, with responsive foam cushioning.", tags: ["sale"] },
  { slug: "noir-almond-pump", name: "Noir Almond Pump", category: "footwear", gender: "WOMEN", price: 6990, sizes: SHOES_W, colors: [{ name: "Black Patent", hex: "#0d0d0d" }], material: "Patent leather", description: "A timeless almond-toe pump on a 100mm heel. The foundation of every wardrobe.", tags: ["bestseller"] },
  { slug: "champagne-stiletto", name: "Champagne Stiletto", category: "footwear", gender: "WOMEN", price: 7990, sizes: SHOES_W, colors: [{ name: "Champagne", hex: "#d8b08c" }], material: "Metallic leather", description: "A luminous champagne finish on a razor-thin stiletto. Made for celebrations.", featured: true },
  { slug: "coral-stiletto", name: "Coral Stiletto", category: "footwear", gender: "WOMEN", price: 6490, sizes: SHOES_W, colors: [{ name: "Coral", hex: "#e8473f" }], material: "Patent leather", description: "A vivid coral pump with a softly pointed toe and sculpted heel." },
  { slug: "two-tone-pointed-pump", name: "Two-Tone Pointed Pump", category: "footwear", gender: "WOMEN", price: 7490, sizes: SHOES_W, colors: [{ name: "Black / Cognac", hex: "#5a3a22" }], material: "Calf leather", description: "Black toe cap meets cognac leather on this graphic pointed pump." },
  { slug: "sculpt-slide-sandal", name: "Sculpt Slide Sandal", category: "footwear", gender: "WOMEN", price: 5990, sizes: SHOES_W, colors: [{ name: "Black", hex: "#141414" }], material: "Leather, block heel", description: "Architectural block-heel slides with a padded strap. Day-to-night ease.", tags: ["new"] },

  // Bags
  { slug: "marine-structured-tote", name: "Marine Structured Tote", category: "bags", gender: "WOMEN", price: 9490, sizes: ONE, colors: [{ name: "Marine", hex: "#1f2e6b" }], material: "Pebbled leather", description: "A structured tote with rolled handles and a suede-lined interior that fits a 13\" laptop." },
  { slug: "cognac-hobo-bag", name: "Cognac Hobo Bag", category: "bags", gender: "WOMEN", price: 12990, sizes: ONE, colors: [{ name: "Cognac", hex: "#9c4f25" }], material: "Vegetable-tanned leather", description: "Slouchy, sumptuous and built to patina beautifully with age.", featured: true, tags: ["bestseller"] },
  { slug: "aqua-saffiano-tote", name: "Aqua Saffiano Tote", category: "bags", gender: "WOMEN", price: 18990, sizes: ONE, colors: [{ name: "Aqua", hex: "#8ccfdc" }], material: "Saffiano leather", description: "Scratch-resistant saffiano leather in a refreshing aqua with gold-tone hardware.", tags: ["new"] },
  { slug: "ivory-mini-backpack", name: "Ivory Mini Backpack", category: "bags", gender: "WOMEN", price: 4990, compareAtPrice: 5990, sizes: ONE, colors: [{ name: "Ivory", hex: "#f1ede6" }], material: "Faux leather", description: "A compact drawstring backpack with magnetic flap and adjustable straps.", tags: ["sale"] },
  { slug: "noir-top-handle-bag", name: "Noir Top-Handle Bag", category: "bags", gender: "WOMEN", price: 10990, sizes: ONE, colors: [{ name: "Noir", hex: "#121212" }], material: "Smooth calf leather", description: "Polished, structured and endlessly versatile, with a detachable shoulder strap." },

  // Eyewear
  { slug: "havana-clubmaster", name: "Havana Clubmaster", category: "eyewear", gender: "UNISEX", price: 4490, sizes: ONE, colors: [{ name: "Havana / Green", hex: "#5b3a29" }], material: "Acetate and metal", description: "A mid-century browline frame with polarised G-15 lenses.", featured: true },
  { slug: "gradient-aviator", name: "Gradient Aviator", category: "eyewear", gender: "UNISEX", price: 3990, sizes: ONE, colors: [{ name: "Gold / Grey Gradient", hex: "#c9a65a" }], material: "Titanium", description: "Feather-light titanium aviators with a grey-to-clear gradient lens." },
  { slug: "mint-aviator", name: "Mint Aviator", category: "eyewear", gender: "UNISEX", price: 3790, sizes: ONE, colors: [{ name: "Black / Mint", hex: "#7fd1b0" }], material: "Stainless steel", description: "Mint-tinted lenses on a slim black frame. A fresh take on a classic.", tags: ["new"] },
  { slug: "crystal-shield", name: "Crystal Shield", category: "eyewear", gender: "UNISEX", price: 4990, sizes: ONE, colors: [{ name: "Crystal Clear", hex: "#e9edf0" }], material: "Bio-acetate", description: "A bold shield silhouette in crystal-clear bio-acetate with gold rivets." },

  // Jewellery
  { slug: "emerald-drop-earrings", name: "Emerald Drop Earrings", category: "jewellery", gender: "WOMEN", price: 3490, sizes: ONE, colors: [{ name: "Emerald", hex: "#1e6b46" }], material: "Gold-plated brass, crystal", description: "Faceted emerald crystals suspended from gold-plated drops.", featured: true },
  { slug: "checkerboard-hoop-earrings", name: "Checkerboard Hoop Earrings", category: "jewellery", gender: "WOMEN", price: 2490, sizes: ONE, colors: [{ name: "Mint / Cream", hex: "#5fb48a" }], material: "Hand-painted resin", description: "Playful oversized hoops in a hand-painted checkerboard.", tags: ["new"] },
  { slug: "gilded-palm-earrings", name: "Gilded Palm Earrings", category: "jewellery", gender: "WOMEN", price: 2790, sizes: ONE, colors: [{ name: "Ochre", hex: "#d79a3c" }], material: "Lightweight resin, gold-tone posts", description: "Sculptural palm leaves in warm ochre. Statement-making yet featherlight." },

  // Watches
  { slug: "heritage-moonphase-chronograph", name: "Heritage Moonphase Chronograph", category: "watches", gender: "MEN", price: 34990, sizes: ONE, colors: [{ name: "Gold / Brown", hex: "#8b5a2b" }], material: "Gold-tone steel, alligator-embossed leather", description: "A moonphase complication paired with chronograph sub-dials on a hand-stitched leather strap.", featured: true, tags: ["bestseller"] },
  { slug: "steel-automatic", name: "Steel Automatic 40", category: "watches", gender: "MEN", price: 28990, sizes: ONE, colors: [{ name: "Steel / Black", hex: "#9aa0a6" }], material: "316L stainless steel", description: "A Swiss-inspired automatic with a 42-hour power reserve and sapphire crystal." },
  { slug: "meridian-chronograph", name: "Meridian Chronograph", category: "watches", gender: "MEN", price: 32990, sizes: ONE, colors: [{ name: "Steel / Black", hex: "#7d8288" }], material: "Stainless steel", description: "Tri-compax chronograph with tachymeter bezel and screw-down crown." },
  { slug: "moonphase-dress-watch", name: "Moonphase Dress Watch", category: "watches", gender: "UNISEX", price: 39990, sizes: ONE, colors: [{ name: "Rose Gold / White", hex: "#b76e79" }], material: "Rose gold PVD, leather", description: "A refined dress watch featuring an enamel-blue moonphase at six o'clock." },
  { slug: "rose-gold-classic", name: "Rose Gold Classic", category: "watches", gender: "MEN", price: 24990, compareAtPrice: 29990, sizes: ONE, colors: [{ name: "Rose Gold / Black", hex: "#b07a5a" }], material: "Rose gold PVD, leather", description: "A slim, sunray black dial framed in warm rose gold.", tags: ["sale"] },
  { slug: "two-tone-oyster", name: "Two-Tone Oyster", category: "watches", gender: "UNISEX", price: 36990, sizes: ONE, colors: [{ name: "Steel / Gold", hex: "#c8a24a" }], material: "Steel and gold-tone", description: "Fluted bezel, jubilee bracelet and a date window with cyclops lens." },
  { slug: "diver-pro-300", name: "Diver Pro 300", category: "watches", gender: "MEN", price: 31990, sizes: ONE, colors: [{ name: "Black", hex: "#1a1a1a" }], material: "Stainless steel", description: "300m water resistance, unidirectional ceramic bezel and luminous indices.", tags: ["new"] },
  { slug: "azure-gold-bracelet-watch", name: "Azure Gold Bracelet Watch", category: "watches", gender: "WOMEN", price: 21990, sizes: ONE, colors: [{ name: "Gold / Azure", hex: "#2a4d8f" }], material: "Gold-tone steel", description: "A sunburst azure dial on a polished gold bracelet. Jewellery that tells time." },
  { slug: "minimal-steel-36", name: "Minimal Steel 36", category: "watches", gender: "WOMEN", price: 14990, sizes: ONE, colors: [{ name: "Steel / Black", hex: "#a5a9ae" }], material: "Stainless steel", description: "A pared-back 36mm case with a matte black dial and integrated bracelet." },
];

export const products: CatalogProduct[] = [
  ...newLines,
  ...baseProducts.map((p) => ({
    ...p,
    category: legacyCategory[p.category] ?? p.category,
    brand: p.brand ?? "The UK Edit Select",
    preorder: p.preorder ?? preorderSlugs.has(p.slug),
  })),
];

export const suppliers = [
  { name: "Boots Wholesale UK", contactName: "Emma Clarke", email: "trade@boots-wholesale.example", phone: "+44 20 7946 0101", address: "Nottingham, United Kingdom", leadTimeDays: 12 },
  { name: "Fragrance Direct Trade", contactName: "Oliver Hughes", email: "b2b@fragrancedirect.example", phone: "+44 20 7946 0102", address: "Manchester, United Kingdom", leadTimeDays: 14 },
  { name: "London Fashion Consolidators", contactName: "Amelia Patel", email: "orders@lfc.example", phone: "+44 20 7946 0103", address: "Shoreditch, London", leadTimeDays: 18 },
  { name: "Mayfair Lifestyle Imports", contactName: "James Whitaker", email: "sourcing@mayfair-imports.example", phone: "+44 20 7946 0104", address: "Mayfair, London", leadTimeDays: 21 },
];
