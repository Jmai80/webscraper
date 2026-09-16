import { createClient } from "@supabase/supabase-js";

const anon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

const { data, error } = await anon.from("recipes").select("title");

if (error) console.error("Fel:", error.message);
else console.log(`Anon-nyckeln ser ${data.length} recept.`);