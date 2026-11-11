import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const BRAND = {
  name: "The UK Edit BD",
  tagline: "Curated from the UK",
  promise: ["Shop", "Pre-order", "Deliver"],
};

export function Logo({ className, href = "/", variant = "wordmark", priority }: { className?: string; href?: string; variant?: "wordmark" | "badge"; priority?: boolean }) {
  return (
    <Link href={href} aria-label={`${BRAND.name} — home`} className={cn("inline-flex shrink-0 items-center", className)}>
      {variant === "wordmark" ? (
        <Image src="/brand/wordmark.png" alt={BRAND.name} width={791} height={465} priority={priority} className="h-full w-auto" />
      ) : (
        <Image src="/brand/logo.png" alt={BRAND.name} width={925} height={925} priority={priority} className="h-full w-auto" />
      )}
    </Link>
  );
}
