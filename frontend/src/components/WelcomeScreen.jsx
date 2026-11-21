import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
  ArrowLeft,
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
import { useTranslation } from 'react-i18next';
import { lobbyAmbient } from '../utils/lobbyAmbient';
import { isLowPower } from '../utils/lowPower';
import { lockLandscape } from '../utils/orientation';
import A11yControls from './A11yControls';

const TRIAL_DAYS = 7;

export default function WelcomeScreen({
  onContinue,
  onOpenTutorial,
  onOpenLogin,
  onOpenLegal,
  isLoggedIn = false,
  username = '',
  user = null
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isInstalled, triggerInstall } = usePwaInstall();
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Cuenta regresiva de la prueba gratis (solo plan free; pro/school = ilimitado)
  const isPremium = user?.plan === 'pro' || user?.plan === 'school';
  const trialEndsAt = (() => {
    if (!isLoggedIn || !user || isPremium || !user.created_at) return null;
    const created = new Date(user.created_at).getTime();
    return Number.isFinite(created) ? created + TRIAL_DAYS * 86400000 : null;
  })();

  // Plan PRO: fin del ciclo de 30 días (desde pro_since)
  const PRO_CYCLE_DAYS = 30;
  const proEndsAt = (() => {
    if (!isLoggedIn || !user || user.plan !== 'pro' || !user.pro_since) return null;
    const since = new Date(user.pro_since).getTime();
    return Number.isFinite(since) ? since + PRO_CYCLE_DAYS * 86400000 : null;
  })();

  const [now, setNow] = useState(Date.now());
  React.useEffect(() => {
    if (!trialEndsAt && !proEndsAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [trialEndsAt, proEndsAt]);

  const trialRemainingMs = trialEndsAt ? trialEndsAt - now : null;
  const proRemainingMs = proEndsAt ? Math.max(0, proEndsAt - now) : null;
  const trialDaysLeft =
    trialRemainingMs !== null
      ? Math.max(0, Math.ceil(trialRemainingMs / 86400000))
      : isLoggedIn && user && !isPremium && typeof user.trial_days_left === 'number'
        ? user.trial_days_left
        : null;

  // "6d 23:59:41" — días + horas:minutos:segundos
  const formatTrialCountdown = (ms) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${d}d ${pad(h)}:${pad(m)}:${pad(sec)}`;
  };

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

    // La música del lobby NO se detiene al desmontar: sigue sonando en
    // carpetas y mapa hasta entrar al tablero (orquestada en ArcadeArena).
    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };
  }, []);

  const handleContinueClick = (e) => {
    lockLandscape();
    if (onContinue) onContinue(e);
  };

  const handleInstallClick = () => {
    setIsInstallModalOpen(true);
  };

  const handleConfirmInstall = async () => {
    if (isInstalled) {
      setToastMessage(t('welcome.already_inst'));
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
          if (!isLowPower()) confetti({ particleCount: 90, spread: 65, origin: { y: 0.6 } });
        } catch {}
        setToastMessage(t('welcome.inst_ok'));
        setIsInstallModalOpen(false);
      }
    } else {
      setToastMessage(t('welcome.inst_check'));
      setIsInstallModalOpen(false);
    }
    setTimeout(() => setToastMessage(''), 3500);
  };

  return (
    <div className="welcome-stage fixed inset-0 z-50 flex flex-col justify-between select-none font-sans overflow-y-auto overflow-x-hidden bg-gradient-to-b from-[#D8F0F2] via-[#EAF7F8] to-[#FAF6EE] text-[#1E2F3A]">
      {/* ── PAISAJE GHIBLI ILUSTRADO DE FONDO (Colinas y nubes suaves) ── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex flex-col justify-between">
        <div className="relative w-full h-32">
          <div className="absolute top-4 left-[10%] w-32 h-10 bg-white/70 rounded-full blur-[1px]" />
          <div className="absolute top-2 left-[12%] w-16 h-16 bg-white/70 rounded-full blur-[1px]" />
          <div className="absolute top-8 right-[15%] w-48 h-12 bg-white/70 rounded-full blur-[1px]" />
        </div>
        <div className="relative w-full h-44 sm:h-56 mt-auto opacity-70">
          <svg
            className="absolute bottom-0 inset-x-0 w-full h-32 sm:h-44 text-[#A3D9A5]/35"
            viewBox="0 0 1440 220"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            <path d="M0,120 C320,50 640,160 1000,90 C1200,50 1360,110 1440,130 L1440,220 L0,220 Z" />
          </svg>
          <svg
            className="absolute bottom-0 inset-x-0 w-full h-24 sm:h-36 text-[#78B38A]/40"
            viewBox="0 0 1440 180"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            <path d="M0,90 C220,130 480,40 760,100 C1040,160 1280,70 1440,100 L1440,180 L0,180 Z" />
          </svg>
        </div>
      </div>

      {/* ── BARRA SUPERIOR: AJUSTES & ACCESO ── */}
      <div className="relative w-full px-4 sm:px-8 pt-4 flex items-center justify-between z-20">
        {/* Botón Izquierdo: Volver al inicio + Iniciar Sesión / Cuenta */}
        <div className="relative flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="btn-tactile-cream p-2.5 rounded-2xl text-[#1E2F3A] shadow-sm cursor-pointer"
            title={t('welcome.back_home')}
          >
            <ArrowLeft className="w-5 h-5 text-[#526673]" />
          </button>
          <button
            onClick={onOpenLogin}
            className="btn-tactile-cream flex items-center gap-2.5 px-4 py-2 rounded-2xl text-[#1E2F3A] shadow-sm cursor-pointer"
          >
            <div className={`w-6 h-6 rounded-xl flex items-center justify-center text-white ${
              isLoggedIn ? 'bg-[var(--cozy-sage)]' : 'bg-[var(--cozy-amber)]'
            }`}>
              {isLoggedIn ? <User className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            </div>
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[11px] font-['Fredoka'] font-bold text-[#1E2F3A]">
                {isLoggedIn ? (username || t('welcome.my_account')) : t('welcome.login')}
              </span>
              <span className={`text-[9px] font-medium ${isLoggedIn ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isLoggedIn ? t('welcome.session_on') : t('welcome.login_needed')}
              </span>
            </div>
          </button>
        </div>

        {/* Chip central: días de prueba gratis / insignia PRO */}
        {isLoggedIn && (
          <div className="absolute left-1/2 -translate-x-1/2 hidden sm:flex items-center">
            {isPremium ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-[10px] font-['Fredoka'] font-bold uppercase tracking-wider text-emerald-800 shadow-sm">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                {user?.plan === 'school'
                  ? t('welcome.school_plan')
                  : proRemainingMs !== null
                    ? t('welcome.pro_days', { time: formatTrialCountdown(proRemainingMs) })
                    : 'Plan Pro'}
              </span>
            ) : trialRemainingMs !== null ? (
              <span
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-[10px] font-['Fredoka'] font-bold uppercase tracking-wider ${
                  trialRemainingMs <= 0
                    ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-sm'
                    : 'bg-[#FAF6EE] border-[#E6DEC8] text-[#1E2F3A] shadow-sm'
                }`}
                title={t('welcome.trial_t')}
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                {trialRemainingMs <= 0
                  ? t('welcome.trial_done')
                  : t('welcome.trial_left', { time: formatTrialCountdown(trialRemainingMs) })}
              </span>
            ) : trialDaysLeft !== null ? (
              <span
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border bg-[#FAF6EE] border-[#E6DEC8] text-[10px] font-['Fredoka'] font-bold uppercase tracking-wider text-[#1E2F3A] shadow-sm"
                title={t('welcome.trial_t2')}
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                {trialDaysLeft === 0
                  ? t('welcome.trial_done')
                  : t('welcome.trial_days', { count: trialDaysLeft })}
              </span>
            ) : null}
          </div>
        )}

        {/* Botones Derechos: Instalar App, Ayuda y Accesibilidad */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="btn-tactile-cream flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-['Fredoka'] font-bold text-[#1E2F3A] shadow-sm cursor-pointer"
            title={t('welcome.install_t')}
          >
            {isInstalled ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <Download className="w-4 h-4 text-[#526673]" />
            )}
            <span className="hidden sm:inline">
              {isInstalled ? t('welcome.installed') : t('welcome.install')}
            </span>
          </button>

          <button
            onClick={onOpenTutorial}
            className="btn-tactile-cream p-2.5 rounded-2xl text-[#1E2F3A] shadow-sm cursor-pointer"
            title={t('welcome.help_t')}
          >
            <HelpCircle className="w-4 h-4 text-[#526673]" />
          </button>
          <A11yControls />
        </div>
      </div>

      {/* ── SECCIÓN CENTRAL: TARJETA ELEVADA "SANTUARIO CAPIBARA" ── */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-4 z-10 py-6">
        <motion.div
          initial={{ scale: 0.92, y: 15, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          className="w-full max-w-lg bg-[#FAF6EE]/94 backdrop-blur-md rounded-3xl border-2 border-[#E6DEC8] shadow-[0_16px_40px_rgba(30,47,58,0.08)] p-6 sm:p-8 flex flex-col items-center text-center relative"
        >
          {/* Badge superior */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#EDE9FE] border border-[#DDD6FE] text-[#6D58D6] text-xs font-['Fredoka'] font-bold mb-3 shadow-sm">
            <GraduationCap className="w-3.5 h-3.5 text-[#6D58D6]" />
            <span>✨ Estudia jugando, respira aprendiendo</span>
          </div>

          {/* Avatar de Hubzi */}
          <div className="relative my-2">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-b from-[#FAF6EE] to-[#E6DEC8] p-1.5 border-2 border-[#E6DEC8] shadow-inner flex items-center justify-center overflow-hidden">
              <img
                src={capyMascot}
                alt="Hubzi Mascota"
                className="w-full h-full object-contain drop-shadow"
              />
            </div>
          </div>

          {/* Título Principal */}
          <h1 className="text-4xl sm:text-5xl font-['Fredoka'] font-black uppercase tracking-wide text-[#1E2F3A] leading-tight mt-1">
            HUBZI
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[#526673] mt-1 mb-6 max-w-sm">
            {t('welcome.tagline')}
          </p>

          {/* BOTÓN CTA PRINCIPAL ÁMBAR (Sin rayas de advertencia, 3D táctil suave) */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleContinueClick}
            className="w-full py-3.5 sm:py-4 px-6 rounded-2xl btn-tactile-amber flex items-center justify-between text-left shadow-[0_8px_20px_rgba(245,138,41,0.25)] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white">
                {isLoggedIn ? (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-['Fredoka'] font-black text-white tracking-wide uppercase leading-none">
                  {t('welcome.continue')}
                </h3>
                <p className="text-[11px] font-medium text-amber-100 mt-0.5">
                  {isLoggedIn ? t('welcome.cont_in') : t('welcome.cont_out')}
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-white" />
          </motion.button>

          {/* Accesos Rápidos: Tutorial y Términos */}
          <div className="flex items-center justify-center gap-3 mt-4 w-full pt-1">
            <button
              type="button"
              onClick={onOpenTutorial}
              className="btn-tactile-cream flex-1 py-2 px-3 rounded-2xl text-xs font-['Fredoka'] font-bold text-[#1E2F3A] flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-[var(--cozy-sage)]" />
              <span>Tutorial</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenLegal && onOpenLegal('terms')}
              className="btn-tactile-cream flex-1 py-2 px-3 rounded-2xl text-xs font-['Fredoka'] font-bold text-[#1E2F3A] flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#526673]" />
              <span>{t('welcome.legal_m')}</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* ── MODAL EXCLUSIVO HUBZY PARA INSTALACIÓN ── */}
      <AnimatePresence>
        {isInstallModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-arcade-navy-dark)]/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 25 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 25 }}
              transition={{ type: "spring", damping: 25, stiffness: 320 }}
              className="relative w-full max-w-md bg-[var(--color-arcade-navy)] border-4 border-[var(--color-arcade-navy-dark)] rounded-arcade-lg p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-white overflow-hidden"
            >
              {/* Botón Cerrar (X) */}
              <button
                onClick={() => setIsInstallModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-arcade bg-[var(--color-arcade-navy-dark)] text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer border-2 border-slate-700/50"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Cabecera con Hubzi 3D y Título */}
              <div className="flex flex-col items-center text-center mb-5">
                <div className="relative mb-3">
                  <div className="w-24 h-24 rounded-arcade-lg bg-gradient-to-br from-[var(--color-arcade-yellow)] to-[var(--color-arcade-orange)] p-1 border-3 border-[var(--color-arcade-navy-dark)] shadow-[0_6px_0_var(--color-arcade-orange-shadow)] flex items-center justify-center overflow-hidden">
                    <img 
                      src={capyMascot} 
                      alt="Hubzi" 
                      className="w-full h-full object-cover scale-105" 
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 p-1.5 rounded-arcade-sm bg-emerald-500 border-2 border-[var(--color-arcade-navy)] text-white shadow-md">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[var(--color-arcade-navy-dark)] border border-amber-400/40 text-[var(--color-arcade-yellow)] text-[10px] font-black uppercase tracking-widest mb-1.5">
                  <Sparkles className="w-3 h-3 text-[var(--color-arcade-yellow)]" />
                  {t('welcome.install_badge')}
                </div>

                <h3 className="text-2xl font-black text-white tracking-wide uppercase drop-shadow">
                  {t('welcome.install_title')}
                </h3>
                <p className="text-xs text-sky-200/90 font-medium mt-1 max-w-xs">
                  {t('welcome.install_sub')}
                </p>
              </div>

              {/* Tarjetas de Beneficios */}
              <div className="space-y-2 mb-6 text-xs">
                <div className="p-3 rounded-arcade bg-[var(--color-arcade-navy-dark)]/90 border border-slate-700/60 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-arcade-sm bg-[var(--color-sky-400)]/20 border border-[var(--color-sky-400)] flex items-center justify-center text-[var(--color-sky-400)] shrink-0">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-white">{t('welcome.b1_t')}</p>
                    <p className="text-[11px] text-slate-300">{t('welcome.b1_d')}</p>
                  </div>
                </div>

                <div className="p-3 rounded-arcade bg-[var(--color-arcade-navy-dark)]/90 border border-slate-700/60 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-arcade-sm bg-[var(--color-arcade-yellow)]/20 border border-[var(--color-arcade-yellow)] flex items-center justify-center text-[var(--color-arcade-yellow)] shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-white">{t('welcome.b2_t')}</p>
                    <p className="text-[11px] text-slate-300">{t('welcome.b2_d')}</p>
                  </div>
                </div>
              </div>

              {/* Botón de Acción Principal */}
              <div className="space-y-2.5">
                <button
                  onClick={handleConfirmInstall}
                  disabled={isInstalling}
                  className="w-full py-3.5 px-6 rounded-arcade bg-[var(--color-arcade-orange)] hover:bg-[#ff8a1a] text-white font-black text-sm uppercase tracking-wider shadow-[0_6px_0_#B34E00] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2.5 cursor-pointer border-2 border-[var(--color-arcade-navy)] disabled:opacity-80"
                >
                  <Download className="w-5 h-5 text-white" />
                  <span>
                    {isInstalled 
                      ? t('welcome.open_app')
                      : isInstalling 
                        ? t('welcome.confirming')
                        : t('welcome.install_app')}
                  </span>
                </button>

                <button
                  onClick={() => setIsInstallModalOpen(false)}
                  className="w-full py-2.5 px-4 rounded-arcade-sm bg-transparent hover:bg-white/5 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {t('welcome.close')}
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
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-arcade bg-[var(--color-arcade-navy)] border-3 border-[var(--color-sky-400)] shadow-[0_8px_25px_rgba(0,0,0,0.5)] text-white text-xs font-black uppercase tracking-wider flex items-center gap-3"
          >
            <Sparkles className="w-5 h-5 text-[var(--color-arcade-yellow)] shrink-0 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
