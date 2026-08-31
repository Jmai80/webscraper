import { readFile } from "node:fs/promises";
import { extraheraRecept } from "./parse.js";

const html = await readFile("data/raw/chimichurri.html", "utf-8");
const recept = extraheraRecept(html, "https://baraenkakatill.se/chimichurri/");
console.log(JSON.stringify(recept, null, 2));