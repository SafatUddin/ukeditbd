import { PageHeader } from "@/components/admin/page-header";
import { PasswordForm, ProfileForm } from "@/components/admin/settings-forms";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/dal";
import { adminEmails } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { formatDateTime, initials } from "@/lib/format";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireAdmin();
  const team = await db.user.findMany({ where: { role: { in: ["ADMIN", "STAFF"] } }, orderBy: { createdAt: "asc" }, select: { id: true, name: true, email: true, role: true, lastLoginAt: true } });
  const pinned = adminEmails();

  return (
    <>
      <PageHeader title="Settings" description="Manage your profile, security and team access." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Shown on order timelines and inventory movements you create.</CardDescription>
          </CardHeader>
          <CardContent><ProfileForm name={user.name} phone={user.phone ?? ""} email={user.email} /></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Use at least 8 characters with an uppercase letter and a number.</CardDescription>
          </CardHeader>
          <CardContent><PasswordForm /></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Team access</CardTitle>
          <CardDescription>
            Everyone signs in through the same login page. The backend checks the account&apos;s role (and the <code className="rounded bg-muted px-1 font-mono text-xs">ADMIN_EMAILS</code> allow-list) and routes staff to this dashboard. Promote customers from the Customers page.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="divide-y border-y">
            {team.map((m) => (
              <div key={m.id} className="flex items-center gap-4 px-6 py-3">
                <Avatar className="size-9"><AvatarFallback className="text-xs">{initials(m.name)}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{m.name} {m.id === user.id && <span className="text-xs text-muted-foreground">(you)</span>}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                </div>
                {pinned.includes(m.email) && <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">Pinned via ADMIN_EMAILS</span>}
                <StatusBadge status={m.role} dot={false} />
                <p className="hidden w-44 text-right text-xs text-muted-foreground md:block">{m.lastLoginAt ? `Last login ${formatDateTime(m.lastLoginAt)}` : "Never signed in"}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
