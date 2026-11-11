"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const priceRanges = [
  { label: "Under ৳5,000", min: "", max: "5000" },
  { label: "৳5,000 – ৳10,000", min: "5000", max: "10000" },
  { label: "৳10,000 – ৳25,000", min: "10000", max: "25000" },
  { label: "Over ৳25,000", min: "25000", max: "" },
];

function useParamsUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const set = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    start(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  };
  return { params, set, pending };
}

type Props = { categories: { slug: string; name: string; count: number }[]; sizes: string[] };

export function ShopFilters(props: Props) {
  return (
    <>
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <FilterPanel {...props} />
        </div>
      </aside>
      <Sheet>
        <SheetTrigger className="flex h-11 items-center justify-center gap-2 rounded-full border text-sm lg:hidden">
          <SlidersHorizontal className="size-4" /> Filters
        </SheetTrigger>
        <SheetContent side="left" className="overflow-y-auto p-6">
          <SheetTitle className="font-display text-2xl">Filters</SheetTitle>
          <FilterPanel {...props} />
        </SheetContent>
      </Sheet>
    </>
  );
}

function FilterPanel({ categories, sizes }: Props) {
  const { params, set, pending } = useParamsUpdater();
  const category = params.get("category");
  const gender = params.get("gender");
  const selectedSizes = params.get("size")?.split(",").filter(Boolean) ?? [];
  const min = params.get("min") ?? "";
  const max = params.get("max") ?? "";
  const active = ["category", "gender", "size", "min", "max", "sale", "preorder", "q"].some((k) => params.get(k));

  const toggleSize = (s: string) => {
    const next = selectedSizes.includes(s) ? selectedSizes.filter((x) => x !== s) : [...selectedSizes, s];
    set({ size: next.join(",") || null });
  };

  return (
    <div className={cn("transition-opacity", pending && "opacity-60")}>
      {active && (
        <button
          onClick={() => set({ category: null, gender: null, size: null, min: null, max: null, sale: null, preorder: null, q: null })}
          className="mb-4 flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <X className="size-3" /> Clear all filters
        </button>
      )}
      <Accordion type="multiple" defaultValue={["category", "gender", "size", "price"]} className="w-full">
        <AccordionItem value="category">
          <AccordionTrigger className="eyebrow text-[11px]">Category</AccordionTrigger>
          <AccordionContent className="space-y-1">
            {categories.map((c) => (
              <button
                key={c.slug}
                onClick={() => set({ category: category === c.slug ? null : c.slug })}
                className={cn("flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-cream", category === c.slug && "bg-cream font-medium")}
              >
                {c.name} <span className="text-xs text-muted-foreground">{c.count}</span>
              </button>
            ))}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="gender">
          <AccordionTrigger className="eyebrow text-[11px]">Department</AccordionTrigger>
          <AccordionContent className="flex gap-2">
            {[["WOMEN", "Women"], ["MEN", "Men"]].map(([v, l]) => (
              <button key={v} onClick={() => set({ gender: gender === v ? null : v })} className={cn("flex-1 rounded-full border py-2 text-sm transition-colors", gender === v ? "border-ink bg-ink text-white" : "hover:border-foreground")}>
                {l}
              </button>
            ))}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="size">
          <AccordionTrigger className="eyebrow text-[11px]">Size</AccordionTrigger>
          <AccordionContent className="grid grid-cols-4 gap-2">
            {sizes.map((s) => (
              <button key={s} onClick={() => toggleSize(s)} className={cn("h-9 rounded-md border text-xs transition-colors", selectedSizes.includes(s) ? "border-ink bg-ink text-white" : "hover:border-foreground")}>
                {s}
              </button>
            ))}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="price">
          <AccordionTrigger className="eyebrow text-[11px]">Price</AccordionTrigger>
          <AccordionContent className="space-y-2.5">
            {priceRanges.map((r) => {
              const checked = min === r.min && max === r.max;
              return (
                <label key={r.label} className="flex cursor-pointer items-center gap-2.5 text-sm">
                  <Checkbox checked={checked} onCheckedChange={() => set(checked ? { min: null, max: null } : { min: r.min || null, max: r.max || null })} />
                  {r.label}
                </label>
              );
            })}
            <label className="flex cursor-pointer items-center gap-2.5 pt-2 text-sm text-rose">
              <Checkbox checked={params.get("sale") === "1"} onCheckedChange={(c) => set({ sale: c ? "1" : null })} />
              On sale only
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-navy">
              <Checkbox checked={params.get("preorder") === "1"} onCheckedChange={(c) => set({ preorder: c ? "1" : null })} />
              Available to pre-order
            </label>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export function SortSelect() {
  const { params, set } = useParamsUpdater();
  return (
    <Select value={params.get("sort") ?? "featured"} onValueChange={(v) => set({ sort: v === "featured" ? null : v })}>
      <SelectTrigger className="w-48 rounded-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="featured">Featured</SelectItem>
        <SelectItem value="newest">Newest</SelectItem>
        <SelectItem value="price-asc">Price: Low to high</SelectItem>
        <SelectItem value="price-desc">Price: High to low</SelectItem>
      </SelectContent>
    </Select>
  );
}
