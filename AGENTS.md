<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project notes

- Brand: **The UK Edit BD** — "Curated from the UK", "Shop · Pre-order · Deliver". Colours: navy `#0a2a5e` (`navy`/`ink`), crimson `#d9245f` (`rose`), gold `#c39a4c` (`gold`), cream; category pastels live in `src/app/globals.css` and `src/lib/brand.ts`. Logo assets are in `public/brand/` (`logo.png` badge, `wordmark.png` header).
- Categories: Beauty, Skincare, Fragrance, Fashion, Shoes, Lifestyle, Food & Wellness (seeded from `prisma/catalog.ts`).
- Stack: Next.js 16 (use `src/proxy.ts`, not middleware; request APIs are async), Prisma 7 with the generated client in `src/generated/prisma` (import from `@/generated/prisma/client`), SQLite via `@prisma/adapter-better-sqlite3`, shadcn/ui on Radix (`CommandDialog` children must be wrapped in `<Command>`).
- Auth: JWT session cookie (`src/lib/auth/*`). Admin is decided server-side by DB role plus `ADMIN_EMAILS`. Always re-check with `requireAdmin()` / `assertAdmin()` in pages and actions.
- Inventory: every stock change must write an `InventoryMovement`. Pre-order lines may take stock negative (backorder).
- Admin tables reuse `src/components/admin/data-table/data-table.tsx`.

## Verification

```bash
npx tsc --noEmit
npx eslint src prisma
npm run build
npm run db:reset   # re-migrate + reseed demo data
```

Demo logins: `admin@ukeditbd.com` / `Admin@12345`, `customer@ukeditbd.com` / `Customer@123`.
