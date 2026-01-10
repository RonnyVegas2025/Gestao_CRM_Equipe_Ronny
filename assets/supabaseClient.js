import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// ⚠️ TROQUE PELOS DADOS DO SEU PROJETO SUPABASE
const SUPABASE_URL = "https://ksyofflresajlpgitqhh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....";

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

