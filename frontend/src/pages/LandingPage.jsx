import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  BookOpen,
  Gamepad2,
  Wind,
  ArrowRight,
  Crown,
  Check,
  School,
  ChevronLeft,
  ChevronRight,
  X,
  Info,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import A11yControls from "../components/A11yControls";
import SubscriptionModal from "../components/SubscriptionModal";
import { useAuthStore } from "../store/authStore";
import { getMascotA11yDescription } from "../utils/a11yDescriptions";

// Mascotas Oficiales desde src/assets/mascots
import capyEscolar from "../assets/mascots/capy_escolar_nino_m.webp";
import capyMedica from "../assets/mascots/capy_medica_f.webp";
import capyProgramador from "../assets/mascots/capy_programador_m.webp";
import capyAbogada from "../assets/mascots/capy_abogada_f.webp";
import capyAdmin from "../assets/mascots/capy_administradora_f.webp";
import capyProfesor from "../assets/mascots/capy_profesor_m.webp";

const SHOWCASE_MASCOTS = [
  {
    image: capyEscolar,
    name: "Hubzi Estudiante",
    role: "Colegio & Bachillerato",
    description: "Hubzi con mochila, cuaderno de apuntes y lápiz en mano, lista para repasar juntos."
  },
  {
    image: capyMedica,
    name: "Dra. Hubzi",
    role: "Medicina & Salud",
    description: "Hubzi con bata médica blanca y estetoscopio, brindando calma y rigor científico."
  },
  {
    image: capyProgramador,
    name: "Hubzi Dev",
    role: "Sistemas & Programación",
    description: "Hubzi programadora con laptop y audífonos, resolviendo lógica y algoritmos."
  },
  {
    image: capyAbogada,
    name: "Dra. Hubzi Jurista",
    role: "Derecho & Leyes",
    description: "Hubzi abogada con toga y código legal, analizando cada artículo con serenidad."
  },
  {
    image: capyAdmin,
    name: "Lic. Hubzi Admin",
    role: "Administración & Negocios",
    description: "Hubzi administradora con portafolios y visión estratégica de negocios."
  },
  {
    image: capyProfesor,
    name: "Prof. Hubzi",
    role: "Docencia & Humanidades",
    description: "Profesor Hubzi con gafas redondas y tiza, explicando conceptos paso a paso."
  }
];

export default function LandingPage() {
  const { t } = useTranslation();
  const [selectedMascotIndex, setSelectedMascotIndex] = useState(0);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isPlansOpen, setIsPlansOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const isPro = user?.plan === "pro" || user?.plan === "school";
  const activeMascot = SHOWCASE_MASCOTS[selectedMascotIndex];

  useEffect(() => {
    if (!isPlansOpen) return;
    const onKey = (e) => e.key === "Escape" && setIsPlansOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isPlansOpen]);

  const nextMascot = () => setSelectedMascotIndex((i) => (i + 1) % SHOWCASE_MASCOTS.length);
  const prevMascot = () => setSelectedMascotIndex((i) => (i - 1 + SHOWCASE_MASCOTS.length) % SHOWCASE_MASCOTS.length);

  const planCheck = (cls) => (
    <div className={`w-4 h-4 rounded-md ${cls} flex items-center justify-center shrink-0`}>
      <Check className="w-3 h-3 stroke-[3]" />
    </div>
  );
  const freeCheck = planCheck("bg-emerald-100 text-emerald-700");
  const proCheck = planCheck("bg-[var(--cozy-sage)] text-white");
  const schoolCheck = planCheck("bg-emerald-400 text-emerald-950");

  return (
    <div className="landing-stage min-h-[100dvh] w-full overflow-x-hidden flex flex-col justify-between relative bg-gradient-to-b from-[#D8F0F2] via-[#EAF7F8] to-[#FAF6EE] font-sans text-[#1E2F3A]">
      {/* ── PAISAJE GHIBLI ILUSTRADO DE FONDO (Colinas y orilla) ── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex flex-col justify-between">
        {/* Nubes esponjosas superiores */}
        <div className="relative w-full h-36">
          <div className="absolute top-4 left-[10%] w-32 h-10 bg-white/70 rounded-full blur-[1px]" />
          <div className="absolute top-2 left-[12%] w-16 h-16 bg-white/70 rounded-full blur-[1px]" />
          <div className="absolute top-8 right-[15%] w-48 h-12 bg-white/70 rounded-full blur-[1px]" />
          <div className="absolute top-4 right-[18%] w-20 h-20 bg-white/70 rounded-full blur-[1px]" />
          <div className="absolute top-12 left-[45%] w-40 h-10 bg-white/50 rounded-full blur-[1px]" />
        </div>

        {/* Colinas y agua en la base */}
        <div className="relative w-full h-44 sm:h-56 mt-auto">
          {/* Horizonte de agua tranquila */}
          <div className="absolute bottom-16 sm:bottom-20 inset-x-0 h-16 bg-gradient-to-t from-[#A8DADC]/60 to-transparent" />
          
          {/* Colina verde fondo */}
          <svg
            className="absolute bottom-0 inset-x-0 w-full h-32 sm:h-44 text-[#A3D9A5]/40"
            viewBox="0 0 1440 220"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            <path d="M0,120 C320,50 640,160 1000,90 C1200,50 1360,110 1440,130 L1440,220 L0,220 Z" />
          </svg>

          {/* Colina verde media con árboles */}
          <svg
            className="absolute bottom-0 inset-x-0 w-full h-24 sm:h-36 text-[#78B38A]/50"
            viewBox="0 0 1440 180"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            <path d="M0,90 C220,130 480,40 760,100 C1040,160 1280,70 1440,100 L1440,180 L0,180 Z" />
          </svg>

          {/* Colina verde frontal con orilla suave */}
          <svg
            className="absolute bottom-0 inset-x-0 w-full h-16 sm:h-24 text-[#5A9A70]/40"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            <path d="M0,60 C380,20 720,80 1100,40 C1280,20 1380,50 1440,60 L1440,120 L0,120 Z" />
          </svg>
        </div>
      </div>

      {/* ── NAVBAR SUPERIOR ── */}
      <header className="relative z-30 flex items-center justify-between px-6 sm:px-12 py-4">
        {/* Logo Hubzi */}
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#1E2F3A] font-['Fredoka'] group-hover:text-[#F58A29] transition-colors">
            HUBZI
          </span>
        </Link>

        {/* Acciones derecha */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Botón Planes */}
          <button
            type="button"
            onClick={() => setIsPlansOpen(true)}
            className="btn-tactile-cream px-4 py-2 text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm bg-[#FAF6EE] hover:bg-[#F2EBD9] text-[#1E2F3A] border border-[#E6DEC8] border-b-[3px] border-b-[#D8CEB6] rounded-full"
            aria-label="Ver planes y precios"
          >
            <Crown className="w-4 h-4 text-[#F58A29] fill-[#F58A29]" />
            <span className="font-['Fredoka']">{t("nav.plans", "Planes")}</span>
          </button>

          {/* Accesibilidad A11y */}
          <A11yControls />

          {/* Botón Iniciar Sesión */}
          <Link
            to="/arena"
            className="btn-tactile-ink px-5 sm:px-6 py-2 text-xs sm:text-sm font-bold uppercase tracking-wide bg-[#1E2F3A] text-white rounded-full border-b-4 border-[#0F1B22] shadow-md hover:bg-[#283E4C] transition-all"
          >
            {t("auth.login", "Iniciar Sesión")}
          </Link>
        </div>
      </header>

      {/* ── HERO PRINCIPAL (2 Columnas) ── */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 py-4 sm:py-6 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Columna Izquierda: Títulos y CTAs */}
          <div className="lg:col-span-7 text-center lg:text-left flex flex-col items-center lg:items-start">
            {/* Pill Badge */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#4A3B32] text-[#F9EDDE] text-xs sm:text-sm font-bold font-['Fredoka'] shadow-sm mb-4"
            >
              <span>🌿</span>
              <span>ESTUDIA JUGANDO, RESPIRA APRENDIENDO</span>
              <span>🌿</span>
            </motion.div>

            {/* Gran Título Hero con 'JUEGO' en Ámbar Cálido */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl xl:text-6xl font-black text-[#1E2F3A] font-['Fredoka'] uppercase tracking-tight leading-[1.15]"
            >
              Tus apuntes se convierten en un{" "}
              <span className="block sm:inline text-[#F58A29] drop-shadow-[0_4px_0_#C96812] filter">
                JUEGO
              </span>
            </motion.h1>

            {/* Subtítulo legible */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-4 text-base sm:text-lg text-[#526673] font-medium max-w-2xl leading-relaxed"
            >
              {t(
                "landing.hero_subtitle",
                "Hubzi transforma tus documentos en arenas de aprendizaje con Hubzi, tu compañera capibara que también cuida tu calma antes de los exámenes."
              )}
            </motion.p>

            {/* Botones de Acción Táctiles */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4"
            >
              {/* Botón Principal: Empezar Gratis */}
              <Link
                to="/arena"
                className="btn-tactile-amber px-8 py-3.5 sm:px-10 sm:py-4 text-base sm:text-lg font-black tracking-wide uppercase font-['Fredoka'] rounded-full shadow-lg"
              >
                <span>{isPro ? "Continuar Aventura →" : "Empezar Gratis →"}</span>
              </Link>

              {/* Botón Secundario: Modo Zen (Lavanda Exclusivo) */}
              <Link
                to="/zen"
                className="btn-tactile-zen px-7 py-3.5 sm:px-8 sm:py-4 text-base sm:text-lg font-black tracking-wide font-['Fredoka'] rounded-full"
              >
                <span className="text-xl">🌙</span>
                <span>Modo Zen</span>
              </Link>
            </motion.div>
          </div>

          {/* Columna Derecha: Hubzi en Isla Flotante con Carrusel */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
            {/* Pill Superior: COMPAÑEROS HUBZI */}
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#1E2F3A] text-white text-xs font-bold font-['Fredoka'] tracking-wider uppercase mb-3 shadow-sm">
              <span>🌿</span>
              <span>Compañeros Hubzi</span>
            </div>

            {/* Escenario de Isla Flotante con flechas */}
            <div className="relative w-full max-w-[340px] sm:max-w-[400px] flex items-center justify-center">
              {/* Flecha Izquierda */}
              <button
                type="button"
                onClick={prevMascot}
                className="absolute -left-2 sm:-left-4 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#FAF6EE] hover:bg-[#F2EBD9] text-[#1E2F3A] border-2 border-[#E6DEC8] border-b-4 border-b-[#D8CEB6] shadow-md flex items-center justify-center transition-transform active:translate-y-1 cursor-pointer"
                aria-label="Ver traje anterior de Hubzi"
              >
                <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
              </button>

              {/* Contenedor Ilustrado de Isla Flotante */}
              <div className="relative w-72 h-80 sm:w-80 sm:h-92 flex flex-col items-center justify-end">
                {/* Hubzi parada sobre el pasto */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                  className="relative z-10 w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center"
                >
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activeMascot.name}
                      src={activeMascot.image}
                      alt={getMascotA11yDescription(activeMascot)}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(30,47,58,0.18)]"
                    />
                  </AnimatePresence>
                </motion.div>

                {/* Isla Flotante 2.5D (Pasto Verde Salvia + Roca Tierra) */}
                <div className="relative -mt-8 z-0 w-64 sm:w-72 h-24">
                  {/* Copa verde con flores */}
                  <div className="w-full h-12 bg-gradient-to-b from-[#48A37E] to-[#2F8F6B] rounded-t-[50px] shadow-sm relative overflow-hidden">
                    {/* Flores decorativas miniatura */}
                    <span className="absolute top-2 left-6 text-xs">🌸</span>
                    <span className="absolute top-1 left-16 text-xs">🌼</span>
                    <span className="absolute top-2 right-8 text-xs">🌸</span>
                    <span className="absolute top-1 right-20 text-xs">🌼</span>
                  </div>
                  {/* Base de tierra / roca flotante */}
                  <div
                    className="w-full h-12 bg-gradient-to-b from-[#8C6D53] to-[#5C4533] shadow-lg"
                    style={{ clipPath: "polygon(0 0, 100% 0, 85% 100%, 15% 100%)" }}
                  />
                  {/* Sombra proyectada en el aire */}
                  <div className="w-48 h-4 mx-auto bg-[#1E2F3A]/10 rounded-full blur-[4px] mt-1" />
                </div>

                {/* Badge inferior con el nombre del traje */}
                <div className="absolute -bottom-2 z-20 px-5 py-1 rounded-full bg-[#1E2F3A] text-white text-xs font-bold font-['Fredoka'] tracking-wider uppercase shadow-md">
                  {activeMascot.name}
                </div>
              </div>

              {/* Flecha Derecha */}
              <button
                type="button"
                onClick={nextMascot}
                className="absolute -right-2 sm:-right-4 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#FAF6EE] hover:bg-[#F2EBD9] text-[#1E2F3A] border-2 border-[#E6DEC8] border-b-4 border-b-[#D8CEB6] shadow-md flex items-center justify-center transition-transform active:translate-y-1 cursor-pointer"
                aria-label="Ver siguiente traje de Hubzi"
              >
                <ChevronRight className="w-6 h-6 stroke-[2.5]" />
              </button>
            </div>
          </div>

        </div>

        {/* ── 3 TARJETAS INFERIORES ELEVADAS COLOR CREMA (#FAF6EE) ── */}
        <section className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {/* Tarjeta 1: Sube tus apuntes */}
          <div className="card-cozy-cream p-5 sm:p-6 flex items-center gap-4 bg-[#FAF6EE] rounded-3xl border border-[#E6DEC8] shadow-sm hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-[#FEF3E7] border border-[#FAD8B5] flex items-center justify-center text-2xl shrink-0">
              📖
            </div>
            <div className="text-left">
              <h3 className="text-base sm:text-lg font-bold text-[#1E2F3A] font-['Fredoka']">
                Sube tus apuntes
              </h3>
              <p className="text-xs sm:text-sm text-[#526673] font-medium mt-0.5">
                Convierte PDFs, resúmenes y fotos de cuadernos en mapas de estudio interactivos.
              </p>
            </div>
          </div>

          {/* Tarjeta 2: Juega para memorizar */}
          <div className="card-cozy-cream p-5 sm:p-6 flex items-center gap-4 bg-[#FAF6EE] rounded-3xl border border-[#E6DEC8] shadow-sm hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-[#FEECEC] border border-[#FBCACA] flex items-center justify-center text-2xl shrink-0">
              🎮
            </div>
            <div className="text-left">
              <h3 className="text-base sm:text-lg font-bold text-[#1E2F3A] font-['Fredoka']">
                Juega para memorizar
              </h3>
              <p className="text-xs sm:text-sm text-[#526673] font-medium mt-0.5">
                Avanza por 20 niveles progresivos con cartas, retos adaptativos y batallas boss.
              </p>
            </div>
          </div>

          {/* Tarjeta 3: Hubzi cuida tu calma */}
          <div className="card-cozy-cream p-5 sm:p-6 flex items-center gap-4 bg-[#FAF6EE] rounded-3xl border border-[#E6DEC8] shadow-sm hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-[#E8F8F5] border border-[#BDEFE5] flex items-center justify-center text-2xl shrink-0">
              🪷
            </div>
            <div className="text-left">
              <h3 className="text-base sm:text-lg font-bold text-[#1E2F3A] font-['Fredoka']">
                Hubzi cuida tu calma
              </h3>
              <p className="text-xs sm:text-sm text-[#526673] font-medium mt-0.5">
                Pausas zen guiadas y respiración antes de exámenes para estudiar sin ansiedad.
              </p>
            </div>
          </div>
        </section>

        {/* ── AVISO DE SALUD MENTAL (Píldora Limpia) ── */}
        <div className="mt-6 mx-auto inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FAF6EE]/90 border border-[#E6DEC8] text-xs text-[#526673] font-medium shadow-sm">
          <Info className="w-4 h-4 text-[#F58A29] shrink-0" />
          <span>Hubzi no es un servicio de salud mental. Si estás en crisis, busca ayuda profesional.</span>
        </div>
      </main>

      {/* ── FOOTER DISCRETO ── */}
      <footer className="relative z-10 py-4 text-center text-xs text-[#526673] font-medium border-t border-[#E6DEC8]/60">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setIsPlansOpen(true)}
            className="hover:text-[#1E2F3A] transition-colors cursor-pointer"
          >
            Planes y Precios
          </button>
          <span>·</span>
          <Link to="/legal/terminos" className="hover:text-[#1E2F3A] transition-colors">
            Términos de Servicio
          </Link>
          <span>·</span>
          <Link to="/legal/privacidad" className="hover:text-[#1E2F3A] transition-colors">
            Política de Privacidad
          </Link>
          <span>·</span>
          <span>© 2026 SynapseHub</span>
        </div>
      </footer>

      {/* ── MODAL PLANES Y PRECIOS COZY ── */}
      {isPlansOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-[#1E2F3A]/50 backdrop-blur-sm"
          onClick={() => setIsPlansOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-5xl max-h-[92dvh] overflow-y-auto rounded-3xl bg-[#FAF6EE] p-6 sm:p-8 shadow-2xl border-2 border-[#E6DEC8]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#FEF3E7] border border-[#FAD8B5] px-4 py-1.5 text-xs font-bold font-['Fredoka'] text-[#F58A29]">
                <Crown className="w-4 h-4 fill-current" /> Planes y Precios
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#1E2F3A] font-['Fredoka']">
                Elige tu Plan de Estudio
              </h2>
              <button
                type="button"
                onClick={() => setIsPlansOpen(false)}
                aria-label="Cerrar modal"
                className="w-9 h-9 rounded-full bg-[#F2EBD9] hover:bg-[#E6DEC8] text-[#1E2F3A] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {/* Plan Básico */}
              <div className="card-cozy-cream p-6 rounded-3xl bg-white border border-[#E6DEC8] shadow-sm flex flex-col justify-between">
                <div>
                  <span className="px-3 py-1 rounded-full bg-[#F2EBD9] text-[#1E2F3A] text-xs font-bold font-['Fredoka']">
                    Básico
                  </span>
                  <h3 className="text-lg font-bold text-[#1E2F3A] font-['Fredoka'] mt-3">
                    Estudiante Zen
                  </h3>
                  <div className="mt-2 mb-4">
                    <span className="text-3xl font-black text-[#1E2F3A] font-['Fredoka']">$0</span>
                    <span className="text-xs text-[#526673] ml-1">/ 7 días de prueba</span>
                  </div>
                  <div className="space-y-2 text-xs font-medium text-[#526673] border-t border-[#E6DEC8] pt-4">
                    <div className="flex items-center gap-2">{freeCheck}<span>Subida de resúmenes en PDF</span></div>
                    <div className="flex items-center gap-2">{freeCheck}<span>Circuitos interactivos de cartas</span></div>
                    <div className="flex items-center gap-2">{freeCheck}<span>Compañera Hubzi con calma</span></div>
                    <div className="flex items-center gap-2">{freeCheck}<span>Modos de respiración Zen</span></div>
                  </div>
                </div>
                <Link
                  to="/arena"
                  className="mt-6 w-full btn-tactile-cream py-2.5 rounded-full text-xs font-bold text-center block"
                >
                  Empezar Prueba Gratis
                </Link>
              </div>

              {/* Plan Pro */}
              <div className="card-cozy-cream p-6 rounded-3xl bg-[#FAF6EE] border-2 border-[#F58A29] shadow-lg flex flex-col justify-between relative">
                <div className="absolute -top-3 right-6 bg-[#F58A29] text-white text-[10px] font-black font-['Fredoka'] uppercase tracking-wider py-1 px-3 rounded-full shadow-sm">
                  MÁS POPULAR
                </div>
                <div>
                  <span className="px-3 py-1 rounded-full bg-[#FEF3E7] text-[#F58A29] text-xs font-bold font-['Fredoka'] border border-[#FAD8B5]">
                    Pro Ilimitado
                  </span>
                  <h3 className="text-lg font-bold text-[#1E2F3A] font-['Fredoka'] mt-3 flex items-center gap-1.5">
                    Hubzi Pro <Crown className="w-4 h-4 text-[#F58A29] fill-current" />
                  </h3>
                  <div className="mt-2 mb-4">
                    <span className="text-3xl font-black text-[#F58A29] font-['Fredoka']">$2.99</span>
                    <span className="text-xs text-[#526673] ml-1">USD / mes</span>
                  </div>
                  <div className="space-y-2 text-xs font-medium text-[#1E2F3A] border-t border-[#E6DEC8] pt-4">
                    <div className="flex items-center gap-2">{proCheck}<span>Subida ILIMITADA de material</span></div>
                    <div className="flex items-center gap-2">{proCheck}<span>Los 20 Niveles de campaña completos</span></div>
                    <div className="flex items-center gap-2">{proCheck}<span>Voz IA empática ultra-rápida</span></div>
                    <div className="flex items-center gap-2">{proCheck}<span>Simulacros infinitos sin espera</span></div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsPlansOpen(false); setIsSubscriptionModalOpen(true); }}
                  className="mt-6 w-full btn-tactile-amber py-3 rounded-full text-xs font-bold text-center cursor-pointer shadow-md"
                >
                  Obtener Plan PRO ($2.99 / mes)
                </button>
              </div>

              {/* Plan Escuelas */}
              <div className="card-cozy-cream p-6 rounded-3xl bg-white border border-[#E6DEC8] shadow-sm flex flex-col justify-between">
                <div>
                  <span className="px-3 py-1 rounded-full bg-[#E8F8F5] text-[#2F8F6B] text-xs font-bold font-['Fredoka'] border border-[#BDEFE5]">
                    Instituciones
                  </span>
                  <h3 className="text-lg font-bold text-[#1E2F3A] font-['Fredoka'] mt-3 flex items-center gap-1.5">
                    Hubzi Escuelas <School className="w-4 h-4 text-[#2F8F6B]" />
                  </h3>
                  <div className="mt-2 mb-4">
                    <span className="text-3xl font-black text-[#2F8F6B] font-['Fredoka']">$1</span>
                    <span className="text-xs text-[#526673] ml-1">USD / alumno / mes</span>
                  </div>
                  <div className="space-y-2 text-xs font-medium text-[#526673] border-t border-[#E6DEC8] pt-4">
                    <div className="flex items-center gap-2">{schoolCheck}<span>Grados y paralelos con código</span></div>
                    <div className="flex items-center gap-2">{schoolCheck}<span>Libros convertidos en islas</span></div>
                    <div className="flex items-center gap-2">{schoolCheck}<span>Panel docente con métricas pedagógicas</span></div>
                  </div>
                </div>
                <Link
                  to="/arena"
                  className="mt-6 w-full btn-tactile-sage py-2.5 rounded-full text-xs font-bold text-center block"
                >
                  Crear Colegio
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de Suscripción Stripe (Hubzi Pro) */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        currentUser={null}
        onSubscriptionSuccess={() => {
          setIsSubscriptionModalOpen(false);
          window.location.href = "/arena";
        }}
      />
    </div>
  );
}
