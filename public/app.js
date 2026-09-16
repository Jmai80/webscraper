import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://jisleyrtpojsfjtlbplp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ts0hUrMnRc00kDfzeAZXsg_SZBQeETG";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const lista = document.getElementById("lista");
const status = document.getElementById("status");

async function hamtaRecept() {
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .order("scraped_at", { ascending: false });

  if (error) {
    status.textContent = `Fel: ${error.message}`;
    return [];
  }
  return data;
}

function esc(text) {
  const d = document.createElement("div");
  d.textContent = String(text ?? "");
  return d.innerHTML;
}

function receptTillHtml(r) {
  const ingredienser = r.ingredients.map((i) => `<li>${esc(i)}</li>`).join("");
  const steg = r.instructions.map((s) => `<li>${esc(s)}</li>`).join("");

  const tider = [
    r.prep_minutes && `Förberedelse ${r.prep_minutes} min`,
    r.cook_minutes && `Tillagning ${r.cook_minutes} min`,
    r.servings && `${esc(r.servings)} portioner`,
  ]
    .filter(Boolean)
    .map((t) => `<span>${t}</span>`)
    .join("");

  const sokText = [r.title, r.description, r.author, ...r.ingredients, ...r.instructions]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return `
<article class="recept" data-sok="${esc(sokText)}">
  ${r.image_url ? `<img src="${esc(r.image_url)}" alt="" loading="lazy">` : ""}
  <div class="innehall">
    <h2>${esc(r.title)}</h2>
    <p class="ingress">${esc(r.description)}</p>
    <div class="meta">${tider}</div>
    <h3>Ingredienser</h3>
    <ul class="ingredienser">${ingredienser}</ul>
    <h3>Gör så här</h3>
    <ol class="steg">${steg}</ol>
    <a class="kalla" href="${esc(r.source_url)}">Källa: ${esc(r.author ?? "okänd")}</a>
  </div>
</article>`;
}

const recept = await hamtaRecept();
lista.innerHTML = recept.map(receptTillHtml).join("");

const falt = document.getElementById("sok");
const kort = [...document.querySelectorAll(".recept")];

falt.addEventListener("input", () => {
  const ord = falt.value.toLowerCase().split(/\s+/).filter(Boolean);
  let synliga = 0;

  for (const el of kort) {
    const traff = ord.every((o) => el.dataset.sok.includes(o));
    el.hidden = !traff;
    if (traff) synliga++;
  }

  status.textContent = ord.length === 0 ? "" : `${synliga} av ${kort.length} recept`;
});

status.textContent = "";