import * as cheerio from "cheerio";

function harTyp(nod, typ) {
  const t = nod["@type"];
  return Array.isArray(t) ? t.includes(typ) : t === typ;
}

function hittaRecept(html) {
  const $ = cheerio.load(html);
  let recept = null;

  $('script[type="application/ld+json"]').each((i, el) => {
    if (recept) return;
    let data;
    try {
      data = JSON.parse($(el).text());
    } catch {
      return;
    }
    const noder = data["@graph"] ?? (Array.isArray(data) ? data : [data]);
    recept = noder.find((nod) => harTyp(nod, "Recipe")) ?? null;
  });

  return recept;
}

function varaktighetTillMinuter(iso) {
  if (typeof iso !== "string") return null;
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/);
  if (!m) return null;
  const timmar = Number(m[1] ?? 0);
  const minuter = Number(m[2] ?? 0);
  return timmar * 60 + minuter;
}

function valjBild(bild) {
  const lista = Array.isArray(bild) ? bild : [bild];
  const urler = lista
    .map((b) => (typeof b === "string" ? b : b?.url))
    .filter(Boolean);
  // Varianter med -225x225 i namnet är nedskalade. Föredra originalet.
  return urler.find((u) => !/-\d+x\d+\.\w+$/.test(u)) ?? urler[0] ?? null;
}

function textFranSteg(steg) {
  if (!Array.isArray(steg)) return [];
  return steg
    .flatMap((s) => {
      if (typeof s === "string") return s;
      if (harTyp(s, "HowToSection")) return textFranSteg(s.itemListElement);
      return s?.text ?? [];
    })
    .map((t) => t.trim())
    .filter(Boolean);
}

export function extraheraRecept(html, kallUrl) {
  const r = hittaRecept(html);
  if (!r) throw new Error(`Ingen Recipe hittades på ${kallUrl}`);

  return {
    source_url: r.url ?? kallUrl,
    title: r.name?.trim() ?? null,
    description: r.description?.trim() ?? null,
    author: r.author?.name ?? null,
    image_url: valjBild(r.image),
    ingredients: r.recipeIngredient ?? [],
    instructions: textFranSteg(r.recipeInstructions),
    prep_minutes: varaktighetTillMinuter(r.prepTime),
    cook_minutes: varaktighetTillMinuter(r.cookTime),
    total_minutes: varaktighetTillMinuter(r.totalTime),
    servings: r.recipeYield ? String(r.recipeYield) : null,
    published_at: r.datePublished ?? null,
    scraped_at: new Date().toISOString(),
  };
}