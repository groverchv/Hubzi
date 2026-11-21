import React, { useEffect, useState } from "react";
import { ShieldCheck, Smartphone, Trash2, MonitorSmartphone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { fetchWithAuth } from "../lib/api";

/**
 * Ajustes de seguridad de la cuenta:
 *  - Sesiones activas (listar + revocar dispositivos por jti)
 *  - MFA TOTP (enrolar con otpauth_uri/QR, verificar, backup codes, desactivar)
 */
export default function SecuritySettings({ user }) {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState(null);
  const [mfa, setMfa] = useState({ step: null, uri: null, secret: null, code: "", backup: null, error: null, busy: false });
  const [disablePw, setDisablePw] = useState("");
  const [aiConsent, setAiConsent] = useState(!!user?.ai_training_consent);

  const loadSessions = async () => {
    try {
      const res = await fetchWithAuth("/api/v1/auth/sessions");
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch {
      setSessions([]);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const revoke = async (jti) => {
    await fetchWithAuth(`/api/v1/auth/sessions/${jti}`, { method: "DELETE" }).catch(() => {});
    loadSessions();
  };

  const mfaSetup = async () => {
    setMfa((m) => ({ ...m, busy: true, error: null }));
    try {
      const res = await fetchWithAuth("/api/v1/auth/mfa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setMfa((m) => ({ ...m, step: "scan", uri: data.otpauth_uri, secret: data.secret, busy: false }));
    } catch (e) {
      setMfa((m) => ({ ...m, error: e.message || "Error", busy: false }));
    }
  };

  const mfaEnable = async () => {
    setMfa((m) => ({ ...m, busy: true, error: null }));
    try {
      const res = await fetchWithAuth("/api/v1/auth/mfa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: mfa.code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setMfa((m) => ({ ...m, step: "backup", backup: data.backup_codes, busy: false }));
    } catch (e) {
      setMfa((m) => ({ ...m, error: e.message || t("auth.err_mfa_code", "Código incorrecto."), busy: false }));
    }
  };

  const mfaDisable = async () => {
    try {
      const res = await fetchWithAuth("/api/v1/auth/mfa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: disablePw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setMfa({ step: null, uri: null, secret: null, code: "", backup: null, error: null, busy: false });
      setDisablePw("");
    } catch (e) {
      setMfa((m) => ({ ...m, error: e.message || "Error" }));
    }
  };

  const toggleAiConsent = async (value) => {
    setAiConsent(value);
    try {
      await fetchWithAuth("/api/v1/users/me/ai-consent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: value }),
      });
    } catch {
      setAiConsent(!value);
    }
  };

  const mfaEnabled = user?.mfa_enabled;

  return (
    <section className="mt-14 rounded-arcade-lg border-2 border-slate-200 bg-white/80 p-6">
      <h2 className="text-sm font-black uppercase tracking-wide text-[var(--color-arcade-navy)] flex items-center gap-2">
        <ShieldCheck className="w-4 h-4" />
        {t("dashboard.security", "Seguridad")}
      </h2>

      {/* MFA */}
      <div className="mt-4 border-t border-slate-100 pt-4">
        <h3 className="text-xs font-black uppercase text-slate-600 flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5" />
          {t("dashboard.mfa_title", "Verificación en dos pasos (MFA)")}
        </h3>
        {mfaEnabled ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-emerald-600">
              {t("dashboard.mfa_on", "Activada")}
            </span>
            <input
              type="password"
              value={disablePw}
              onChange={(e) => setDisablePw(e.target.value)}
              placeholder={t("dashboard.mfa_pw_ph", "Contraseña para desactivar")}
              className="rounded-arcade bg-white border-2 border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
            />
            <button
              onClick={mfaDisable}
              className="text-xs font-black uppercase text-rose-600 hover:text-rose-500"
            >
              {t("dashboard.mfa_disable", "Desactivar")}
            </button>
          </div>
        ) : !mfa.step ? (
          <button
            onClick={mfaSetup}
            disabled={mfa.busy}
            className="mt-2 rounded-arcade bg-slate-700 hover:bg-slate-600 px-4 py-2 text-xs font-black uppercase text-white border-b-arcade border-slate-900 transition-all"
          >
            {t("dashboard.mfa_enable", "Activar MFA")}
          </button>
        ) : mfa.step === "scan" ? (
          <div className="mt-2 space-y-2">
            <p className="text-xs font-semibold text-slate-600">
              {t(
                "dashboard.mfa_scan",
                "Escanea con tu app de autenticación (Google Authenticator, Authy…) o copia el secreto, luego ingresa el código de 6 dígitos:",
              )}
            </p>
            <code className="block break-all rounded bg-slate-100 p-2 text-[11px] text-slate-700">{mfa.secret}</code>
            <details className="text-[11px] text-slate-500">
              <summary className="cursor-pointer font-bold">otpauth:// URI</summary>
              <code className="break-all">{mfa.uri}</code>
            </details>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={mfa.code}
                onChange={(e) => setMfa((m) => ({ ...m, code: e.target.value }))}
                placeholder="000000"
                className="w-32 rounded-arcade bg-white border-2 border-slate-300 px-3 py-1.5 text-center text-sm font-bold tracking-[0.3em] text-slate-700"
              />
              <button
                onClick={mfaEnable}
                disabled={mfa.busy || mfa.code.length < 6}
                className="rounded-arcade bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-black uppercase text-white border-b-arcade border-emerald-800 disabled:opacity-50 transition-all"
              >
                {t("dashboard.mfa_verify", "Verificar")}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            <p className="text-xs font-bold text-amber-700">
              {t(
                "dashboard.mfa_backup_warn",
                "MFA activada. Guarda estos códigos de respaldo — se muestran UNA sola vez:",
              )}
            </p>
            <div className="grid grid-cols-2 gap-1">
              {(mfa.backup || []).map((c) => (
                <code key={c} className="rounded bg-slate-100 px-2 py-1 text-center text-[11px] font-mono text-slate-800">
                  {c}
                </code>
              ))}
            </div>
            <button
              onClick={() => setMfa((m) => ({ ...m, step: null }))}
              className="text-xs font-black uppercase text-slate-600 hover:text-slate-800"
            >
              {t("dashboard.mfa_done", "Listo")}
            </button>
          </div>
        )}
        {mfa.error && <p className="mt-2 text-xs font-bold text-rose-600">{mfa.error}</p>}
      </div>

      {/* Consentimiento de dataset IA */}
      <div className="mt-4 border-t border-slate-100 pt-4">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={aiConsent}
            onChange={(e) => toggleAiConsent(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-emerald-600"
          />
          <span className="text-xs font-semibold text-slate-600 leading-snug">
            {t(
              "dashboard.ai_consent",
              "Permitir que mis materiales mejoren la IA de Hubzi (opcional — si lo desactivas, tus aportes previos se eliminan del dataset).",
            )}
          </span>
        </label>
      </div>

      {/* Sesiones activas */}
      <div className="mt-4 border-t border-slate-100 pt-4">
        <h3 className="text-xs font-black uppercase text-slate-600 flex items-center gap-1.5">
          <MonitorSmartphone className="w-3.5 h-3.5" />
          {t("dashboard.sessions", "Dispositivos conectados")}
        </h3>
        {!sessions ? (
          <p className="mt-2 text-xs text-slate-400">{t("loading", "Cargando…")}</p>
        ) : sessions.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">{t("dashboard.no_sessions", "Sin sesiones registradas.")}</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {sessions.map((s) => (
              <li
                key={s.jti}
                className="flex items-center justify-between rounded-arcade-sm bg-slate-50 px-3 py-2 text-xs"
              >
                <div className="min-w-0">
                  <span className="font-bold text-slate-700">
                    {s.current ? t("dashboard.session_current", "Este dispositivo") : (s.user_agent || "").slice(0, 40)}
                  </span>
                  <span className="ml-2 text-slate-400">
                    {s.ip || "?"} · {(s.last_seen || "").slice(0, 16).replace("T", " ")}
                  </span>
                </div>
                {!s.current && (
                  <button
                    onClick={() => revoke(s.jti)}
                    className="ml-3 shrink-0 text-rose-500 hover:text-rose-400"
                    title={t("dashboard.session_revoke", "Cerrar esta sesión")}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
