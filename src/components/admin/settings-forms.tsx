"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword, updateProfile } from "@/lib/actions/admin/settings";

export function ProfileForm({ name, phone, email }: { name: string; phone: string; email: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ name, phone });
  const [pending, start] = useTransition();
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await updateProfile(form);
          if (res.ok) toast.success(res.message);
          else toast.error(res.error);
          router.refresh();
        });
      }}
    >
      <div className="space-y-1.5"><Label className="text-xs">Email</Label><Input value={email} disabled /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label className="text-xs">Full name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      </div>
      <Button type="submit" disabled={pending}>{pending && <Loader2 className="animate-spin" />} Save profile</Button>
    </form>
  );
}

export function PasswordForm() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [pending, start] = useTransition();
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await changePassword(form);
          if (!res.ok) return void toast.error(res.error);
          toast.success(res.message);
          setForm({ current: "", next: "", confirm: "" });
        });
      }}
    >
      <div className="space-y-1.5"><Label className="text-xs">Current password</Label><Input type="password" autoComplete="current-password" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label className="text-xs">New password</Label><Input type="password" autoComplete="new-password" value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">Confirm</Label><Input type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} /></div>
      </div>
      <Button type="submit" disabled={pending}>{pending && <Loader2 className="animate-spin" />} Update password</Button>
    </form>
  );
}
