import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, BookOpen, Swords, Wind, ArrowRight, HeartHandshake, GraduationCap, Crown, Check, School } from "lucide-react";
import { useTranslation } from "react-i18next";
import AnimatedCloudsBackground from "../components/AnimatedCloudsBackground";
import SubscriptionModal from "../components/SubscriptionModal";

// Mascotas Oficiales desde src/assets/mascots
import capyEscolar from "../assets/mascots/capy_escolar_nino_m.webp";
import capyMedica from "../assets/mascots/capy_medica_f.webp";
import capyProgramador from "../assets/mascots/capy_programador_m.webp";
import capyAbogada from "../assets/mascots/capy_abogada_f.webp";
import capyAdmin from "../assets/mascots/capy_administradora_f.webp";
import capyProfesor from "../assets/mascots/capy_profesor_m.webp";

const SHOWCASE_MASCOTS = [
  { image: capyEscolar, name: "Hubzi Estudiante", role: "Colegio & Bachillerato", color: "from-amber-400 to-orange-500", border: "#FF7A00" },
  { image: capyMedica, name: "Dra. Hubzi", role: "Medicina & Salud", color: "from-emerald-400 to-teal-500", border: "#10b981" },
  { image: capyProgramador, name: "Hubzi Dev", role: "Sistemas & Programación", color: "from-cyan-400 to-blue-600", border: "#38bdf8" },
  { image: capyAbogada, name: "Dra. Hubzi Jurista", role: "Derecho & Leyes", color: "from-purple-400 to-indigo-600", border: "#a855f7" },
  { image: capyAdmin, name: "Lic. Hubzi Admin", role: "Administración & Negocios", color: "from-orange-400 to-rose-500", border: "#f43f5e" },
  { image: capyProfesor, name: "Prof. Hubzi", role: "Docencia & Humanidades", color: "from-amber-400 to-yellow-600", border: "#f59e0b" }
];

const FEATURES = [
  { icon: BookOpen, titleKey: "landing.feature_1_title", descKey: "landing.feature_1_desc" },
  { icon: Swords, titleKey: "landing.feature_2_title", descKey: "landing.feature_2_desc" },
  { icon: Wind, titleKey: "landing.feature_3_title", descKey: "landing.feature_3_desc" },
];

export default function LandingPage() {
  const { t } = useTranslation();
  const [selectedMascotIndex, setSelectedMascotIndex] = useState(0);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const activeMascot = SHOWCASE_MASCOTS[selectedMascotIndex];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-100 font-sans">
      <AnimatedCloudsBackground />

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl font-black uppercase tracking-wider text-[#122443]">Hubzi</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="#planes"
            className="rounded-2xl bg-white/80 hover:bg-white px-3.5 py-2 text-xs sm:text-sm font-black uppercase text-[#122443] border-2 border-slate-300 hover:border-[#122443] transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Crown className="w-4 h-4 text-amber-500 fill-current" />
            <span>Planes</span>
          </a>
          <Link
            to="/arena"
            className="rounded-2xl bg-[#122443] px-5 py-2.5 text-xs sm:text-sm font-black uppercase text-white border-b-4 border-[#050a13] hover:bg-[#1a335e] transition-colors shadow-md"
          >
            {t("auth.login")}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 mx-auto max-w-5xl px-6 pt-10 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-[#122443] px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[#FFB400] shadow-md">
            <Sparkles className="w-4 h-4" /> {t("app.tagline")}
          </div>

          <h1 className="text-4xl sm:text-6xl font-black uppercase leading-tight text-[#122443] drop-shadow-sm">
            {t("landing.hero_title")}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg font-semibold text-slate-700">
            {t("landing.hero_subtitle")}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/arena"
              className="group inline-flex items-center gap-2 rounded-3xl bg-[#FF7A00] px-8 py-4 text-lg font-black uppercase text-white border-b-6 border-[#D45B00] shadow-xl hover:scale-[1.03] active:scale-95 transition-transform cursor-pointer"
            >
              {t("landing.cta_start")}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/zen"
              className="inline-flex items-center gap-2 rounded-3xl bg-white/80 px-8 py-4 text-lg font-black uppercase text-[#122443] border-b-6 border-slate-300 hover:bg-white transition-colors cursor-pointer shadow-md"
            >
              <Wind className="w-5 h-5" /> {t("nav.zen")}
            </Link>
          </div>
        </motion.div>

        {/* Showcase de Mascotas Oficiales de Hubzy (src/assets/mascots) */}
        <div className="mt-12 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#122443] text-white text-[11px] font-black uppercase tracking-wider mb-4 shadow-md">
            <GraduationCap className="w-4 h-4 text-[#FFB400]" />
            <span>Compañeros Hubzi para cada carrera</span>
          </div>

          {/* Tarjeta de Mascota Activa */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMascot.name}
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -15 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center"
              >
                <div className="relative w-56 sm:w-64 h-56 sm:h-64 rounded-[2.5rem] bg-gradient-to-br from-white/90 to-slate-100/80 border-4 border-[#122443] shadow-2xl p-3 flex items-center justify-center overflow-hidden">
                  <img
                    src={activeMascot.image}
                    alt={activeMascot.name}
                    className="w-full h-full object-contain drop-shadow-md scale-105"
                  />
                </div>
                <div className="mt-3 px-4 py-1.5 rounded-2xl bg-[#122443] border-2 border-[#0a162b] shadow-md text-white">
                  <h4 className="text-sm font-black uppercase tracking-wide text-[#FFB400]">
                    {activeMascot.name}
                  </h4>
                  <p className="text-[11px] font-bold text-slate-200">
                    {activeMascot.role}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Selector de Mascota */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 max-w-lg">
            {SHOWCASE_MASCOTS.map((m, idx) => (
              <button
                key={m.name}
                onClick={() => setSelectedMascotIndex(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-2 ${
                  idx === selectedMascotIndex
                    ? "bg-[#122443] text-[#FFB400] border-[#FFB400] shadow-md scale-105"
                    : "bg-white/80 hover:bg-white text-slate-700 border-slate-300"
                }`}
              >
                <img src={m.image} alt={m.name} className="w-5 h-5 rounded-md object-cover" />
                <span>{m.role.split("&")[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Features */}
        <section className="mt-16 grid gap-5 sm:grid-cols-3 text-left">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              className="rounded-3xl bg-white/85 p-6 border-b-6 border-slate-200 shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
            >
              <div className="mb-3 inline-flex rounded-2xl bg-[#FFB400]/20 p-3">
                <f.icon className="w-7 h-7 text-[#FF7A00]" />
              </div>
              <h3 className="text-lg font-black text-[#122443]">{t(f.titleKey)}</h3>
              <p className="mt-2 text-sm font-medium text-slate-600 leading-relaxed">{t(f.descKey)}</p>
            </motion.div>
          ))}
        </section>

        {/* SECCIÓN PLANES Y PRECIOS */}
        <section id="planes" className="mt-20 scroll-mt-12">
          <div className="mx-auto max-w-2xl text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#122443] px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[#FFB400] shadow-md mb-3">
              <Crown className="w-4 h-4 fill-current" /> Planes y Precios
            </div>
            <h2 className="text-3xl sm:text-5xl font-black uppercase text-[#122443] tracking-tight">
              Planes que Ofrecemos
            </h2>
            <p className="mt-3 text-sm sm:text-base font-bold text-slate-700">
              Diseñados especialmente para estudiantes: potencia tu memoria y vence los exámenes con calma.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto text-left items-stretch">
            {/* PLAN GRATUITO */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative rounded-3xl bg-white/90 p-7 sm:p-8 border-4 border-slate-200 border-b-8 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-wider border border-slate-300">
                    Básico
                  </span>
                  <Sparkles className="w-5 h-5 text-slate-400" />
                </div>
                <h3 className="text-2xl font-black uppercase text-[#122443]">Estudiante Zen</h3>
                <p className="text-xs font-bold text-slate-500 mt-1">Para comenzar a transformar tus apuntes hoy mismo.</p>

                <div className="mt-5 mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-[#122443]">$0</span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">/ Siempre gratis</span>
                </div>

                <div className="space-y-3 text-xs font-bold text-slate-700 border-t border-slate-200/80 pt-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span>Subida de resúmenes y apuntes en PDF</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span>Circuitos interactivos de preguntas y cartas</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span>Compañera Hubzi con consejos empáticos</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span>Modos de respiración consciente Zen</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-400">
                    <div className="w-5 h-5 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[2]" />
                    </div>
                    <span>1 Baúl de estudio activo</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4">
                <Link
                  to="/arena"
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-white hover:bg-slate-50 text-[#122443] font-black text-xs uppercase tracking-wider border-2 border-[#122443] border-b-4 border-b-[#050a13] shadow-md hover:scale-[1.01] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  <span>Empezar Gratis</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>

            {/* PLAN PRO */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="relative rounded-3xl bg-[#122443] p-7 sm:p-8 border-4 border-[#FFB400] border-b-8 border-b-[#D48800] shadow-2xl flex flex-col justify-between text-white overflow-hidden"
            >
              {/* Badge Más Popular */}
              <div className="absolute top-0 right-0 bg-gradient-to-l from-[#FF7A00] to-[#FFB400] text-[#122443] text-[10px] font-black uppercase tracking-wider py-1.5 px-4 rounded-bl-2xl shadow-md flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 fill-current" />
                <span>MÁS POPULAR</span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 rounded-xl bg-[#0a162b] text-[#FFB400] text-xs font-black uppercase tracking-wider border border-[#FFB400]/40">
                    Pro Ilimitado
                  </span>
                </div>
                <h3 className="text-2xl font-black uppercase text-white flex items-center gap-2">
                  Hubzy Pro
                  <Crown className="w-6 h-6 text-[#FFB400] fill-current" />
                </h3>
                <p className="text-xs font-bold text-slate-300 mt-1">Potencia total para aprobar exámenes exigentes sin estrés.</p>

                <div className="mt-5 mb-6 flex items-baseline gap-1.5">
                  <span className="text-4xl sm:text-5xl font-black text-[#FFB400] drop-shadow">$2.99</span>
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">USD / mes <span className="text-emerald-400 font-extrabold">(~20 Bs)</span></span>
                </div>

                <div className="space-y-3 text-xs font-bold text-slate-200 border-t border-[#1e3a6c] pt-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-lg bg-[#48C838] text-white flex items-center justify-center shrink-0 shadow-[0_2px_0_#28871E]">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span><strong>Subida ILIMITADA</strong> de PDFs, diapositivas y libros</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-lg bg-[#48C838] text-white flex items-center justify-center shrink-0 shadow-[0_2px_0_#28871E]">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span><strong>Acceso a los 5 Niveles</strong> de maestría en la Arena</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-lg bg-[#48C838] text-white flex items-center justify-center shrink-0 shadow-[0_2px_0_#28871E]">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span><strong>Voz IA de Hubzi ultra-rápida y empática</strong> sin límites</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-lg bg-[#48C838] text-white flex items-center justify-center shrink-0 shadow-[0_2px_0_#28871E]">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span><strong>Simulacros infinitos</strong> sin tiempos de espera</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-lg bg-[#48C838] text-white flex items-center justify-center shrink-0 shadow-[0_2px_0_#28871E]">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span><strong>Múltiples carpetas y materias</strong> simultáneas</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-lg bg-[#48C838] text-white flex items-center justify-center shrink-0 shadow-[0_2px_0_#28871E]">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span className="text-emerald-300">Garantía de reembolso de 7 días · Cancela con 1 clic</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4">
                <button
                  type="button"
                  onClick={() => setIsSubscriptionModalOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#FF7A00] to-[#FFB400] hover:from-[#ff8c1a] hover:to-[#ffbf1a] text-[#122443] font-black text-xs uppercase tracking-wider border-2 border-[#122443] border-b-4 border-b-[#8c3b00] shadow-[0_4px_0_#8c3b00] hover:scale-[1.01] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  <Crown className="w-4 h-4 fill-current" />
                  <span>Obtener Plan PRO ($2.99 / mes)</span>
                </button>
              </div>
            </motion.div>

            {/* PLAN ESCUELAS (B2B) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="relative rounded-3xl bg-gradient-to-b from-emerald-900 to-[#0f2a1d] p-7 sm:p-8 border-4 border-emerald-400 border-b-8 border-b-emerald-700 shadow-2xl flex flex-col justify-between text-white overflow-hidden md:col-span-2 lg:col-span-1"
            >
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 rounded-xl bg-emerald-950/70 text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-400/40">
                    Para instituciones
                  </span>
                </div>
                <h3 className="text-2xl font-black uppercase text-white flex items-center gap-2">
                  Hubzy Escuelas
                  <School className="w-6 h-6 text-emerald-300" />
                </h3>
                <p className="text-xs font-bold text-emerald-100/80 mt-1">
                  Toda la gamificación anti-estrés para tu colegio, con panel docente.
                </p>

                <div className="mt-5 mb-6 flex items-baseline gap-1.5">
                  <span className="text-4xl sm:text-5xl font-black text-emerald-300 drop-shadow">$1</span>
                  <span className="text-xs font-bold text-emerald-100/80 uppercase tracking-wide">
                    USD / estudiante / mes <span className="text-emerald-200/70">(mín. 30)</span>
                  </span>
                </div>

                <div className="space-y-3 text-xs font-bold text-emerald-50 border-t border-emerald-400/20 pt-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-lg bg-emerald-400 text-emerald-950 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span><strong>Grados y paralelos ilimitados</strong> con código de clase</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-lg bg-emerald-400 text-emerald-950 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span><strong>Materias por grado</strong> — el libro se convierte en islas-temas solas</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-lg bg-emerald-400 text-emerald-950 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span><strong>Panel docente:</strong> progreso por estudiante y temas débiles del curso</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-lg bg-emerald-400 text-emerald-950 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span>Todo lo del plan Pro para cada estudiante</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-lg bg-emerald-400 text-emerald-950 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span className="text-emerald-200">Privacidad de menores: métricas pedagógicas, jamás chats</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4">
                <Link
                  to="/arena"
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black text-xs uppercase tracking-wider border-2 border-emerald-600 border-b-4 border-b-emerald-800 shadow-md hover:scale-[1.01] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  <School className="w-4 h-4" />
                  <span>Crear mi colegio gratis</span>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Mental health note */}
        <div className="mx-auto mt-14 flex max-w-xl items-start gap-3 rounded-2xl bg-white/70 p-4 text-left text-xs text-slate-600">
          <HeartHandshake className="mt-0.5 w-5 h-5 shrink-0 text-rose-500" />
          <p>{t("landing.disclaimer")}</p>
        </div>
      </main>

      {/* Footer legal */}
      <footer className="relative z-10 border-t border-[#122443]/10 py-6 text-center text-xs font-semibold text-slate-600">
        <div className="flex items-center justify-center gap-4">
          <a href="#planes" className="hover:text-[#122443] transition-colors">
            Planes y Precios
          </a>
          <span>·</span>
          <Link to="/legal/terminos" className="hover:text-[#122443] transition-colors">
            Términos de Servicio
          </Link>
          <span>·</span>
          <Link to="/legal/privacidad" className="hover:text-[#122443] transition-colors">
            Política de Privacidad
          </Link>
          <span>·</span>
          <span>© 2026 Hubzy — SynapseHub</span>
        </div>
      </footer>

      {/* Modal de Suscripción Stripe (Hubzy Pro) */}
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
