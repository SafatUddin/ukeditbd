"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, PackageCheck, Printer, Send, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { receivePurchaseOrder, setPurchaseOrderStatus } from "@/lib/actions/admin/purchasing";

type Line = { itemId: string; sku: string; name: string; label: string; outstanding: number };

export function POActions({ id, status, lines }: { id: string; status: string; lines: Line[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [receiving, setReceiving] = useState(false);
  const [qty, setQty] = useState<Record<string, number>>(() => Object.fromEntries(lines.map((l) => [l.itemId, l.outstanding])));

  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>, after?: () => void) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(res.message);
        after?.();
      } else toast.error(res.error);
      router.refresh();
    });

  const open = lines.filter((l) => l.outstanding > 0);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
      {status === "DRAFT" && <Button size="sm" disabled={pending} onClick={() => run(() => setPurchaseOrderStatus(id, "ORDERED"))}><Send /> Submit to supplier</Button>}
      {["ORDERED", "PARTIAL"].includes(status) && <Button size="sm" disabled={pending} onClick={() => setReceiving(true)}><PackageCheck /> Receive stock</Button>}
      {["DRAFT", "ORDERED"].includes(status) && (
        <Button size="sm" variant="destructive" disabled={pending} onClick={() => confirm("Cancel this purchase order?") && run(() => setPurchaseOrderStatus(id, "CANCELLED"))}>
          <XCircle /> Cancel PO
        </Button>
      )}
      {["RECEIVED", "CANCELLED"].includes(status) && <span className="text-sm text-muted-foreground">This purchase order is closed.</span>}
      <Button size="sm" variant="ghost" className="ml-auto" onClick={() => window.print()}><Printer /> Print</Button>

      <Dialog open={receiving} onOpenChange={setReceiving}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Receive stock</DialogTitle>
            <DialogDescription>Enter quantities that physically arrived. Inventory and unit costs update immediately.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] space-y-2 overflow-y-auto">
            {open.map((l) => (
              <div key={l.itemId} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{l.name}</p>
                  <p className="text-xs text-muted-foreground"><span className="font-mono">{l.sku}</span> · {l.label} · {l.outstanding} outstanding</p>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={l.outstanding}
                  value={qty[l.itemId] ?? 0}
                  onChange={(e) => setQty((q) => ({ ...q, [l.itemId]: Math.min(l.outstanding, Math.max(0, Number(e.target.value))) }))}
                  className="h-8 w-20"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiving(false)}>Cancel</Button>
            <Button
              disabled={pending}
              onClick={() => run(() => receivePurchaseOrder(id, Object.entries(qty).map(([itemId, quantity]) => ({ itemId, quantity }))), () => setReceiving(false))}
            >
              {pending && <Loader2 className="animate-spin" />} Confirm receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
