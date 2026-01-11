import { sb } from "./supabaseClient.js";

const el = (id) => document.getElementById(id);

export function toast(msg) {
  const t = el("toast");
  if (!t) {
    alert(msg);
    return;
  }
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

export function isAdminPapel(papel) {
  const p = String(papel || "").toLowerCase();
  return ["gestor", "adm", "adm_comercial"].includes(p);
}

/**
 * Busca o perfil do usuário em public.profiles2.
 * Se não existir, tenta criar com papel = 'vendedor' (ou metadata.role/papel).
 */
export async function getProfile() {
  const user = await requireAuth();
  if (!user) return null;

  // 1) tenta ler
  let { data: prof, error } = await sb
    .from("profiles2")
    .select("id,nome,papel")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (prof) return { user, profile: prof };

  // 2) não achou -> tenta criar automático
  const nomeAuto =
    user.user_metadata?.nome ||
    user.user_metadata?.name ||
    user.email ||
    "Usuário";

  const papelMeta =
    user.user_metadata?.papel ||
    user.user_metadata?.role ||
    "vendedor";

  const papelAuto = String(papelMeta).toLowerCase();
  const papelFinal = ["vendedor", "gestor", "adm", "adm_comercial"].includes(papelAuto)
    ? papelAuto
    : "vendedor";

  const { error: insErr } = await sb.from("profiles2").insert({
    id: user.id,
    nome: nomeAuto,
    papel: papelFinal
  });

  if (insErr) {
    // aqui normalmente é RLS/policy do profiles2
    console.error("INSERT PROFILE ERROR:", insErr);
    toast("Não consegui criar seu perfil (profiles2). Verifique RLS/policies.");
    throw insErr;
  }

  // 3) lê de novo
  const { data: prof2, error: selErr2 } = await sb
    .from("profiles2")
    .select("id,nome,papel")
    .eq("id", user.id)
    .single();

  if (selErr2) throw selErr2;
  return { user, profile: prof2 };
}

export async function logout() {
  await sb.auth.signOut();
  location.href = "index.html";
}
