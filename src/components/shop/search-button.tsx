"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const suggestions = ["Dior", "Chanel", "Mascara", "Body wash", "Handbag", "Stiletto", "Sunglasses"];

export function SearchButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const go = (q: string) => {
    setOpen(false);
    router.push(`/shop?q=${encodeURIComponent(q)}`);
  };
  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Search" className="flex size-10 items-center justify-center rounded-full hover:bg-black/5">
        <Search className="size-[18px]" strokeWidth={1.6} />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-24 translate-y-0 gap-0 p-0 sm:max-w-2xl" showCloseButton={false}>
          <DialogTitle className="sr-only">Search the store</DialogTitle>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = new FormData(e.currentTarget).get("q")?.toString().trim();
              if (q) go(q);
            }}
            className="flex items-center gap-3 border-b px-5"
          >
            <Search className="size-5 text-muted-foreground" />
            <input name="q" autoFocus placeholder="Search brands, perfume, skincare, bags…" className="h-16 flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground" />
            <kbd className="rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground">ESC</kbd>
          </form>
          <div className="p-5">
            <p className="eyebrow mb-3 text-muted-foreground">Popular searches</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button key={s} onClick={() => go(s)} className="rounded-full border px-4 py-1.5 text-sm transition-colors hover:border-foreground">
                  {s}
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
