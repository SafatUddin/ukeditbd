"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Library, Loader2, Plus, Sparkles, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { saveProduct, type ProductInput } from "@/lib/actions/admin/products";
import { uploadImage } from "@/lib/actions/admin/upload";
import { formatPrice, slugify } from "@/lib/format";
import { cn } from "@/lib/utils";

type Variant = ProductInput["variants"][number] & { key: string };
type Initial = Omit<ProductInput, "variants"> & { variants: ProductInput["variants"] };

const blank: Initial = {
  name: "",
  slug: "",
  description: "",
  categoryId: "",
  gender: "UNISEX",
  status: "DRAFT",
  featured: false,
  allowPreorder: false,
  preorderDays: 14,
  brand: "",
  price: 0,
  compareAtPrice: null,
  material: "",
  care: "",
  tags: "",
  images: [],
  variants: [],
};

let keySeq = 0;
const nextKey = () => `v${++keySeq}`;

export function ProductForm({ initial = blank, categories, library }: { initial?: Initial; categories: { id: string; name: string }[]; library: string[] }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [variants, setVariants] = useState<Variant[]>(() => initial.variants.map((v) => ({ ...v, key: nextKey() })));
  const [slugTouched, setSlugTouched] = useState(!!initial.id);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [sizesInput, setSizesInput] = useState("XS, S, M, L, XL");
  const [colorName, setColorName] = useState("");
  const [colorHex, setColorHex] = useState("#111111");
  const [saving, startSave] = useTransition();
  const [uploading, startUpload] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Initial>(k: K, v: Initial[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setVariant = (key: string, patch: Partial<Variant>) => setVariants((vs) => vs.map((v) => (v.key === key ? { ...v, ...patch } : v)));
  const skuPrefix = () => (form.name ? form.name.split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 4) : "NEW");

  const generate = () => {
    const sizes = sizesInput.split(",").map((s) => s.trim()).filter(Boolean);
    const color = colorName.trim() || null;
    if (!sizes.length) return toast.error("Enter at least one size");
    const existing = new Set(variants.map((v) => `${v.color ?? ""}|${v.size ?? ""}`));
    const created = sizes
      .filter((s) => !existing.has(`${color ?? ""}|${s}`))
      .map((size) => ({
        key: nextKey(),
        sku: `UK-${skuPrefix()}-${(color ?? "STD").slice(0, 3).toUpperCase()}-${size.replace(/\s+/g, "").toUpperCase().slice(0, 4)}`,
        size,
        color,
        colorHex: color ? colorHex : null,
        price: null,
        costPrice: Math.round(form.price * 0.45),
        stock: 0,
        reorderPoint: 5,
        binLocation: "",
      }));
    if (!created.length) return toast.info("Those variants already exist");
    setVariants((vs) => [...vs, ...created]);
    toast.success(`Added ${created.length} variant(s)`);
  };

  const onUpload = (files: FileList | null) => {
    if (!files?.length) return;
    startUpload(async () => {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await uploadImage(fd);
        if (res.ok && res.data) setForm((f) => ({ ...f, images: [...f.images, res.data!.url] }));
        else if (!res.ok) toast.error(res.error);
      }
    });
  };

  const moveImage = (i: number, dir: -1 | 1) =>
    setForm((f) => {
      const imgs = [...f.images];
      [imgs[i], imgs[i + dir]] = [imgs[i + dir], imgs[i]];
      return { ...f, images: imgs };
    });

  const submit = () =>
    startSave(async () => {
      // zod strips the client-only `key` field on the server
      const res = await saveProduct({ ...form, variants });
      if (!res.ok) return void toast.error(res.error);
      toast.success(res.message);
      if (!initial.id && res.data) router.push(`/admin/products/${res.data.id}`);
      else router.refresh();
    });

  const totalStock = variants.reduce((s, v) => s + (v.stock || 0), 0);
  const margin = form.price && variants.length ? ((form.price - variants.reduce((s, v) => s + v.costPrice, 0) / variants.length) / form.price) * 100 : null;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>General</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Product name">
                <Input value={form.name} onChange={(e) => { set("name", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} placeholder="e.g. Oxford Gingham Shirt" />
              </Field>
              <Field label="URL handle" hint={`/product/${form.slug || "…"}`}>
                <Input value={form.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} />
              </Field>
              <Field label="Description">
                <Textarea rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Tell the story of this piece — fabric, fit, craftsmanship…" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Material & composition"><Input value={form.material ?? ""} onChange={(e) => set("material", e.target.value)} /></Field>
                <Field label="Care instructions"><Input value={form.care ?? ""} onChange={(e) => set("care", e.target.value)} /></Field>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div className="space-y-1.5">
                <CardTitle>Media</CardTitle>
                <CardDescription>The first image is used as the cover. Drag order with the arrows.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setLibraryOpen(true)}><Library /> Library</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="animate-spin" /> : <Upload />} Upload
                </Button>
                <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { onUpload(e.target.files); e.target.value = ""; }} />
              </div>
            </CardHeader>
            <CardContent>
              {form.images.length ? (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  {form.images.map((url, i) => (
                    <div key={url + i} className={cn("group relative aspect-square overflow-hidden rounded-lg border bg-white", i === 0 && "col-span-2 row-span-2")}>
                      <Image src={url} alt="" fill sizes="200px" className="object-contain p-2" />
                      {i === 0 && <span className="absolute top-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">Cover</span>}
                      <div className="absolute inset-x-1 bottom-1 flex justify-center gap-1 opacity-0 transition group-hover:opacity-100">
                        {i > 0 && <Button type="button" size="icon-xs" variant="secondary" onClick={() => moveImage(i, -1)}><ArrowUp className="-rotate-90" /></Button>}
                        {i < form.images.length - 1 && <Button type="button" size="icon-xs" variant="secondary" onClick={() => moveImage(i, 1)}><ArrowDown className="-rotate-90" /></Button>}
                        <Button type="button" size="icon-xs" variant="secondary" onClick={() => set("images", form.images.filter((_, j) => j !== i))}><X /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); onUpload(e.dataTransfer.files); }}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-12 text-sm text-muted-foreground transition hover:border-foreground/30"
                >
                  <ImagePlus className="size-8" />
                  Drop images here or click to upload
                </button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Variants & inventory</CardTitle>
              <CardDescription>Each size/colour combination is a SKU with its own stock level and reorder point.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 md:grid-cols-[1.4fr_1fr_auto_auto] md:items-end">
                <Field label="Sizes (comma separated)"><Input value={sizesInput} onChange={(e) => setSizesInput(e.target.value)} placeholder="S, M, L or 40, 41 or One Size" /></Field>
                <Field label="Colour name"><Input value={colorName} onChange={(e) => setColorName(e.target.value)} placeholder="e.g. Midnight" /></Field>
                <Field label="Swatch"><Input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="h-8 w-14 p-1" /></Field>
                <Button type="button" variant="secondary" onClick={generate}><Sparkles /> Generate</Button>
              </div>

              {variants.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead>Variant</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="w-28">Price override</TableHead>
                        <TableHead className="w-24">Unit cost</TableHead>
                        <TableHead className="w-20">Stock</TableHead>
                        <TableHead className="w-20">Reorder at</TableHead>
                        <TableHead className="w-20">Bin</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variants.map((v) => (
                        <TableRow key={v.key}>
                          <TableCell>
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              {v.colorHex && <span className="size-3.5 rounded-full ring-1 ring-black/10" style={{ background: v.colorHex }} />}
                              <Input value={v.color ?? ""} onChange={(e) => setVariant(v.key, { color: e.target.value })} placeholder="Colour" className="h-7 w-24" />
                              <Input value={v.size ?? ""} onChange={(e) => setVariant(v.key, { size: e.target.value })} placeholder="Size" className="h-7 w-16" />
                            </div>
                          </TableCell>
                          <TableCell><Input value={v.sku} onChange={(e) => setVariant(v.key, { sku: e.target.value.toUpperCase() })} className="h-7 min-w-36 font-mono text-xs" /></TableCell>
                          <TableCell><Num value={v.price ?? undefined} placeholder={String(form.price || "")} onChange={(n) => setVariant(v.key, { price: n ?? null })} /></TableCell>
                          <TableCell><Num value={v.costPrice} onChange={(n) => setVariant(v.key, { costPrice: n ?? 0 })} /></TableCell>
                          <TableCell><Num value={v.stock} onChange={(n) => setVariant(v.key, { stock: n ?? 0 })} className={cn(v.stock <= v.reorderPoint && "text-amber-600")} /></TableCell>
                          <TableCell><Num value={v.reorderPoint} onChange={(n) => setVariant(v.key, { reorderPoint: n ?? 0 })} /></TableCell>
                          <TableCell><Input value={v.binLocation ?? ""} onChange={(e) => setVariant(v.key, { binLocation: e.target.value })} className="h-7 w-20 text-xs" /></TableCell>
                          <TableCell>
                            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setVariants((vs) => vs.filter((x) => x.key !== v.key))} aria-label="Remove variant"><Trash2 /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">No variants yet — use the generator above.</p>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setVariants((vs) => [...vs, { key: nextKey(), sku: `UK-${skuPrefix()}-${vs.length + 1}`, size: "", color: "", colorHex: null, price: null, costPrice: 0, stock: 0, reorderPoint: 5, binLocation: "" }])}
              >
                <Plus /> Add single variant
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Status</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Select value={form.status} onValueChange={(v) => set("status", v as Initial["status"])}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active — visible in store</SelectItem>
                  <SelectItem value="DRAFT">Draft — hidden</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
              <label className="flex items-center justify-between gap-4 rounded-lg border p-3">
                <span>
                  <span className="block text-sm font-medium">Featured</span>
                  <span className="block text-xs text-muted-foreground">Show in “Most wanted” on the homepage</span>
                </span>
                <Switch checked={form.featured} onCheckedChange={(v) => set("featured", v)} />
              </label>
              <div className="space-y-3 rounded-lg border p-3">
                <label className="flex items-center justify-between gap-4">
                  <span>
                    <span className="block text-sm font-medium">Allow pre-orders</span>
                    <span className="block text-xs text-muted-foreground">Customers can order out-of-stock sizes; you source them from the UK</span>
                  </span>
                  <Switch checked={form.allowPreorder} onCheckedChange={(v) => set("allowPreorder", v)} />
                </label>
                {form.allowPreorder && (
                  <Field label="Estimated sourcing time (days)">
                    <Num value={form.preorderDays} onChange={(n) => set("preorderDays", n ?? 14)} className="h-8" />
                  </Field>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Price (৳)"><Num value={form.price || undefined} onChange={(n) => set("price", n ?? 0)} className="h-8" /></Field>
                <Field label="Compare-at (৳)"><Num value={form.compareAtPrice ?? undefined} onChange={(n) => set("compareAtPrice", n ?? null)} className="h-8" /></Field>
              </div>
              {margin !== null && (
                <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/40 p-3 text-sm">
                  <div><p className="text-xs text-muted-foreground">Avg. margin</p><p className={cn("font-medium", margin < 40 && "text-amber-600")}>{margin.toFixed(1)}%</p></div>
                  <div><p className="text-xs text-muted-foreground">Retail value</p><p className="font-medium">{formatPrice(totalStock * form.price)}</p></div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Organization</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Category">
                <Select value={form.categoryId} onValueChange={(v) => set("categoryId", v)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Brand">
                <Input value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="e.g. Dior, Charlotte Tilbury" />
              </Field>
              <Field label="Department">
                <Select value={form.gender} onValueChange={(v) => set("gender", v as Initial["gender"])}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WOMEN">Women</SelectItem>
                    <SelectItem value="MEN">Men</SelectItem>
                    <SelectItem value="UNISEX">Unisex</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Tags" hint="Comma separated, e.g. new, bestseller, evening">
                <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Inventory summary</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-3 gap-3 text-center">
              <Stat label="SKUs" value={variants.length} />
              <Stat label="Units" value={totalStock} />
              <Stat label="Low" value={variants.filter((v) => v.stock <= v.reorderPoint).length} warn />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="sticky bottom-0 z-30 -mx-4 border-t bg-background/90 backdrop-blur md:-mx-6 lg:-mx-8">
        <div className="flex items-center justify-end gap-2 px-4 py-3 md:px-6 lg:px-8">
          <p className="mr-auto hidden text-sm text-muted-foreground sm:block">{initial.id ? "Editing product" : "Unsaved new product"}</p>
          <Button variant="outline" onClick={() => router.push("/admin/products")}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving && <Loader2 className="animate-spin" />} {initial.id ? "Save changes" : "Create product"}</Button>
        </div>
      </div>

      <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Media library</DialogTitle>
            <DialogDescription>Click images to add them to this product.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <div className="grid grid-cols-4 gap-2 pr-3 sm:grid-cols-6">
              {library.map((url) => {
                const selected = form.images.includes(url);
                return (
                  <button
                    key={url}
                    type="button"
                    onClick={() => set("images", selected ? form.images.filter((u) => u !== url) : [...form.images, url])}
                    className={cn("relative aspect-square overflow-hidden rounded-md border bg-white transition", selected ? "ring-2 ring-primary" : "hover:border-foreground/40")}
                  >
                    <Image src={url} alt="" fill sizes="120px" className="object-contain p-1" />
                    {selected && <span className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">{form.images.indexOf(url) + 1}</span>}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Num({ value, onChange, placeholder, className }: { value?: number; onChange: (n: number | undefined) => void; placeholder?: string; className?: string }) {
  return (
    <Input
      type="number"
      min={0}
      inputMode="numeric"
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value === "" ? undefined : Math.max(0, Math.round(Number(e.target.value))))}
      className={cn("h-7 tabular-nums", className)}
    />
  );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <p className={cn("text-xl font-semibold tabular-nums", warn && value > 0 && "text-amber-600")}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
