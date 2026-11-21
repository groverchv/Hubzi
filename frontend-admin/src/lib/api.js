/** Cliente API — igual que en los otros frontends (cookie HttpOnly + CSRF header). */
import { useAuthStore } from "../store/authStore";

export class ApiError extends Error {
  constructor(status, message, payload = null) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

const CSRF_HEADER = { "X-Requested-With": "XMLHttpRequest" };

function handleUnauthorized(res) {
  if (res.status === 401 && useAuthStore.getState().user) {
    useAuthStore.getState().logout?.();
  }
}

export async function apiFetch(path, { method = "GET", body, headers = {}, raw = false } = {}) {
  const finalHeaders = { ...CSRF_HEADER, ...headers };
  const isFormData = body instanceof FormData;
  if (body && !isFormData && !finalHeaders["Content-Type"]) {
    finalHeaders["Content-Type"] = "application/json";
  }
  const res = await fetch(path, {
    method,
    headers: finalHeaders,
    credentials: "include",
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });
  if (raw) return res;
  handleUnauthorized(res);
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : null;
  if (!res.ok) {
    const message =
      (data && (data.detail || data.message)) || `Error del servidor (${res.status})`;
    throw new ApiError(res.status, message, data);
  }
  return data;
}
