import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

export async function getMediaLibrary() {
  const root = path.join(process.cwd(), "public");
  const out: string[] = [];
  for (const base of ["products", "uploads"]) {
    const dir = path.join(root, base);
    const entries = await fs.readdir(dir, { withFileTypes: true, recursive: true }).catch(() => []);
    for (const e of entries) {
      if (e.isFile() && /\.(webp|png|jpe?g|avif)$/i.test(e.name)) {
        out.push("/" + path.relative(root, path.join(e.parentPath, e.name)).split(path.sep).join("/"));
      }
    }
  }
  return out.sort();
}
