"use client";

import Link from "next/link";
import { LayoutDashboard, LogOut, Package, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/actions/auth";

type U = { name: string; email: string; role: string } | null;

export function AccountMenu({ user }: { user: U }) {
  if (!user) {
    return (
      <Link href="/login" className="hidden h-10 items-center rounded-full px-3 text-[13px] tracking-wide hover:bg-black/5 sm:flex">
        Sign in
      </Link>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Account" className="flex size-10 items-center justify-center rounded-full outline-none hover:bg-black/5">
        <User className="size-[18px]" strokeWidth={1.6} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.role !== "CUSTOMER" && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <LayoutDashboard /> Admin dashboard
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/account">
            <User /> My account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/orders">
            <Package /> Orders
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => logout()}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
