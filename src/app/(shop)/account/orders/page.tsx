import Image from "next/image";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";

export default async function OrdersPage() {
  const user = await requireUser("/account/orders");
  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: { select: { image: true, productName: true } } },
  });

  if (!orders.length) {
    return (
      <div className="rounded-2xl bg-cream p-16 text-center">
        <p className="font-display text-3xl">No orders yet</p>
        <Link href="/shop" className="mt-6 inline-block rounded-full bg-ink px-8 py-3 text-sm text-white">Start shopping</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <Link key={o.id} href={`/account/orders/${o.number}`} className="block rounded-2xl border p-5 transition hover:border-foreground/30 hover:shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <p className="font-medium">{o.number}</p>
              <StatusBadge status={o.status} />
            </div>
            <p className="text-sm text-muted-foreground">{formatDate(o.createdAt)}</p>
          </div>
          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="flex -space-x-3">
              {o.items.slice(0, 4).map((i, idx) => (
                <div key={idx} className="relative size-14 overflow-hidden rounded-full border-2 border-white bg-cream">
                  {i.image && <Image src={i.image} alt={i.productName} fill sizes="56px" className="object-contain p-1.5 mix-blend-multiply" />}
                </div>
              ))}
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{o.items.length} item{o.items.length > 1 ? "s" : ""}</p>
              <p className="font-medium">{formatPrice(o.total)}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
