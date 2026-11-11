import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

const DAY = 86_400_000;
const valid: Prisma.OrderWhereInput = { status: { notIn: ["CANCELLED", "REFUNDED"] } };

export async function getDashboardData() {
  const now = Date.now();
  const start90 = new Date(now - 90 * DAY);
  const start30 = new Date(now - 30 * DAY);
  const start60 = new Date(now - 60 * DAY);

  const [orders90, statusGroups, variants, recentOrders, newCustomers, prevCustomers, items30] = await Promise.all([
    db.order.findMany({ where: { createdAt: { gte: start90 }, ...valid }, select: { total: true, createdAt: true } }),
    db.order.groupBy({ by: ["status"], _count: true }),
    db.productVariant.findMany({
      select: { id: true, sku: true, size: true, color: true, stock: true, reorderPoint: true, reorderQty: true, costPrice: true, price: true, product: { select: { id: true, name: true, price: true, images: { take: 1, orderBy: { position: "asc" }, select: { url: true } } } } },
    }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 7, select: { id: true, number: true, customerName: true, email: true, total: true, status: true, createdAt: true } }),
    db.user.count({ where: { role: "CUSTOMER", createdAt: { gte: start30 } } }),
    db.user.count({ where: { role: "CUSTOMER", createdAt: { gte: start60, lt: start30 } } }),
    db.orderItem.findMany({
      where: { order: { createdAt: { gte: start30 }, ...valid } },
      select: { quantity: true, unitPrice: true, unitCost: true, productName: true, image: true, variant: { select: { product: { select: { id: true, category: { select: { name: true } } } } } } },
    }),
  ]);

  const inRange = (from: number, to: number) => orders90.filter((o) => o.createdAt.getTime() >= from && o.createdAt.getTime() < to);
  const cur = inRange(start30.getTime(), now + 1);
  const prev = inRange(start60.getTime(), start30.getTime());
  const sum = (arr: { total: number }[]) => arr.reduce((s, o) => s + o.total, 0);
  const delta = (a: number, b: number) => (b === 0 ? (a > 0 ? 100 : 0) : ((a - b) / b) * 100);

  const revenue = sum(cur);
  const prevRevenue = sum(prev);
  const aov = cur.length ? revenue / cur.length : 0;
  const prevAov = prev.length ? prevRevenue / prev.length : 0;

  const series = Array.from({ length: 90 }, (_, i) => {
    const d = new Date(now - (89 - i) * DAY);
    const key = d.toISOString().slice(0, 10);
    return { date: key, revenue: 0, orders: 0 };
  });
  const idx = new Map(series.map((s, i) => [s.date, i]));
  for (const o of orders90) {
    const i = idx.get(o.createdAt.toISOString().slice(0, 10));
    if (i !== undefined) {
      series[i].revenue += o.total;
      series[i].orders += 1;
    }
  }

  const inventoryValue = variants.reduce((s, v) => s + v.stock * v.costPrice, 0);
  const retailValue = variants.reduce((s, v) => s + v.stock * (v.price ?? v.product.price), 0);
  const units = variants.reduce((s, v) => s + v.stock, 0);
  const lowStock = variants.filter((v) => v.stock <= v.reorderPoint).sort((a, b) => a.stock - b.stock);

  const byProduct = new Map<string, { name: string; image: string | null; units: number; revenue: number }>();
  const byCategory = new Map<string, { revenue: number; profit: number }>();
  let cogs = 0;
  for (const it of items30) {
    const id = it.variant?.product.id ?? it.productName;
    const p = byProduct.get(id) ?? { name: it.productName, image: it.image, units: 0, revenue: 0 };
    p.units += it.quantity;
    p.revenue += it.quantity * it.unitPrice;
    byProduct.set(id, p);
    const cat = it.variant?.product.category.name ?? "Other";
    const c = byCategory.get(cat) ?? { revenue: 0, profit: 0 };
    c.revenue += it.quantity * it.unitPrice;
    c.profit += it.quantity * (it.unitPrice - it.unitCost);
    byCategory.set(cat, c);
    cogs += it.quantity * it.unitCost;
  }
  const itemsRevenue = items30.reduce((s, it) => s + it.quantity * it.unitPrice, 0);

  return {
    kpis: {
      revenue: { value: revenue, delta: delta(revenue, prevRevenue) },
      orders: { value: cur.length, delta: delta(cur.length, prev.length) },
      aov: { value: aov, delta: delta(aov, prevAov) },
      customers: { value: newCustomers, delta: delta(newCustomers, prevCustomers) },
      margin: itemsRevenue ? ((itemsRevenue - cogs) / itemsRevenue) * 100 : 0,
    },
    inventory: {
      value: inventoryValue,
      retailValue,
      units,
      skus: variants.length,
      low: lowStock.filter((v) => v.stock > 0).length,
      out: lowStock.filter((v) => v.stock <= 0).length,
    },
    series,
    statuses: statusGroups.map((g) => ({ status: g.status, count: g._count })),
    lowStock: lowStock.slice(0, 6).map((v) => ({ id: v.id, sku: v.sku, name: v.product.name, label: [v.color, v.size].filter(Boolean).join(" / "), stock: v.stock, reorderPoint: v.reorderPoint, reorderQty: v.reorderQty, image: v.product.images[0]?.url ?? null })),
    topProducts: [...byProduct.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    categories: [...byCategory.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.revenue - a.revenue),
    recentOrders,
  };
}
