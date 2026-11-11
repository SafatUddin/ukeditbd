"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, PackageCheck, Truck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { DataTableColumnHeader } from "@/components/admin/data-table/column-header";
import { DataTable, facetFilterFn, selectColumn } from "@/components/admin/data-table/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { updateOrderStatus } from "@/lib/actions/admin/orders";
import { formatDateTime, formatPrice } from "@/lib/format";
import type { OrderStatusValue } from "@/lib/order-flow";

export type OrderRow = {
  id: string;
  number: string;
  createdAt: string;
  customer: string;
  email: string;
  city: string;
  phone: string;
  address: string;
  items: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
};

const columns: ColumnDef<OrderRow>[] = [
  selectColumn<OrderRow>(),
  {
    accessorKey: "number",
    meta: { label: "Order" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Order" />,
    cell: ({ row }) => <Link href={`/admin/orders/${row.original.id}`} onClick={(e) => e.stopPropagation()} className="font-mono text-sm font-medium hover:underline">{row.original.number}</Link>,
  },
  {
    accessorKey: "createdAt",
    meta: { label: "Date" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => <span className="text-sm whitespace-nowrap text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>,
  },
  {
    accessorKey: "customer",
    meta: { label: "Customer" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
    cell: ({ row }) => (
      <div>
        <p className="text-sm font-medium">{row.original.customer}</p>
        <p className="text-xs text-muted-foreground">{row.original.email}</p>
      </div>
    ),
  },
  {
    accessorKey: "address",
    meta: { label: "Address" },
    header: "Address",
    cell: ({ row }) => (
      <div className="max-w-72 min-w-48">
        <p className="text-sm leading-snug whitespace-normal">{row.original.address}</p>
        <p className="text-xs text-muted-foreground">{row.original.phone}</p>
      </div>
    ),
  },
  { accessorKey: "phone", meta: { label: "Phone" }, header: "Phone" },
  { accessorKey: "email", meta: { label: "Email" }, header: "Email" },
  { accessorKey: "city", meta: { label: "City" }, header: ({ column }) => <DataTableColumnHeader column={column} title="City" />, filterFn: facetFilterFn },
  { accessorKey: "items", meta: { label: "Items" }, header: ({ column }) => <DataTableColumnHeader column={column} title="Items" />, cell: ({ row }) => <span className="tabular-nums">{row.original.items}</span> },
  {
    accessorKey: "paymentStatus",
    meta: { label: "Payment" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Payment" />,
    cell: ({ row }) => (
      <div className="flex flex-col items-start gap-0.5">
        <StatusBadge status={row.original.paymentStatus} />
        <span className="text-[11px] text-muted-foreground">{row.original.paymentMethod === "COD" ? "Cash on delivery" : "Card"}</span>
      </div>
    ),
    filterFn: facetFilterFn,
  },
  { accessorKey: "paymentMethod", meta: { label: "Method" }, header: "Method", filterFn: facetFilterFn },
  {
    accessorKey: "status",
    meta: { label: "Fulfilment" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fulfilment" />,
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
    filterFn: facetFilterFn,
  },
  {
    accessorKey: "total",
    meta: { label: "Total" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Total" className="justify-end" />,
    cell: ({ row }) => <p className="text-right font-medium tabular-nums">{formatPrice(row.original.total)}</p>,
  },
];

export function OrdersTable({ data, initialStatus, initialSearch }: { data: OrderRow[]; initialStatus?: string[]; initialSearch?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const bulk = (ids: string[], status: OrderStatusValue, reset: () => void) =>
    start(async () => {
      const res = await updateOrderStatus(ids, status);
      if (res.ok) toast.success(res.message);
      else toast.error(res.error);
      reset();
      router.refresh();
    });

  return (
    <DataTable
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      pageSize={20}
      onRowClick={(r) => router.push(`/admin/orders/${r.id}`)}
      searchPlaceholder="Search order #, customer, address, phone…"
      initialSearch={initialSearch}
      initialVisibility={{ phone: false, email: false, city: false, paymentMethod: false }}
      initialFilters={initialStatus ? [{ id: "status", value: initialStatus }] : []}
      exportName="orders"
      filters={[
        {
          columnId: "status",
          title: "Fulfilment",
          options: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"].map((s) => ({ label: s.charAt(0) + s.slice(1).toLowerCase(), value: s })),
        },
        { columnId: "paymentStatus", title: "Payment", options: [{ label: "Paid", value: "PAID" }, { label: "Unpaid", value: "UNPAID" }, { label: "Refunded", value: "REFUNDED" }] },
        { columnId: "paymentMethod", title: "Method", options: [{ label: "Cash on delivery", value: "COD" }, { label: "Card", value: "CARD" }] },
      ]}
      bulkActions={(rows, table) => {
        const ids = rows.map((r) => r.original.id);
        const reset = () => table.resetRowSelection();
        return (
          <>
            <Button size="sm" variant="outline" className="h-7" disabled={pending} onClick={() => bulk(ids, "CONFIRMED", reset)}><CheckCircle2 /> Confirm</Button>
            <Button size="sm" variant="outline" className="h-7" disabled={pending} onClick={() => bulk(ids, "PROCESSING", reset)}><PackageCheck /> Mark packed</Button>
            <Button size="sm" variant="outline" className="h-7" disabled={pending} onClick={() => bulk(ids, "SHIPPED", reset)}><Truck /> Mark shipped</Button>
            <Button size="sm" variant="outline" className="h-7 text-destructive" disabled={pending} onClick={() => confirm(`Cancel ${ids.length} order(s)? Stock will be returned to inventory.`) && bulk(ids, "CANCELLED", reset)}>
              <XCircle /> Cancel
            </Button>
          </>
        );
      }}
    />
  );
}
