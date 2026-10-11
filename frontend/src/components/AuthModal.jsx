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
  Volume2,
  X
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
      setErrorMsg('Por favor introduce un correo electr├│nico v├ílido.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('La contrase├▒a debe tener al menos 6 caracteres.');
      return;
    }

    if (mode === 'register') {
      if (!username.trim() || username.trim().length < 2) {
        setErrorMsg('Por favor introduce tu nombre o apodo (m├¡nimo 2 letras).');
        return;
      }
      const numAge = parseInt(age, 10);
      if (isNaN(numAge) || numAge < 6 || numAge > 110) {
        setErrorMsg('Ingresa una edad v├ílida (entre 6 y 110 a├▒os).');
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
        setSuccessMsg(mode === 'login' ? '┬íBienvenido de vuelta!' : '┬íCuenta creada con ├®xito!');
        
        // Guardar token y usuario
        if (data.token) {
          localStorage.setItem('hubzy_auth_token', data.token);
        }
        localStorage.setItem('hubzy_current_user', JSON.stringify(data.user));

        setTimeout(() => {
          onAuthSuccess(data.user);
        }, 500);
      } else {
        setErrorMsg(data.detail || 'Ocurri├│ un error al procesar tu solicitud.');
      }
    } catch (err) {
      console.warn("Error en autenticaci├│n API, intentando fallback:", err);
      // Fallback local en caso de desconexi├│n moment├ínea de red
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
        className="relative w-full max-w-md rounded-3xl bg-[#122443] border-4 border-[#0a162b] p-6 sm:p-7 text-white shadow-[0_12px_0_#050a13,0_20px_35px_rgba(0,0,0,0.6)] overflow-hidden"
      >
        {/* Glow de fondo */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#FF7A00]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#48C838]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Bot├│n Cerrar (X) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 rounded-2xl bg-[#0a162b] hover:bg-[#1a335e] border-2 border-[#1e3a6c] text-slate-300 hover:text-white shadow-[0_3px_0_#050a13] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          title="Cerrar"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Header con Capibara y T├¡tulo */}
        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b-2 border-[#1e3a6c]">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-3 border-[#FFB400] shadow-[0_4px_0_#D48800] shrink-0 bg-[#0a162b]">
            <img src={capybara3dImg} alt="Capi Guardi├ín" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-black uppercase text-[#FFB400] tracking-wider">
                Portal de Acceso
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#0a162b] border-2 border-[#1e3a6c] text-[9px] font-black text-white uppercase tracking-wider">
                Hubzi Arena
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide mt-0.5 drop-shadow">
              {mode === 'login' ? 'Iniciar Sesi├│n' : 'Crear Cuenta'}
            </h2>
          </div>
        </div>

        {/* Selector de Pesta├▒as (Login / Registro estilo Card Clash) */}
        <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-[#0a162b] border-3 border-[#1e3a6c] mb-5">
          <button
            type="button"
            onClick={() => handleToggleMode('login')}
            className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-[#FF7A00] text-white border-b-3 border-[#D45B00] shadow-[0_2px_0_#050a13]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Ingresar</span>
          </button>
          <button
            type="button"
            onClick={() => handleToggleMode('register')}
            className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-[#48C838] text-white border-b-3 border-[#28871E] shadow-[0_2px_0_#050a13]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Registrarme</span>
          </button>
        </div>

        {/* Mensajes de Alerta / ├ëxito */}
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
                placeholder="Ej. Alex, Sof├¡a, Mateo..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 focus:border-purple-400 focus:outline-none text-white text-xs font-medium placeholder:text-slate-500 transition-colors"
              />
            </div>
          )}

          {/* Campo Correo Electr├│nico */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-300 font-bold mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              <span>Correo Electr├│nico</span>
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

          {/* Campo Contrase├▒a con Toggle de Ojo */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-300 font-bold mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Contrase├▒a</span>
              </span>
              {mode === 'register' && (
                <span className="text-[10px] text-slate-400 font-normal">M├¡n. 6 caracteres</span>
              )}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="ÔÇóÔÇóÔÇóÔÇóÔÇóÔÇóÔÇóÔÇó"
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-900/90 border border-slate-700 focus:border-amber-400 focus:outline-none text-white text-xs font-mono placeholder:text-slate-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title={showPassword ? "Ocultar contrase├▒a" : "Ver contrase├▒a"}
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
              {/* Selector de G├®nero */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-300 font-bold mb-1.5">
                  Sexo / G├®nero
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
                    <span>Edad: <strong className="text-amber-300">{age} a├▒os</strong></span>
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

          {/* Bot├│n de Enviar (Estilo Bot├│n Primario Arcade Card Clash) */}
          <div className="pt-2 space-y-2.5">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 border-3 transition-all cursor-pointer ${
                isLoading 
                  ? 'bg-slate-800 text-slate-500 border-[#1e3a6c] cursor-not-allowed'
                  : mode === 'login'
                  ? 'bg-[#FF7A00] hover:bg-[#ff8c1a] border-[#0a162b] border-b-5 border-b-[#D45B00] text-white shadow-[0_5px_0_#050a13] active:translate-y-1 active:shadow-none'
                  : 'bg-[#48C838] hover:bg-[#57d847] border-[#0a162b] border-b-5 border-b-[#28871E] text-white shadow-[0_5px_0_#050a13] active:translate-y-1 active:shadow-none'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Procesando...</span>
                </div>
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4 text-white" />
                  <span>Iniciar Sesi├│n en Hubzi</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-white" />
                  <span>Crear Cuenta y Comenzar</span>
                </>
              )}
            </button>

            {/* Ingreso Directo sin registrarse (Modo Invitado con Estilo Bot├│n P├¡ldora Marina) */}
            <button
              type="button"
              onClick={() => {
                const guestUser = {
                  id: `guest_${Date.now().toString(36)}`,
                  email: 'invitado@hubzi.app',
                  username: 'Invitado',
                  gender: 'masculino',
                  age: 20,
                  avatar: 'capy_fan',
                  voice_preference: 'auto',
                  assigned_voice_gender: 'female',
                  is_guest: true,
                  created_at: new Date().toISOString()
                };
                localStorage.setItem('hubzy_current_user', JSON.stringify(guestUser));
                setSuccessMsg('┬íIngreso directo concedido! Bienvenido.');
                setTimeout(() => {
                  onAuthSuccess(guestUser);
                }, 400);
              }}
              className="w-full py-2.5 rounded-2xl bg-[#0a162b] hover:bg-[#122443] border-3 border-[#1e3a6c] border-b-4 border-b-[#050a13] text-[#FFB400] text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_3px_0_#050a13] active:translate-y-0.5 active:shadow-none"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FFB400] animate-pulse" />
              <span>Ingresar Directo (Sin Registro / Invitado)</span>
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
