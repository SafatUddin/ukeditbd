import { Plane } from "lucide-react";

export function PreorderTag({ days = 14 }: { days?: number }) {
  return (
    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-navy/5 px-2 py-0.5 text-[11px] font-medium text-navy">
      <Plane className="size-3" /> Pre-order · arrives in {days}–{days + 7} days
    </span>
  );
}
