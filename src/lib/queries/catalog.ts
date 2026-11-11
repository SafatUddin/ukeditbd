import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export const productCardInclude = {
  images: { orderBy: { position: "asc" }, take: 2 },
  category: { select: { name: true, slug: true } },
  variants: { select: { stock: true, size: true, colorHex: true, color: true, price: true } },
} satisfies Prisma.ProductInclude;

export type ProductCardData = Prisma.ProductGetPayload<{ include: typeof productCardInclude }>;

export type ShopFilters = {
  q?: string;
  category?: string;
  gender?: string;
  size?: string[];
  min?: number;
  max?: number;
  sort?: string;
  sale?: boolean;
  preorder?: boolean;
};

const sorts: Record<string, Prisma.ProductOrderByWithRelationInput[]> = {
  newest: [{ createdAt: "desc" }],
  "price-asc": [{ price: "asc" }],
  "price-desc": [{ price: "desc" }],
  featured: [{ featured: "desc" }, { createdAt: "desc" }],
};

export async function getShopProducts(f: ShopFilters) {
  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    ...(f.q && {
      OR: [{ name: { contains: f.q } }, { brand: { contains: f.q } }, { description: { contains: f.q } }, { tags: { contains: f.q.toLowerCase() } }, { category: { name: { contains: f.q } } }],
    }),
    ...(f.category && { category: { slug: f.category } }),
    ...(f.gender && { gender: { in: [f.gender, "UNISEX"] } }),
    ...(f.size?.length && { variants: { some: { size: { in: f.size }, stock: { gt: 0 } } } }),
    ...((f.min || f.max) && { price: { gte: f.min || undefined, lte: f.max || undefined } }),
    ...(f.sale && { compareAtPrice: { not: null } }),
    ...(f.preorder && { allowPreorder: true }),
  };
  return db.product.findMany({ where, include: productCardInclude, orderBy: sorts[f.sort ?? "featured"] ?? sorts.featured });
}

export async function getFeaturedProducts(take = 8) {
  return db.product.findMany({
    where: { status: "ACTIVE", featured: true },
    include: productCardInclude,
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function getNewArrivals(take = 8) {
  return db.product.findMany({ where: { status: "ACTIVE" }, include: productCardInclude, orderBy: { createdAt: "desc" }, take });
}

export async function getCategoriesWithCounts() {
  return db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: { where: { status: "ACTIVE" } } } } },
  });
}

export async function getProductBySlug(slug: string) {
  return db.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      images: { orderBy: { position: "asc" } },
      category: true,
      variants: { orderBy: { createdAt: "asc" }, select: { id: true, sku: true, size: true, color: true, colorHex: true, price: true, stock: true } },
    },
  });
}

export async function getRelatedProducts(productId: string, categoryId: string, take = 4) {
  return db.product.findMany({
    where: { status: "ACTIVE", categoryId, id: { not: productId } },
    include: productCardInclude,
    take,
  });
}

export async function getWishlistIds(userId?: string) {
  if (!userId) return new Set<string>();
  const rows = await db.wishlistItem.findMany({ where: { userId }, select: { productId: true } });
  return new Set(rows.map((r) => r.productId));
}
