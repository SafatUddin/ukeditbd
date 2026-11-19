import fs from "node:fs";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { categories } from "./catalog";

if (fs.existsSync(".env")) process.loadEnvFile(".env");

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DIRECT_URL or DATABASE_URL must be set in the environment");
}

const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
const pool = new Pool({
  connectionString,
  ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
});

const db = new PrismaClient({
  adapter: new PrismaPg(pool),
});

function readArg(flag: string): string | undefined {
  const prefix = `--${flag}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
}

/**
 * Safe, idempotent production bootstrap:
 * - Creates or updates the admin user directly in the database (pass --email=... --password=...)
 * - Ensures the 7 base storefront categories exist
 * - Does NOT store admin credentials in .env and does NOT insert any fake customers, products, orders, or suppliers
 */
async function main() {
  const emailArg = readArg("email")?.trim().toLowerCase();
  const passwordArg = readArg("password");

  if (emailArg) {
    if (!passwordArg || passwordArg.length < 8) {
      throw new Error("Provide a --password=... (at least 8 characters) when setting up the admin user.");
    }
    const passwordHash = await bcrypt.hash(passwordArg, 10);
    await db.user.upsert({
      where: { email: emailArg },
      update: { role: "ADMIN", passwordHash },
      create: {
        email: emailArg,
        name: "Store Admin",
        role: "ADMIN",
        passwordHash,
      },
    });
    console.log(`Admin user configured in database: ${emailArg}`);
  } else {
    console.log("No --email passed; skipping admin user creation.");
  }

  for (const [i, c] of categories.entries()) {
    await db.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        slug: c.slug,
        name: c.name,
        description: c.description,
        image: c.image,
        sortOrder: i,
      },
    });
  }
  console.log(`Ensured ${categories.length} storefront categories exist.`);
  console.log("Bootstrap complete (0 fake customers, 0 fake products).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
    await pool.end();
  });
