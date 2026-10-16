/**
 * Store global de autenticación (Zustand + persistencia en localStorage).
 * Mantiene compatibilidad con las claves legadas 'hubzy_current_user' / 'hubzy_auth_token'.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

const LEGACY_USER_KEY = "hubzy_current_user";
const LEGACY_TOKEN_KEY = "hubzy_auth_token";

function loadLegacySession() {
  try {
    const user = JSON.parse(localStorage.getItem(LEGACY_USER_KEY) || "null");
    const token = localStorage.getItem(LEGACY_TOKEN_KEY);
    return { user, token };
  } catch {
    return { user: null, token: null };
  }
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: loadLegacySession().user,
      token: loadLegacySession().token,

      setSession: ({ user, token }) => {
        if (user) localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(user));
        if (token) localStorage.setItem(LEGACY_TOKEN_KEY, token);
        set({ user, token });
      },

      setUser: (user) => {
        if (user) localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(user));
        set({ user });
      },

      logout: () => {
        localStorage.removeItem(LEGACY_USER_KEY);
        localStorage.removeItem(LEGACY_TOKEN_KEY);
        set({ user: null, token: null });
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
      partialize: (s) => ({ user: s.user, token: s.token }),
    }
  )
);
