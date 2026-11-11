"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LogOut, Package, User } from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

const items = [
  { href: "/account", label: "Overview", icon: User },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/account" ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={cn("flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm whitespace-nowrap transition-colors", active ? "bg-ink text-white" : "hover:bg-cream")}>
            <Icon className="size-4" strokeWidth={1.6} /> {label}
          </Link>
        );
      })}
      <form action={logout}>
        <button className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm whitespace-nowrap text-muted-foreground hover:bg-cream hover:text-foreground">
          <LogOut className="size-4" strokeWidth={1.6} /> Sign out
        </button>
      </form>
    </nav>
  );
}
