import { writeFile, mkdir } from "node:fs/promises";
import { extraheraRecept } from "./parse.js";
import { sparaRecept } from "./save.js";

const url = process.argv[2];

if (!url) {
  console.error("Användning: node --env-file=.env src/index.js <url>");
  process.exit(1);
}

function filnamnFor(url) {
  const slug = new URL(url).pathname
    .replace(/^\/|\/$/g, "")
    .replace(/[^a-z0-9]+/gi, "-");
  return `data/raw/${slug || "index"}.html`;
}

async function hamtaSida(url) {
  const svar = await fetch(url, {
    headers: { "User-Agent": "Laroprojekt-scraper" },
  });
  if (!svar.ok) {
    throw new Error(`Servern svarade ${svar.status} ${svar.statusText}`);
  }
  return await svar.text();
}

const html = await hamtaSida(url);

await mkdir("data/raw", { recursive: true });
await writeFile(filnamnFor(url), html, "utf-8");

const recept = extraheraRecept(html, url);
const sparat = await sparaRecept(recept);

console.log(`✓ ${sparat.title}  (id ${sparat.id})`);