import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { assertArtifactPath, hashFile, manifestPath, root, sourceHash } from "./pages-artifacts.mjs";

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
assert.equal(manifest.sourceHash, await sourceHash(), "Pages artifacts are stale. Run pnpm build:pages and commit the generated files.");
await access(path.join(root, ".nojekyll"));
assert.ok((await readFile(path.join(root, "CNAME"), "utf8")).trim(), "The custom domain must be preserved.");
assert.ok(manifest.files["index.html"], "The published index.html is missing.");
assert.ok(manifest.files["404.html"], "The static 404 page is missing.");
let scriptCount = 0;
let styleCount = 0;
for (const [file, hash] of Object.entries(manifest.files)) {
  assertArtifactPath(file);
  assert.equal(await hashFile(path.join(root, file)), hash, `Missing or modified Pages artifact: ${file}`);
  if (!file.endsWith(".html")) continue;
  const html = await readFile(path.join(root, file), "utf8");
  for (const match of html.matchAll(/(?:src|href)="(\/_next\/[^"?#]+)(?:[^\"]*)"/g)) {
    const asset = decodeURIComponent(match[1].slice(1));
    assert.ok(manifest.files[asset], `${file} references an unpublished asset: ${asset}`);
    if (asset.endsWith(".js")) scriptCount++;
    if (asset.endsWith(".css")) styleCount++;
  }
}
assert.ok(scriptCount > 0 && styleCount > 0, "Published HTML must load both JavaScript and CSS.");
console.log("Pages artifacts match the source; all referenced JavaScript and CSS files are present.");
