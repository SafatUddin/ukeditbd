# The UK Edit BD — Curated from the UK

E-commerce platform for **The UK Edit BD** (Dhaka): authentic beauty, skincare, fragrance, fashion, shoes, lifestyle and food & wellness products sourced from the UK. **Shop · Pre-order · Deliver.**

One Next.js app serves two experiences:

- **Storefront** (`/`): open to everyone, no sign-in needed to browse. Signing in is required at checkout.
- **Admin inventory & commerce system** (`/admin`): for staff only.

Everyone uses the **same login page** (`/login`). After the password check, the backend looks up the account's role, and any email in `ADMIN_EMAILS` is always an admin. Admins/staff go to `/admin`; customers go back to the shop.

## Quick start

```bash
cp .env.example .env              # then set AUTH_SECRET (openssl rand -base64 32)
npm install                       # runs `prisma generate`
npx prisma migrate dev            # creates prisma/dev.db (SQLite)
npm run db:seed                   # demo catalog, customers, orders, POs
npm run dev                       # http://localhost:3000
```

| Account  | Email                   | Password                              |
| -------- | ----------------------- | ------------------------------------- |
| Admin    | `admin@ukeditbd.com`    | `SEED_ADMIN_PASSWORD` (default `Admin@12345`) |
| Customer | `customer@ukeditbd.com` | `Customer@123`                        |

Change the admin password after first login (**Admin → Settings**).

## Features

**Storefront**
- Editorial home page with logo-matched pastel category circles, featured products, a "How it works" section and a Fragrance spotlight
- Shop with filters (category, department, size, price, sale, pre-order), sorting and brand/product search
- Product page: gallery with hover zoom, colour/size pickers, per-size pricing (e.g. 50ml / 100ml), low-stock notices, wishlist
- **Pre-order**: out-of-stock sizes on pre-order-enabled products can still be ordered, with sourcing time shown end to end
- Slide-over bag, bag page, checkout with Cash on Delivery or mock card (cards ending in `0002` are declined)
- Account area: overview, order history with status tracker and timeline, saved addresses, wishlist

**Admin IMS** (patterns from `satnaing/shadcn-admin`, Medusa and Saleor)
- Collapsible sidebar with live badges, ⌘K command palette with live search, light/dark theme
- Dashboard: revenue vs. previous period, AOV, gross margin, revenue chart (7/30/90d), order pipeline, sales by category, top products, reorder alerts
- Reusable TanStack data tables: faceted filters, sorting, column visibility, bulk actions, CSV export
- Products: create/edit, media upload and library, variant matrix generator, pre-order settings
- Inventory: stock levels per SKU with reorder points, days of cover, 30-day sales velocity, add/remove/count adjustments, backorder tracking
- Movements: an audit ledger of every stock change, linked to the order or PO that caused it
- Orders: an enforced status state machine; cancelling or refunding restocks automatically; payment recording, notes, timeline
- Purchase orders: auto-fill from low stock, submit, partial or full receiving that updates stock and unit cost
- Suppliers, categories, customers (segments, LTV, role management), settings (profile, password, team)

## Tech

Next.js 16 (App Router, Server Actions, `proxy.ts`) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui (Radix) · Prisma 7 + SQLite (better-sqlite3 adapter) · TanStack Table 8 · Recharts · Zustand · Zod · jose (JWT in httpOnly cookies) · bcryptjs

### Moving to Postgres
1. In `prisma/schema.prisma`, set `provider = "postgresql"`.
2. Swap `@prisma/adapter-better-sqlite3` for `@prisma/adapter-pg` in `src/lib/db.ts` and `prisma/seed.ts`.
3. Point `DATABASE_URL` at your database and run `npx prisma migrate dev`.
4. Replace the two raw SQL snippets (`MAX(CAST(SUBSTR(...)))` and the low-stock `COUNT`) if your dialect needs it.

### Production notes
- Image uploads are written to `public/uploads/`. On serverless hosts, switch `src/lib/actions/admin/upload.ts` to object storage (S3, R2, Vercel Blob).
- Demo product photography comes from the DummyJSON test CDN. Replace it with your own product photos before launch.
- Card payments are mocked. Integrate SSLCommerz or bKash in `placeOrder` (`src/lib/actions/shop.ts`).

## Scripts

`dev` · `build` · `start` · `lint` · `typecheck` · `db:migrate` · `db:seed` · `db:reset` · `db:studio`
