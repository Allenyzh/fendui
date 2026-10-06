import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { assertArtifactPath, hashFile, listFiles, manifestPath, output, root, sourceHash } from "./pages-artifacts.mjs";

const files = await listFiles(output);
if (!files.includes("index.html") || !files.some((file) => file.endsWith(".js"))) {
  throw new Error("Run the Next.js static build before exporting Pages artifacts.");
}
files.forEach(assertArtifactPath);

let previous;
try {
  previous = JSON.parse(await readFile(manifestPath, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
for (const file of Object.keys(previous?.files ?? {})) {
  assertArtifactPath(file);
  if (!files.includes(file)) await rm(path.join(root, file), { force: true });
}

const hashes = {};
for (const file of files) {
  const destination = path.join(root, file);
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(path.join(output, file), destination);
  hashes[file] = await hashFile(destination);
}
await writeFile(path.join(root, ".nojekyll"), "");
await writeFile(manifestPath, `${JSON.stringify({ sourceHash: await sourceHash(), files: hashes }, null, 2)}\n`);
await import("./verify-pages.mjs");
console.log(`Published ${files.length} static files to the repository root. Commit them with the source changes.`);
