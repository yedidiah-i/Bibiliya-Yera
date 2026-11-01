/**
 * Builds feed/manifest.json from every pack in feed/packs/.
 *
 * The manifest carries size + sha256 for each pack; the desktop app verifies
 * both before installing anything, so a corrupted or tampered download can
 * never end up in the reader.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const feedDir = join(root, "feed");
const packsDir = join(feedDir, "packs");

const files = readdirSync(packsDir).filter((f) => f.endsWith(".json"));
const packs = [];

for (const file of files) {
  const buf = readFileSync(join(packsDir, file));
  let data;
  try {
    data = JSON.parse(buf.toString("utf8"));
  } catch (e) {
    throw new Error(`${file}: ntabwo ari JSON yuzuye (${e.message})`);
  }
  if (!data.id || !data.type || !Array.isArray(data.items)) {
    throw new Error(`${file}: bisaba "id", "type" na "items"`);
  }
  packs.push({
    id: data.id,
    title: data.title ?? data.id,
    type: data.type,
    version: data.version ?? "1.0.0",
    size: buf.length,
    sha256: createHash("sha256").update(buf).digest("hex"),
    url: `packs/${encodeURIComponent(file)}`,
    notes: data.notes ?? "",
  });
}

packs.sort((a, b) => a.id.localeCompare(b.id));

const manifest = {
  version: 1,
  updated: new Date().toISOString().slice(0, 10),
  message: "Ibyongewe bishya kuri Bibiliya Yera.",
  packs,
};

writeFileSync(join(feedDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`manifest.json: ${packs.length} pack(s)`);
for (const p of packs) console.log(`  - ${p.id} ${p.version} (${p.size} B)`);
