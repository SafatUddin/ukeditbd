"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/admin/data-table/column-header";
import { DataTable, facetFilterFn } from "@/components/admin/data-table/data-table";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export type MovementRow = {
  id: string;
  createdAt: string;
  type: string;
  product: string;
  productId: string;
  sku: string;
  variant: string;
  quantity: number;
  stockAfter: number;
  reference: string;
  referenceHref: string | null;
  reason: string;
  user: string;
};

const columns: ColumnDef<MovementRow>[] = [
  {
    accessorKey: "createdAt",
    meta: { label: "Date" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => <span className="text-sm whitespace-nowrap text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>,
  },
  {
    accessorKey: "type",
    meta: { label: "Type" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => <StatusBadge status={row.original.type} />,
    filterFn: facetFilterFn,
  },
  {
    accessorKey: "product",
    meta: { label: "Product" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
    cell: ({ row }) => (
      <div className="min-w-0">
        <Link href={`/admin/products/${row.original.productId}`} className="block max-w-60 truncate text-sm font-medium hover:underline">{row.original.product}</Link>
        <p className="text-xs text-muted-foreground"><span className="font-mono">{row.original.sku}</span> · {row.original.variant}</p>
      </div>
    ),
  },
  { accessorKey: "sku", meta: { label: "SKU" }, header: "SKU" },
  {
    accessorKey: "quantity",
    meta: { label: "Change" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Change" />,
    cell: ({ row }) => {
      const q = row.original.quantity;
      return <span className={cn("font-mono text-sm font-semibold tabular-nums", q > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>{q > 0 ? `+${q}` : q}</span>;
    },
  },
  {
    accessorKey: "stockAfter",
    meta: { label: "Balance" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Balance" />,
    cell: ({ row }) => <span className="font-mono text-sm tabular-nums">{row.original.stockAfter}</span>,
  },
  {
    accessorKey: "reference",
    meta: { label: "Reference" },
    header: "Reference",
    cell: ({ row }) =>
      row.original.referenceHref ? (
        <Link href={row.original.referenceHref} className="font-mono text-xs text-primary underline-offset-4 hover:underline">{row.original.reference}</Link>
      ) : (
        <span className="font-mono text-xs text-muted-foreground">{row.original.reference || "—"}</span>
      ),
  },
  { accessorKey: "reason", meta: { label: "Reason" }, header: "Reason", cell: ({ row }) => <span className="block max-w-56 truncate text-sm text-muted-foreground">{row.original.reason || "—"}</span> },
  { accessorKey: "user", meta: { label: "By" }, header: ({ column }) => <DataTableColumnHeader column={column} title="By" />, cell: ({ row }) => <span className="text-sm">{row.original.user}</span> },
];

export function MovementsTable({ data, initialSearch }: { data: MovementRow[]; initialSearch?: string }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      pageSize={20}
      initialSearch={initialSearch}
      initialVisibility={{ sku: false }}
      searchPlaceholder="Search SKU, product, reference…"
      exportName="inventory-movements"
      filters={[
        {
          columnId: "type",
          title: "Type",
          options: ["SALE", "RECEIVED", "RETURN", "ADJUSTMENT", "DAMAGE", "INITIAL"].map((t) => ({ label: t.charAt(0) + t.slice(1).toLowerCase(), value: t })),
        },
      ]}
    />
  );
}
