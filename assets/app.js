import { sb } from "./supabaseClient.js";

const el = (id) => document.getElementById(id);

export const BRL = (v) =>
  (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function toast(msg) {
  const t = el("toast");
  if (!t) {
    alert(msg);
    return;
  }
  t.textContent = msg;
  t.style.display = "block";
  clearTimeout(window.__t);
  window.__t = setTimeout(() => (t.style.display = "none"), 2800);
}

export async function requireAuth() {
  const { data } = await sb.auth.getSession();
  if (!data.session) {
    location.href = "index.html";
    return null;
  }
  return data.session.user;
}

function normalizeRole(papel) {
  const r = (papel || "").toLowerCase();
  if (["adm", "admin"].includes(r)) return "adm";
  if (["gestor", "manager"].includes(r)) return "gestor";
  return "vendedor";
}

/**
 * Carrega o perfil em profiles2.
 * Se não existir, cria automaticamente com:
 * - id = user.id
 * - nome = metadata.nome | metadata.name | email
 * - papel = vendedor (padrão)
 *
 * Retorna { user, profile: { id, nome, role } }
 */
export async function getProfile() {
  const user = await requireAuth();
  if (!user) return null;

  // 1) tenta ler
  const { data: prof, error } = await sb
    .from("profiles2")
    .select("id,nome,papel")
    .eq("id", user.id)
    .maybeSingle();

  if (!error && prof) {
    return {
      user,
      profile: {
        id: prof.id,
        nome: prof.nome || user.email || "Usuário",
        role: normalizeRole(prof.papel),
      },
    };
  }

  // 2) cria se não existe
  const nomeAuto =
    user.user_metadata?.nome ||
    user.user_metadata?.name ||
    user.email ||
    "Usuário";

  const papelAuto = normalizeRole(user.user_metadata?.role || "vendedor");

  const { error: insErr } = await sb.from("profiles2").insert({
    id: user.id,
    nome: nomeAuto,
    papel: papelAuto,
  });

  if (insErr) {
    console.error("ERRO criando profiles2:", insErr);
    toast(
      "Não consegui criar seu perfil automaticamente. Verifique as políticas (RLS) da tabela profiles2."
    );
    throw insErr;
  }

  // 3) lê de novo
  const { data: prof2, error: selErr2 } = await sb
    .from("profiles2")
    .select("id,nome,papel")
    .eq("id", user.id)
    .single();

  if (selErr2 || !prof2) {
    console.error("ERRO lendo profiles2:", selErr2);
    toast("Criei seu perfil, mas não consegui carregar. Verifique RLS.");
    throw selErr2 || new Error("profile_readback_failed");
  }

  return {
    user,
    profile: {
      id: prof2.id,
      nome: prof2.nome || user.email || "Usuário",
      role: normalizeRole(prof2.papel),
    },
  };
}

export async function logout() {
  await sb.auth.signOut();
  location.href = "index.html";
}

export function isAdminRole(role) {
  return role === "adm" || role === "gestor";
}

export function q(name) {
  return new URL(location.href).searchParams.get(name);
}
