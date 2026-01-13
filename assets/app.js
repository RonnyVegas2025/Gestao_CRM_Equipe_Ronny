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
  window.__t = setTimeout(() => (t.style.display = "none"), 2600);
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
 * Lê o perfil do usuário em profiles2.
 * OBS: no seu banco tem coluna "e-mail" com hífen.
 * Pra evitar 400, NÃO vamos selecionar e-mail aqui.
 */
export async function getProfile() {
  const user = await requireAuth();
  if (!user) return null;

  const { data: profile, error } = await sb
    .from("profiles2")
    .select("id,nome,papel")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    toast("Perfil não encontrado em profiles2. Confere se existe id=user.id.");
    throw error || new Error("profile_not_found");
  }

  return { user, profile };
}

// compat: se algum arquivo chamar ensureProfile, funciona igual
export const ensureProfile = getProfile;

/** ADM/Gestor? (baseado no profiles2.papel) */
export function isAdminPapel(papel) {
  const p = String(papel || "").toLowerCase();
  return p === "adm" || p === "gestor" || p === "adm_comercial";
}

export async function logout() {
  await sb.auth.signOut();
  location.href = "index.html";
}

export function periodStart(kind) {
  const d = new Date();
  if (kind === "all") return new Date("2000-01-01T00:00:00");
  if (kind === "mtd") return new Date(d.getFullYear(), d.getMonth(), 1);
  const days = Number(kind);
  const s = new Date();
  s.setDate(s.getDate() - days);
  return s;
}

export function bindChipGroup(groupId, onChange) {
  const root = el(groupId);
  if (!root) return;

  root.querySelectorAll(".chip").forEach((btn) =>
    btn.addEventListener("click", () => {
      root.querySelectorAll(".chip").forEach((b) =>
        b.setAttribute("aria-pressed", "false")
      );
      btn.setAttribute("aria-pressed", "true");
      root.dataset.value = btn.dataset.value || btn.textContent.trim();
      onChange?.(root.dataset.value);
    })
  );
}
