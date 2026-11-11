import { requireUser } from "@/lib/auth/dal";
import { AccountNav } from "@/components/shop/account-nav";

export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const user = await requireUser("/account");
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-8">
      <p className="eyebrow text-muted-foreground">My account</p>
      <h1 className="mt-2 font-display text-5xl">Hello, {user.name.split(" ")[0]}</h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-[220px_1fr]">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
