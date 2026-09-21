import { mkdir, writeFile } from "node:fs/promises";

const SUPABASE_URL = "https://jisleyrtpojsfjtlbplp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ts0hUrMnRc00kDfzeAZXsg_SZBQeETG";
const APP_URL = "https://jmai80.github.io/webscraper/";
const MAPP = "docs/r";

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const svar = await fetch(
  `${SUPABASE_URL}/rest/v1/recipes?select=id,title,description,image_url`,
  { headers: { apikey: SUPABASE_ANON_KEY } }
);
if (!svar.ok) throw new Error(`Supabase svarade ${svar.status}`);
const recept = await svar.json();

await mkdir(MAPP, { recursive: true });

for (const r of recept) {
  const appLank = `${APP_URL}?recept=${r.id}`;
  const html = `<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8">
<title>${esc(r.title)}</title>
<meta property="og:title" content="${esc(r.title)}">
<meta property="og:description" content="${esc(r.description)}">
${r.image_url ? `<meta property="og:image" content="${esc(r.image_url)}">` : ""}
<meta property="og:type" content="article">
<script>location.replace(${JSON.stringify(appLank)});</script>
</head>
<body>
<p><a href="${esc(appLank)}">${esc(r.title)}</a></p>
</body>
</html>`;
  await writeFile(`${MAPP}/${r.id}.html`, html);
}

console.log(`Skrev ${recept.length} delningssidor till ${MAPP}/`);