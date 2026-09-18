import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Sparkles, Volume2, ShieldCheck, Heart, GraduationCap, Compass } from 'lucide-react';
import capybara3dImg from '../assets/capybara_3d.jpg';
import { capyVoice } from '../utils/capyVoice';

export default function UserAuthModal({ isOpen, currentUser, onUserSaved }) {
  const [username, setUsername] = useState(currentUser?.username || '');
  const [gender, setGender] = useState(currentUser?.gender || 'masculino');
  const [age, setAge] = useState(currentUser?.age ? String(currentUser.age) : '20');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  if (!isOpen) return null;

  // Determinar la voz asignada según la regla:
  // Hombre -> Voz Femenina dulce
  // Mujer -> Voz Masculina sabia y serena
  const isMaleUser = gender === 'masculino';
  const assignedVoiceLabel = isMaleUser ? 'Voz Femenina (Dulce y Maternal)' : 'Voz Masculina (Cálida y Sabia)';

  const parsedAge = parseInt(age, 10) || 20;
  const ageProfile = parsedAge < 18 
    ? { title: 'Modo Escolar / Juvenil', icon: Sparkles, desc: 'Capi dinámico, amigable y con enfoque positivo', color: 'text-amber-300 border-amber-500/40 bg-amber-950/40' }
    : parsedAge <= 25 
    ? { title: 'Modo Universitario', icon: GraduationCap, desc: 'Apoyo para desvelos, exámenes y alivio del estrés académico', color: 'text-purple-300 border-purple-500/40 bg-purple-950/40' }
    : { title: 'Modo Profesional / Adulto', icon: Compass, desc: 'Técnicas de mindfulness, serenidad y claridad mental', color: 'text-emerald-300 border-emerald-500/40 bg-emerald-950/40' };

  const handleTestVoice = async () => {
    setIsPreviewPlaying(true);
    const sampleText = isMaleUser 
      ? `Hola ${username.trim() || 'amigo'}, soy tu compañera Capi. Estoy lista para cuidar de tu mente mientras estudias.`
      : `Hola ${username.trim() || 'amiga'}, soy tu compañero Capi. Cuenta conmigo para mantener la calma y superar cada reto.`;

    try {
      await capyVoice.speak(sampleText, {
        user_gender: gender,
        voice_gender: isMaleUser ? 'female' : 'male',
        profile: 'loving_psychologist'
      });
    } catch (e) {
      console.warn("Error probando voz:", e);
    } finally {
      setIsPreviewPlaying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || username.trim().length < 2) {
      setErrorMsg('Por favor ingresa un nombre o apodo de al menos 2 letras.');
      return;
    }

    const numAge = parseInt(age, 10);
    if (isNaN(numAge) || numAge < 6 || numAge > 110) {
      setErrorMsg('Por favor ingresa una edad válida (entre 6 y 100 años).');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/v1/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          gender: gender,
          age: numAge,
          avatar: 'capy_fan',
          voice_preference: 'auto'
        })
      });

      if (res.ok) {
        const userProfile = await res.json();
        localStorage.setItem('hubzy_current_user', JSON.stringify(userProfile));
        capyVoice.currentUser = userProfile;
        onUserSaved(userProfile);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.detail || 'No se pudo guardar tu perfil.');
      }
    } catch (err) {
      // Fallback local seguro si no hay backend en ese instante
      const localUser = {
        id: `user_local_${Date.now()}`,
        username: username.trim(),
        gender: gender,
        age: numAge,
        avatar: 'capy_fan',
        voice_preference: 'auto',
        assigned_voice_gender: isMaleUser ? 'female' : 'male'
      };
      localStorage.setItem('hubzy_current_user', JSON.stringify(localUser));
      capyVoice.currentUser = localUser;
      onUserSaved(localUser);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#16202e] to-[#0c131d] border-2 border-cyan-500/50 p-6 sm:p-7 shadow-[0_0_50px_rgba(6,182,212,0.3)] flex flex-col text-slate-100"
      >
        {/* Cabecera con Capi */}
        <div className="flex items-center gap-4 border-b border-slate-700/60 pb-4 mb-5">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)] shrink-0 bg-slate-950">
            <img src={capybara3dImg} alt="Capibara Psicólogo" className="w-full h-full object-cover" />
            <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                Perfil de Usuario
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Espacio 100% Privado
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-wide mt-1 font-mono">
              {currentUser ? 'Editar mi Perfil de Estudio' : '¡Bienvenido a Hubzy!'}
            </h2>
            <p className="text-xs text-slate-300">
              Tus documentos y preguntas son estrictamente privados y exclusivos de tu cuenta.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/70 text-rose-200 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Nombre de usuario */}
          <div>
            <label className="block text-slate-300 font-bold mb-1 font-mono uppercase tracking-wider text-[11px]">
              Nombre de Usuario o Apodo:
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej. Carlos, Valeria, Alex..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 placeholder:text-slate-500 font-medium focus:outline-hidden focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all text-sm"
              />
              <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            </div>
          </div>

          {/* Selector de Sexo */}
          <div>
            <label className="block text-slate-300 font-bold mb-1 font-mono uppercase tracking-wider text-[11px]">
              Sexo / Género:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setGender('masculino')}
                className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  gender === 'masculino'
                    ? 'bg-sky-950/90 border-sky-400 text-sky-200 shadow-[0_0_18px_rgba(56,189,248,0.35)] scale-[1.02]'
                    : 'bg-slate-900/70 border-slate-700/80 text-slate-400 hover:border-slate-500'
                }`}
              >
                <User className="w-6 h-6 text-sky-400 mb-0.5" />
                <span className="font-black text-xs">Hombre</span>
                <span className="text-[9px] text-sky-300 font-mono text-center">
                  Capi con voz femenina dulce
                </span>
              </button>

              <button
                type="button"
                onClick={() => setGender('femenino')}
                className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  gender === 'femenino'
                    ? 'bg-rose-950/90 border-rose-400 text-rose-200 shadow-[0_0_18px_rgba(244,63,94,0.35)] scale-[1.02]'
                    : 'bg-slate-900/70 border-slate-700/80 text-slate-400 hover:border-slate-500'
                }`}
              >
                <User className="w-6 h-6 text-rose-400 mb-0.5" />
                <span className="font-black text-xs">Mujer</span>
                <span className="text-[9px] text-rose-300 font-mono text-center">
                  Capi con voz masculina sabia
                </span>
              </button>
            </div>
          </div>

          {/* Edad y Modo de Personalidad */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-slate-300 font-bold mb-1 font-mono uppercase tracking-wider text-[11px]">
                Edad:
              </label>
              <input
                type="number"
                min="6"
                max="100"
                required
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 font-mono font-bold text-center text-base focus:outline-hidden focus:border-cyan-400"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col justify-end">
              <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${ageProfile.color}`}>
                <ageProfile.icon className="w-5 h-5 shrink-0 animate-pulse" />
                <div className="leading-tight">
                  <span className="font-bold block text-[10.5px] uppercase font-mono">{ageProfile.title}</span>
                  <span className="text-[9.5px] opacity-90">{ageProfile.desc}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta de Resumen y Prueba de Voz */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Heart className="w-4 h-4 text-rose-400" />
              <div>
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Voz Asignada de Capi:</span>
                <span className="text-xs font-black text-cyan-300 font-mono">{assignedVoiceLabel}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTestVoice}
              disabled={isPreviewPlaying}
              className="px-3 py-1.5 rounded-xl bg-cyan-950 border border-cyan-400 text-cyan-300 hover:bg-cyan-900 text-[10px] font-bold font-mono flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
            >
              <Volume2 className={`w-3.5 h-3.5 ${isPreviewPlaying ? 'animate-spin' : ''}`} />
              <span>{isPreviewPlaying ? 'Escuchando...' : 'Probar Voz'}</span>
            </button>
          </div>

          {/* Botón de Confirmación */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider font-mono shadow-[0_0_20px_rgba(34,211,238,0.5)] active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isLoading ? 'Configurando...' : 'Entrar a mi Espacio Privado'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
