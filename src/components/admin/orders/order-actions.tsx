"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Banknote, CheckCircle2, Loader2, PackageCheck, Printer, RotateCcw, Send, Truck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addOrderNote, markOrderPaid, updateOrderStatus } from "@/lib/actions/admin/orders";
import { orderTransitions, type OrderStatusValue } from "@/lib/order-flow";

const actionMeta: Record<OrderStatusValue, { label: string; icon: React.ComponentType; destructive?: boolean }> = {
  PENDING: { label: "Pending", icon: CheckCircle2 },
  CONFIRMED: { label: "Confirm order", icon: CheckCircle2 },
  PROCESSING: { label: "Mark as packed", icon: PackageCheck },
  SHIPPED: { label: "Mark as shipped", icon: Truck },
  DELIVERED: { label: "Mark as delivered", icon: CheckCircle2 },
  CANCELLED: { label: "Cancel order", icon: XCircle, destructive: true },
  REFUNDED: { label: "Refund & restock", icon: RotateCcw, destructive: true },
};

export function OrderActions({ orderId, status, canMarkPaid }: { orderId: string; status: OrderStatusValue; canMarkPaid: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const next = orderTransitions[status];

  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) =>
    start(async () => {
      const res = await fn();
      if (res.ok) toast.success(res.message);
      else toast.error(res.error);
      router.refresh();
    });

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
      <span className="mr-2 text-sm text-muted-foreground">Next steps:</span>
      {next.length === 0 && <span className="text-sm">This order is closed.</span>}
      {next.map((s) => {
        const meta = actionMeta[s];
        const Icon = meta.icon;
        return (
          <Button
            key={s}
            size="sm"
            variant={meta.destructive ? "destructive" : "default"}
            disabled={pending}
            onClick={() => {
              if (meta.destructive && !confirm(`${meta.label}? Items will be returned to stock.`)) return;
              run(() => updateOrderStatus(orderId, s));
            }}
          >
            {pending ? <Loader2 className="animate-spin" /> : <Icon />} {meta.label}
          </Button>
        );
      })}
      {canMarkPaid && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => markOrderPaid(orderId))}>
          <Banknote /> Record payment
        </Button>
      )}
      <Button size="sm" variant="ghost" className="ml-auto" onClick={() => window.print()}>
        <Printer /> Print packing slip
      </Button>
    </div>
  );
}

export function OrderNoteForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await addOrderNote(orderId, note);
          if (!res.ok) return void toast.error(res.error);
          setNote("");
          router.refresh();
        });
      }}
      className="flex gap-2"
    >
      <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal note (courier tracking, customer call…)" rows={2} className="min-h-0" />
      <Button type="submit" size="icon" disabled={pending || !note.trim()} aria-label="Add note">
        {pending ? <Loader2 className="animate-spin" /> : <Send />}
      </Button>
    </form>
  );
}
