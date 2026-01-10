import { sb } from "./supabaseClient.js";

const el = (id) => document.getElementById(id);

export function toast(msg) {
  const t = el("toast");
  if (!t) return alert(msg);
  t.textContent = msg;
  t.style.display = "block";
  clearTimeout(window.__toastT);
  window.__toastT = setTimeout(() => (t.style.display = "none"), 3200);
}

// Tradução simples de erros comuns do Supabase
export function humanError(err) {
  if (!err) return "Erro desconhecido.";

  const m = (err.message || "").toLowerCase();

  if (m.includes("invalid login credentials")) return "E-mail ou senha inválidos.";
  if (m.includes("email not confirmed")) return "Seu e-mail ainda não foi confirmado.";
  if (m.includes("same_password") || m.includes("different from the old password"))
    return "A nova senha não pode ser igual à senha anterior.";
  if (m.includes("password should be at least")) return "A senha é muito curta (mínimo de 6 caracteres).";
  if (m.includes("rate limit")) return "Muitas tentativas. Aguarde um pouco e tente novamente.";
  if (m.includes("failed to fetch")) return "Não consegui conectar no servidor. Verifique internet/URL do Supabase.";

  // fallback
  return err.message || "Erro inesperado.";
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
 * Garante que existe um perfil do usuário em profiles2.
 * Se não existir, cria automaticamente (papel padrão = vendedor).
 */
export async function ensureProfile() {
  const user = await requireAuth();
  if (!user) return null;

  const { data: prof, error } = await sb
    .from("profiles2")
    .select("id,nome,papel")
    .eq("id", user.id)
    .maybeSingle();

  if (!error && prof) return { user, prof };

  const nomeAuto =
    user.user_metadata?.nome ||
    user.user_metadata?.name ||
    user.email ||
    "Usuário";

  const papelAuto = String(user.user_metadata?.papel || user.user_metadata?.role || "vendedor").toLowerCase();
  const papelFinal = ["vendedor", "gestor", "adm"].includes(papelAuto) ? papelAuto : "vendedor";

  const { error: insErr } = await sb.from("profiles2").insert({
    id: user.id,
    nome: nomeAuto,
    papel: papelFinal,
  });

  if (insErr) {
    console.error("ensureProfile insert error:", insErr);
    toast("Não consegui criar seu perfil automaticamente. Verifique RLS/policies da profiles2.");
    throw insErr;
  }

  const { data: prof2, error: selErr2 } = await sb
    .from("profiles2")
    .select("id,nome,papel")
    .eq("id", user.id)
    .single();

  if (selErr2 || !prof2) {
    toast("Criei seu perfil, mas não consegui ler de volta. Verifique RLS.");
    throw selErr2 || new Error("profile_readback_failed");
  }

  return { user, prof: prof2 };
}

export async function logout() {
  await sb.auth.signOut();
  location.href = "index.html";
}
