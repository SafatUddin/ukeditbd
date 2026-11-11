"use client";

import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

export function NewsletterForm() {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.currentTarget.reset();
        toast.success("You're on the list. Welcome to The UK Edit BD.");
      }}
      className="flex items-center border-b border-white/30 focus-within:border-white"
    >
      <input type="email" required placeholder="Email address" className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-white/40" />
      <button aria-label="Subscribe" className="p-2">
        <ArrowRight className="size-4" />
      </button>
    </form>
  );
}
