/**
 * Sesión del panel escolar — JWT en cookie HttpOnly (JS nunca lo lee).
 * Solo persiste el perfil no-sensible para arranque rápido; /auth/me
 * es la fuente de verdad.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiFetch } from "../lib/api";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => {
        set({ user: null });
        apiFetch("/api/v1/auth/logout", { method: "POST" }).catch(() => {});
      },
      refreshUser: async () => {
        try {
          const res = await apiFetch("/api/v1/auth/me", { raw: true });
          if (res.status === 401) {
            if (get().user) get().logout();
            return;
          }
          if (res.ok) {
            const user = await res.json();
            if (user?.id) get().setUser(user);
          }
        } catch {
          /* sin conexión: conservar sesión persistida */
        }
      },
      get isAdmin() {
        return ["admin", "superadmin"].includes(get().user?.role);
      },
      get isStaff() {
        return ["admin", "teacher", "superadmin"].includes(get().user?.role);
      },
    }),
    {
      name: "hubzy-school-auth",
      partialize: (s) => ({ user: s.user }),
    },
  ),
);
