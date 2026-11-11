"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Archive, CheckCircle2, ExternalLink, FileEdit, MoreHorizontal, Pencil, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTableColumnHeader } from "@/components/admin/data-table/column-header";
import { DataTable, facetFilterFn, selectColumn } from "@/components/admin/data-table/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { deleteProduct, setProductsStatus } from "@/lib/actions/admin/products";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  category: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  featured: boolean;
  price: number;
  compareAtPrice: number | null;
  variants: number;
  stock: number;
  lowVariants: number;
  updatedAt: string;
};

export function ProductsTable({ data, categories }: { data: ProductRow[]; categories: string[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const runStatus = (ids: string[], status: ProductRow["status"]) =>
    start(async () => {
      const res = await setProductsStatus(ids, status);
      if (res.ok) toast.success(res.message);
      else toast.error(res.error);
      router.refresh();
    });

  const columns: ColumnDef<ProductRow>[] = [
    selectColumn<ProductRow>(),
    {
      accessorKey: "name",
      meta: { label: "Product" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="relative size-11 shrink-0 overflow-hidden rounded-lg border bg-white">
            {row.original.image && <Image src={row.original.image} alt="" fill sizes="44px" className="object-contain p-1" />}
          </div>
          <div className="min-w-0">
            <Link href={`/admin/products/${row.original.id}`} className="flex items-center gap-1.5 font-medium hover:underline">
              <span className="truncate">{row.original.name}</span>
              {row.original.featured && <Star className="size-3 shrink-0 fill-amber-400 text-amber-400" />}
            </Link>
            <p className="truncate text-xs text-muted-foreground">/{row.original.slug}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      meta: { label: "Status" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      filterFn: facetFilterFn,
    },
    {
      accessorKey: "category",
      meta: { label: "Category" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
      cell: ({ row }) => <span className="text-sm">{row.original.category}</span>,
      filterFn: facetFilterFn,
    },
    {
      accessorKey: "stock",
      meta: { label: "Inventory" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Inventory" />,
      cell: ({ row }) => {
        const { stock, variants, lowVariants } = row.original;
        return (
          <div className="text-sm">
            <span className={cn("font-medium tabular-nums", stock === 0 ? "text-red-600" : lowVariants ? "text-amber-600" : "")}>{stock} in stock</span>
            <span className="text-muted-foreground"> · {variants} variant{variants === 1 ? "" : "s"}</span>
            {lowVariants > 0 && stock > 0 && <p className="text-xs text-amber-600">{lowVariants} low</p>}
          </div>
        );
      },
    },
    {
      accessorKey: "price",
      meta: { label: "Price" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Price" />,
      cell: ({ row }) => (
        <div className="tabular-nums">
          {formatPrice(row.original.price)}
          {row.original.compareAtPrice && <span className="ml-1.5 text-xs text-muted-foreground line-through">{formatPrice(row.original.compareAtPrice)}</span>}
        </div>
      ),
    },
    {
      accessorKey: "updatedAt",
      meta: { label: "Updated" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Updated" />,
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.updatedAt)}</span>,
    },
    {
      id: "actions",
      enableHiding: false,
      size: 40,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Actions"><MoreHorizontal /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem asChild><Link href={`/admin/products/${row.original.id}`}><Pencil /> Edit</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href={`/product/${row.original.slug}`} target="_blank"><ExternalLink /> View in store</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            {row.original.status !== "ACTIVE" && <DropdownMenuItem onSelect={() => runStatus([row.original.id], "ACTIVE")}><CheckCircle2 /> Publish</DropdownMenuItem>}
            {row.original.status !== "ARCHIVED" && <DropdownMenuItem onSelect={() => runStatus([row.original.id], "ARCHIVED")}><Archive /> Archive</DropdownMenuItem>}
            <DropdownMenuItem
              variant="destructive"
              onSelect={() =>
                start(async () => {
                  if (!confirm(`Delete "${row.original.name}"? This cannot be undone.`)) return;
                  const res = await deleteProduct(row.original.id);
                  if (res.ok) toast.success(res.message);
                  else toast.error(res.error);
                  router.refresh();
                })
              }
            >
              <Trash2 /> Delete
            </DropdownMenuItem>
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
      searchPlaceholder="Search products…"
      exportName="products"
      filters={[
        { columnId: "status", title: "Status", options: [{ label: "Active", value: "ACTIVE" }, { label: "Draft", value: "DRAFT" }, { label: "Archived", value: "ARCHIVED" }] },
        { columnId: "category", title: "Category", options: categories.map((c) => ({ label: c, value: c })) },
      ]}
      bulkActions={(rows, table) => {
        const ids = rows.map((r) => r.original.id);
        const go = (s: ProductRow["status"]) => {
          runStatus(ids, s);
          table.resetRowSelection();
        };
        return (
          <>
            <Button size="sm" variant="outline" className="h-7" disabled={pending} onClick={() => go("ACTIVE")}><CheckCircle2 /> Publish</Button>
            <Button size="sm" variant="outline" className="h-7" disabled={pending} onClick={() => go("DRAFT")}><FileEdit /> Set draft</Button>
            <Button size="sm" variant="outline" className="h-7" disabled={pending} onClick={() => go("ARCHIVED")}><Archive /> Archive</Button>
          </>
        );
      }}
    />
  );
}
