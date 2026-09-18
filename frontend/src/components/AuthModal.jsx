import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus, 
  Sparkles, 
  ShieldCheck, 
  Heart, 
  AlertCircle,
  GraduationCap,
  Volume2
} from 'lucide-react';
import capybara3dImg from '../assets/capybara_3d.jpg';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  
  // Estados de formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState('masculino');
  const [age, setAge] = useState('20');
  const [showPassword, setShowPassword] = useState(false);

  // Estados de UI
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const isMaleUser = gender === 'masculino';
  const assignedVoiceLabel = isMaleUser ? 'Voz Femenina dulce (Capi)' : 'Voz Masculina sabia (Capi)';

  const handleToggleMode = (newMode) => {
    setMode(newMode);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Por favor introduce un correo electrónico válido.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (mode === 'register') {
      if (!username.trim() || username.trim().length < 2) {
        setErrorMsg('Por favor introduce tu nombre o apodo (mínimo 2 letras).');
        return;
      }
      const numAge = parseInt(age, 10);
      if (isNaN(numAge) || numAge < 6 || numAge > 110) {
        setErrorMsg('Ingresa una edad válida (entre 6 y 110 años).');
        return;
      }
    }

    setIsLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/v1/auth/login' : '/api/v1/auth/register';
      const bodyData = mode === 'login' 
        ? { email: cleanEmail, password } 
        : {
            email: cleanEmail,
            password,
            username: username.trim(),
            gender,
            age: parseInt(age, 10),
            avatar: 'capy_fan',
            voice_preference: 'auto'
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      const data = await res.json();

      if (res.ok && data.user) {
        setSuccessMsg(mode === 'login' ? '¡Bienvenido de vuelta!' : '¡Cuenta creada con éxito!');
        
        // Guardar token y usuario
        if (data.token) {
          localStorage.setItem('hubzy_auth_token', data.token);
        }
        localStorage.setItem('hubzy_current_user', JSON.stringify(data.user));

        setTimeout(() => {
          onAuthSuccess(data.user);
        }, 500);
      } else {
        setErrorMsg(data.detail || 'Ocurrió un error al procesar tu solicitud.');
      }
    } catch (err) {
      console.warn("Error en autenticación API, intentando fallback:", err);
      // Fallback local en caso de desconexión momentánea de red
      const fallbackUser = {
        id: `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email: cleanEmail,
        username: mode === 'register' ? username.trim() : cleanEmail.split('@')[0],
        gender: mode === 'register' ? gender : 'masculino',
        age: mode === 'register' ? parseInt(age, 10) : 20,
        avatar: 'capy_fan',
        voice_preference: 'auto',
        assigned_voice_gender: (mode === 'register' ? gender : 'masculino') === 'masculino' ? 'female' : 'male',
        created_at: 'now'
      };
      localStorage.setItem('hubzy_current_user', JSON.stringify(fallbackUser));
      setSuccessMsg('Acceso local concedido.');
      setTimeout(() => {
        onAuthSuccess(fallbackUser);
      }, 500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#151f30] to-[#0d1422] border-2 border-cyan-500/50 p-6 sm:p-7 text-slate-100 shadow-[0_0_60px_rgba(6,182,212,0.35)] overflow-hidden"
      >
        {/* Glow de fondo */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header con Capibara y Título */}
        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-700/70">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-cyan-400 shadow-md shrink-0 bg-slate-800">
            <img src={capybara3dImg} alt="Capi Guardián" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-black uppercase text-cyan-400 tracking-wider">
                Portal de Acceso
              </span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/50 text-[9px] font-mono text-cyan-300 font-bold">
                Hubzi Arena
              </span>
            </div>
            <h2 className="text-xl font-black text-white tracking-wide mt-0.5">
              {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h2>
          </div>
        </div>

        {/* Selector de Pestañas (Login / Registro) */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-900/90 border border-slate-700/80 mb-5">
          <button
            type="button"
            onClick={() => handleToggleMode('login')}
            className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Ingresar</span>
          </button>
          <button
            type="button"
            onClick={() => handleToggleMode('register')}
            className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Registrarme</span>
          </button>
        </div>

        {/* Mensajes de Alerta / Éxito */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="leading-snug">{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs flex items-center gap-2.5"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="leading-snug">{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          
          {/* Campo Nombre de Usuario (Solo en Registro) */}
          {mode === 'register' && (
            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-400" />
                <span>Nombre o Apodo</span>
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej. Alex, Sofía, Mateo..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 focus:border-purple-400 focus:outline-none text-white text-xs font-medium placeholder:text-slate-500 transition-colors"
              />
            </div>
          )}

          {/* Campo Correo Electrónico */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-300 font-bold mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              <span>Correo Electrónico</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu.correo@ejemplo.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 focus:border-cyan-400 focus:outline-none text-white text-xs font-medium placeholder:text-slate-500 transition-colors"
            />
          </div>

          {/* Campo Contraseña con Toggle de Ojo */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-300 font-bold mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Contraseña</span>
              </span>
              {mode === 'register' && (
                <span className="text-[10px] text-slate-400 font-normal">Mín. 6 caracteres</span>
              )}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-900/90 border border-slate-700 focus:border-amber-400 focus:outline-none text-white text-xs font-mono placeholder:text-slate-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Opciones de Perfil (Solo en Registro) */}
          {mode === 'register' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3 pt-1 border-t border-slate-800"
            >
              {/* Selector de Género */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-300 font-bold mb-1.5">
                  Sexo / Género
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGender('masculino')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                      gender === 'masculino'
                        ? 'bg-sky-950/80 border-sky-400 text-sky-200 shadow-sm'
                        : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span>Hombre</span>
                    <span className="text-[9px] font-mono text-pink-400">Voz Capi Fem.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGender('femenino')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                      gender === 'femenino'
                        ? 'bg-rose-950/80 border-rose-400 text-rose-200 shadow-sm'
                        : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span>Mujer</span>
                    <span className="text-[9px] font-mono text-cyan-400">Voz Capi Masc.</span>
                  </button>
                </div>
              </div>

              {/* Selector de Edad */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-mono uppercase text-slate-300 font-bold flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Edad: <strong className="text-amber-300">{age} años</strong></span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {parseInt(age, 10) < 18 ? 'Escolar' : parseInt(age, 10) <= 25 ? 'Universitario' : 'Adulto'}
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="70"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Indicador de voz complementaria asignada */}
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-[11px] text-slate-300 font-mono">
                  Asignado: <strong className="text-cyan-300">{assignedVoiceLabel}</strong>
                </span>
              </div>
            </motion.div>
          )}

          {/* Botón de Enviar */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 cursor-pointer ${
                isLoading 
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : mode === 'login'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.4)]'
                  : 'bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white shadow-[0_0_25px_rgba(168,85,247,0.4)]'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  <span>Procesando...</span>
                </div>
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Iniciar Sesión en Hubzi</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Crear Cuenta y Comenzar</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer / Nota de privacidad de documentos */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 text-center">
          <p className="text-[10px] text-slate-400 font-mono flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Tus documentos y carpetas son 100% privados e independientes</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
