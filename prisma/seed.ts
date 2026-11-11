import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { Prisma, PrismaClient, type OrderStatus, type PaymentMethod } from "../src/generated/prisma/client";
import { categories, products, suppliers } from "./catalog";

if (fs.existsSync(".env")) process.loadEnvFile(".env");

const db = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" }),
});

let seed = 42;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000 - int(0, 86_399) * 1000);

const firstNames = ["Ayesha", "Rahim", "Tanvir", "Nadia", "Farhan", "Sabrina", "Imran", "Mehjabin", "Shafiq", "Tasnim", "Zarif", "Lamia", "Rafsan", "Anika", "Sakib", "Maliha", "Junaid", "Fariha", "Omar", "Rumana", "Kabir", "Sumaiya", "Nafis", "Priya", "Arman"];
const lastNames = ["Rahman", "Hossain", "Chowdhury", "Ahmed", "Islam", "Karim", "Siddiqui", "Khan", "Akter", "Haque"];
const cities = [
  { city: "Dhaka", areas: ["Gulshan", "Banani", "Dhanmondi", "Uttara", "Bashundhara", "Mirpur"] },
  { city: "Chattogram", areas: ["Agrabad", "Nasirabad", "Khulshi"] },
  { city: "Sylhet", areas: ["Zindabazar", "Uposhohor"] },
];

const careCopy: Record<string, string> = {
  beauty: "Store in a cool, dry place away from direct sunlight. Best used within 12 months of opening.",
  skincare: "For external use only. Store below 25°C. Patch test before first use.",
  fragrance: "Keep away from heat and direct sunlight to preserve the composition. Apply to pulse points.",
  fashion: "Dry clean recommended. Do not tumble dry. Store on a padded hanger or in the dust bag provided.",
  shoes: "Wipe with a soft, damp cloth. Use shoe trees and store in the dust bag provided.",
  lifestyle: "Wipe clean with a soft, dry cloth. Store in the pouch or box provided.",
  "food-wellness": "Store in a cool, dry place. Check the best-before date on the pack. Reseal after opening.",
};

const statusFlow: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

async function main() {
  console.log("Clearing database...");
  await db.orderEvent.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.purchaseOrderItem.deleteMany();
  await db.purchaseOrder.deleteMany();
  await db.supplier.deleteMany();
  await db.inventoryMovement.deleteMany();
  await db.wishlistItem.deleteMany();
  await db.productVariant.deleteMany();
  await db.productImage.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  await db.address.deleteMany();
  await db.user.deleteMany();

  console.log("Seeding users...");
  const adminEmail = (process.env.ADMIN_EMAILS ?? "admin@ukeditbd.com").split(",")[0].trim().toLowerCase();
  const admin = await db.user.create({
    data: {
      email: adminEmail,
      name: "Store Admin",
      role: "ADMIN",
      passwordHash: await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? "Admin@12345", 10),
    },
  });

  const customerHash = await bcrypt.hash("Customer@123", 10);
  const demo = await db.user.create({
    data: {
      email: "customer@ukeditbd.com",
      name: "Ayesha Rahman",
      phone: "+880 1700-000000",
      passwordHash: customerHash,
      addresses: {
        create: { fullName: "Ayesha Rahman", phone: "+880 1700-000000", line1: "House 12, Road 7", area: "Gulshan", city: "Dhaka", postalCode: "1212", isDefault: true },
      },
    },
  });

  const customers = [demo];
  for (let i = 0; i < 40; i++) {
    const first = pick(firstNames);
    const last = pick(lastNames);
    customers.push(
      await db.user.create({
        data: {
          email: `${first}.${last}${i}@example.com`.toLowerCase(),
          name: `${first} ${last}`,
          phone: `+880 17${int(10, 99)}-${int(100000, 999999)}`,
          passwordHash: customerHash,
          createdAt: daysAgo(int(5, 180)),
        },
      }),
    );
  }

  console.log("Seeding catalog...");
  const categoryIds: Record<string, string> = {};
  for (const [i, c] of categories.entries()) {
    categoryIds[c.slug] = (await db.category.create({ data: { ...c, sortOrder: i } })).id;
  }

  type V = { id: string; sku: string; price: number; cost: number; label: string; name: string; image: string; target: number; reorderPoint: number };
  const variants: V[] = [];

  for (const p of products) {
    const dir = path.join("public/products", p.slug);
    const images = fs.readdirSync(dir).filter((f) => f.endsWith(".webp")).sort();
    const created = await db.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        gender: p.gender,
        brand: p.brand,
        categoryId: categoryIds[p.category],
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        material: p.material,
        care: careCopy[p.category],
        featured: p.featured ?? false,
        allowPreorder: p.preorder ?? false,
        preorderDays: p.category === "fragrance" ? 10 : 14,
        tags: (p.tags ?? []).join(","),
        createdAt: daysAgo(int(10, 200)),
        images: { create: images.map((f, i) => ({ url: `/products/${p.slug}/${f}`, alt: `${p.name} view ${i + 1}`, position: i })) },
      },
    });
    const prefix = p.slug.split("-").map((w) => w[0]).join("").toUpperCase().slice(0, 4);
    for (const color of p.colors) {
      for (const size of p.sizes) {
        const sku = `UK-${prefix}-${size.replace(/\s+/g, "").toUpperCase().slice(0, 4)}-${int(100, 999)}`;
        const roll = rand();
        // Pre-order lines are mostly sourced on demand, so they often sit at zero stock.
        const target = p.preorder && roll < 0.45 ? 0 : roll < 0.08 ? 0 : roll < 0.2 ? int(1, 4) : int(8, 60);
        const reorderPoint = p.sizes.length > 1 ? 5 : 3;
        const price = p.sizePrices?.[size] ?? p.price;
        const cost = Math.round(price * (0.45 + rand() * 0.15));
        const v = await db.productVariant.create({
          data: {
            productId: created.id,
            sku,
            size,
            color: color.name,
            colorHex: color.hex,
            price: p.sizePrices?.[size] ?? null,
            costPrice: cost,
            stock: target,
            reorderPoint,
            reorderQty: reorderPoint * 4,
            binLocation: `${p.category.slice(0, 2).toUpperCase()}-${int(1, 9)}${String.fromCharCode(65 + int(0, 5))}`,
            barcode: String(int(100000000, 999999999)) + String(int(1000, 9999)),
          },
        });
        variants.push({ id: v.id, sku, price, cost, label: [color.name, size].join(" / "), name: p.name, image: `/products/${p.slug}/${images[0]}`, target, reorderPoint });
      }
    }
  }

  console.log("Seeding orders...");
  const sold: Record<string, { qty: number; at: Date; ref: string }[]> = {};
  let orderNo = 1000;
  for (let i = 0; i < 220; i++) {
    const age = Math.floor(Math.pow(rand(), 1.4) * 90);
    const createdAt = daysAgo(age);
    const customer = rand() < 0.15 ? demo : pick(customers);
    const loc = pick(cities);
    const lines = Array.from({ length: int(1, 3) }, () => pick(variants));
    const uniq = [...new Map(lines.map((l) => [l.id, l])).values()];
    const items = uniq.map((v) => ({ v, qty: rand() < 0.85 ? 1 : 2 }));
    const subtotal = items.reduce((s, it) => s + it.v.price * it.qty, 0);
    const shippingFee = subtotal >= 10000 ? 0 : loc.city === "Dhaka" ? 80 : 150;
    const cancelled = rand() < 0.06;
    const stage = cancelled ? -1 : age > 10 ? 4 : age > 5 ? int(2, 4) : int(0, 3);
    const status: OrderStatus = cancelled ? "CANCELLED" : statusFlow[stage];
    const method: PaymentMethod = rand() < 0.6 ? "COD" : "CARD";
    const paid = method === "CARD" ? !cancelled : status === "DELIVERED";
    const number = `UK-${++orderNo}`;

    const events: { status: OrderStatus; message: string; createdAt: Date; actor: string }[] = [
      { status: "PENDING", message: "Order placed", createdAt, actor: customer.name },
    ];
    if (cancelled) events.push({ status: "CANCELLED", message: "Order cancelled at customer's request", createdAt: new Date(createdAt.getTime() + 3_600_000 * 5), actor: admin.name });
    for (let s = 1; s <= stage; s++) {
      const msg = { CONFIRMED: "Order confirmed", PROCESSING: "Packed and ready to ship", SHIPPED: "Handed to courier (Pathao)", DELIVERED: "Delivered to customer" }[statusFlow[s] as "CONFIRMED"];
      events.push({ status: statusFlow[s], message: msg, createdAt: new Date(createdAt.getTime() + s * 3_600_000 * 18), actor: admin.name });
    }

    await db.order.create({
      data: {
        number,
        userId: customer.id,
        email: customer.email,
        customerName: customer.name,
        phone: customer.phone ?? "+880 1700-000000",
        line1: `House ${int(1, 99)}, Road ${int(1, 30)}`,
        area: pick(loc.areas),
        city: loc.city,
        postalCode: String(int(1000, 4000)),
        status,
        paymentMethod: method,
        paymentStatus: cancelled && method === "CARD" ? "REFUNDED" : paid ? "PAID" : "UNPAID",
        subtotal,
        shippingFee,
        total: subtotal + shippingFee,
        createdAt,
        updatedAt: events[events.length - 1].createdAt,
        items: { create: items.map(({ v, qty }) => ({ variantId: v.id, productName: v.name, variantLabel: v.label, sku: v.sku, image: v.image, unitPrice: v.price, unitCost: v.cost, quantity: qty })) },
        events: { create: events },
      },
    });

    if (!cancelled) for (const { v, qty } of items) (sold[v.id] ??= []).push({ qty, at: createdAt, ref: number });
  }

  console.log("Building inventory ledger...");
  for (const v of variants) {
    const sales = (sold[v.id] ?? []).sort((a, b) => a.at.getTime() - b.at.getTime());
    const totalSold = sales.reduce((s, x) => s + x.qty, 0);
    let stock = v.target + totalSold;
    const movements: Prisma.InventoryMovementCreateManyInput[] = [
      { variantId: v.id, type: "INITIAL", quantity: stock, stockAfter: stock, reason: "Opening stock count", createdAt: daysAgo(95), userId: admin.id },
    ];
    for (const s of sales) {
      stock -= s.qty;
      movements.push({ variantId: v.id, type: "SALE", quantity: -s.qty, stockAfter: stock, reason: "Customer order", reference: s.ref, createdAt: s.at });
    }
    await db.inventoryMovement.createMany({ data: movements });
  }

  console.log("Seeding suppliers & purchase orders...");
  const supplierRows = [];
  for (const s of suppliers) supplierRows.push(await db.supplier.create({ data: s }));
  const lowStock = variants.filter((v) => v.target <= v.reorderPoint);
  const poDefs = [
    { status: "RECEIVED" as const, age: 40, supplier: supplierRows[0] },
    { status: "RECEIVED" as const, age: 25, supplier: supplierRows[1] },
    { status: "ORDERED" as const, age: 4, supplier: supplierRows[1] },
    { status: "ORDERED" as const, age: 2, supplier: supplierRows[3] },
    { status: "DRAFT" as const, age: 0, supplier: supplierRows[2] },
  ];
  for (const [i, def] of poDefs.entries()) {
    const lines = (def.status === "RECEIVED" ? variants : lowStock).slice(i * 4, i * 4 + int(3, 6));
    await db.purchaseOrder.create({
      data: {
        number: `PO-${String(2026001 + i)}`,
        supplierId: def.supplier.id,
        status: def.status,
        createdAt: daysAgo(def.age),
        expectedAt: new Date(Date.now() + (def.supplier.leadTimeDays - def.age) * 86_400_000),
        receivedAt: def.status === "RECEIVED" ? daysAgo(def.age - def.supplier.leadTimeDays) : null,
        items: { create: lines.map((v) => ({ variantId: v.id, quantity: v.reorderPoint * 4, received: def.status === "RECEIVED" ? v.reorderPoint * 4 : 0, unitCost: v.cost })) },
      },
    });
  }

  const wish = products.filter((p) => p.featured).slice(0, 4);
  for (const p of wish) {
    const prod = await db.product.findUnique({ where: { slug: p.slug } });
    if (prod) await db.wishlistItem.create({ data: { userId: demo.id, productId: prod.id } });
  }

  console.log(`Done. Admin: ${adminEmail} | Customer: customer@ukeditbd.com / Customer@123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
