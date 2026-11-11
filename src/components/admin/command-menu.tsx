"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Laptop, Moon, Package, Plus, Search, ShoppingCart, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { allNavItems } from "./nav";

type SearchResult = { type: "product" | "order" | "customer"; id: string; title: string; subtitle: string; href: string };
const icons = { product: Package, order: ShoppingCart, customer: User };

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const router = useRouter();
  const { setTheme } = useTheme();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement))) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/admin/search?q=${encodeURIComponent(query)}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : []))
        .then(setResults)
        .catch(() => {});
    }, 150);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  const run = (fn: () => void) => {
    setOpen(false);
    setQuery("");
    fn();
  };
  const visibleResults = query.trim().length >= 2 ? results : [];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-8 w-full items-center gap-2 rounded-lg border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted md:w-64"
      >
        <Search className="size-4" />
        <span className="hidden md:inline">Search or jump to…</span>
        <kbd className="pointer-events-none ml-auto hidden h-5 items-center gap-0.5 rounded border bg-background px-1.5 font-mono text-[10px] font-medium md:flex">⌘K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Command palette" description="Search products, orders and customers or jump to a page">
        <Command>
        <CommandInput placeholder="Search products, orders, customers…" value={query} onValueChange={setQuery} />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {visibleResults.length > 0 && (
            <CommandGroup heading="Results">
              {visibleResults.map((r) => {
                const Icon = icons[r.type];
                return (
                  <CommandItem key={r.type + r.id} value={`${r.title} ${r.subtitle} ${r.id}`} onSelect={() => run(() => router.push(r.href))}>
                    <Icon />
                    <div className="flex flex-col">
                      <span>{r.title}</span>
                      <span className="text-xs text-muted-foreground">{r.subtitle}</span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
          <CommandGroup heading="Quick actions">
            <CommandItem onSelect={() => run(() => router.push("/admin/products/new"))}>
              <Plus /> New product <CommandShortcut>P</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => run(() => router.push("/admin/purchase-orders/new"))}>
              <Plus /> New purchase order
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Navigate">
            {allNavItems.map((item) => (
              <CommandItem key={item.href} onSelect={() => run(() => router.push(item.href))}>
                <item.icon /> {item.title}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Theme">
            <CommandItem onSelect={() => run(() => setTheme("light"))}><Sun /> Light</CommandItem>
            <CommandItem onSelect={() => run(() => setTheme("dark"))}><Moon /> Dark</CommandItem>
            <CommandItem onSelect={() => run(() => setTheme("system"))}><Laptop /> System</CommandItem>
          </CommandGroup>
        </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
