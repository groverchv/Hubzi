import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Users, 
  BookOpen, 
  ShieldCheck, 
  Sparkles, 
  Settings, 
  Lock,
  Layers,
  HelpCircle,
  GraduationCap,
  ArrowRight,
  Play,
  Download,
  Smartphone,
  CheckCircle2,
  X,
  Share,
  Monitor
} from 'lucide-react';
import capyMascot from '../assets/mascots/capy_escolar_nino_m.webp';
import confetti from 'canvas-confetti';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { lobbyAmbient } from '../utils/lobbyAmbient';

export default function WelcomeScreen({
  onContinue,
  onOpenTutorial,
  onOpenLogin,
  onOpenLegal,
  isLoggedIn = false,
  username = ''
}) {
  const { isInstalled, triggerInstall } = usePwaInstall();
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Inicializar paisaje sonoro relajante del lobby antes de iniciar el juego
  React.useEffect(() => {
    lobbyAmbient.start();

    // Desbloqueo ante políticas de interacción del navegador
    const handleFirstGesture = () => {
      lobbyAmbient.start();
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };

    window.addEventListener('click', handleFirstGesture, { passive: true });
    window.addEventListener('keydown', handleFirstGesture, { passive: true });
    window.addEventListener('touchstart', handleFirstGesture, { passive: true });

    return () => {
      lobbyAmbient.stop(0.5);
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };
  }, []);

  const handleContinueClick = (e) => {
    lobbyAmbient.stop(0.4);
    if (onContinue) onContinue(e);
  };

  const handleInstallClick = () => {
    setIsInstallModalOpen(true);
  };

  const handleConfirmInstall = async () => {
    if (isInstalled) {
      setToastMessage('¡Hubzy ya está instalada en tu dispositivo!');
      setTimeout(() => setToastMessage(''), 3000);
      setIsInstallModalOpen(false);
      return;
    }

    setIsInstalling(true);
    const res = await triggerInstall();
    setIsInstalling(false);

    if (res.triggered) {
      if (res.outcome === 'accepted') {
        try {
          confetti({ particleCount: 90, spread: 65, origin: { y: 0.6 } });
        } catch {}
        setToastMessage('¡Hubzy instalada con éxito en tu equipo!');
        setIsInstallModalOpen(false);
      }
    } else {
      setToastMessage('Revisa la barra de direcciones de tu navegador para confirmar');
      setIsInstallModalOpen(false);
    }
    setTimeout(() => setToastMessage(''), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between select-none font-sans overflow-hidden bg-transparent">
      {/* ── BARRA SUPERIOR: AJUSTES & ACCESO ── */}
      <div className="relative w-full px-4 sm:px-8 pt-4 flex items-center justify-between z-20">

        {/* Botón Izquierdo: Iniciar Sesión / Cuenta */}
        <div className="relative">
          <button
            onClick={onOpenLogin}
            className="group relative flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-[#122443] hover:bg-[#1a335e] border-3 border-[#0a162b] border-b-5 border-b-[#050a13] text-white transition-all shadow-[0_6px_0_#FF7A00] active:translate-y-1 active:shadow-none cursor-pointer"
          >
            <div className={`w-7 h-7 rounded-xl border-2 border-[#122443] flex items-center justify-center text-[#122443] ${
              isLoggedIn ? 'bg-[#48C838] shadow-[0_2px_0_#28871E]' : 'bg-[#FFB400] shadow-[0_2px_0_#D48800]'
            }`}>
              {isLoggedIn ? <User className="w-4 h-4 stroke-[2.8]" /> : <Lock className="w-4 h-4 stroke-[2.8]" />}
            </div>
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[11px] font-black uppercase text-white tracking-wide">
                {isLoggedIn ? (username || 'MI CUENTA') : 'INICIAR SESIÓN'}
              </span>
              <span className={`text-[8.5px] font-bold ${isLoggedIn ? 'text-emerald-300' : 'text-amber-300'}`}>
                {isLoggedIn ? 'Sesión Activa' : 'Acceso Requerido'}
              </span>
            </div>
          </button>
        </div>

        {/* Botones Derechos: Instalar App & Ayuda */}
        <div className="flex items-center gap-2">
          {/* Botón Barra Superior: Instalar App */}
          <button
            onClick={handleInstallClick}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-[#122443] hover:bg-[#1a335e] border-3 border-[#0a162b] border-b-5 border-b-[#050a13] text-white active:translate-y-1 active:shadow-none transition-all cursor-pointer ${
              isInstalled ? 'shadow-[0_4px_0_#10b981]' : 'shadow-[0_4px_0_#38BDF8]'
            }`}
            title="Instalar Hubzy en tu dispositivo (PWA)"
          >
            {isInstalled ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Download className="w-4 h-4 text-[#38BDF8]" />
            )}
            <span className={`text-[11px] font-black uppercase tracking-wider hidden sm:inline ${
              isInstalled ? 'text-emerald-300' : 'text-[#38BDF8]'
            }`}>
              {isInstalled ? 'Instalada' : 'Instalar'}
            </span>
          </button>

          <button
            onClick={onOpenTutorial}
            className="p-3 rounded-2xl bg-[#122443] hover:bg-[#1a335e] border-3 border-[#0a162b] border-b-5 border-b-[#050a13] text-white shadow-[0_4px_0_#050a13] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
            title="Ayuda / Reglas"
          >
            <HelpCircle className="w-5 h-5 text-[#FFB400]" />
          </button>
        </div>
      </div>

      {/* ── SECCIÓN CENTRAL: LOGO HUBZY CARD CLASH Y BOTÓN TUTORIAL ── */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-4 z-10 -mt-6">
        
        {/* LOGO GIGANTE 3D "HUBZY CARD CLASH" */}
        <motion.div
          initial={{ scale: 0.85, y: -20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 20 }}
          className="flex flex-col items-center text-center relative"
        >
          {/* Corona / Halo Superior */}
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#122443] border-3 border-[#0a162b] shadow-[0_4px_0_#050a13] mb-2">
            <GraduationCap className="w-4 h-4 text-[#FFB400]" />
            <span className="text-[11px] font-black uppercase text-[#FFB400] tracking-widest">
              ARENA DE APRENDIZAJE ACTIVO
            </span>
          </div>

          {/* Letras 3D Grandes */}
          <div className="relative">
            {/* Texto "HUBZY" */}
            <h1 
              className="text-6xl sm:text-7xl md:text-8xl font-black uppercase tracking-wider text-[#FFB400] leading-none drop-shadow-[0_8px_0_#D48800]"
              style={{
                WebkitTextStroke: '3.5px #122443',
                textShadow: '0 8px 0 #122443, 0 16px 25px rgba(0,0,0,0.5)'
              }}
            >
              HUBZY
            </h1>
          </div>

          {/* Subtítulo Cápsula */}
          <div className="mt-3 px-6 py-2 rounded-2xl bg-[#122443] border-3 border-[#0a162b] shadow-[0_6px_0_#050a13] text-white">
            <p className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-100 font-mono">
              Convierte cualquier PDF o apunte en una batalla de estudio
            </p>
          </div>
        </motion.div>

        {/* Tarjeta Flotante Lateral Izquierda: TÉRMINOS & LEGAL */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onOpenLegal && onOpenLegal('terms')}
          className="absolute left-4 sm:left-8 lg:left-12 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center cursor-pointer group select-none z-30"
          title="Ver Términos y Condiciones, Políticas y Legal"
        >
          <div className="w-22 h-22 sm:w-24 sm:h-24 mb-2 relative flex items-center justify-center">
            <div className="w-20 h-20 rounded-3xl bg-[#38BDF8]/20 border-3 border-[#38BDF8] flex items-center justify-center shadow-lg group-hover:border-cyan-300 group-hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all">
              <ShieldCheck className="w-10 h-10 text-[#38BDF8] group-hover:text-cyan-300 drop-shadow transition-colors" />
            </div>
          </div>
          <button
            type="button"
            className="px-5 sm:px-6 py-3 rounded-2xl bg-[#122443] group-hover:bg-[#1a335e] border-3 border-[#0a162b] border-b-5 border-b-[#050a13] text-white font-black text-xs uppercase tracking-wider shadow-[0_5px_0_#38BDF8] active:translate-y-1 active:shadow-none transition-all cursor-pointer whitespace-nowrap"
          >
            TÉRMINOS & LEGAL
          </button>
        </motion.div>

        {/* Tarjeta Flotante Lateral Derecha: PLAY TUTORIAL */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={onOpenTutorial}
          className="absolute right-4 sm:right-8 lg:right-12 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center cursor-pointer group select-none z-30"
          title="Ver Tutorial de Hubzy"
        >
          <div className="w-22 h-22 sm:w-24 sm:h-24 mb-2 relative flex items-center justify-center">
            <div className="w-20 h-20 rounded-3xl bg-[#FFB400]/20 border-3 border-[#FFB400] flex items-center justify-center shadow-lg group-hover:border-amber-300 group-hover:shadow-[0_0_20px_rgba(255,180,0,0.4)] transition-all">
              <BookOpen className="w-10 h-10 text-[#FFB400] group-hover:text-amber-300 drop-shadow transition-colors" />
            </div>
          </div>
          <button
            type="button"
            className="px-5 sm:px-6 py-3 rounded-2xl bg-[#122443] group-hover:bg-[#1a335e] border-3 border-[#0a162b] border-b-5 border-b-[#050a13] text-white font-black text-xs uppercase tracking-wider shadow-[0_5px_0_#FF7A00] active:translate-y-1 active:shadow-none transition-all cursor-pointer whitespace-nowrap"
          >
            PLAY TUTORIAL
          </button>
        </motion.div>
      </div>

      {/* ── BANNER INFERIOR: BOTONES CONTINUAR Y DEMO INMEDIATO ── */}
      <div className="relative w-full z-20 pb-5 px-4 sm:px-8">
        <div className="max-w-xl mx-auto space-y-2.5">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleContinueClick}
            className={`w-full py-3.5 sm:py-4 px-6 sm:px-8 rounded-3xl flex items-center justify-between text-left cursor-pointer overflow-hidden relative shadow-[0_8px_0_#122443] transition-all ${
              isLoggedIn 
                ? 'btn-arcade-banner-orange bg-striped-diagonal' 
                : 'bg-[#1b2f52] border-3 border-[#0a162b] hover:bg-[#223b66]'
            }`}
          >
            <div className="flex items-center gap-3.5 relative z-10">
              <div className={`w-12 h-12 rounded-2xl border-3 border-[#122443] flex items-center justify-center text-white ${
                isLoggedIn ? 'bg-[#FF7A00] shadow-[0_3px_0_#D45B00]' : 'bg-[#FFB400] text-[#122443] shadow-[0_3px_0_#D48800]'
              }`}>
                {isLoggedIn ? (
                  <Play className="w-7 h-7 text-white fill-current drop-shadow ml-0.5" />
                ) : (
                  <Lock className="w-6 h-6 text-[#122443] stroke-[2.8]" />
                )}
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-wider uppercase drop-shadow flex items-center gap-2">
                  CONTINUAR
                  {!isLoggedIn && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF7A00] text-white border-2 border-[#122443] font-black uppercase">
                      Cuenta Requerida
                    </span>
                  )}
                </h3>
                <p className={`text-xs font-black drop-shadow-sm ${isLoggedIn ? 'text-orange-100' : 'text-amber-300'}`}>
                  {isLoggedIn 
                    ? 'Ir a tus carpetas y materiales de estudio' 
                    : 'Inicia sesión para gestionar tus documentos'}
                </p>
              </div>
            </div>

            <div className={`w-10 h-10 rounded-2xl border-3 border-[#0a162b] flex items-center justify-center text-white shadow-md relative z-10 ${
              isLoggedIn ? 'bg-[#122443]' : 'bg-[#0a162b]'
            }`}>
              {isLoggedIn ? (
                <ArrowRight className="w-6 h-6 stroke-[3]" />
              ) : (
                <Lock className="w-4 h-4 text-amber-400 stroke-[2.5]" />
              )}
            </div>
          </motion.button>

          {/* Accesos rápidos en móviles (Tutorial y Legal) */}
          <div className="flex md:hidden items-center justify-center gap-4 pt-1">
            <button
              onClick={() => onOpenLegal && onOpenLegal('terms')}
              className="text-xs font-bold text-slate-300 hover:text-cyan-300 flex items-center gap-1.5 py-1 px-3 rounded-xl bg-[#0a162b]/80 border border-slate-700/50 cursor-pointer active:scale-95 transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Términos & Legal</span>
            </button>
            <button
              onClick={onOpenTutorial}
              className="text-xs font-bold text-slate-300 hover:text-amber-300 flex items-center gap-1.5 py-1 px-3 rounded-xl bg-[#0a162b]/80 border border-slate-700/50 cursor-pointer active:scale-95 transition-all"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#FFB400]" />
              <span>Tutorial</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── MODAL EXCLUSIVO HUBZY PARA INSTALACIÓN ── */}
      <AnimatePresence>
        {isInstallModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a162b]/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 25 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 25 }}
              transition={{ type: "spring", damping: 25, stiffness: 320 }}
              className="relative w-full max-w-md bg-[#122443] border-4 border-[#0a162b] rounded-3xl p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-white overflow-hidden"
            >
              {/* Botón Cerrar (X) */}
              <button
                onClick={() => setIsInstallModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-2xl bg-[#0a162b] text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer border-2 border-slate-700/50"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Cabecera con Hubzi 3D y Título */}
              <div className="flex flex-col items-center text-center mb-5">
                <div className="relative mb-3">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#FFB400] to-[#FF7A00] p-1 border-3 border-[#0a162b] shadow-[0_6px_0_#D45B00] flex items-center justify-center overflow-hidden">
                    <img 
                      src={capyMascot} 
                      alt="Hubzi" 
                      className="w-full h-full object-cover scale-105" 
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-emerald-500 border-2 border-[#122443] text-white shadow-md">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#0a162b] border border-amber-400/40 text-[#FFB400] text-[10px] font-black uppercase tracking-widest mb-1.5">
                  <Sparkles className="w-3 h-3 text-[#FFB400]" />
                  APLICACIÓN OFICIAL HUBZY
                </div>

                <h3 className="text-2xl font-black text-white tracking-wide uppercase drop-shadow">
                  INSTALAR HUBZY
                </h3>
                <p className="text-xs text-sky-200/90 font-medium mt-1 max-w-xs">
                  Disfruta de la mejor experiencia de estudio en pantalla completa y sin distracciones.
                </p>
              </div>

              {/* Tarjetas de Beneficios */}
              <div className="space-y-2 mb-6 text-xs">
                <div className="p-3 rounded-2xl bg-[#0a162b]/90 border border-slate-700/60 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#38BDF8]/20 border border-[#38BDF8] flex items-center justify-center text-[#38BDF8] shrink-0">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-white">Pantalla Completa Arcade</p>
                    <p className="text-[11px] text-slate-300">Sin barras ni pestañas que te distraigan</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#0a162b]/90 border border-slate-700/60 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#FFB400]/20 border border-[#FFB400] flex items-center justify-center text-[#FFB400] shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-white">Acceso Inmediato</p>
                    <p className="text-[11px] text-slate-300">Ícono directo en tu escritorio o celular</p>
                  </div>
                </div>
              </div>

              {/* Botón de Acción Principal */}
              <div className="space-y-2.5">
                <button
                  onClick={handleConfirmInstall}
                  disabled={isInstalling}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#FF7A00] hover:bg-[#ff8a1a] text-white font-black text-sm uppercase tracking-wider shadow-[0_6px_0_#B34E00] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2.5 cursor-pointer border-2 border-[#122443] disabled:opacity-80"
                >
                  <Download className="w-5 h-5 text-white" />
                  <span>
                    {isInstalled 
                      ? 'ABRIR APLICACIÓN' 
                      : isInstalling 
                        ? 'CONFIRMANDO...' 
                        : 'INSTALAR APLICACIÓN'}
                  </span>
                </button>

                <button
                  onClick={() => setIsInstallModalOpen(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-transparent hover:bg-white/5 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── TOAST NOTIFICACIÓN NO INTRUSIVA ── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-2xl bg-[#122443] border-3 border-[#38BDF8] shadow-[0_8px_25px_rgba(0,0,0,0.5)] text-white text-xs font-black uppercase tracking-wider flex items-center gap-3"
          >
            <Sparkles className="w-5 h-5 text-[#FFB400] shrink-0 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
