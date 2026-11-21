/** Sesión del panel admin — mismo patrón que los otros frontends. */
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
          /* conservar sesión persistida */
        }
      },
      get isSuperadmin() {
        return get().user?.role === "superadmin";
      },
    }),
    {
      name: "hubzy-admin-auth",
      partialize: (s) => ({ user: s.user }),
    },
  ),
);
