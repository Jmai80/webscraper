import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

form.onsubmit = async (e) => {
  e.preventDefault();
  const knapp = form.querySelector("button");
  knapp.disabled = true;
  status.textContent = "Sparar…";

  const recept = {
    title: text("titel"),
    description: text("beskrivning"),
    author: text("forfattare"),
    ingredients: rader("ingredienser"),
    instructions: rader("steg"),
    image_url: text("bild"),
    source_url: text("kalla"),
    tags: document.getElementById("nyckelord").value
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
    scraped_at: new Date().toISOString(),
  };

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