import { supabase } from "./db.js";

const { data, error } = await supabase
  .from("recipes")
  .select("*");

if (error) {
  console.error("Fel:", error.message);
} else {
  console.log(`Kopplingen fungerar. ${data.length} rader i tabellen.`);
}