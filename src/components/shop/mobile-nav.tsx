"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Logo } from "@/components/logo";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type Props = { nav: { label: string; href: string; accent?: boolean }[]; signedIn: boolean };

export function MobileNav({ nav, signedIn }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger aria-label="Menu" className="flex size-10 items-center justify-center rounded-full hover:bg-navy/5 xl:hidden">
        <Menu className="size-5" strokeWidth={1.6} />
      </SheetTrigger>
      <SheetContent side="left" className="w-full max-w-sm p-0">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <div className="border-b px-6 py-4" onClick={() => setOpen(false)}>
          <Logo className="h-14" />
        </div>
        <nav className="flex flex-col overflow-y-auto px-6 py-4" onClick={() => setOpen(false)}>
          {nav.map((n) => (
            <Link key={n.label} href={n.href} className={`border-b border-navy/5 py-3.5 font-display text-2xl ${n.accent ? "text-rose" : "text-navy"}`}>
              {n.label}
            </Link>
          ))}
          <Link href={signedIn ? "/account" : "/login"} className="mt-8 rounded-full bg-navy py-3 text-center text-sm text-white">
            {signedIn ? "My account" : "Sign in"}
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
