import { writeFile } from "node:fs/promises";

const URL_ATT_HAMTA = "https://baraenkakatill.se/chimichurri/";
const UTFIL = "data/raw/chimichurri.html";

async function hamtaSida(url) {
  const svar = await fetch(url, {
    headers: {
      "User-Agent": "Laroprojekt-scraper (kontakt: dranejimmy@gmail.com)",
    },
  });

  if (!svar.ok) {
    throw new Error(`Servern svarade ${svar.status} ${svar.statusText}`);
  }

  return await svar.text();
}

const html = await hamtaSida(URL_ATT_HAMTA);
await writeFile(UTFIL, html, "utf-8");
console.log(`Sparade ${html.length} tecken till ${UTFIL}`);