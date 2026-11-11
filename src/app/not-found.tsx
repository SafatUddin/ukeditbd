import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-cream px-6 text-center">
      <p className="eyebrow text-muted-foreground">Error 404</p>
      <h1 className="font-display text-6xl">Lost in the archive</h1>
      <p className="max-w-md text-muted-foreground">The page you&apos;re looking for has moved, sold out, or never existed.</p>
      <Link href="/" className="mt-4 rounded-full bg-ink px-8 py-3 text-sm text-white">Return to the shop</Link>
    </div>
  );
}
