import React from 'react';
import { motion } from 'framer-motion';
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
  Play
} from 'lucide-react';
import capybara3dImg from '../assets/capybara_3d.jpg';

export default function WelcomeScreen({
  onContinue,
  onOpenTutorial,
  onOpenLogin,
  isLoggedIn = false,
  username = ''
}) {
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

        {/* Botón Derecho: Ajustes / Ayuda */}
        <div className="flex items-center gap-2">
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

        {/* Tarjeta Flotante Lateral: PLAY TUTORIAL */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute right-4 sm:right-12 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center"
        >
          <div className="w-24 h-24 mb-1 relative flex items-center justify-center">
            <div className="w-20 h-20 rounded-3xl bg-[#FFB400]/20 border-3 border-[#FFB400] flex items-center justify-center shadow-lg">
              <BookOpen className="w-10 h-10 text-[#FFB400] drop-shadow" />
            </div>
          </div>
          <button
            onClick={onOpenTutorial}
            className="px-6 py-3 rounded-2xl bg-[#122443] hover:bg-[#1a335e] border-3 border-[#0a162b] border-b-5 border-b-[#050a13] text-white font-black text-xs uppercase tracking-wider shadow-[0_5px_0_#FF7A00] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
          >
            PLAY TUTORIAL
          </button>
        </motion.div>
      </div>

      {/* ── BANNER INFERIOR: BOTÓN CONTINUAR DESTACADO CON PROTECCIÓN DE SESIÓN ── */}
      <div className="relative w-full z-20 pb-5 px-4 sm:px-8">
        <div className="max-w-xl mx-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onContinue}
            className={`w-full py-4 sm:py-5 px-8 rounded-3xl flex items-center justify-between text-left cursor-pointer overflow-hidden relative shadow-[0_10px_0_#122443] transition-all ${
              isLoggedIn 
                ? 'btn-arcade-banner-orange bg-striped-diagonal' 
                : 'bg-[#1b2f52] border-4 border-[#0a162b] hover:bg-[#223b66]'
            }`}
          >
            <div className="flex items-center gap-4 relative z-10">
              <div className={`w-14 h-14 rounded-2xl border-3 border-[#122443] flex items-center justify-center text-white ${
                isLoggedIn ? 'bg-[#FF7A00] shadow-[0_4px_0_#D45B00]' : 'bg-[#FFB400] text-[#122443] shadow-[0_4px_0_#D48800]'
              }`}>
                {isLoggedIn ? (
                  <Play className="w-8 h-8 text-white fill-current drop-shadow ml-0.5" />
                ) : (
                  <Lock className="w-7 h-7 text-[#122443] stroke-[2.8]" />
                )}
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-wider uppercase drop-shadow flex items-center gap-2">
                  CONTINUAR
                  {!isLoggedIn && (
                    <span className="text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full bg-[#FF7A00] text-white border-2 border-[#122443] font-black uppercase">
                      Bloqueado
                    </span>
                  )}
                </h3>
                <p className={`text-xs sm:text-sm font-black drop-shadow-sm ${isLoggedIn ? 'text-orange-100' : 'text-amber-300'}`}>
                  {isLoggedIn 
                    ? 'Entrar a la Arena de Aprendizaje con Hubzy' 
                    : 'Inicia sesión primero para desbloquear la Arena'}
                </p>
              </div>
            </div>

            <div className={`w-12 h-12 rounded-2xl border-3 border-[#0a162b] flex items-center justify-center text-white shadow-md relative z-10 ${
              isLoggedIn ? 'bg-[#122443]' : 'bg-[#0a162b]'
            }`}>
              {isLoggedIn ? (
                <ArrowRight className="w-7 h-7 stroke-[3]" />
              ) : (
                <Lock className="w-5 h-5 text-amber-400 stroke-[2.5]" />
              )}
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
