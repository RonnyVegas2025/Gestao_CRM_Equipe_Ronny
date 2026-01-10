import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// ⚠️ TROQUE PELOS DADOS DO SEU PROJETO SUPABASE
const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
const SUPABASE_ANON_KEY = "SUA_PUBLIC_ANON_KEY_AQUI";

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

