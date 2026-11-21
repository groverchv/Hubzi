/**
 * Contexto institucional: /institutions/mine cacheado — la institución del
 * usuario, sus grados y su rol. Se recarga tras mutaciones relevantes.
 */
import { create } from "zustand";
import { apiFetch } from "../lib/api";

export const useSchoolStore = create((set, get) => ({
  institution: null,
  grades: [],
  role: null,
  myCredential: null,
  loaded: false,

  refresh: async () => {
    const data = await apiFetch("/api/v1/institutions/mine");
    set({
      institution: data.institution,
      grades: data.grades || [],
      // superadmin vinculado se comporta como admin dentro de la escuela
      role: data.role === "superadmin" ? "admin" : data.role,
      myCredential: data.my_school_credential || null,
      loaded: true,
    });
    return data;
  },

  reset: () => set({ institution: null, grades: [], role: null, myCredential: null, loaded: false }),
  get hasInstitution() {
    return Boolean(get().institution);
  },
}));
