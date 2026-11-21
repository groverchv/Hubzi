/**
 * Cliente API — mismo contrato que la app de juego:
 * JWT en cookie HttpOnly + credentials:"include" + header anti-CSRF.
 * El proxy de vite (/api → :8000) mantiene todo same-origin.
 */
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

/** Sube un archivo con progreso real (XHR — fetch no reporta upload progress). */
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
