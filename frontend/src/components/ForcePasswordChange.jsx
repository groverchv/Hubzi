import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { apiFetch } from '../lib/api';

/**
 * Cambio de contraseña OBLIGATORIO para cuentas escolares con contraseña
 * temporal (must_change_password). No se puede cerrar: el backend bloquea
 * el resto de la API (403) hasta completar este paso.
 */
export default function ForcePasswordChange() {
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    if (password.length < 8) {
      setErrorMsg('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }
    setIsLoading(true);
    try {
      const data = await apiFetch('/api/v1/auth/change-password', {
        method: 'POST',
        body: { current_password: current, new_password: password },
      });
      if (data?.user) useAuthStore.getState().setSession({ user: data.user });
    } catch (err) {
      setErrorMsg(err?.message || 'No se pudo actualizar la contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="max-w-sm w-full p-8 rounded-arcade-lg bg-[var(--color-arcade-navy)] border-4 border-[var(--color-arcade-navy-dark)] shadow-modal-lg text-white font-sans">
        <h1 className="text-xl font-black uppercase tracking-wide mb-1">Crea tu contraseña</h1>
        <p className="text-xs text-slate-400 mb-5">
          Tu escuela te asignó una contraseña temporal. Por seguridad, elige una nueva antes de continuar.
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-arcade-sm bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              Contraseña temporal
            </label>
            <input
              type="password"
              required
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-arcade-sm bg-slate-900/90 border border-slate-700 focus:border-amber-400 focus:outline-none text-white text-xs"
              placeholder="La que te dio tu docente"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 pr-10 rounded-arcade-sm bg-slate-900/90 border border-slate-700 focus:border-amber-400 focus:outline-none text-white text-xs"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              Confirmar contraseña
            </label>
            <input
              type={show ? 'text' : 'password'}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-arcade-sm bg-slate-900/90 border border-slate-700 focus:border-amber-400 focus:outline-none text-white text-xs"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-arcade bg-[var(--color-arcade-orange)] hover:bg-[var(--color-arcade-orange-bright)] border-b-arcade border-[var(--color-arcade-orange-shadow)] text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            {isLoading ? 'Guardando…' : 'Guardar y continuar'}
          </button>
        </form>
      </div>
    </div>
  );
}
