import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

/**
 * Destino del enlace de verificación de cuenta: /verify-email?token=...
 */
export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [state, setState] = useState('loading'); // loading | ok | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setState('error');
      setMessage('El enlace no contiene un token de verificación.');
      return;
    }
    fetch('/api/v1/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setState('ok');
          setMessage(data.detail || 'Correo verificado correctamente.');
        } else {
          setState('error');
          setMessage(data.detail || 'El enlace es inválido o expiró.');
        }
      })
      .catch(() => {
        setState('error');
        setMessage('No se pudo contactar al servidor.');
      });
  }, [params]);

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-[#0a162b] text-white font-sans">
      <div className="max-w-sm w-full mx-4 p-8 rounded-3xl bg-[#122443] border-4 border-[#0a162b] text-center shadow-[0_12px_0_#050a13]">
        {state === 'loading' && (
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
        )}
        {state === 'ok' && <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />}
        {state === 'error' && <XCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />}
        <h1 className="text-xl font-black uppercase tracking-wide mb-2">
          {state === 'loading' ? 'Verificando…' : state === 'ok' ? '¡Cuenta verificada!' : 'Enlace inválido'}
        </h1>
        <p className="text-sm text-slate-300 mb-6">{message}</p>
        <Link
          to="/"
          className="inline-block px-6 py-3 rounded-2xl bg-[#FF7A00] border-b-4 border-[#D45B00] font-black text-xs uppercase tracking-wider hover:bg-[#ff8c1a] transition-colors"
        >
          Ir a Hubzi
        </Link>
      </div>
    </div>
  );
}
