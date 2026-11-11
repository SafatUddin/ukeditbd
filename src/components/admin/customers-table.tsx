"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Mail, MoreHorizontal, ShieldCheck, ShoppingCart, User, UserCog } from "lucide-react";
import { toast } from "sonner";
import { DataTableColumnHeader } from "@/components/admin/data-table/column-header";
import { DataTable, facetFilterFn } from "@/components/admin/data-table/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { setUserRole } from "@/lib/actions/admin/settings";
import { formatDate, formatPrice, initials } from "@/lib/format";
import { cn } from "@/lib/utils";

export type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "CUSTOMER" | "STAFF" | "ADMIN";
  orders: number;
  spent: number;
  aov: number;
  lastOrder: string | null;
  joined: string;
  segment: string;
};

const segmentStyle: Record<string, string> = {
  VIP: "bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:text-amber-300",
  Repeat: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
  New: "bg-blue-500/10 text-blue-700 ring-blue-500/20 dark:text-blue-300",
  Prospect: "bg-zinc-500/10 text-zinc-600 ring-zinc-500/20 dark:text-zinc-300",
};

type Props = { data: CustomerRow[]; currentUserId: string; canManageRoles: boolean; initialSearch?: string };

export function CustomersTable({ data, currentUserId, canManageRoles, initialSearch }: Props) {
  const router = useRouter();
  const [, start] = useTransition();

  const changeRole = (id: string, role: CustomerRow["role"]) =>
    start(async () => {
      const res = await setUserRole(id, role);
      if (res.ok) toast.success(res.message);
      else toast.error(res.error);
      router.refresh();
    });

  const columns: ColumnDef<CustomerRow>[] = [
    {
      accessorKey: "name",
      meta: { label: "Customer" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="size-9"><AvatarFallback className="text-xs">{initials(row.original.name)}</AvatarFallback></Avatar>
          <div className="min-w-0">
            <p className="font-medium">{row.original.name}</p>
            <p className="truncate text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    { accessorKey: "email", meta: { label: "Email" }, header: "Email" },
    { accessorKey: "phone", meta: { label: "Phone" }, header: "Phone", cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.phone || "—"}</span> },
    {
      accessorKey: "segment",
      meta: { label: "Segment" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Segment" />,
      cell: ({ row }) => <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset", segmentStyle[row.original.segment])}>{row.original.segment}</span>,
      filterFn: facetFilterFn,
    },
    { accessorKey: "role", meta: { label: "Role" }, header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />, cell: ({ row }) => <StatusBadge status={row.original.role} dot={false} />, filterFn: facetFilterFn },
    { accessorKey: "orders", meta: { label: "Orders" }, header: ({ column }) => <DataTableColumnHeader column={column} title="Orders" />, cell: ({ row }) => <span className="tabular-nums">{row.original.orders}</span> },
    { accessorKey: "spent", meta: { label: "Total spent" }, header: ({ column }) => <DataTableColumnHeader column={column} title="Total spent" />, cell: ({ row }) => <span className="font-medium tabular-nums">{formatPrice(row.original.spent)}</span> },
    { accessorKey: "aov", meta: { label: "AOV" }, header: ({ column }) => <DataTableColumnHeader column={column} title="AOV" />, cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{row.original.aov ? formatPrice(row.original.aov) : "—"}</span> },
    {
      accessorKey: "lastOrder",
      meta: { label: "Last order" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Last order" />,
      sortUndefined: "last",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.lastOrder ? formatDate(row.original.lastOrder) : "—"}</span>,
    },
    { accessorKey: "joined", meta: { label: "Joined" }, header: ({ column }) => <DataTableColumnHeader column={column} title="Joined" />, cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.joined)}</span> },
    {
      id: "actions",
      enableHiding: false,
      size: 40,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label="Actions"><MoreHorizontal /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild><Link href={`/admin/orders?q=${encodeURIComponent(row.original.email)}`}><ShoppingCart /> View orders</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><a href={`mailto:${row.original.email}`}><Mail /> Email customer</a></DropdownMenuItem>
            {canManageRoles && row.original.id !== currentUserId && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Change role</DropdownMenuLabel>
                {row.original.role !== "CUSTOMER" && <DropdownMenuItem onSelect={() => changeRole(row.original.id, "CUSTOMER")}><User /> Customer</DropdownMenuItem>}
                {row.original.role !== "STAFF" && <DropdownMenuItem onSelect={() => changeRole(row.original.id, "STAFF")}><UserCog /> Staff</DropdownMenuItem>}
                {row.original.role !== "ADMIN" && <DropdownMenuItem onSelect={() => changeRole(row.original.id, "ADMIN")}><ShieldCheck /> Admin</DropdownMenuItem>}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      pageSize={20}
      initialSearch={initialSearch}
      initialVisibility={{ email: false, phone: false, aov: false }}
      initialSorting={[{ id: "spent", desc: true }]}
      searchPlaceholder="Search name, email, phone…"
      exportName="customers"
      filters={[
        { columnId: "segment", title: "Segment", options: ["VIP", "Repeat", "New", "Prospect"].map((s) => ({ label: s, value: s })) },
        { columnId: "role", title: "Role", options: [{ label: "Customer", value: "CUSTOMER" }, { label: "Staff", value: "STAFF" }, { label: "Admin", value: "ADMIN" }] },
      ]}
    />
  );
}
