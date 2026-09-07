import { hamtaAllaRecept, receptTillHtml } from "./html.js";

const recept = await hamtaAllaRecept();
console.log(receptTillHtml(recept[0]));