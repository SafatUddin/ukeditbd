"use server";

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { assertAdmin, fail, type ActionResult } from "./guard";

const allowed: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };

export async function uploadImage(formData: FormData): Promise<ActionResult<{ url: string }>> {
  await assertAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) return fail("No file provided");
  const ext = allowed[file.type];
  if (!ext) return fail("Only JPG, PNG, WebP or AVIF images are allowed");
  if (file.size > 5 * 1024 * 1024) return fail("Image must be smaller than 5 MB");

  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  const name = `${crypto.randomUUID()}.${ext}`;
  await fs.writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return { ok: true, data: { url: `/uploads/${name}` } };
}
