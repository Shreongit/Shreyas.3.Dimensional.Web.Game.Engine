import { readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const roots = ["src", "tests", "scripts"];
const files = [];

async function collect(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await collect(full);
    else if (entry.isFile() && full.endsWith(".js") || entry.isFile() && full.endsWith(".mjs")) files.push(full);
  }
}
for (const root of roots) await collect(root);
for (const file of files) {
  // --check parses the module without executing it.
  const { spawnSync } = await import("node:child_process");
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || `Syntax check failed: ${file}\n`);
    process.exit(result.status ?? 1);
  }
}
console.log(`Syntax check passed for ${files.length} JavaScript files.`);
