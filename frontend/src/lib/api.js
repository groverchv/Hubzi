/**
 * Cliente API centralizado de Hubzy.
 * - Inyecta automáticamente el JWT (Authorization: Bearer) en cada request.
 * - Normaliza errores del backend (detail → Error.message).
 * - Soporta FormData (uploads) sin forzar Content-Type.
 */
import { useAuthStore } from "../store/authStore";

export class ApiError extends Error {
  constructor(status, message, payload = null) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

function getToken() {
  return (
    useAuthStore.getState().token ||
    localStorage.getItem("hubzy_auth_token") ||
    null
  );
}

/**
 * Drop-in replacement de fetch() que inyecta el JWT.
 * Usar en componentes existentes: fetchWithAuth('/api/v1/...', {method, body})
 */
export async function fetchWithAuth(path, options = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(path, { ...options, headers });
  if (res.status === 401 && token) {
    localStorage.removeItem("hubzy_auth_token");
    useAuthStore.getState().logout?.();
  }
  return res;
}

export async function apiFetch(path, { method = "GET", body, headers = {}, raw = false } = {}) {
  const token = getToken();

  const finalHeaders = { ...headers };
  if (token) finalHeaders["Authorization"] = `Bearer ${token}`;

  const isFormData = body instanceof FormData;
  if (body && !isFormData && !finalHeaders["Content-Type"]) {
    finalHeaders["Content-Type"] = "application/json";
  }

  const res = await fetch(path, {
    method,
    headers: finalHeaders,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  if (raw) return res;

  if (res.status === 401) {
    // Token expirado/invalido: limpiar sesión local
    if (useAuthStore.getState().token) {
      useAuthStore.getState().logout();
    }
  }

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message =
      (data && (data.detail || data.message)) ||
      `Error del servidor (${res.status})`;
    throw new ApiError(res.status, message, data);
  }

  return data;
}
