import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Accessibility, Type, Contrast } from 'lucide-react';

/**
 * Controles de accesibilidad: alto contraste y texto grande.
 * Persisten en localStorage (`hubzy_a11y`) y se aplican como clases en
 * <html> — las reglas viven en index.css (a11y-contrast / a11y-large-text).
 */
const KEY = 'hubzy_a11y';

function readPrefs() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') || {};
  } catch {
    return {};
  }
}

function applyPrefs(p) {
  const el = document.documentElement;
  el.classList.toggle('a11y-contrast', Boolean(p.contrast));
  el.classList.toggle('a11y-large-text', Boolean(p.largeText));
}

// Aplica las preferencias guardadas lo antes posible al montar el módulo.
applyPrefs(readPrefs());

export default function A11yControls() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState(readPrefs);
  const wrapRef = useRef(null);

  useEffect(() => {
    applyPrefs(prefs);
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch {}
  }, [prefs]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const active = Boolean(prefs.contrast || prefs.largeText);

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`p-3 rounded-2xl bg-[var(--color-arcade-navy)] hover:bg-[var(--color-arcade-navy-hover)] border-3 border-[var(--color-arcade-navy-dark)] border-b-5 border-b-[var(--color-arcade-ink)] text-white shadow-[0_4px_0_var(--color-arcade-ink)] active:translate-y-1 active:shadow-none transition-all cursor-pointer ${
          active ? 'ring-2 ring-[var(--color-arcade-cyan)]' : ''
        }`}
        title="Accesibilidad: alto contraste y texto grande"
        aria-label="Opciones de accesibilidad"
        aria-expanded={open}
      >
        <Accessibility className="w-5 h-5 text-[var(--color-arcade-cyan)]" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 z-[70] w-56 p-3 rounded-2xl bg-[var(--color-arcade-navy)] border-2 border-[var(--color-arcade-navy-light)] shadow-[0_10px_30px_rgba(0,0,0,0.6)] flex flex-col gap-2"
            role="menu"
            aria-label="Opciones de accesibilidad"
          >
            {[
              {
                key: 'contrast',
                icon: Contrast,
                label: 'Alto contraste',
                desc: 'Colores más definidos',
              },
              {
                key: 'largeText',
                icon: Type,
                label: 'Texto grande',
                desc: 'Letras un 18% más grandes',
              },
            ].map(({ key, icon: Icon, label, desc }) => {
              const on = Boolean(prefs[key]);
              return (
                <button
                  key={key}
                  onClick={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))}
                  role="menuitemcheckbox"
                  aria-checked={on}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    on
                      ? 'bg-[var(--color-arcade-navy-hover)] border-[var(--color-arcade-cyan)]'
                      : 'bg-[var(--color-arcade-navy-dark)]/60 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${on ? 'text-[var(--color-arcade-cyan)]' : 'text-slate-400'}`}
                  />
                  <span className="flex-1 leading-tight">
                    <span className="block text-[11px] font-black uppercase tracking-wide text-white">
                      {label}
                    </span>
                    <span className="block text-[9px] text-slate-400">{desc}</span>
                  </span>
                  <span
                    className={`w-8 h-4.5 h-[18px] rounded-full border flex items-center px-0.5 transition-colors ${
                      on ? 'bg-emerald-500/80 border-emerald-300 justify-end' : 'bg-slate-700 border-slate-600 justify-start'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-white shadow" />
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
