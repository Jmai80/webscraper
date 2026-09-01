import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  throw new Error(
    "SUPABASE_URL och SUPABASE_SECRET_KEY måste finnas i .env"
  );
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});