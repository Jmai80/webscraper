import { createClient } from "@supabase/supabase-js";

const anon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

const { data, error } = await anon.auth.signInWithPassword({
  email: process.argv[2],
  password: process.argv[3],
});

if (error) {
  console.error("Inloggning misslyckades:", error.message);
} else {
  console.log("Inloggad som", data.user.email);
  console.log("Roll:", data.user.role);
}