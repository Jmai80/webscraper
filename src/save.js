import { supabase } from "./db.js";

export async function sparaRecept(recept) {
  const { data, error } = await supabase
    .from("recipes")
    .upsert(recept, { onConflict: "source_url" })
    .select()
    .single();

  if (error) throw new Error(`Kunde inte spara: ${error.message}`);
  return data;
}