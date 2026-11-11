"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { deleteCategory, saveCategory, type CategoryInput } from "@/lib/actions/admin/settings";
import { cn } from "@/lib/utils";

export function CategoryDialog({ category, library, nextSort = 0 }: { category?: CategoryInput & { id: string }; library: string[]; nextSort?: number }) {
  const router = useRouter();
  const blank: CategoryInput = { name: "", description: "", image: "", sortOrder: nextSort };
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CategoryInput>(category ?? blank);
  const [pending, start] = useTransition();

  const submit = () =>
    start(async () => {
      const res = await saveCategory({ ...form, id: category?.id });
      if (!res.ok) return void toast.error(res.error);
      toast.success(res.message);
      setOpen(false);
      router.refresh();
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {category ? <Button variant="ghost" size="icon-sm" aria-label="Edit category"><Pencil /></Button> : <Button size="sm"><Plus /> New category</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{category ? "Edit category" : "New category"}</DialogTitle>
          <DialogDescription>The URL handle is generated from the name.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-[1fr_96px] gap-3">
          <div className="space-y-1.5"><Label className="text-xs">Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Sort order</Label><Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></div>
          <div className="col-span-2 space-y-1.5"><Label className="text-xs">Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs">Cover image</Label>
            <ScrollArea className="h-44 rounded-md border">
              <div className="grid grid-cols-6 gap-1.5 p-2">
                {library.filter((u) => u.endsWith("/1.webp") || u.startsWith("/uploads")).map((url) => (
                  <button key={url} type="button" onClick={() => setForm({ ...form, image: url })} className={cn("relative aspect-square overflow-hidden rounded border bg-white", form.image === url && "ring-2 ring-primary")}>
                    <Image src={url} alt="" fill sizes="64px" className="object-contain p-0.5" />
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={pending}>{pending && <Loader2 className="animate-spin" />} Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteCategoryButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Delete category"
      disabled={pending}
      onClick={() =>
        confirm(`Delete category "${name}"?`) &&
        start(async () => {
          const res = await deleteCategory(id);
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
