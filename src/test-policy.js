import { createClient } from "@supabase/supabase-js";

const anon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

const test = {
  source_url: "https://example.com/policytest",
  title: "Policytest",
};

// 1. Utan inloggning
const utan = await anon.from("recipes").insert(test);
console.log("Anon skriver:", utan.error ? `nekad (${utan.error.code})` : "TILLÅTEN");

// 2. Med inloggning
await anon.auth.signInWithPassword({
  email: process.argv[2],
  password: process.argv[3],
});

const med = await anon.from("recipes").insert(test);
console.log("Inloggad skriver:", med.error ? `nekad (${med.error.message})` : "tillåten");

// Städa upp
await anon.from("recipes").delete().eq("source_url", test.source_url);
console.log("Testraden borttagen");