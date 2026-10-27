import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, ShieldCheck, FileText, RefreshCw, Cookie, Building2 } from 'lucide-react';

export default function LegalModal({ isOpen, onClose, initialTab = 'terms' }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="relative w-full max-w-lg sm:max-w-2xl bg-[#0c1526] border-2 border-slate-700/70 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col text-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-[#0a1424]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white tracking-wide">
                Centro Legal y Transparencia
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400">
                Hubzy (SynapseHub) · Cumplimiento Normativo y Protección
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs (Sin scrollbar nativa fea) */}
        <div className="px-5 pt-3 pb-2 bg-[#08101e]/70 border-b border-slate-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {[
              { id: 'terms', label: 'Términos', icon: FileText, color: 'text-amber-400' },
              { id: 'privacy', label: 'Privacidad', icon: ShieldCheck, color: 'text-emerald-400' },
              { id: 'refunds', label: 'Reembolsos', icon: RefreshCw, color: 'text-cyan-400' },
              { id: 'cookies', label: 'Cookies', icon: Cookie, color: 'text-purple-400' },
              { id: 'business', label: 'Datos Empresa', icon: Building2, color: 'text-blue-400' }
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                    active
                      ? 'bg-[var(--color-arcade-navy)] text-white border-amber-400/80 shadow-[0_2px_8px_rgba(255,180,0,0.25)]'
                      : 'bg-slate-900/40 text-slate-400 border-slate-800/80 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? tab.color : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area con scrollbar compacta y estilizada */}
        <div className="px-5 py-4 overflow-y-auto space-y-3 text-xs text-slate-300 leading-relaxed max-h-[50vh] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/60 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-600">
          {activeTab === 'terms' && (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-white">Términos y Condiciones de Uso</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Última actualización: Octubre 2026. Al usar Hubzy, aceptas los siguientes términos:</p>
              </div>
              
              <div className="p-3 rounded-xl bg-[var(--color-arcade-navy-deep)] border border-slate-800/90">
                <h4 className="font-bold text-amber-300 mb-0.5 text-xs">1. Objeto del Servicio</h4>
                <p className="text-[11.5px] leading-relaxed text-slate-300">Hubzy es un entorno web de gamificación y microaprendizaje para estudiantes. Transforma apuntes y documentos en circuitos interactivos de preguntas y cartas conceptuales para afianzar el conocimiento de forma amigable y sin estrés.</p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--color-arcade-navy-deep)] border border-slate-800/90">
                <h4 className="font-bold text-amber-300 mb-0.5 text-xs">2. Propiedad Intelectual de tus Documentos</h4>
                <p className="text-[11.5px] leading-relaxed text-slate-300">Tus apuntes, diapositivas y textos siguen siendo 100% de tu propiedad. Hubzy no vende, no comercializa ni reclama derechos de autor sobre el material académico que subes a tu cuenta personal.</p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--color-arcade-navy-deep)] border border-slate-800/90">
                <h4 className="font-bold text-amber-300 mb-0.5 text-xs">3. Uso Responsable</h4>
                <p className="text-[11.5px] leading-relaxed text-slate-300">El usuario se compromete a no subir contenido ilícito, programas maliciosos ni material protegido que no tenga autorización de utilizar con fines de estudio personal.</p>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-white">Política de Privacidad y Protección de Datos</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Tu privacidad es fundamental. Cumplimos con estándares de protección de datos (RGPD / CCPA):</p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--color-arcade-navy-deep)] border border-slate-800/90">
                <h4 className="font-bold text-emerald-300 mb-0.5 text-xs">1. Qué Datos Recopilamos</h4>
                <p className="text-[11.5px] leading-relaxed text-slate-300">Únicamente recopilamos los datos estrictamente necesarios para tu experiencia de estudio: nombre o apodo, correo electrónico para inicio de sesión, y preferencias opcionales de voz para Hubzi.</p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--color-arcade-navy-deep)] border border-slate-800/90">
                <h4 className="font-bold text-emerald-300 mb-0.5 text-xs">2. Cero Venta de Información</h4>
                <p className="text-[11.5px] leading-relaxed text-slate-300">Bajo ninguna circunstancia vendemos ni compartimos tus datos personales ni tus documentos con anunciantes ni entidades externas.</p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--color-arcade-navy-deep)] border border-slate-800/90">
                <h4 className="font-bold text-emerald-300 mb-0.5 text-xs">3. Seguridad de Almacenamiento</h4>
                <p className="text-[11.5px] leading-relaxed text-slate-300">Tus carpetas de estudio están aisladas por tu ID de usuario en bases de datos protegidas con cifrado en reposo y en tránsito (HTTPS / TLS).</p>
              </div>
            </div>
          )}

          {activeTab === 'refunds' && (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-white">Facturación, Cancelaciones y Reembolsos</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Transparencia absoluta en transacciones procesadas mediante <strong>Stripe</strong>:</p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--color-arcade-navy-deep)] border border-slate-800/90">
                <h4 className="font-bold text-cyan-300 mb-0.5 text-xs">1. Suscripción Plan PRO ($2.99 USD / mes)</h4>
                <p className="text-[11.5px] leading-relaxed text-slate-300">Acceso ilimitado a análisis de documentos extensos, OCR multimodal, modos de juego avanzados y voz personalizada de Hubzi.</p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--color-arcade-navy-deep)] border border-slate-800/90">
                <h4 className="font-bold text-cyan-300 mb-0.5 text-xs">2. Cancelación Inmediata con un Clic</h4>
                <p className="text-[11.5px] leading-relaxed text-slate-300">Puedes cancelar tu suscripción en cualquier momento desde tu perfil o el portal de Stripe. No hay contratos forzosos ni penalizaciones. Mantienes tu acceso hasta el final del periodo facturado.</p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--color-arcade-navy-deep)] border border-slate-800/90">
                <h4 className="font-bold text-cyan-300 mb-0.5 text-xs">3. Garantía de Reembolso de 7 Días</h4>
                <p className="text-[11.5px] leading-relaxed text-slate-300">Si durante los primeros 7 días experimentas cualquier falla técnica o el servicio no cumple con tus expectativas, contáctanos a soporte para un reembolso del 100%.</p>
              </div>
            </div>
          )}

          {activeTab === 'cookies' && (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-white">Cookies y Almacenamiento Local</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Usamos exclusivamente almacenamiento local esencial (`localStorage`) y cookies técnicas:</p>
              </div>
              
              <div className="p-3 rounded-xl bg-[var(--color-arcade-navy-deep)] border border-slate-800/90 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                  <p className="text-[11.5px]"><strong className="text-white">Cookies de Sesión:</strong> Para mantenerte autenticado de forma segura sin pedir login en cada pantalla.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                  <p className="text-[11.5px]"><strong className="text-white">Almacenamiento Local:</strong> Para recordar tus preferencias de volumen, avatar elegido y progreso de estudio de forma ágil.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                  <p className="text-[11.5px]"><strong className="text-white">Cero Rastreadores Invasivos:</strong> No compartimos ni vendemos tu actividad a redes publicitarias.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'business' && (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-white">Información del Negocio y Contacto</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Datos de contacto y transparencia institucional:</p>
              </div>
              
              <div className="p-3.5 rounded-xl bg-[var(--color-arcade-navy-deep)] border border-slate-800/90 space-y-1.5 text-[11.5px]">
                <p><strong className="text-white">Plataforma:</strong> Hubzy (Proyecto SynapseHub)</p>
                <p><strong className="text-white">Operador:</strong> Grover Choquevillca & Equipo SynapseHub</p>
                <p><strong className="text-white">Contacto de Soporte:</strong> contacto@hubzy.app</p>
                <p><strong className="text-white">Pasarela de Pagos:</strong> Stripe Payments Inc. (Certificación PCI-DSS Nivel 1)</p>
                <p><strong className="text-white">Jurisdicción:</strong> Estándares de comercio electrónico y protección al consumidor.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-[#0a1424] text-[11px] text-slate-400">
          <span>Hubzy © {new Date().getFullYear()} · Todos los derechos reservados.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[var(--color-arcade-orange)] hover:bg-[var(--color-arcade-orange-bright)] border-b-3 border-[var(--color-arcade-orange-shadow)] text-white font-black text-xs uppercase tracking-wider shadow-md active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </motion.div>
    </div>
  );
}
