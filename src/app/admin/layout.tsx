import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminHeader } from "@/components/admin/admin-header";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requireAdmin } from "@/lib/auth/dal";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · The UK Edit BD Admin" } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();
  const cookieStore = await cookies();
  const [orders, lowStock, openPOs] = await Promise.all([
    db.order.count({ where: { status: { in: ["PENDING", "CONFIRMED"] } } }),
    db.$queryRaw<{ n: bigint }[]>`SELECT COUNT(*) as n FROM ProductVariant WHERE stock <= reorderPoint`.then((r) => Number(r[0]?.n ?? 0)),
    db.purchaseOrder.count({ where: { status: { in: ["ORDERED", "PARTIAL"] } } }),
  ]);

  return (
    <SidebarProvider defaultOpen={cookieStore.get("sidebar_state")?.value !== "false"}>
      <AppSidebar user={{ name: user.name, email: user.email, role: user.role }} badges={{ orders, lowStock, openPOs }} />
      <SidebarInset className="min-w-0">
        <AdminHeader />
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
