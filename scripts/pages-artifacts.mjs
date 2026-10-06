import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const root = fileURLToPath(new URL("../", import.meta.url));
export const output = path.join(root, "my-app/out");
export const manifestPath = path.join(root, ".pages-manifest.json");

export async function listFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) return listFiles(path.join(directory, entry.name), relative);
    if (!entry.isFile()) throw new Error(`Unsupported export entry: ${relative}`);
    return [relative];
  }));
  return files.flat().sort();
}

export async function hashFile(file) {
  return createHash("sha256").update(await readFile(file)).digest("hex");
}

export async function sourceHash() {
  const directories = ["app", "features", "i18n", "messages", "public"];
  const files = [
    "CNAME", "my-app/next.config.ts", "my-app/package.json", "my-app/pnpm-lock.yaml",
    "my-app/pnpm-workspace.yaml", "my-app/postcss.config.mjs", "my-app/tsconfig.json",
    ...await listFiles(path.join(root, "scripts")).then((files) => files.map((file) => `scripts/${file}`)),
    ...(await Promise.all(directories.map(async (directory) =>
      (await listFiles(path.join(root, "my-app", directory))).map((file) => `my-app/${directory}/${file}`)
    ))).flat(),
  ].sort();
  const hash = createHash("sha256");
  for (const file of files) hash.update(`${file}\0${await hashFile(path.join(root, file))}\n`);
  return hash.digest("hex");
}

export function assertArtifactPath(file) {
  const reserved = new Set([".git", ".github", ".agents", ".codex", "scripts", "my-app", "CNAME", "README.md", ".gitignore", ".pages-manifest.json", "index.js"]);
  if (path.posix.isAbsolute(file) || file.split("/").some((part) => !part || part === "." || part === "..") || file.includes("\\") || reserved.has(file.split("/")[0])) {
    throw new Error(`Unsafe artifact path: ${file}`);
  }
}
