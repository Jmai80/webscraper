import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://jisleyrtpojsfjtlbplp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ts0hUrMnRc00kDfzeAZXsg_SZBQeETG";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const lista = document.getElementById("lista");
const status = document.getElementById("status");

async function hamtaRecept() {
  const { data, error } = await supabase
    .from("recipes")
    .select("id, title, image_url, ingredients, tags")
    .order("scraped_at", { ascending: false });

  if (error) {
    status.textContent = `Fel: ${error.message}`;
    return [];
  }
  return data;
}

async function hamtaEttRecept(id) {
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    status.textContent = `Fel: ${error.message}`;
    return null;
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

  const nyckelord = r.tags.length > 0
    ? `<ul class="nyckelord">${r.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`
    : "";

  return `
<article class="recept">
  ${r.image_url ? `<img src="${esc(r.image_url)}" alt="" loading="lazy">` : ""}
  <div class="innehall">
    <h2><a class="titel-lank" href="?recept=${r.id}">${esc(r.title)}</a></h2>
    <p class="ingress">${esc(r.description)}</p>
    <div class="meta">${tider}</div>
    ${nyckelord}
    <h3>Ingredienser</h3>
    <ul class="ingredienser">${ingredienser}</ul>
    <h3>Gör så här</h3>
    <ol class="steg">${steg}</ol>
    <button class="dela" data-id="${r.id}" data-titel="${esc(r.title)}">Dela recept</button>
    <a class="kalla" href="${esc(r.source_url)}">Källa: ${esc(r.author ?? "okänd")}</a>
  </div>
</article>`;
}

function traffTillHtml(r) {
  const sokText = [r.title, ...r.ingredients, ...r.tags]
    .join(" ")
    .toLowerCase();

  const bild = r.image_url
    ? `<img src="${esc(r.image_url)}" alt="" loading="lazy">`
    : `<span class="traff-tom"></span>`;

  return `
<a class="traff" href="?recept=${r.id}" data-sok="${esc(sokText)}">
  ${bild}
  <span class="traff-titel">${esc(r.title)}</span>
</a>`;
}

const params = new URLSearchParams(location.search);
const valtId = params.get("recept");

let alla = [];
let recept = [];

if (valtId) {
  const ett = await hamtaEttRecept(valtId);
  if (ett) recept = [ett];
} else {
  alla = await hamtaRecept();
  recept = alla;
}

lista.innerHTML = valtId
  ? recept.map(receptTillHtml).join("")
  : alla.map(traffTillHtml).join("");

const grid = document.getElementById("grid");
grid.innerHTML = alla
  .filter((r) => r.image_url)
  .map(
    (r) => `<a href="?recept=${r.id}"><img src="${esc(r.image_url)}" alt="${esc(r.title)}" loading="lazy"></a>`
  )
  .join("");

lista.addEventListener("click", async (e) => {
  const knapp = e.target.closest(".dela");
  if (!knapp) return;

  const url = new URL(`r/${knapp.dataset.id}.html`, location.href).href;
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
  document.body.classList.add("soker", "receptvy");
  document.querySelector(".topp").insertAdjacentHTML(
    "afterbegin",
    `<a class="tillbaka" href="./">← Alla recept</a>`
  );
  document.getElementById("sok").hidden = true;
}

const falt = document.getElementById("sok");
const kort = [...document.querySelectorAll(".traff")];

if (!valtId) {
  for (const el of kort) el.hidden = true;
}

falt.addEventListener("input", () => {
  const ord = falt.value.toLowerCase().split(/\s+/).filter(Boolean);
  let synliga = 0;

  for (const el of kort) {
    const traff = ord.length > 0 && ord.every((o) => el.dataset.sok.includes(o));
    el.hidden = !traff;
    if (traff) synliga++;
  }

  status.textContent = ord.length === 0 ? "" : `${synliga} av ${kort.length} recept`;
});

falt.addEventListener("focus", () => {
  document.body.classList.add("soker");
  window.scrollTo({ top: 0 });
});

falt.addEventListener("blur", () => {
  if (falt.value.trim() === "") document.body.classList.remove("soker");
});

status.textContent = "";

const admin = document.getElementById("admin");

function visaInloggning() {
  admin.innerHTML = `
    <button id="visa-login" class="admin-knapp">Logga in</button>
    <form id="login" hidden>
      <input type="email" id="epost" placeholder="E-post" autocomplete="username">
      <input type="password" id="losen" placeholder="Lösenord" autocomplete="current-password">
      <button type="submit">Logga in</button>
      <p id="login-fel"></p>
    </form>`;

  document.getElementById("visa-login").onclick = (e) => {
    e.target.hidden = true;
    document.getElementById("login").hidden = false;
  };

  document.getElementById("login").onsubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email: document.getElementById("epost").value,
      password: document.getElementById("losen").value,
    });
    if (error) document.getElementById("login-fel").textContent = error.message;
    else location.reload();
  };
}

function visaSparaFormular() {
  admin.innerHTML = `
    <form id="spara">
      <input type="url" id="ny-url" placeholder="Klistra in en receptlänk…" required>
      <button type="submit">Spara</button>
    </form>
    <p id="spara-status"></p>
        <div class="admin-rad">
      <a href="nytt.html" class="admin-knapp">Nytt recept</a>
      <button id="logga-ut" class="admin-knapp">Logga ut</button>
    </div>`;

  const status2 = document.getElementById("spara-status");

  document.getElementById("spara").onsubmit = async (e) => {
    e.preventDefault();
    const falt = document.getElementById("ny-url");
    const knapp = e.target.querySelector("button");

    knapp.disabled = true;
    status2.textContent = "Hämtar receptet…";

    const { data, error } = await supabase.functions.invoke("scrape", {
      body: { url: falt.value },
    });

    knapp.disabled = false;

    if (error) {
      const detalj = await error.context?.json?.().catch(() => null);
      status2.textContent = `Misslyckades: ${detalj?.error ?? error.message}`;
      return;
    }

    status2.textContent = `Sparade "${data.title}"`;
    falt.value = "";
    setTimeout(() => location.reload(), 1200);
  };

  document.getElementById("logga-ut").onclick = async () => {
    await supabase.auth.signOut();
    location.reload();
  };
}

const { data: { session } } = await supabase.auth.getSession();
if (session) visaSparaFormular();
else visaInloggning();