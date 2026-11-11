import Link from "next/link";
import { Heart } from "lucide-react";
import { Logo } from "@/components/logo";
import { getCurrentUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { AccountMenu } from "./account-menu";
import { CartButton } from "./cart-button";
import { MobileNav } from "./mobile-nav";
import { SearchButton } from "./search-button";

export async function Header() {
  const [user, categories] = await Promise.all([
    getCurrentUser(),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { name: true, slug: true } }),
  ]);
  const nav = [
    { label: "New In", href: "/shop?sort=newest" },
    ...categories.map((c) => ({ label: c.name, href: `/shop?category=${c.slug}` })),
    { label: "Pre-order", href: "/shop?preorder=1" },
    { label: "Sale", href: "/shop?sale=1", accent: true },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-navy/10 bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75">
      <div className="mx-auto grid h-[76px] max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 md:px-8">
        <div className="flex items-center gap-1">
          <MobileNav nav={nav} signedIn={!!user} />
          <nav className="hidden items-center gap-4 xl:flex 2xl:gap-5">
            {nav.map((n) => (
              <Link
                key={n.label}
                href={n.href}
                className={`text-[12.5px] whitespace-nowrap tracking-wide transition-colors hover:text-navy ${n.label === "New In" ? "hidden 2xl:inline" : ""} ${n.accent ? "font-medium text-rose" : "text-foreground/70"}`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <Logo className="h-14" priority />
        <div className="flex items-center justify-end gap-0.5">
          <SearchButton />
          <AccountMenu user={user ? { name: user.name, email: user.email, role: user.role } : null} />
          <Link href="/account/wishlist" aria-label="Wishlist" className="hidden size-10 items-center justify-center rounded-full hover:bg-navy/5 sm:flex">
            <Heart className="size-[18px]" strokeWidth={1.6} />
          </Link>
          <CartButton />
        </div>
      </div>
    </header>
  );
}
