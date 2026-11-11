"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/admin/data-table/column-header";
import { DataTable, facetFilterFn } from "@/components/admin/data-table/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Progress } from "@/components/ui/progress";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export type PORow = {
  id: string;
  number: string;
  supplier: string;
  status: string;
  lines: number;
  units: number;
  received: number;
  total: number;
  expectedAt: string | null;
  createdAt: string;
};

const columns: ColumnDef<PORow>[] = [
  {
    accessorKey: "number",
    meta: { label: "PO #" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="PO #" />,
    cell: ({ row }) => <Link href={`/admin/purchase-orders/${row.original.id}`} onClick={(e) => e.stopPropagation()} className="font-mono text-sm font-medium hover:underline">{row.original.number}</Link>,
  },
  { accessorKey: "supplier", meta: { label: "Supplier" }, header: ({ column }) => <DataTableColumnHeader column={column} title="Supplier" />, filterFn: facetFilterFn },
  { accessorKey: "status", meta: { label: "Status" }, header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />, cell: ({ row }) => <StatusBadge status={row.original.status} />, filterFn: facetFilterFn },
  {
    accessorKey: "received",
    meta: { label: "Received" },
    header: "Received",
    cell: ({ row }) => (
      <div className="w-36">
        <div className="flex justify-between text-xs"><span className="tabular-nums">{row.original.received} / {row.original.units} units</span><span className="text-muted-foreground">{row.original.lines} lines</span></div>
        <Progress value={(row.original.received / Math.max(1, row.original.units)) * 100} className="mt-1 h-1.5" />
      </div>
    ),
  },
  { accessorKey: "total", meta: { label: "Total cost" }, header: ({ column }) => <DataTableColumnHeader column={column} title="Total cost" />, cell: ({ row }) => <span className="font-medium tabular-nums">{formatPrice(row.original.total)}</span> },
  {
    accessorKey: "expectedAt",
    meta: { label: "Expected" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Expected" />,
    cell: ({ row }) => {
      const d = row.original.expectedAt;
      if (!d) return <span className="text-muted-foreground">—</span>;
      const overdue = new Date(d) < new Date() && ["ORDERED", "PARTIAL"].includes(row.original.status);
      return <span className={cn("text-sm", overdue ? "font-medium text-red-600" : "text-muted-foreground")}>{formatDate(d)}{overdue && " · overdue"}</span>;
    },
  },
  { accessorKey: "createdAt", meta: { label: "Created" }, header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />, cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</span> },
];

export function PurchaseOrdersTable({ data }: { data: PORow[] }) {
  const router = useRouter();
  const suppliers = [...new Set(data.map((d) => d.supplier))];
  return (
    <DataTable
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      onRowClick={(r) => router.push(`/admin/purchase-orders/${r.id}`)}
      searchPlaceholder="Search PO or supplier…"
      exportName="purchase-orders"
      filters={[
        { columnId: "status", title: "Status", options: ["DRAFT", "ORDERED", "PARTIAL", "RECEIVED", "CANCELLED"].map((s) => ({ label: s.charAt(0) + s.slice(1).toLowerCase(), value: s })) },
        { columnId: "supplier", title: "Supplier", options: suppliers.map((s) => ({ label: s, value: s })) },
      ]}
    />
  );
}
