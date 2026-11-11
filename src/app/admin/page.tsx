import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Boxes, DollarSign, PackageX, Percent, ShoppingCart, UserPlus, Wallet } from "lucide-react";
import { CategoryChart, RevenueChart, StatusDonut } from "@/components/admin/dashboard-charts";
import { KpiCard } from "@/components/admin/kpi-card";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { requireAdmin } from "@/lib/auth/dal";
import { getDashboardData } from "@/lib/queries/dashboard";
import { formatCompact, formatDateTime, formatPrice, stockStatus } from "@/lib/format";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireAdmin();
  const d = await getDashboardData();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const maxTop = Math.max(...d.topProducts.map((p) => p.revenue), 1);

  return (
    <>
      <PageHeader title={`${greeting}, ${user.name.split(" ")[0]}`} description="Here's what's happening across your store over the last 30 days.">
        <Button variant="outline" size="sm" asChild><Link href="/admin/inventory?status=low">Review low stock</Link></Button>
        <Button size="sm" asChild><Link href="/admin/products/new">Add product</Link></Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Revenue" value={formatPrice(d.kpis.revenue.value)} delta={d.kpis.revenue.delta} hint="vs. previous 30d" icon={DollarSign} />
        <KpiCard title="Orders" value={String(d.kpis.orders.value)} delta={d.kpis.orders.delta} hint="vs. previous 30d" icon={ShoppingCart} />
        <KpiCard title="Average order value" value={formatPrice(d.kpis.aov.value)} delta={d.kpis.aov.delta} hint="vs. previous 30d" icon={Wallet} />
        <KpiCard title="New customers" value={String(d.kpis.customers.value)} delta={d.kpis.customers.delta} hint="vs. previous 30d" icon={UserPlus} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RevenueChart data={d.series} />
        <StatusDonut data={d.statuses} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Inventory value (cost)" value={`৳${formatCompact(d.inventory.value)}`} hint={`৳${formatCompact(d.inventory.retailValue)} at retail`} icon={Boxes} />
        <KpiCard title="Gross margin" value={`${d.kpis.margin.toFixed(1)}%`} hint={`${d.inventory.units.toLocaleString()} units · ${d.inventory.skus} SKUs`} icon={Percent} />
        <KpiCard title="Low stock SKUs" value={String(d.inventory.low)} hint="At or below reorder point" icon={AlertTriangle} tone="warning" />
        <KpiCard title="Out of stock SKUs" value={String(d.inventory.out)} hint="Losing sales right now" icon={PackageX} tone="danger" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <CategoryChart data={d.categories} />

        <Card>
          <CardHeader>
            <CardTitle>Top products</CardTitle>
            <CardDescription>By revenue, last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {d.topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="w-4 text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                <div className="relative size-10 shrink-0 overflow-hidden rounded-md border bg-white">
                  {p.image && <Image src={p.image} alt="" fill sizes="40px" className="object-contain p-1" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="truncate font-medium">{p.name}</span>
                    <span className="tabular-nums">{formatPrice(p.revenue)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Progress value={(p.revenue / maxTop) * 100} className="h-1.5" />
                    <span className="text-xs whitespace-nowrap text-muted-foreground">{p.units} sold</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div className="space-y-1.5">
              <CardTitle>Reorder alerts</CardTitle>
              <CardDescription>SKUs at or below reorder point</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild><Link href="/admin/inventory">View all <ArrowRight /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {d.lowStock.map((v) => (
              <div key={v.id} className="flex items-center gap-3">
                <div className="relative size-10 shrink-0 overflow-hidden rounded-md border bg-white">
                  {v.image && <Image src={v.image} alt="" fill sizes="40px" className="object-contain p-1" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{v.name}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">{v.sku} · {v.label}</p>
                </div>
                <div className="text-right">
                  <StatusBadge status={stockStatus(v.stock, v.reorderPoint)} dot={false} />
                  <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">{v.stock} / {v.reorderPoint}</p>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/admin/purchase-orders/new?low=1">Create purchase order</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="space-y-1.5">
            <CardTitle>Recent orders</CardTitle>
            <CardDescription>Latest activity from your storefront</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild><Link href="/admin/orders">View all <ArrowRight /></Link></Button>
        </CardHeader>
        <CardContent className="px-0">
          <div className="divide-y">
            {d.recentOrders.map((o) => (
              <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-muted/50">
                <div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {o.customerName.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{o.customerName}</p>
                  <p className="truncate text-xs text-muted-foreground">{o.number} · {formatDateTime(o.createdAt)}</p>
                </div>
                <StatusBadge status={o.status} />
                <p className="w-24 text-right text-sm font-medium tabular-nums">{formatPrice(o.total)}</p>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
