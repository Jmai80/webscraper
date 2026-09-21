import { createClient } from "jsr:@supabase/supabase-js@2";
import * as cheerio from "npm:cheerio@1.0.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function startaBygge() {
  try {
    const svar = await fetch(
      "https://api.github.com/repos/jmai80/webscraper/actions/workflows/pages.yml/dispatches",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("GITHUB_PAT")}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "webscraper",
        },
        body: JSON.stringify({ ref: "main" }),
      }
    );
    if (!svar.ok) console.error(`GitHub svarade ${svar.status}: ${await svar.text()}`);
  } catch (err) {
    console.error("Kunde inte starta bygget:", err);
  }
}

function harTyp(nod: any, typ: string) {
  const t = nod["@type"];
  return Array.isArray(t) ? t.includes(typ) : t === typ;
}

function varaktighetTillMinuter(iso: any) {
  if (typeof iso !== "string") return null;
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/);
  if (!m) return null;
  return Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0);
}

function valjBild(bild: any) {
  const lista = Array.isArray(bild) ? bild : [bild];
  const urler = lista
    .map((b: any) => (typeof b === "string" ? b : b?.url))
    .filter(Boolean);
  return urler.find((u: string) => !/-\d+x\d+\.\w+$/.test(u)) ?? urler[0] ?? null;
}

function textFranSteg(steg: any): string[] {
  if (!Array.isArray(steg)) return [];
  return steg
    .flatMap((s: any) => {
      if (typeof s === "string") return s;
      if (harTyp(s, "HowToSection")) return textFranSteg(s.itemListElement);
      return s?.text ?? [];
    })
    .map((t: string) => t.trim())
    .filter(Boolean);
}

function extraheraRecept(html: string, kallUrl: string) {
  const $ = cheerio.load(html);
  let r: any = null;

  $('script[type="application/ld+json"]').each((_i, el) => {
    if (r) return;
    let data: any;
    try {
      data = JSON.parse($(el).text());
    } catch {
      return;
    }
    const noder = data["@graph"] ?? (Array.isArray(data) ? data : [data]);
    r = noder.find((n: any) => harTyp(n, "Recipe")) ?? null;
  });

  if (!r) throw new Error("Ingen receptmärkning hittades på sidan");

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const { url } = await req.json();
    if (!url) throw new Error("Ingen url angiven");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization") ?? "" },
        },
      }
    );

    const svar = await fetch(url, {
      headers: { "User-Agent": "Laroprojekt-scraper" },
    });
    if (!svar.ok) throw new Error(`Sidan svarade ${svar.status}`);

    const recept = extraheraRecept(await svar.text(), url);

    const { data, error } = await supabase
      .from("recipes")
      .upsert(recept, { onConflict: "source_url" })
      .select()
      .single();

    if (error) throw new Error(error.message);

    await startaBygge();

    return new Response(JSON.stringify(data), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});