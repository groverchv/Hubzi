import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Users, LogIn, Sparkles, Copy, Check, ArrowRight, ShieldCheck, Gamepad2 } from 'lucide-react';

export default function GameModeModal({ isOpen, onSelectMode }) {
  const [view, setView] = useState('select'); // 'select' | 'create_room' | 'join_room'
  const [createdRoomCode, setCreatedRoomCode] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generar código de sala amigable (ej: "HUB-7429")
  const handleGenerateRoom = () => {
    const randomCode = `HUB-${Math.floor(1000 + Math.random() * 9000)}`;
    setCreatedRoomCode(randomCode);
    setView('create_room');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(createdRoomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. Iniciar en Modo Solo -> Directo a subir documentos
  const handleStartSolo = () => {
    onSelectMode({
      mode: 'solo',
      roomId: 'sala-solo',
      isHost: true,
      needsUpload: true, // Debe subir documentos
    });
  };

  // 2. Iniciar como Creador de Sala 1v1 -> Con el código listo, pasa a subir documentos
  const handleConfirmHostRoom = () => {
    onSelectMode({
      mode: '1v1',
      roomId: createdRoomCode,
      isHost: true,
      needsUpload: true, // El anfitrión sube los documentos para la batalla
    });
  };

  // 3. Unirse a Sala 1v1 con Código -> Se conecta directamente a la sala del host
  const handleJoinWithCode = (e) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;

    onSelectMode({
      mode: '1v1',
      roomId: joinCodeInput.trim().toUpperCase(),
      isHost: false,
      needsUpload: false, // El invitado entra directo al tablero del host
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 320, damping: 25 }}
          className="relative w-full max-w-xl rounded-[2.5rem] bg-[#162032] border-4 border-[#2d3f5d] shadow-[0_25px_60px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.1)] overflow-hidden text-slate-100 p-6 sm:p-8 flex flex-col"
        >
          {/* Cabecera */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-400/60 flex items-center justify-center shadow-[0_4px_0_#78350f]">
              <Gamepad2 className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                <Gamepad2 className="w-3 h-3 text-emerald-400" />
                Modo de Partida
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
                ¿Cómo quieres jugar hoy?
              </h2>
              <p className="text-xs text-slate-400">
                Elige tu estilo de juego para comenzar a aprender sin estrés.
              </p>
            </div>
          </div>

          {/* VISTA 1: MENÚ PRINCIPAL (SOLO, CREAR 1v1, UNIRSE A SALA) */}
          {view === 'select' && (
            <div className="space-y-3.5">
              {/* Opción 1: Jugar Solo */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartSolo}
                className="w-full p-4 rounded-3xl bg-[#141d2c] hover:bg-[#1a263a] border-2 border-[#223147] hover:border-emerald-400/80 flex items-center justify-between text-left transition-all shadow-md group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400/50 flex items-center justify-center text-emerald-300 group-hover:scale-105 transition-transform shadow-[0_3px_0_#065f46]">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                      Aventura en Solitario
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Paso a paso
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Sube tu material y entrena a tu ritmo con el Capi Zen.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </motion.button>

              {/* Opción 2: Crear Sala 1v1 (Generar Código) */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerateRoom}
                className="w-full p-4 rounded-3xl bg-[#141d2c] hover:bg-[#1a263a] border-2 border-[#223147] hover:border-sky-400/80 flex items-center justify-between text-left transition-all shadow-md group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border-2 border-sky-400/50 flex items-center justify-center text-sky-300 group-hover:scale-105 transition-transform shadow-[0_3px_0_#0369a1]">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                      Crear Batalla 1 vs 1
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40">
                        Host
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Genera una clave de sala, sube el material y desafía a un amigo.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
              </motion.button>

              {/* Opción 3: Unirse a Sala con Código */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView('join_room')}
                className="w-full p-4 rounded-3xl bg-[#141d2c] hover:bg-[#1a263a] border-2 border-[#223147] hover:border-amber-400/80 flex items-center justify-between text-left transition-all shadow-md group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-400/50 flex items-center justify-center text-amber-300 group-hover:scale-105 transition-transform shadow-[0_3px_0_#78350f]">
                    <LogIn className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                      Unirse a una Partida
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Con Código
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Ingresa el código que te compartió tu amigo para competir juntos.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </motion.button>
            </div>
          )}

          {/* VISTA 2: CÓDIGO GENERADO PARA 1v1 (HOST) */}
          {view === 'create_room' && (
            <div className="space-y-5 text-center">
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700 shadow-md">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                  Código de Sala Generado
                </span>
                
                <div className="my-3 flex items-center justify-center gap-3">
                  <span className="text-3xl sm:text-4xl font-black font-mono tracking-wider text-emerald-400 px-5 py-2.5 rounded-xl bg-slate-950 border-2 border-emerald-500/60 shadow-inner">
                    {createdRoomCode}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 transition-colors shadow-xs"
                    title="Copiar Código"
                  >
                    {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>

                <p className="text-xs text-slate-400">
                  Comparte este código con tu compañero. Al ingresarlo, ambos se sincronizarán en la misma partida.
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => setView('select')}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Volver Atrás
                </button>

                <button
                  onClick={handleConfirmHostRoom}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-95"
                >
                  <span>Continuar a Subir Documentos</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* VISTA 3: UNIRSE CON CÓDIGO (INVITADO) */}
          {view === 'join_room' && (
            <form onSubmit={handleJoinWithCode} className="space-y-5 text-center">
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700 shadow-md">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                  Ingresa el Código de la Sala
                </span>
                
                <input
                  type="text"
                  placeholder="EJ: HUB-4821"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  className="w-full max-w-xs mx-auto my-3 block text-center text-2xl font-black font-mono tracking-widest bg-slate-950 border-2 border-emerald-500/60 rounded-xl px-4 py-2.5 text-emerald-400 placeholder:text-slate-600 focus:outline-none focus:border-emerald-400 shadow-inner"
                  autoFocus
                />

                <p className="text-xs text-slate-400">
                  Entrarás directamente al tablero creado por tu compañero sin tener que subir archivos de nuevo.
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setView('select')}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Volver Atrás
                </button>

                <button
                  type="submit"
                  disabled={!joinCodeInput.trim()}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-95 disabled:opacity-50"
                >
                  <span>Unirme a la Batalla</span>
                  <Gamepad2 className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
