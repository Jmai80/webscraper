import { createClient } from "@supabase/supabase-js";

const anon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

await anon.auth.signInWithPassword({
  email: process.argv[2],
  password: process.argv[3],
});

const { data, error } = await anon.functions.invoke("scrape", {
  body: { url: process.argv[4] },
});

if (error) {
  console.error("Fel:", error.message);
  console.error(await error.context?.json?.());
} else {
  console.log("Sparade:", data.title, "(id", data.id + ")");
}