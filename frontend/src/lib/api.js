/**
 * Cliente API centralizado de Hubzy.
 * - Auth por cookie HttpOnly: el JWT nunca es legible por JS (vector XSS→token eliminado).
 * - credentials: "include" en todos los fetch; X-Requested-With como defensa CSRF.
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

/** Header custom que el backend exige en requests mutadores autenticados por cookie. */
const CSRF_HEADER = { "X-Requested-With": "XMLHttpRequest" };

/** Sesión expirada/revocada: limpiar estado local. */
function handleUnauthorized(res) {
  if (res.status === 401 && useAuthStore.getState().user) {
    useAuthStore.getState().logout?.();
  }
}

/**
 * Asegura la identidad de invitado: el backend emite un JWT HttpOnly opaco
 * (guest_<id>) en la cookie — cada navegador queda aislado del resto y sus
 * carpetas migran a la cuenta al registrarse. Idempotente (no rota).
 */
export async function ensureGuestSession() {
  try {
    await fetch("/api/v1/auth/guest", {
      method: "POST",
      credentials: "include",
      headers: CSRF_HEADER,
    });
  } catch {
    /* identidad de invitado no pudo emitirse — las carpetas fallarán limpio */
  }
}

/**
 * Drop-in replacement de fetch() con cookies + header anti-CSRF.
 * Usar en componentes existentes: fetchWithAuth('/api/v1/...', {method, body})
 */
export async function fetchWithAuth(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("X-Requested-With", "XMLHttpRequest");

  const res = await fetch(path, { ...options, headers, credentials: "include" });
  handleUnauthorized(res);
  return res;
}

/**
 * Sube un archivo con progreso real (XMLHttpRequest reporta upload progress;
 * fetch no lo soporta). Devuelve el JSON parseado; respeta AbortSignal.
 */
export function uploadWithProgress(path, formData, { onProgress, signal } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", path);
    xhr.withCredentials = true;
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

    if (signal) {
      if (signal.aborted) return reject(new DOMException("Aborted", "AbortError"));
      signal.addEventListener("abort", () => {
        xhr.abort();
        reject(new DOMException("Aborted", "AbortError"));
      });
    }

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 401) handleUnauthorized({ status: 401 });
      let data = null;
      try {
        data = JSON.parse(xhr.responseText || "null");
      } catch (_) {
        /* respuesta no JSON */
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data);
      } else {
        reject(
          new ApiError(
            xhr.status,
            (data && (data.detail || data.message)) || `Error del servidor (${xhr.status})`,
            data,
          ),
        );
      }
    };
    xhr.onerror = () => reject(new ApiError(0, "Error de red al subir el archivo."));
    xhr.send(formData);
  });
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
  const data = contentType.includes("application/json") ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message =
      (data && (data.detail || data.message)) ||
      `Error del servidor (${res.status})`;
    throw new ApiError(res.status, message, data);
  }

  return data;
}
