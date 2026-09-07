import { writeFile } from "node:fs/promises";
import { hamtaAllaRecept, byggSida } from "./html.js";

const recept = await hamtaAllaRecept();
await writeFile("recept.html", byggSida(recept), "utf-8");
console.log(`Byggde recept.html med ${recept.length} recept`);