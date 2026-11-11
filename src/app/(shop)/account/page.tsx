import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";

export default async function AccountPage() {
  const user = await requireUser();
  const [orders, stats, addresses, wishCount] = await Promise.all([
    db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 3, include: { _count: { select: { items: true } } } }),
    db.order.aggregate({ where: { userId: user.id, status: { notIn: ["CANCELLED", "REFUNDED"] } }, _sum: { total: true }, _count: true }),
    db.address.findMany({ where: { userId: user.id }, orderBy: { isDefault: "desc" } }),
    db.wishlistItem.count({ where: { userId: user.id } }),
  ]);

  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Orders", stats._count],
          ["Total spent", formatPrice(stats._sum.total ?? 0)],
          ["Saved items", wishCount],
        ].map(([l, v]) => (
          <div key={l} className="rounded-2xl bg-cream p-6">
            <p className="eyebrow text-muted-foreground">{l}</p>
            <p className="mt-2 font-display text-4xl">{v}</p>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">Recent orders</h2>
          <Link href="/account/orders" className="text-sm underline underline-offset-4">View all</Link>
        </div>
        {orders.length ? (
          <div className="divide-y rounded-2xl border">
            {orders.map((o) => (
              <Link key={o.id} href={`/account/orders/${o.number}`} className="flex items-center justify-between gap-4 p-5 transition-colors hover:bg-cream/50">
                <div>
                  <p className="font-medium">{o.number}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(o.createdAt)} · {o._count.items} items</p>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={o.status} />
                  <p className="w-24 text-right text-sm font-medium">{formatPrice(o.total)}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-cream p-8 text-center text-sm text-muted-foreground">No orders yet. <Link href="/shop" className="underline">Start shopping</Link></p>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border p-6">
          <h2 className="text-lg font-medium">Profile</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div><dt className="text-muted-foreground">Name</dt><dd>{user.name}</dd></div>
            <div><dt className="text-muted-foreground">Email</dt><dd>{user.email}</dd></div>
            <div><dt className="text-muted-foreground">Phone</dt><dd>{user.phone ?? "—"}</dd></div>
            <div><dt className="text-muted-foreground">Member since</dt><dd>{formatDate(user.createdAt)}</dd></div>
          </dl>
        </section>
        <section className="rounded-2xl border p-6">
          <h2 className="text-lg font-medium">Address book</h2>
          {addresses.length ? (
            <ul className="mt-4 space-y-4 text-sm">
              {addresses.map((a) => (
                <li key={a.id}>
                  <p className="font-medium">{a.label} {a.isDefault && <span className="ml-1 rounded bg-cream px-1.5 py-0.5 text-[10px] uppercase">Default</span>}</p>
                  <p className="text-muted-foreground">{a.fullName}, {a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.area}, {a.city} {a.postalCode}</p>
                  <p className="text-muted-foreground">{a.phone}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Addresses saved at checkout will appear here.</p>
          )}
        </section>
      </div>
    </div>
  );
}
