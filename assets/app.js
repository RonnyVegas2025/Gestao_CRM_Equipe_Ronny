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
  window.__t = setTimeout(() => {
    t.style.display = "none";
  }, 3000);
}

export async function requireAuth() {
  const { data } = await sb.auth.getSession();
  if (!data.session) {
    location.href = "index.html";
    return null;
  }
  return data.session.user;
}

/**
 * Busca perfil do usuário logado
 * Espera tabela: profiles (id, nome, role)
 */
export async function getProfile() {
  const user = await requireAuth();
  if (!user) return null;

  const { data, error } = await sb
    .from("profiles")
    .select("id,nome,role")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error(error);
    toast("Perfil não encontrado. Verifique tabela profiles.");
    throw error;
  }

  return { user, profile: data };
}

export async function logout() {
  await sb.auth.signOut();
  location.href = "index.html";
}

