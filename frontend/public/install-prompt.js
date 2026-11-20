// Captura inmediata de beforeinstallprompt para evitar perder el evento antes de React
// (externalizado desde index.html para que la CSP pueda usar script-src 'self').
window.deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredInstallPrompt = e;
  window.dispatchEvent(new CustomEvent('pwa-install-ready'));
});
window.addEventListener('appinstalled', () => {
  window.deferredInstallPrompt = null;
  window.dispatchEvent(new CustomEvent('pwa-installed'));
});
