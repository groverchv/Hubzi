import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, BookOpen, Swords, Wind, ArrowRight, HeartHandshake } from "lucide-react";
import { useTranslation } from "react-i18next";
import capybara3dImg from "../assets/capybara_3d.webp";
import AnimatedCloudsBackground from "../components/AnimatedCloudsBackground";

const FEATURES = [
  { icon: BookOpen, titleKey: "landing.feature_1_title", descKey: "landing.feature_1_desc" },
  { icon: Swords, titleKey: "landing.feature_2_title", descKey: "landing.feature_2_desc" },
  { icon: Wind, titleKey: "landing.feature_3_title", descKey: "landing.feature_3_desc" },
];

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-100 font-sans">
      <AnimatedCloudsBackground />

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5">
        <div className="flex items-center gap-2">
          <img src={capybara3dImg} alt="Capi" className="w-10 h-10 rounded-2xl border-2 border-[#122443] object-cover" />
          <span className="text-2xl font-black uppercase tracking-wider text-[#122443]">Hubzy</span>
        </div>
        <Link
          to="/arena"
          className="rounded-2xl bg-[#122443] px-5 py-2.5 text-sm font-black uppercase text-white border-b-4 border-[#050a13] hover:bg-[#1a335e] transition-colors"
        >
          {t("auth.login")}
        </Link>
      </header>

      {/* Hero */}
      <main className="relative z-10 mx-auto max-w-5xl px-6 pt-10 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-[#122443] px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[#FFB400]">
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
              className="group inline-flex items-center gap-2 rounded-3xl bg-[#FF7A00] px-8 py-4 text-lg font-black uppercase text-white border-b-6 border-[#D45B00] shadow-xl hover:scale-[1.03] active:scale-95 transition-transform"
            >
              {t("landing.cta_start")}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/zen"
              className="inline-flex items-center gap-2 rounded-3xl bg-white/80 px-8 py-4 text-lg font-black uppercase text-[#122443] border-b-6 border-slate-300 hover:bg-white transition-colors"
            >
              <Wind className="w-5 h-5" /> {t("nav.zen")}
            </Link>
          </div>
        </motion.div>

        {/* Mascot */}
        <motion.img
          src={capybara3dImg}
          alt="Capi, la capibara de Hubzy"
          className="mx-auto mt-10 w-56 sm:w-72 rounded-[2.5rem] border-4 border-[#122443] shadow-2xl"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, type: "spring", stiffness: 120 }}
        />

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

        {/* Mental health note */}
        <div className="mx-auto mt-14 flex max-w-xl items-start gap-3 rounded-2xl bg-white/70 p-4 text-left text-xs text-slate-600">
          <HeartHandshake className="mt-0.5 w-5 h-5 shrink-0 text-rose-500" />
          <p>{t("landing.disclaimer")}</p>
        </div>
      </main>

      {/* Footer legal */}
      <footer className="relative z-10 border-t border-[#122443]/10 py-6 text-center text-xs font-semibold text-slate-600">
        <div className="flex items-center justify-center gap-4">
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
    </div>
  );
}
