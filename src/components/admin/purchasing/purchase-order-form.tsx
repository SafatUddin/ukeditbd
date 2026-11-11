"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { createPurchaseOrder } from "@/lib/actions/admin/purchasing";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

type VariantOption = { id: string; sku: string; name: string; label: string; image: string | null; stock: number; reorderPoint: number; reorderQty: number; cost: number };
type Line = { variantId: string; quantity: number; unitCost: number };
type Props = { suppliers: { id: string; name: string; leadTimeDays: number }[]; variants: VariantOption[]; initialLines: Line[] };

export function PurchaseOrderForm({ suppliers, variants, initialLines }: Props) {
  const router = useRouter();
  const [supplierId, setSupplierId] = useState(suppliers[0].id);
  const lead = suppliers.find((s) => s.id === supplierId)?.leadTimeDays ?? 7;
  const [expectedAt, setExpectedAt] = useState(() => new Date(Date.now() + lead * 86_400_000).toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>(initialLines);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pending, start] = useTransition();
  const byId = new Map(variants.map((v) => [v.id, v]));

  const total = lines.reduce((s, l) => s + l.quantity * l.unitCost, 0);
  const units = lines.reduce((s, l) => s + l.quantity, 0);

  const toggleVariant = (v: VariantOption) =>
    setLines((ls) => (ls.some((l) => l.variantId === v.id) ? ls.filter((l) => l.variantId !== v.id) : [...ls, { variantId: v.id, quantity: v.reorderQty, unitCost: v.cost }]));

  const submit = (send: boolean) =>
    start(async () => {
      const res = await createPurchaseOrder({ supplierId, expectedAt, notes, submit: send, items: lines });
      if (!res.ok) return void toast.error(res.error);
      toast.success(res.message);
      router.push(`/admin/purchase-orders/${res.data!.id}`);
    });

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="space-y-1.5">
            <CardTitle>Line items</CardTitle>
            <CardDescription>{lines.length} SKUs · {units} units</CardDescription>
          </div>
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline"><Plus /> Add SKUs</Button>
            </PopoverTrigger>
            <PopoverContent className="w-[420px] p-0" align="end">
              <Command>
                <CommandInput placeholder="Search product or SKU…" />
                <CommandList className="max-h-80">
                  <CommandEmpty>No SKUs found.</CommandEmpty>
                  <CommandGroup>
                    {variants.map((v) => {
                      const selected = lines.some((l) => l.variantId === v.id);
                      return (
                        <CommandItem key={v.id} value={`${v.name} ${v.sku} ${v.label}`} onSelect={() => toggleVariant(v)}>
                          <Check className={cn("size-4", selected ? "opacity-100" : "opacity-0")} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm">{v.name} <span className="text-muted-foreground">· {v.label}</span></p>
                            <p className="font-mono text-xs text-muted-foreground">{v.sku}</p>
                          </div>
                          <span className={cn("text-xs tabular-nums", v.stock <= v.reorderPoint ? "font-medium text-amber-600" : "text-muted-foreground")}>{v.stock} on hand</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </CardHeader>
        <CardContent>
          {lines.length ? (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead className="w-20 text-right">On hand</TableHead>
                    <TableHead className="w-24">Qty</TableHead>
                    <TableHead className="w-28">Unit cost</TableHead>
                    <TableHead className="w-28 text-right">Line total</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((l, i) => {
                    const v = byId.get(l.variantId)!;
                    return (
                      <TableRow key={l.variantId}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative size-9 shrink-0 overflow-hidden rounded border bg-white">{v.image && <Image src={v.image} alt="" fill sizes="36px" className="object-contain p-0.5" />}</div>
                            <div className="min-w-0">
                              <p className="max-w-56 truncate text-sm font-medium">{v.name}</p>
                              <p className="text-xs text-muted-foreground"><span className="font-mono">{v.sku}</span> · {v.label}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className={cn("text-right tabular-nums", v.stock <= v.reorderPoint && "text-amber-600")}>{v.stock}</TableCell>
                        <TableCell>
                          <Input type="number" min={1} value={l.quantity} onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, quantity: Math.max(1, Number(e.target.value)) } : x)))} className="h-8" />
                        </TableCell>
                        <TableCell>
                          <Input type="number" min={0} value={l.unitCost} onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, unitCost: Math.max(0, Number(e.target.value)) } : x)))} className="h-8" />
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">{formatPrice(l.quantity * l.unitCost)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon-sm" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} aria-label="Remove line"><Trash2 /></Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">No line items yet. Use “Add SKUs” to build your order.</p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Supplier</Label>
              <Select
                value={supplierId}
                onValueChange={(v) => {
                  setSupplierId(v);
                  const lt = suppliers.find((s) => s.id === v)?.leadTimeDays ?? 7;
                  setExpectedAt(new Date(Date.now() + lt * 86_400_000).toISOString().slice(0, 10));
                }}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Typical lead time: {lead} days</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Expected delivery</Label>
              <Input type="date" value={expectedAt} onChange={(e) => setExpectedAt(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Payment terms, shipping instructions…" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Units</span><span className="tabular-nums">{units}</span></div>
            <div className="flex justify-between text-lg font-semibold"><span>Total cost</span><span className="tabular-nums">{formatPrice(total)}</span></div>
            <Button className="w-full" disabled={pending || !lines.length} onClick={() => submit(true)}>{pending && <Loader2 className="animate-spin" />} Place order with supplier</Button>
            <Button variant="outline" className="w-full" disabled={pending || !lines.length} onClick={() => submit(false)}>Save as draft</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
