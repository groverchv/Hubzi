/**
 * Observabilidad frontend: Sentry (errores) + PostHog (producto) + PWA.
 * Todo se activa solo si las env vars existen — nunca rompe el arranque.
 */

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;
  import("@sentry/react")
    .then((Sentry) => {
      Sentry.init({
        dsn,
        environment: import.meta.env.MODE,
        tracesSampleRate: 0.1,
      });
    })
    .catch(() => {});
}

let posthogInstance = null;

export function initAnalytics() {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key) return;
  import("posthog-js")
    .then((mod) => {
      posthogInstance = mod.default;
      posthogInstance.init(key, {
        api_host: import.meta.env.VITE_POSTHOG_HOST || "https://app.posthog.com",
        autocapture: true,
        capture_pageview: true,
        // Minimización GDPR: la IP no se almacena en los eventos y session
        // replay (si se activa) enmascara texto e inputs — nunca sale PII
        // tecleada por menores a analytics de terceros.
        ip: false,
        mask_all_element_attributes: true,
        mask_all_text: true,
        mask_text_selector: "*",
        // Sin esto $current_url lleva el query string completo a PostHog:
        // ?token= de reset/verify-email y ?session_id= de Stripe acababan
        // en analytics de terceros (tokens canjeables fuera de casa).
        before_send: (event) => {
          try {
            const props = event?.properties;
            for (const k of ["$current_url", "$initial_current_url", "$referrer", "$initial_referrer"]) {
              const u = props?.[k];
              if (typeof u === "string" && u.includes("?")) {
                props[k] = u.split("?")[0];
              }
            }
          } catch { /* noop */ }
          return event;
        },
      });
    })
    .catch(() => {});
}

export function trackEvent(name, props = {}) {
  try {
    posthogInstance?.capture(name, props);
  } catch { /* noop */ }
}

const MINOR_BANDS = new Set(["sprout", "explorer", "adventurer", "challenger"]);

function _anonId(rawId) {
  let h = 0;
  for (let i = 0; i < rawId.length; i++) {
    h = (Math.imul(31, h) + rawId.charCodeAt(i)) | 0;
  }
  return `anon_${(h >>> 0).toString(36)}`;
}

export function identifyUser(user) {
  try {
    if (posthogInstance && user?.id) {
      // Minimización para menores: identificador anonimizado, sin username
      const isMinor = MINOR_BANDS.has(user?.age_band);
      if (isMinor) {
        posthogInstance.identify(_anonId(String(user.id)), {
          plan: user.plan || "free",
          age_band: user.age_band,
        });
      } else {
        posthogInstance.identify(user.id, {
          username: user.username,
          plan: user.plan || "free",
        });
      }
    }
  } catch { /* noop */ }
}

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  // En localhost limpiar caches antiguos para que los cambios se reflejen de inmediato
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    if ("caches" in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => {
          if (key !== "hubzy-v5") caches.delete(key);
        });
      });
    }
  }

  const register = () => {
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      reg.update?.().catch(() => {});
    }).catch(() => {});
  };

  if (document.readyState === "complete" || document.readyState === "interactive") {
    register();
  } else {
    window.addEventListener("load", register);
  }
}
