/**
 * Bloqueo de orientación horizontal.
 *
 * - PWA instalada: el manifest ("orientation": "landscape") ya lo hace nativo.
 * - Navegador Android: screen.orientation.lock() funciona tras gesto del
 *   usuario (y en algunos casos requiere fullscreen — se intenta de rebote).
 * - iOS Safari: ignora todo lo anterior → lo cubre RotatePhoneOverlay.
 */
export async function lockLandscape() {
  try {
    if (document.documentElement.requestFullscreen &&
        !document.fullscreenElement &&
        // Fullscreen solo en pantallas táctiles pequeñas; en desktop no molesta
        window.matchMedia?.('(pointer: coarse)').matches) {
      await document.documentElement.requestFullscreen();
    }
  } catch (_) {}
  try {
    if (screen.orientation?.lock) {
      await screen.orientation.lock('landscape');
    }
  } catch (_) {}
}

export async function unlockOrientation() {
  try {
    screen.orientation?.unlock?.();
  } catch (_) {}
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
  } catch (_) {}
}
