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
        <h2><a class="titel-lank" href="?recept=${r.id}">${esc(r.title)}</a></h2>
    <p class="ingress">${esc(r.description)}</p>
    <div class="meta">${tider}</div>
    <h3>Ingredienser</h3>
    <ul class="ingredienser">${ingredienser}</ul>
    <h3>Gör så här</h3>
    <ol class="steg">${steg}</ol>
        <button class="dela" data-id="${r.id}" data-titel="${esc(r.title)}">Dela recept</button>
    <a class="kalla" href="${esc(r.source_url)}">Källa: ${esc(r.author ?? "okänd")}</a>
  </div>
</article>`;
}

const params = new URLSearchParams(location.search);
const valtId = params.get("recept");

const alla = await hamtaRecept();
const recept = valtId
  ? alla.filter((r) => String(r.id) === valtId)
  : alla;

lista.innerHTML = recept.map(receptTillHtml).join("");

lista.addEventListener("click", async (e) => {
  const knapp = e.target.closest(".dela");
  if (!knapp) return;

  const url = new URL(`?recept=${knapp.dataset.id}`, location.href).href;
  const titel = knapp.dataset.titel;

  if (navigator.share) {
    try {
      await navigator.share({ title: titel, url });
    } catch {
      // Användaren avbröt delningen — inget att göra.
    }
  } else {
    await navigator.clipboard.writeText(url);
    knapp.textContent = "Länk kopierad";
    setTimeout(() => (knapp.textContent = "Dela recept"), 2000);
  }
});

if (valtId) {
  document.querySelector(".topp").insertAdjacentHTML(
    "afterbegin",
    `<a class="tillbaka" href="./">← Alla recept</a>`
  );
  document.getElementById("sok").hidden = true;
}

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