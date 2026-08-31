import { readFile } from "node:fs/promises";
import * as cheerio from "cheerio";

const html = await readFile("data/raw/chimichurri.html", "utf-8");
const $ = cheerio.load(html);

function harTyp(nod, typ) {
  const t = nod["@type"];
  return Array.isArray(t) ? t.includes(typ) : t === typ;
}

let recept = null;

$('script[type="application/ld+json"]').each((i, el) => {
  const data = JSON.parse($(el).text());
  const noder = data["@graph"] ?? (Array.isArray(data) ? data : [data]);
  const traff = noder.find((nod) => harTyp(nod, "Recipe"));
  if (traff) recept = traff;
});

if (!recept) {
  console.log("Ingen Recipe hittades.");
} else {
  console.log(JSON.stringify(recept, null, 2));
}