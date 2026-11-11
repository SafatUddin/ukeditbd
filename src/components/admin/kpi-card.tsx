import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = { title: string; value: string; delta?: number; hint?: string; icon: LucideIcon; tone?: "default" | "warning" | "danger" };

export function KpiCard({ title, value, delta, hint, icon: Icon, tone = "default" }: Props) {
  const up = (delta ?? 0) >= 0;
  return (
    <Card className="relative gap-0 overflow-hidden py-0">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div
            className={cn(
              "flex size-8 items-center justify-center rounded-lg",
              tone === "warning" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : tone === "danger" ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-primary/5 text-foreground/70",
            )}
          >
            <Icon className="size-4" />
          </div>
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        <div className="mt-1 flex items-center gap-1.5 text-xs">
          {delta !== undefined && (
            <span className={cn("inline-flex items-center gap-0.5 font-medium", up ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
              {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {up ? "+" : ""}
              {delta.toFixed(1)}%
            </span>
          )}
          {hint && <span className="text-muted-foreground">{hint}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
