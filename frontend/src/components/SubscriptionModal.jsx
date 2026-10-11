import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crown, 
  Check, 
  Zap, 
  Sparkles, 
  ShieldCheck, 
  X, 
  CreditCard, 
  ExternalLink,
  Flame,
  BookOpen,
  Users
} from 'lucide-react';
import capybara3dImg from '../assets/capybara_3d.jpg';

export default function SubscriptionModal({
  isOpen,
  onClose,
  currentUser,
  onSubscriptionSuccess
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const isPro = currentUser?.plan === 'pro';

  const handleStripeCheckout = async () => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/v1/payments/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser?.id || 'guest_user',
          email: currentUser?.email || 'estudiante@hubzi.app',
          plan_id: 'pro_monthly',
          success_url: window.location.origin + '/?payment=success',
          cancel_url: window.location.origin + '/?payment=cancelled'
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Error al iniciar checkout con Stripe.');
      }

      const data = await res.json();
      if (data.checkout_url) {
        // Redirige directamente al portal seguro alojado por Stripe
        window.location.href = data.checkout_url;
      } else {
        throw new Error('No se recibió la URL de pago de Stripe.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'No se pudo conectar con Stripe.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md select-none font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg rounded-3xl bg-[#122443] border-4 border-[#0a162b] p-6 sm:p-7 text-white shadow-[0_16px_0_#050a13,0_25px_50px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        {/* Glow dorado de fondo */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-[#FFB400]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-[#FF7A00]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Botón Cerrar (X) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-2xl bg-[#0a162b] hover:bg-[#1a335e] border-2 border-[#1e3a6c] text-slate-300 hover:text-white shadow-[0_3px_0_#050a13] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          title="Cerrar"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Cabecera con Capi y Badge Pro */}
        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b-2 border-[#1e3a6c]">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-3 border-[#FFB400] shadow-[0_4px_0_#D48800] shrink-0 bg-[#0a162b]">
            <img src={capybara3dImg} alt="Capi Pro" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#0a162b] border-2 border-[#FFB400] mb-1">
              <Crown className="w-3.5 h-3.5 text-[#FFB400]" />
              <span className="text-[10px] font-black uppercase text-[#FFB400] tracking-wider">
                HUBZY ESTUDIANTE PRO
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide leading-tight">
              Desbloquea el Potencial Ilimitado
            </h2>
          </div>
        </div>

        {/* Cuadro de Precio Accesible para Universitarios */}
        <div className="p-4 rounded-2xl bg-[#0a162b] border-3 border-[#1e3a6c] mb-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Suscripción Mensual
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl sm:text-4xl font-black text-[#FFB400] drop-shadow">
                $2.99
              </span>
              <span className="text-xs font-bold text-slate-300">
                USD / mes <span className="text-emerald-400">(~20 Bs)</span>
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-black uppercase text-emerald-300">
              Paga con Stripe Seguro
            </span>
          </div>
        </div>

        {/* Comparativa de Beneficios */}
        <div className="space-y-2.5 mb-6 text-xs font-bold">
          {[
            { text: 'Subida ILIMITADA de PDFs y libros de texto densos', highlight: true },
            { text: 'Acceso completo a los 5 Niveles de dificultad en la Arena', highlight: true },
            { text: 'Voz interactiva y psicología empática sin pausas con Capi IA', highlight: true },
            { text: 'Modo multijugador 1v1 para competir con compañeros de clase', highlight: false },
            { text: 'Sin límites de preguntas por simulacro ni colas de espera', highlight: false }
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2.5 text-slate-200">
              <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${
                item.highlight ? 'bg-[#48C838] text-white shadow-[0_2px_0_#28871E]' : 'bg-[#1e3a6c] text-cyan-300'
              }`}>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span>{item.text}</span>
            </div>
          ))}
        </div>

        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-500/20 border-2 border-rose-500 text-rose-200 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        {/* Botón de Pago con Stripe */}
        {isPro ? (
          <div className="p-3.5 rounded-2xl bg-[#48C838]/20 border-2 border-[#48C838] text-center">
            <span className="text-sm font-black text-emerald-300 uppercase tracking-wide flex items-center justify-center gap-2">
              <Check className="w-5 h-5" /> ¡Tu cuenta ya es Hubzy Pro!
            </span>
          </div>
        ) : (
          <button
            type="button"
            disabled={isLoading}
            onClick={handleStripeCheckout}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#FF7A00] hover:bg-[#ff8c1a] border-3 border-[#0a162b] border-b-5 border-b-[#D45B00] text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-3 shadow-[0_6px_0_#050a13] active:translate-y-1 active:shadow-none transition-all cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Conectando con Stripe...</span>
              </div>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                <span>Activar Plan Pro con Stripe ($2.99 USD)</span>
                <ExternalLink className="w-4 h-4 opacity-80" />
              </>
            )}
          </button>
        )}

        {/* Garantía y seguridad */}
        <p className="mt-3 text-[10px] text-center text-slate-400 font-bold flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Procesado de forma 100% segura y encriptada por Stripe Checkout. Cancela en cualquier momento.
        </p>
      </motion.div>
    </div>
  );
}
