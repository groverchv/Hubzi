import React from 'react';
import { Smartphone } from 'lucide-react';

/**
 * Overlay "gira tu teléfono" — iOS Safari ignora tanto el manifest como
 * screen.orientation.lock, así que en móviles en vertical mostramos este
 * bloqueo amable hasta que el usuario rote el dispositivo.
 * La visibilidad la controla CSS (.rotate-overlay en index.css).
 */
export default function RotatePhoneOverlay() {
  return (
    <div className="rotate-overlay" role="alert" aria-live="assertive">
      <div className="rotate-overlay-card">
        <div className="rotate-overlay-icon">
          <Smartphone className="w-12 h-12" strokeWidth={1.8} />
        </div>
        <p className="rotate-overlay-title">Gira tu teléfono</p>
        <p className="rotate-overlay-sub">
          Hubzy se juega mejor en horizontal
        </p>
      </div>
    </div>
  );
}
