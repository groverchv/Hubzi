import React, { useState } from 'react';
import { Smartphone, RotateCw, Share } from 'lucide-react';
import { lockLandscape } from '../utils/orientation';

/**
 * Overlay "gira tu teléfono" — iOS Safari ignora tanto el manifest como
 * screen.orientation.lock, así que en móviles en vertical mostramos este
 * bloqueo amable hasta que el usuario rote el dispositivo.
 * La visibilidad la controla CSS (.rotate-overlay en index.css).
 *
 * - Android: botón que entra en fullscreen + lock('landscape') — el
 *   sistema voltea la pantalla solo, sin que el usuario gire el teléfono.
 * - iOS: el lock no existe en Safari → se guía a instalar la PWA
 *   (el manifest sí fija landscape en modo standalone).
 */

const isAppleDevice = (() => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return true;
  // iPadOS 13+ se reporta como Mac pero tiene pantalla táctil
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
})();

export default function RotatePhoneOverlay() {
  const [busy, setBusy] = useState(false);

  const handleActivate = async () => {
    setBusy(true);
    await lockLandscape();
    setBusy(false);
  };

  return (
    <div className="rotate-overlay" role="alert" aria-live="assertive">
      <div className="rotate-overlay-card">
        <div className="rotate-overlay-icon">
          <Smartphone className="w-12 h-12" strokeWidth={1.8} />
        </div>
        <p className="rotate-overlay-title">Gira tu teléfono</p>
        {isAppleDevice ? (
          <p className="rotate-overlay-sub">
            Hubzy se juega mejor en horizontal.
            <br />
            <span className="rotate-overlay-ios">
              <Share className="w-4 h-4" /> Compartir → «Añadir a pantalla de inicio»
              y se abrirá en horizontal automáticamente
            </span>
          </p>
        ) : (
          <>
            <p className="rotate-overlay-sub">
              Hubzy se juega mejor en horizontal
            </p>
            <button
              type="button"
              className="rotate-overlay-btn"
              onClick={handleActivate}
              disabled={busy}
            >
              <RotateCw className="w-5 h-5" />
              {busy ? 'Activando…' : 'Poner en horizontal'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
