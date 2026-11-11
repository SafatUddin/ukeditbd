import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { DeleteSupplierButton, SupplierDialog } from "@/components/admin/purchasing/supplier-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Suppliers" };

export default async function SuppliersPage() {
  const suppliers = await db.supplier.findMany({
    orderBy: { name: "asc" },
    include: { purchaseOrders: { select: { status: true, items: { select: { quantity: true, unitCost: true } } } } },
  });

  return (
    <>
      <PageHeader title="Suppliers" description="Vendors you purchase stock from, with lead times and spend.">
        <SupplierDialog />
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {suppliers.map((s) => {
          const spend = s.purchaseOrders.filter((p) => p.status !== "CANCELLED").reduce((sum, p) => sum + p.items.reduce((a, i) => a + i.quantity * i.unitCost, 0), 0);
          const open = s.purchaseOrders.filter((p) => ["ORDERED", "PARTIAL"].includes(p.status)).length;
          return (
            <Card key={s.id} className="gap-4">
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-900 text-sm font-semibold text-white dark:from-zinc-200 dark:to-zinc-400 dark:text-zinc-900">
                    {s.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <CardTitle className="text-base">{s.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{s.contactName ?? "No contact"}</p>
                  </div>
                </div>
                <div className="flex">
                  <SupplierDialog supplier={{ ...s, contactName: s.contactName ?? "", email: s.email ?? "", phone: s.phone ?? "", address: s.address ?? "", notes: s.notes ?? "" }} />
                  <DeleteSupplierButton id={s.id} name={s.name} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  {s.email && <p className="flex items-center gap-2"><Mail className="size-3.5" /> {s.email}</p>}
                  {s.phone && <p className="flex items-center gap-2"><Phone className="size-3.5" /> {s.phone}</p>}
                  {s.address && <p className="flex items-center gap-2"><MapPin className="size-3.5" /> {s.address}</p>}
                  <p className="flex items-center gap-2"><Clock className="size-3.5" /> {s.leadTimeDays}-day lead time</p>
                </div>
                <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-3 text-center">
                  <div><p className="text-lg font-semibold tabular-nums">{s.purchaseOrders.length}</p><p className="text-[11px] text-muted-foreground">POs</p></div>
                  <div><p className="text-lg font-semibold tabular-nums">{open}</p><p className="text-[11px] text-muted-foreground">Open</p></div>
                  <div><p className="text-lg font-semibold tabular-nums">{formatPrice(spend).replace(/\.00$/, "")}</p><p className="text-[11px] text-muted-foreground">Spend</p></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
