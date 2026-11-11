"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deleteSupplier, saveSupplier, type SupplierInput } from "@/lib/actions/admin/purchasing";

const empty: SupplierInput = { name: "", contactName: "", email: "", phone: "", address: "", leadTimeDays: 7, notes: "" };

export function SupplierDialog({ supplier }: { supplier?: SupplierInput & { id: string } }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<SupplierInput>(supplier ?? empty);
  const [pending, start] = useTransition();
  const set = (k: keyof SupplierInput, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () =>
    start(async () => {
      const res = await saveSupplier({ ...form, id: supplier?.id });
      if (!res.ok) return void toast.error(res.error);
      toast.success(res.message);
      setOpen(false);
      if (!supplier) setForm(empty);
      router.refresh();
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {supplier ? <Button variant="ghost" size="icon-sm" aria-label="Edit supplier"><Pencil /></Button> : <Button size="sm"><Plus /> Add supplier</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{supplier ? "Edit supplier" : "New supplier"}</DialogTitle>
          <DialogDescription>Contact details and typical lead time for replenishment.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <F label="Company name" className="col-span-2"><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></F>
          <F label="Contact person"><Input value={form.contactName} onChange={(e) => set("contactName", e.target.value)} /></F>
          <F label="Lead time (days)"><Input type="number" min={0} value={form.leadTimeDays} onChange={(e) => set("leadTimeDays", Number(e.target.value))} /></F>
          <F label="Email"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></F>
          <F label="Phone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></F>
          <F label="Address" className="col-span-2"><Input value={form.address} onChange={(e) => set("address", e.target.value)} /></F>
          <F label="Notes" className="col-span-2"><Textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></F>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={pending}>{pending && <Loader2 className="animate-spin" />} Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteSupplierButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Delete supplier"
      disabled={pending}
      onClick={() =>
        confirm(`Delete ${name}?`) &&
        start(async () => {
          const res = await deleteSupplier(id);
          if (res.ok) toast.success(res.message);
          else toast.error(res.error);
          router.refresh();
        })
      }
    >
      <Trash2 />
    </Button>
  );
}

function F({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
