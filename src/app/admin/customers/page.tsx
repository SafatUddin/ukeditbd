import { CustomersTable, type CustomerRow } from "@/components/admin/customers-table";
import { KpiCard } from "@/components/admin/kpi-card";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { daysAgo, formatPrice } from "@/lib/format";
import { Crown, Repeat, UserPlus, Users } from "lucide-react";

export const metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  const me = await requireAdmin();
  const sp = await searchParams;
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { orders: { where: { status: { notIn: ["CANCELLED", "REFUNDED"] } }, select: { total: true, createdAt: true } } },
  });

  const rows: CustomerRow[] = users.map((u) => {
    const spent = u.orders.reduce((s, o) => s + o.total, 0);
    const last = u.orders.reduce<Date | null>((d, o) => (!d || o.createdAt > d ? o.createdAt : d), null);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone ?? "",
      role: u.role,
      orders: u.orders.length,
      spent,
      aov: u.orders.length ? Math.round(spent / u.orders.length) : 0,
      lastOrder: last?.toISOString() ?? null,
      joined: u.createdAt.toISOString(),
      segment: u.orders.length === 0 ? "Prospect" : spent >= 50000 ? "VIP" : u.orders.length > 1 ? "Repeat" : "New",
    };
  });

  const customers = rows.filter((r) => r.role === "CUSTOMER");
  const buyers = customers.filter((c) => c.orders > 0);
  const repeat = buyers.filter((c) => c.orders > 1).length;
  const monthAgo = daysAgo(30);
  const ltv = buyers.length ? buyers.reduce((s, c) => s + c.spent, 0) / buyers.length : 0;
  const newThisMonth = customers.filter((c) => new Date(c.joined) > monthAgo).length;

  return (
    <>
      <PageHeader title="Customers" description="Everyone who has an account with your store, with lifetime value and segments." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total customers" value={String(customers.length)} hint={`${buyers.length} have purchased`} icon={Users} />
        <KpiCard title="New (30 days)" value={String(newThisMonth)} icon={UserPlus} />
        <KpiCard title="Repeat purchase rate" value={`${buyers.length ? ((repeat / buyers.length) * 100).toFixed(0) : 0}%`} hint={`${repeat} repeat buyers`} icon={Repeat} />
        <KpiCard title="Avg. lifetime value" value={formatPrice(ltv)} icon={Crown} />
      </div>
      <CustomersTable data={rows} currentUserId={me.id} canManageRoles={me.role === "ADMIN"} initialSearch={typeof sp.q === "string" ? sp.q : ""} />
    </>
  );
}
