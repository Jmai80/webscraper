import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.1";

const SUPABASE_URL = "https://jisleyrtpojsfjtlbplp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ts0hUrMnRc00kDfzeAZXsg_SZBQeETG";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Bilder vars adress börjar så här ligger i din egen bucket.
const BUCKET = `${SUPABASE_URL}/storage/v1/object/public/bilder/`;

const lista = document.getElementById("atgarda-lista");
const status = document.getElementById("atgarda-status");

function esc(text) {
  const d = document.createElement("div");
  d.textContent = String(text ?? "");
  return d.innerHTML;
}

// Det som saknas i ett recept, som korta texter. Tom lista = inget att åtgärda.
function brister(r) {
  const b = [];
  if (!r.image_url) b.push("saknar bild");
  else if (!r.image_url.startsWith(BUCKET)) b.push("bild utanför bucketen");
  if (!r.prep_minutes && !r.cook_minutes) b.push("saknar tider");
  if (!r.servings) b.push("saknar portioner");
  return b;
}

function radTillHtml(r, b) {
  const bild = r.image_url
    ? `<img src="${esc(r.image_url)}" alt="" loading="lazy">`
    : `<span class="traff-tom"></span>`;

  return `
<a class="traff" href="nytt.html?recept=${r.id}&fran=atgarda">
  ${bild}
  <span>
    <span class="traff-titel">${esc(r.title)}</span>
    <span class="brister">${b.join(" · ")}</span>
  </span>
</a>`;
}

const { data, error } = await supabase
  .from("recipes")
  .select("id, title, image_url, prep_minutes, cook_minutes, servings")
  .order("title");

if (error) {
  status.textContent = `Fel: ${error.message}`;
} else {
  const attGora = data
    .map((r) => ({ r, b: brister(r) }))
    .filter(({ b }) => b.length > 0);

  status.textContent = attGora.length === 0
    ? "Inget att åtgärda, alla recept är kompletta."
    : `${attGora.length} av ${data.length} recept behöver åtgärdas.`;

  lista.innerHTML = attGora.map(({ r, b }) => radTillHtml(r, b)).join("");
}