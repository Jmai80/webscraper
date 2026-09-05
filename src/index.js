import { readFile } from "node:fs/promises";
import { extraheraRecept } from "./parse.js";
import { sparaRecept } from "./save.js";

const KALL_URL = "https://baraenkakatill.se/chimichurri/";

const html = await readFile("data/raw/chimichurri.html", "utf-8");
const recept = extraheraRecept(html, KALL_URL);
const sparat = await sparaRecept(recept);

console.log(`Sparade "${sparat.title}" med id ${sparat.id}`);