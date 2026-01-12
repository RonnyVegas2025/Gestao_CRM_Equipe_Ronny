import { sb } from "./supabaseClient.js";

const el = (id) => document.getElementById(id);

export function toast(msg) {
  const t = el("toast");
  if (!t) return alert(msg);
  t.textContent = msg;
  t.style.display = "block";
  clearTimeout(window.__t);
  window.__t = setTimeout(() => (t.style.display = "none"), 2600);
}

export async function requireAuth() {
  const { data, error } = await sb.auth.getSession();
  if (error) throw error;
  if (!data.session) {
    location.href = "index.html";
    return null;
  }
  return data.session.user;
}

export function isAdminRole(papel) {
  const p = String(papel || "").toLowerCase();
  return ["gestor", "adm", "adm_comercial", "admin"].includes(p);
}

function normalizePapel(papel) {
  const p = String(papel || "").toLowerCase();
  if (["vendedor", "gestor", "adm", "adm_comercial", "admin"].includes(p)) return p;
  return "vendedor";
}

/**
 * Garante perfil em public.profiles2
 * columns: id, nome, papel
 */
export async function ensureProfile() {
  const user = await requireAuth();
  if (!user) return null;

  // 1) tenta ler
  const { data: prof, error: selErr } = await sb
    .from("profiles2")
    .select("id,nome,papel")
    .eq("id", user.id)
    .maybeSingle();

  if (!selErr && prof) return { user, profile: prof };

  // 2) cria automaticamente (se policy permitir)
  const nomeAuto =
    user.user_metadata?.nome ||
    user.user_metadata?.name ||
    user.email ||
    "Usuário";

  const papelAuto = normalizePapel(user.user_metadata?.papel || user.user_metadata?.role || "vendedor");

  const { error: insErr } = await sb.from("profiles2").insert({
    id: user.id,
    nome: nomeAuto,
    papel: papelAuto,
  });

  if (insErr) {
    // se não conseguiu criar, pelo menos mostra o erro real no console
    console.error("ensureProfile insert error:", insErr);
    toast("Sem perfil no profiles2 e não consegui criar. Verifique RLS/policies.");
    throw insErr;
  }

  // 3) lê de novo
  const { data: prof2, error: selErr2 } = await sb
    .from("profiles2")
    .select("id,nome,papel")
    .eq("id", user.id)
    .single();

  if (selErr2 || !prof2) {
    console.error("ensureProfile readback error:", selErr2);
    toast("Criei o perfil, mas não consegui ler de volta (RLS).");
    throw selErr2 || new Error("profile_readback_failed");
  }

  return { user, profile: prof2 };
}

export async function getProfile() {
  return ensureProfile();
}

export async function logout() {
  await sb.auth.signOut();
  location.href = "index.html";
}
