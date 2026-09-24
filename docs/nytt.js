import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.1";

const SUPABASE_URL = "https://jisleyrtpojsfjtlbplp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ts0hUrMnRc00kDfzeAZXsg_SZBQeETG";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById("nytt");
const status = document.getElementById("nytt-status");

// Värdet i ett fält, eller null om det är tomt.
function text(id) {
  const v = document.getElementById(id).value.trim();
  return v === "" ? null : v;
}

// Värdet i ett sifferfält, eller null om det är tomt.
function nummer(id) {
  const v = document.getElementById(id).value.trim();
  return v === "" ? null : Number(v);
}

// Ett textfält uppdelat i en lista, en rad per element.
function rader(id) {
  return document.getElementById(id).value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  form.hidden = true;
  status.textContent = "Du måste vara inloggad. Logga in på startsidan först.";
}

// Skriver ett värde i ett fält, om det finns något att skriva.
function fyll(id, varde) {
  if (varde !== null && varde !== undefined) {
    document.getElementById(id).value = varde;
  }
}

// Med ?recept=<id> i adressen redigerar vi ett befintligt recept.
const valtId = new URLSearchParams(location.search).get("recept");

if (valtId && session) {
  const { data: recept } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", valtId)
    .maybeSingle();

  if (!recept) {
    status.textContent = "Hittade inget recept med den adressen.";
  } else {
    document.title = "Redigera recept";
    form.querySelector("h2").textContent = "Redigera recept";
    form.querySelector("button").textContent = "Spara ändringar";

    fyll("titel", recept.title);
    fyll("beskrivning", recept.description);
    fyll("portioner", recept.servings);
    fyll("forberedelse", recept.prep_minutes);
    fyll("tillagning", recept.cook_minutes);
    fyll("ingredienser", recept.ingredients.join("\n"));
    fyll("steg", recept.instructions.join("\n"));
    fyll("bild", recept.image_url);
    fyll("kalla", recept.source_url);
    fyll("forfattare", recept.author);
    fyll("nyckelord", recept.tags.join(", "));
  }
}

form.onsubmit = async (e) => {
  e.preventDefault();
  const knapp = form.querySelector("button");
  knapp.disabled = true;
  status.textContent = "Sparar…";

  const recept = {
    title: text("titel"),
    description: text("beskrivning"),
    author: text("forfattare"),
    servings: text("portioner"),
    prep_minutes: nummer("forberedelse"),
    cook_minutes: nummer("tillagning"),
    ingredients: rader("ingredienser"),
    instructions: rader("steg"),
    image_url: text("bild"),
    source_url: text("kalla"),
    tags: document.getElementById("nyckelord").value
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  };

  // Redigering: spara mot receptets id, så att rätt rad ändras.
  if (valtId) {
    const { data, error } = await supabase
      .from("recipes")
      .update(recept)
      .eq("id", valtId)
      .select("id")
      .maybeSingle();

    knapp.disabled = false;

    if (error || !data) {
      status.textContent = `Misslyckades: ${error?.message ?? "ingen rad ändrades"}`;
      return;
    }

    location.href = `./?recept=${valtId}`;
    return;
  }

  // Nytt recept: Edge Functionen sparar och bygger om delningssidorna.
  recept.scraped_at = new Date().toISOString();

  const { data, error } = await supabase.functions.invoke("scrape", {
    body: { recept },
  });

  knapp.disabled = false;

  if (error) {
    const detalj = await error.context?.json?.().catch(() => null);
    status.textContent = `Misslyckades: ${detalj?.error ?? error.message}`;
    return;
  }

  location.href = `./?recept=${data.id}`;
};