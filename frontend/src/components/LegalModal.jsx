import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, FileText, RefreshCw, Cookie, Building2, ExternalLink } from 'lucide-react';

export default function LegalModal({ isOpen, onClose, initialTab = 'terms' }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-400/40 flex items-center justify-center text-orange-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-wide">Centro Legal y Transparencia</h2>
              <p className="text-xs text-slate-400">Hubzy (SynapseHub) · Cumplimiento Normativo y Protección al Usuario</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 gap-2 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'terms', label: 'Términos y Condiciones', icon: FileText },
            { id: 'privacy', label: 'Política de Privacidad', icon: ShieldCheck },
            { id: 'refunds', label: 'Reembolsos y Pagos', icon: RefreshCw },
            { id: 'cookies', label: 'Cookies y Datos', icon: Cookie },
            { id: 'business', label: 'Datos del Negocio', icon: Building2 }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 transition-all whitespace-nowrap ${
                  active
                    ? 'border-orange-400 text-orange-300 font-bold bg-orange-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed max-h-[60vh]">
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Términos y Condiciones de Uso</h3>
              <p>Última actualización: Octubre 2026. Al utilizar la plataforma <strong>Hubzy</strong>, aceptas los siguientes términos:</p>
              
              <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                <h4 className="font-bold text-orange-300 mb-1">1. Objeto del Servicio</h4>
                <p>Hubzy es un entorno web de gamificación y microaprendizaje para estudiantes. Transforma apuntes y documentos académicos en circuitos interactivos de preguntas y cartas conceptuales para afianzar el conocimiento de forma amigable y sin estrés.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                <h4 className="font-bold text-orange-300 mb-1">2. Propiedad Intelectual de tus Documentos</h4>
                <p>Tus apuntes, diapositivas y textos siguen siendo 100% de tu propiedad. Hubzy no vende, no comercializa ni reclama derechos de autor sobre el material académico que subes a tu cuenta personal.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                <h4 className="font-bold text-orange-300 mb-1">3. Uso Responsable</h4>
                <p>El usuario se compromete a no subir contenido ilícito, programas maliciosos ni material protegido que no tenga autorización de utilizar con fines de estudio personal.</p>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Política de Privacidad y Protección de Datos</h3>
              <p>Tu privacidad es un pilar fundamental en Hubzy. Cumplimos con las mejores prácticas globales (RGPD / CCPA):</p>

              <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                <h4 className="font-bold text-emerald-300 mb-1">1. Qué Datos Recopilamos</h4>
                <p>Únicamente recopilamos los datos estrictamente necesarios para tu experiencia de estudio: nombre o apodo, correo electrónico para inicio de sesión, y preferencias opcionales de voz para Capy.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                <h4 className="font-bold text-emerald-300 mb-1">2. Cero Venta de Información</h4>
                <p>Bajo ninguna circunstancia vendemos ni compartimos tus datos personales ni tus documentos con anunciantes ni entidades externas.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                <h4 className="font-bold text-emerald-300 mb-1">3. Seguridad de Almacenamiento</h4>
                <p>Tus carpetas de estudio están aisladas por tu ID de usuario en bases de datos protegidas con cifrado en reposo y en tránsito (HTTPS / TLS).</p>
              </div>
            </div>
          )}

          {activeTab === 'refunds' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Política de Facturación, Cancelaciones y Reembolsos</h3>
              <p>Garantizamos transparencia absoluta en todas las transacciones procesadas mediante <strong>Stripe</strong>:</p>

              <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                <h4 className="font-bold text-cyan-300 mb-1">1. Suscripción Plan PRO ($2.99 USD / mes)</h4>
                <p>El Plan PRO te otorga acceso ilimitado a análisis de documentos extensos, OCR multimodal de apuntes manuscritos, modos de juego avanzados y voz personalizada de Capy.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                <h4 className="font-bold text-cyan-300 mb-1">2. Cancelación Inmediata</h4>
                <p>Puedes cancelar tu suscripción en cualquier momento con un solo clic desde tu perfil o el portal de Stripe. No hay contratos forzosos ni penalizaciones. Mantendrás tu acceso PRO hasta el final del periodo facturado.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                <h4 className="font-bold text-cyan-300 mb-1">3. Garantía de Reembolso de 7 Días</h4>
                <p>Si durante los primeros 7 días de tu suscripción experimentas cualquier falla técnica o el servicio no cumple con lo prometido, contáctanos a soporte para un reembolso del 100% sin preguntas.</p>
              </div>
            </div>
          )}

          {activeTab === 'cookies' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Política de Cookies y Almacenamiento Local</h3>
              <p>En Hubzy usamos cookies técnicas y almacenamiento local esencial (`localStorage`):</p>
              
              <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                <li><strong>Cookies de Sesión:</strong> Para mantenerte autenticado de forma segura.</li>
                <li><strong>Almacenamiento Local:</strong> Para guardar tus preferencias de volumen, avatar elegido y progreso de estudio sin recargas lentas.</li>
                <li><strong>Cero Rastreadores Invasivos:</strong> No usamos cookies de terceros para seguimiento publicitario invasivo.</li>
              </ul>
            </div>
          )}

          {activeTab === 'business' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Información del Negocio y Contacto</h3>
              
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <p><strong>Plataforma:</strong> Hubzy (Proyecto SynapseHub)</p>
                <p><strong>Operador:</strong> Grover Choquevillca & Equipo SynapseHub</p>
                <p><strong>Contacto de Soporte:</strong> contacto@hubzy.app</p>
                <p><strong>Pasarela de Pagos Oficial:</strong> Stripe Payments Inc. (Certificación PCI-DSS Nivel 1)</p>
                <p><strong>Jurisdicción:</strong> Cumplimiento con estándares internacionales de comercio electrónico y protección al consumidor.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90 text-xs text-slate-400">
          <span>Hubzy © {new Date().getFullYear()} · Todos los derechos reservados.</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-lg shadow-orange-500/20"
          >
            Entendido
          </button>
        </div>
      </motion.div>
    </div>
  );
}
