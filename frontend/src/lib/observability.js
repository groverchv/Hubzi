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
      });
    })
    .catch(() => {});
}

export function trackEvent(name, props = {}) {
  try {
    posthogInstance?.capture(name, props);
  } catch { /* noop */ }
}

export function identifyUser(user) {
  try {
    if (posthogInstance && user?.id) {
      posthogInstance.identify(user.id, {
        username: user.username,
        plan: user.plan || "free",
      });
    }
  } catch { /* noop */ }
}

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
