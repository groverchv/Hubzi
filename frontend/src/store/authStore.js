/**
 * Store global de autenticación (Zustand).
 * El JWT vive en una cookie HttpOnly — JS nunca lo lee ni lo persiste.
 * Solo se guarda el perfil del usuario (no-sensible) para arranque rápido;
 * /auth/me con la cookie es la fuente de verdad al montar la app.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiFetch, fetchWithAuth } from "../lib/api";

function clearUserLocalData() {
  // Datos del usuario fuera de la cuenta: carpetas cacheadas, progreso de
  // campaña, colas y TODAS las claves legadas de sesión (incluido el viejo
  // 'hubzy_auth_token' en localStorage — queda inservible pero se purga).
  // Las claves de preferencia (volúmenes, muted) se conservan.
  const USER_DATA_PREFIXES = [
    "hubzy_current_user",
    "hubzy_auth_token",
    "hubzy_user_study_folders",
    "hubzy_campaign_progress_",
    "hubzy_arena_session",
    "hubzy_hint_",
  ];
  for (const k of Object.keys(localStorage)) {
    if (USER_DATA_PREFIXES.some((p) => k === p || k.startsWith(p))) {
      localStorage.removeItem(k);
    }
  }
}

// Purga de migración: versiones anteriores guardaban el JWT legible en
// localStorage bajo 'hubzy_auth_token'. Se elimina siempre al cargar.
try {
  localStorage.removeItem("hubzy_auth_token");
} catch {
  /* modo privado estricto */
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,

      setSession: ({ user }) => {
        set({ user });
      },

      setUser: (user) => {
        set({ user });
      },

      logout: () => {
        clearUserLocalData();
        set({ user: null });
        // Revocación server-side (token_version++ + cookie borrada). Si el
        // backend está caído la sesión local ya está cerrada igualmente.
        apiFetch("/api/v1/auth/logout", { method: "POST" }).catch(() => {});
      },

      // La cookie HttpOnly es la fuente de verdad: siempre se sondea
      // /auth/me al arrancar (además renueva el token si le queda <50%).
      refreshUser: async () => {
        try {
          const res = await fetchWithAuth("/api/v1/auth/me");
          if (res.status === 401) {
            if (get().user) get().logout();
            return;
          }
          if (res.ok) {
            const user = await res.json();
            if (user?.id) get().setUser(user);
          }
        } catch {
          // sin conexión: conservar la sesión local persistida
        }
      },

      get isPro() {
        return get().user?.plan === "pro";
      },
      get isAuthenticated() {
        return Boolean(get().user);
      },
    }),
    {
      name: "hubzy-auth",
      partialize: (s) => ({ user: s.user }),
    }
  )
);
