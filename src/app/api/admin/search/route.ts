import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { isStaffRole } from "@/lib/auth/jwt";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isStaffRole(user.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const [products, variants, orders, customers] = await Promise.all([
    db.product.findMany({ where: { name: { contains: q } }, take: 5, select: { id: true, name: true, price: true, status: true } }),
    db.productVariant.findMany({ where: { sku: { contains: q } }, take: 3, select: { sku: true, stock: true, product: { select: { id: true, name: true } } } }),
    db.order.findMany({
      where: { OR: [{ number: { contains: q } }, { customerName: { contains: q } }, { email: { contains: q } }] },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, number: true, customerName: true, total: true },
    }),
    db.user.findMany({ where: { role: "CUSTOMER", OR: [{ name: { contains: q } }, { email: { contains: q } }] }, take: 4, select: { id: true, name: true, email: true } }),
  ]);

  return NextResponse.json([
    ...products.map((p) => ({ type: "product", id: p.id, title: p.name, subtitle: `${formatPrice(p.price)} · ${p.status.toLowerCase()}`, href: `/admin/products/${p.id}` })),
    ...variants.map((v) => ({ type: "product", id: v.sku, title: v.sku, subtitle: `${v.product.name} · ${v.stock} on hand`, href: `/admin/inventory?q=${encodeURIComponent(v.sku)}` })),
    ...orders.map((o) => ({ type: "order", id: o.id, title: o.number, subtitle: `${o.customerName} · ${formatPrice(o.total)}`, href: `/admin/orders/${o.id}` })),
    ...customers.map((c) => ({ type: "customer", id: c.id, title: c.name, subtitle: c.email, href: `/admin/customers?q=${encodeURIComponent(c.email)}` })),
  ]);
}
