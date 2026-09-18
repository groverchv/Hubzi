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
  ShieldCheck, 
  AlertCircle,
  GraduationCap,
  Volume2,
  VolumeX,
  School,
  Briefcase,
  Play,
  CheckCircle2,
  Zap
} from 'lucide-react';
import capybara3dImg from '../assets/capybara_3d.jpg';
import { capyVoice } from '../utils/capyVoice';

const STUDY_STAGES = [
  {
    id: 'school',
    title: 'Secundaria',
    icon: School,
    defaultAge: 16,
    badge: '12-17 años'
  },
  {
    id: 'college',
    title: 'Universidad',
    icon: GraduationCap,
    defaultAge: 21,
    badge: '18-25 años'
  },
  {
    id: 'professional',
    title: 'Profesional',
    icon: Briefcase,
    defaultAge: 29,
    badge: '26+ años'
  }
];

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  
  // Estados de formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState('masculino');
  const [age, setAge] = useState('21');
  const [studyStage, setStudyStage] = useState('college');
  const [showPassword, setShowPassword] = useState(false);

  // Estados de UI y prueba de voz
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isPreviewSpeaking, setIsPreviewSpeaking] = useState(false);

  if (!isOpen) return null;

  const isMaleUser = gender === 'masculino';
  const assignedVoiceTitle = isMaleUser 
    ? 'Voz Femenina (Dulce y Maternal)' 
    : 'Voz Masculina (Cálida y Protectora)';

  const handleToggleMode = (newMode) => {
    setMode(newMode);
    setErrorMsg(null);
    setSuccessMsg(null);
    capyVoice.stop();
    setIsPreviewSpeaking(false);
  };

  // Probar la voz en tiempo real
  const handleTestVoicePreview = async () => {
    if (isPreviewSpeaking) {
      capyVoice.stop();
      setIsPreviewSpeaking(false);
      return;
    }

    const testName = username.trim() || 'estudiante';
    const previewPhrase = isMaleUser
      ? `¡Hola ${testName}! Soy Capi. Voy a cuidar de tu mente y acompañarte en cada desafío.`
      : `¡Hola ${testName}! Soy Capi. Cuenta conmigo para mantener la calma y superar cada reto.`;

    setIsPreviewSpeaking(true);
    try {
      await capyVoice.speak(previewPhrase, {
        user_gender: gender,
        voice_gender: isMaleUser ? 'female' : 'male',
        profile: 'loving_psychologist'
      });
    } finally {
      setIsPreviewSpeaking(false);
    }
  };

  // Ingreso directo inmediato sin requerir registro previo
  const handleDirectAccess = () => {
    capyVoice.stop();
    let user = null;
    try {
      const saved = localStorage.getItem('hubzy_current_user');
      if (saved) user = JSON.parse(saved);
    } catch (_) {}

    if (!user) {
      user = {
        id: `user_guest_${Date.now()}`,
        email: 'invitado@hubzi.local',
        username: username.trim() || 'Estudiante',
        gender: gender || 'masculino',
        age: parseInt(age, 10) || 21,
        avatar: 'capy_fan',
        voice_preference: 'auto',
        assigned_voice_gender: (gender || 'masculino') === 'masculino' ? 'female' : 'male',
        created_at: 'now'
      };
      localStorage.setItem('hubzy_current_user', JSON.stringify(user));
    }

    setSuccessMsg('Ingreso directo concedido.');
    setTimeout(() => {
      onAuthSuccess(user);
    }, 300);
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
    capyVoice.stop();

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
      console.warn("Error de conexión API, usando modo local:", err);
      const fallbackUser = {
        id: `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email: cleanEmail,
        username: mode === 'register' ? username.trim() : (cleanEmail.split('@')[0] || 'Estudiante'),
        gender: mode === 'register' ? gender : 'masculino',
        age: mode === 'register' ? parseInt(age, 10) : 21,
        avatar: 'capy_fan',
        voice_preference: 'auto',
        assigned_voice_gender: (mode === 'register' ? gender : 'masculino') === 'masculino' ? 'female' : 'male',
        created_at: 'now'
      };
      localStorage.setItem('hubzy_current_user', JSON.stringify(fallbackUser));
      setSuccessMsg('Acceso concedido.');
      setTimeout(() => {
        onAuthSuccess(fallbackUser);
      }, 500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={`relative w-full rounded-2xl bg-[#0f172a] border border-slate-700 p-5 sm:p-6 text-slate-100 shadow-2xl overflow-hidden ${
          mode === 'register' ? 'max-w-xl' : 'max-w-md'
        }`}
      >
        {/* Cabecera limpia y sólida */}
        <div className="flex items-center justify-between gap-4 mb-4 pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden border border-slate-700 shrink-0 bg-slate-800">
              <img src={capybara3dImg} alt="Capi" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-semibold uppercase text-cyan-400">
                Hubzi Arena
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
                {mode === 'login' ? 'Iniciar Sesión' : 'Registro de Cuenta'}
              </h2>
            </div>
          </div>

          {/* Pestañas Sólidas (Sin degradado) */}
          <div className="flex p-1 rounded-xl bg-[#1e293b] border border-slate-700">
            <button
              type="button"
              onClick={() => handleToggleMode('login')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => handleToggleMode('register')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                mode === 'register'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Registro
            </button>
          </div>
        </div>

        {/* Mensajes de Alerta / Éxito */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mb-3.5 p-2.5 rounded-xl bg-red-950/80 border border-red-700 text-red-200 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mb-3.5 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FORMULARIO */}
        {mode === 'login' ? (
          /* ================= LOGIN ================= */
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Correo Electrónico</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu.correo@ejemplo.com"
                className="w-full px-3 py-2 rounded-xl bg-[#1e293b] border border-slate-700 focus:border-blue-500 text-white text-xs placeholder:text-slate-500 transition-colors outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 font-medium mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Contraseña</span>
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 pr-10 rounded-xl bg-[#1e293b] border border-slate-700 focus:border-blue-500 text-white text-xs font-mono placeholder:text-slate-500 transition-colors outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Verificando...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Iniciar Sesión</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* ================= REGISTRO: UN SOLO PASO ================= */
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Fila 1: Nombre y Correo en 2 columnas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Nombre o Apodo</span>
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ej. Martín, Sofía..."
                  className="w-full px-3 py-2 rounded-xl bg-[#1e293b] border border-slate-700 focus:border-blue-500 text-white text-xs placeholder:text-slate-500 transition-colors outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Correo Electrónico</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu.correo@ejemplo.com"
                  className="w-full px-3 py-2 rounded-xl bg-[#1e293b] border border-slate-700 focus:border-blue-500 text-white text-xs placeholder:text-slate-500 transition-colors outline-none"
                />
              </div>
            </div>

            {/* Fila 2: Contraseña */}
            <div>
              <label className="block text-xs text-slate-300 font-medium mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Contraseña</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Mínimo 6 caracteres</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 pr-10 rounded-xl bg-[#1e293b] border border-slate-700 focus:border-blue-500 text-white text-xs font-mono placeholder:text-slate-500 transition-colors outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Fila 3: Sexo / Género */}
            <div>
              <label className="block text-xs text-slate-300 font-medium mb-1">
                Sexo / Género (Para adaptar la voz de Capi)
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setGender('masculino')}
                  className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    gender === 'masculino'
                      ? 'bg-[#1e293b] border-blue-500 text-white'
                      : 'bg-[#1e293b]/60 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>Hombre</span>
                    <span className="text-[10px] text-cyan-400 font-mono">Voz Femenina</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Voz maternal y dulce</p>
                </button>

                <button
                  type="button"
                  onClick={() => setGender('femenino')}
                  className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    gender === 'femenino'
                      ? 'bg-[#1e293b] border-blue-500 text-white'
                      : 'bg-[#1e293b]/60 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>Mujer</span>
                    <span className="text-[10px] text-cyan-400 font-mono">Voz Masculina</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Voz sabia y protectora</p>
                </button>
              </div>
            </div>

            {/* Fila 4: Nivel de Estudio en 3 chips sólidos */}
            <div>
              <label className="block text-xs text-slate-300 font-medium mb-1">
                Nivel Académico
              </label>
              <div className="grid grid-cols-3 gap-2">
                {STUDY_STAGES.map((st) => {
                  const Icon = st.icon;
                  const isSelected = studyStage === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        setStudyStage(st.id);
                        setAge(String(st.defaultAge));
                      }}
                      className={`p-2 rounded-xl border text-center transition-colors cursor-pointer flex flex-col items-center gap-0.5 ${
                        isSelected
                          ? 'bg-[#1e293b] border-blue-500 text-white'
                          : 'bg-[#1e293b]/60 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-xs font-semibold">{st.title}</span>
                      <span className="text-[9px] text-slate-400">{st.badge}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fila 5: Barra sólida de prueba de voz */}
            <div className="p-2.5 rounded-xl bg-[#1e293b] border border-slate-700 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Volume2 className={`w-4 h-4 text-cyan-400 ${isPreviewSpeaking ? 'animate-pulse' : ''}`} />
                <span className="text-xs text-slate-200">
                  {assignedVoiceTitle}
                </span>
              </div>

              <button
                type="button"
                onClick={handleTestVoicePreview}
                className={`px-3 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isPreviewSpeaking
                    ? 'bg-red-900 border-red-700 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 border-slate-600 text-white'
                }`}
              >
                {isPreviewSpeaking ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>Pausar</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current" />
                    <span>Probar Voz</span>
                  </>
                )}
              </button>
            </div>

            {/* Botón de Submit Registro (Sólido) */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Creando cuenta...</span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Crear Cuenta</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Botón de Ingreso Directo (Sólido, sin degradado) */}
        <div className="mt-3.5 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={handleDirectAccess}
            className="w-full py-2.5 px-4 rounded-xl bg-[#1e293b] hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Ingreso Directo</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-2.5 text-center">
          <p className="text-[10px] text-slate-500 font-mono flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-slate-400" />
            <span>Tus carpetas de estudio son 100% privadas</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
