"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { adjustStock, updateVariantSettings, type AdjustInput } from "@/lib/actions/admin/inventory";
import { cn } from "@/lib/utils";

type Row = { id: string; product: string; variant: string; sku: string; stock: number; reorderPoint: number; reorderQty: number; bin: string };
type Mode = AdjustInput["mode"];

const reasonsByMode: Record<Mode, { value: AdjustInput["type"]; label: string }[]> = {
  add: [
    { value: "RECEIVED", label: "Received from supplier" },
    { value: "RETURN", label: "Customer return" },
    { value: "ADJUSTMENT", label: "Correction" },
  ],
  remove: [
    { value: "DAMAGE", label: "Damaged / defective" },
    { value: "ADJUSTMENT", label: "Shrinkage / lost" },
  ],
  set: [{ value: "ADJUSTMENT", label: "Physical stock count" }],
};

export function AdjustStockDialog({ row, initialMode, onClose }: { row: Row; initialMode: Mode; onClose: () => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [type, setType] = useState<AdjustInput["type"]>(reasonsByMode[initialMode][0].value);
  const [qty, setQty] = useState<number | "">("");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  const q = qty === "" ? 0 : qty;
  const next = mode === "set" ? q : mode === "add" ? row.stock + q : row.stock - q;
  const invalid = qty === "" || next < 0 || next === row.stock;

  const submit = () =>
    start(async () => {
      const res = await adjustStock({ variantId: row.id, mode, type, quantity: q, reason: note });
      if (!res.ok) return void toast.error(res.error);
      toast.success(res.message);
      router.refresh();
      onClose();
    });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
          <DialogDescription>
            {row.product} · {row.variant} · <span className="font-mono">{row.sku}</span>
          </DialogDescription>
        </DialogHeader>
        <Tabs
          value={mode}
          onValueChange={(v) => {
            setMode(v as Mode);
            setType(reasonsByMode[v as Mode][0].value);
          }}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="add">Add</TabsTrigger>
            <TabsTrigger value="remove">Remove</TabsTrigger>
            <TabsTrigger value="set">Set count</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{mode === "set" ? "Counted quantity" : "Quantity"}</Label>
            <Input type="number" min={0} autoFocus value={qty} onChange={(e) => setQty(e.target.value === "" ? "" : Math.max(0, Math.round(Number(e.target.value))))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Reason</Label>
            <Select value={type} onValueChange={(v) => setType(v as AdjustInput["type"])}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{reasonsByMode[mode].map((r) => <SelectItem key={r.label} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Note (optional)</Label>
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reference, invoice no., details…" />
        </div>
        <div className="flex items-center justify-center gap-4 rounded-lg bg-muted/50 py-4">
          <div className="text-center"><p className="text-xs text-muted-foreground">Current</p><p className="text-2xl font-semibold tabular-nums">{row.stock}</p></div>
          <ArrowRight className="size-4 text-muted-foreground" />
          <div className="text-center">
            <p className="text-xs text-muted-foreground">New</p>
            <p className={cn("text-2xl font-semibold tabular-nums", next < 0 ? "text-red-600" : next > row.stock ? "text-emerald-600" : next < row.stock ? "text-amber-600" : "")}>{next}</p>
          </div>
          {next !== row.stock && next >= 0 && (
            <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", next > row.stock ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-amber-500/10 text-amber-700 dark:text-amber-400")}>
              {next > row.stock ? "+" : ""}
              {next - row.stock}
            </span>
          )}
        </div>
        {next < 0 && <p className="text-sm text-red-600">Cannot remove more than {row.stock} units.</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={invalid || pending}>{pending && <Loader2 className="animate-spin" />} Save adjustment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ReorderSettingsDialog({ row, onClose }: { row: Row; onClose: () => void }) {
  const router = useRouter();
  const [point, setPoint] = useState(row.reorderPoint);
  const [qty, setQty] = useState(row.reorderQty);
  const [bin, setBin] = useState(row.bin);
  const [pending, start] = useTransition();

  const submit = () =>
    start(async () => {
      const res = await updateVariantSettings(row.id, { reorderPoint: point, reorderQty: qty, binLocation: bin });
      if (!res.ok) return void toast.error(res.error);
      toast.success(res.message);
      router.refresh();
      onClose();
    });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reorder settings</DialogTitle>
          <DialogDescription>{row.product} · {row.variant} · <span className="font-mono">{row.sku}</span></DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Reorder point</Label>
            <Input type="number" min={0} value={point} onChange={(e) => setPoint(Number(e.target.value))} />
            <p className="text-[11px] text-muted-foreground">Alert when stock falls to this level</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Reorder quantity</Label>
            <Input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
            <p className="text-[11px] text-muted-foreground">Suggested qty for purchase orders</p>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs">Bin / shelf location</Label>
            <Input value={bin} onChange={(e) => setBin(e.target.value.toUpperCase())} placeholder="e.g. ME-3B" className="font-mono" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={pending}>{pending && <Loader2 className="animate-spin" />} Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
