#!/usr/bin/env node
// Merges locale fragments in locales/_fragments/*.{en,am}.json into the main
// locales/en.json and locales/am.json via a deep merge. Fragments override
// existing keys at their leaf nodes.

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesDir = join(__dirname, "..", "locales");
const fragmentsDir = join(localesDir, "_fragments");

function deepMerge(target, source) {
  if (typeof source !== "object" || source === null || Array.isArray(source)) {
    return source;
  }
  const out = { ...(target && typeof target === "object" && !Array.isArray(target) ? target : {}) };
  for (const [k, v] of Object.entries(source)) {
    out[k] = k in out ? deepMerge(out[k], v) : v;
  }
  return out;
}

function mergeFor(locale) {
  const mainPath = join(localesDir, `${locale}.json`);
  const main = JSON.parse(readFileSync(mainPath, "utf8"));
  const files = readdirSync(fragmentsDir).filter((f) => f.endsWith(`.${locale}.json`));
  let merged = main;
  for (const f of files.sort()) {
    const frag = JSON.parse(readFileSync(join(fragmentsDir, f), "utf8"));
    merged = deepMerge(merged, frag);
    console.log(`  merged ${f}`);
  }
  writeFileSync(mainPath, JSON.stringify(merged, null, 2) + "\n");
  console.log(`  wrote ${mainPath}`);
}

console.log("Merging English locale fragments…");
mergeFor("en");
console.log("Merging Amharic locale fragments…");
mergeFor("am");
console.log("Done.");
