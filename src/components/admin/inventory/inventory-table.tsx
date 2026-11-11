"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { History, MoreHorizontal, Package, PlusCircle, Settings2, SlidersHorizontal } from "lucide-react";
import { DataTableColumnHeader } from "@/components/admin/data-table/column-header";
import { DataTable, facetFilterFn, selectColumn } from "@/components/admin/data-table/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AdjustStockDialog, ReorderSettingsDialog } from "./stock-dialogs";

export type InventoryRow = {
  id: string;
  productId: string;
  product: string;
  image: string | null;
  category: string;
  sku: string;
  variant: string;
  colorHex: string | null;
  bin: string;
  stock: number;
  reorderPoint: number;
  reorderQty: number;
  status: "in" | "low" | "out" | "backorder";
  cost: number;
  value: number;
  sold30: number;
  daysOfCover: number | null;
};

type Props = { data: InventoryRow[]; categories: string[]; initialSearch?: string; initialStatus?: string[] };

export function InventoryTable({ data, categories, initialSearch, initialStatus }: Props) {
  const [adjust, setAdjust] = useState<{ row: InventoryRow; mode: "add" | "remove" | "set" } | null>(null);
  const [settings, setSettings] = useState<InventoryRow | null>(null);

  const columns: ColumnDef<InventoryRow>[] = [
    selectColumn<InventoryRow>(),
    {
      accessorKey: "product",
      meta: { label: "Product" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="relative size-10 shrink-0 overflow-hidden rounded-md border bg-white">
            {row.original.image && <Image src={row.original.image} alt="" fill sizes="40px" className="object-contain p-1" />}
          </div>
          <div className="min-w-0">
            <Link href={`/admin/products/${row.original.productId}`} className="block max-w-56 truncate font-medium hover:underline">{row.original.product}</Link>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {row.original.colorHex && <span className="size-2.5 rounded-full ring-1 ring-black/10" style={{ background: row.original.colorHex }} />}
              {row.original.variant}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "sku",
      meta: { label: "SKU" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="SKU" />,
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.sku}</span>,
    },
    { accessorKey: "category", meta: { label: "Category" }, header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />, filterFn: facetFilterFn },
    {
      accessorKey: "bin",
      meta: { label: "Bin" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Bin" />,
      cell: ({ row }) => row.original.bin ? <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{row.original.bin}</span> : <span className="text-muted-foreground">—</span>,
    },
    {
      accessorKey: "stock",
      meta: { label: "On hand" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="On hand" />,
      cell: ({ row }) => {
        const { stock, reorderPoint, reorderQty } = row.original;
        const target = Math.max(reorderPoint + reorderQty, 1);
        return (
          <div className="w-28">
            <div className="flex items-baseline justify-between text-sm">
              <span className={cn("font-semibold tabular-nums", stock < 0 ? "text-violet-600" : stock === 0 ? "text-red-600" : stock <= reorderPoint ? "text-amber-600" : "")}>{stock}</span>
              <span className="text-[11px] text-muted-foreground">min {reorderPoint}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", stock <= 0 ? "bg-red-500" : stock <= reorderPoint ? "bg-amber-500" : "bg-emerald-500")}
                style={{ width: `${Math.max(0, Math.min(100, (stock / target) * 100))}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      meta: { label: "Status" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      filterFn: facetFilterFn,
    },
    {
      accessorKey: "sold30",
      meta: { label: "Sold (30d)" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Sold 30d" />,
      cell: ({ row }) => <span className="tabular-nums">{row.original.sold30}</span>,
    },
    {
      accessorKey: "daysOfCover",
      meta: { label: "Days of cover" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Cover" />,
      sortUndefined: "last",
      cell: ({ row }) => {
        const d = row.original.daysOfCover;
        if (d === null) return <span className="text-muted-foreground">—</span>;
        return <span className={cn("tabular-nums", d < 14 && "font-medium text-amber-600", d < 7 && "text-red-600")}>{d}d</span>;
      },
    },
    {
      accessorKey: "value",
      meta: { label: "Value (cost)" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Value" />,
      cell: ({ row }) => (
        <div className="text-right tabular-nums">
          <p>{formatPrice(row.original.value)}</p>
          <p className="text-[11px] text-muted-foreground">@ {formatPrice(row.original.cost)}</p>
        </div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      size: 40,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="outline" size="xs" onClick={() => setAdjust({ row: row.original, mode: "add" })}>
            <PlusCircle /> Stock
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="More"><MoreHorizontal /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onSelect={() => setAdjust({ row: row.original, mode: "add" })}><PlusCircle /> Receive / add</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setAdjust({ row: row.original, mode: "remove" })}><SlidersHorizontal /> Remove / write off</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setAdjust({ row: row.original, mode: "set" })}><SlidersHorizontal /> Stock count (set)</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSettings(row.original)}><Settings2 /> Reorder settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link href={`/admin/inventory/movements?q=${encodeURIComponent(row.original.sku)}`}><History /> View history</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href={`/admin/products/${row.original.productId}`}><Package /> Edit product</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        getRowId={(r) => r.id}
        pageSize={20}
        searchPlaceholder="Search SKU, product, bin…"
        initialSearch={initialSearch}
        initialFilters={initialStatus ? [{ id: "status", value: initialStatus }] : []}
        initialVisibility={{ category: false }}
        initialSorting={[{ id: "stock", desc: false }]}
        exportName="inventory"
        filters={[
          { columnId: "status", title: "Stock status", options: [{ label: "In stock", value: "in" }, { label: "Low stock", value: "low" }, { label: "Out of stock", value: "out" }, { label: "Backordered (pre-orders)", value: "backorder" }] },
          { columnId: "category", title: "Category", options: categories.map((c) => ({ label: c, value: c })) },
        ]}
        bulkActions={(rows) => (
          <Button size="sm" variant="outline" className="h-7" asChild>
            <Link href={`/admin/purchase-orders/new?variants=${rows.map((r) => r.original.id).join(",")}`}>Create purchase order</Link>
          </Button>
        )}
      />
      {adjust && <AdjustStockDialog row={adjust.row} initialMode={adjust.mode} onClose={() => setAdjust(null)} />}
      {settings && <ReorderSettingsDialog row={settings} onClose={() => setSettings(null)} />}
    </>
  );
}
