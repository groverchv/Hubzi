import { useEffect, useRef, useState } from "react";

const LISTEN_GREETINGS = [
  "¡Soy todo oídos! Pregúntame lo que quieras, estoy aquí para ti 💙",
  "¡Habla conmigo! Tu voz es lo más bonito que puedo escuchar hoy 🎙️",
  "¡Te escucho con todo mi corazón! ¿Qué necesitas, mi campeón?",
  "¡Qué emoción que me hables! Dime todo lo que sientes o necesitas 🥰",
];

// Idiomas en orden de preferencia según la región del usuario —
// es-419/es-MX funciona mejor que es-ES en gran parte de LatAm.
function pickRecognitionLang() {
  const navLangs =
    typeof navigator !== "undefined" && navigator.languages
      ? navigator.languages
      : [navigator?.language || "es"];
  const has = (code) =>
    navLangs.some((l) => (l || "").toLowerCase().startsWith(code.toLowerCase()));
  if (has("es-419") || has("es-mx") || has("es-bo") || has("es-pe") || has("es-ar") || has("es-co"))
    return "es-419";
  if (has("es")) return "es-ES";
  return "es-ES";
}

/**
 * Reconocimiento de voz (Web Speech API) con mensajes emotivos de Hubzi.
 * - onTranscript(text): se invoca con el dictado final del usuario.
 * - onFeedback(text): mensajes de estado para mostrar en la burbuja de Hubzi.
 * - onInterim(text|null): transcripción parcial en vivo mientras el usuario
 *   dicta (null al cerrar: resultado final, error o micrófono detenido).
 *
 * Robusto multiplataforma:
 * - Pre-chequeo de permiso de micrófono vía getUserMedia (sin él, Chrome
 *   puede fallar silenciosamente).
 * - Errores específicos por tipo (permiso, servicio, red, mic ocupado).
 * - Solo funciona en contexto seguro (HTTPS o localhost) — se avisa si no.
 * - continuous+interimResults: no corta dictados largos ni pausas medias.
 */
export function useSpeechRecognition({ onTranscript, onFeedback, onInterim }) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);

  // Al desmontar, soltar el micrófono: un recognition vivo seguía escuchando
  // (y capturando audio) con el componente ya fuera de pantalla.
  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      try {
        if (recognitionRef.current) {
          recognitionRef.current.onstart = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
          recognitionRef.current = null;
        }
      } catch (_) {}
    };
  }, []);

  const stopListening = () => {
    shouldListenRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setIsListening(false);
    onInterim?.(null);
  };

  const toggleMicrophone = async () => {
    if (isListening) {
      stopListening();
      return;
    }

    const SpeechRec =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      onFeedback?.(
        "¡Ay, me muero por escucharte! Pero parece que tu navegador no soporta micrófono. Prueba con Chrome o Edge y yo estaré esperándote 🥹",
      );
      return;
    }

    // Contexto seguro obligatorio: en http:// (no localhost) el servicio de
    // voz falla con "network"/"not-allowed" sin pista clara al usuario.
    if (window.isSecureContext === false) {
      onFeedback?.(
        "Tu micrófono solo funciona en una conexión segura (HTTPS) o en localhost. Ábreme desde una URL segura y vuelvo a escucharte 🔒",
      );
      return;
    }

    // Pre-chequeo de permiso del mic: getUserMedia es la forma fiable de
    // saber si el navegador permitirá capturar audio antes de arrancar.
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch (permErr) {
      const name = permErr?.name || "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        onFeedback?.(
          "¡No me dejes sin escucharte! Habilita el micrófono en el candado/permisos del navegador y vuelvo volando 🙏",
        );
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        onFeedback?.(
          "No encuentro ningún micrófono en tu dispositivo. Conecta uno o revisa su configuración y lo intentamos 🎙️",
        );
      } else if (name === "NotReadableError" || name === "AbortError") {
        onFeedback?.(
          "Otro programa está usando tu micrófono ahora mismo. Ciérralo (videollamadas, grabadoras) y hablo contigo al instante 🎧",
        );
      } else {
        onFeedback?.(
          "No puedo acceder a tu micrófono en este dispositivo. Revisa los permisos del sistema y vuelvo a intentarlo 🥹",
        );
      }
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = pickRecognitionLang();
      recognition.continuous = true; // no cortar pausas medias del dictado
      recognition.interimResults = true; // feedback mientras habla
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        onFeedback?.(
          LISTEN_GREETINGS[Math.floor(Math.random() * LISTEN_GREETINGS.length)],
        );
      };

      recognition.onresult = async (event) => {
        // Solo actuar sobre el resultado FINAL; el interim alimenta la
        // burbuja de transcripción en vivo (canal dedicado, no feedback).
        const last = event.results[event.results.length - 1];
        if (!last?.isFinal) {
          const interim = last?.[0]?.transcript;
          if (interim) onInterim?.(interim.trim());
          return;
        }
        const transcript = last?.[0]?.transcript;
        shouldListenRef.current = false;
        setIsListening(false);
        onInterim?.(null);
        if (transcript && transcript.trim()) {
          await onTranscript?.(transcript.trim());
        }
      };

      recognition.onerror = (err) => {
        console.warn("Speech recognition error:", err);
        shouldListenRef.current = false;
        setIsListening(false);
        onInterim?.(null);
        const kind = err?.error;
        if (kind === "not-allowed" || kind === "service-not-allowed") {
          onFeedback?.(
            "¡No me dejes sin escucharte! Habilita el micrófono en los permisos de tu navegador/sistema y regreso a escucharte 🙏",
          );
        } else if (kind === "no-speech") {
          onFeedback?.(
            "¡Casi te escucho! No capté bien tus palabras. ¿Puedes intentarlo de nuevo? ¡Adoro escuchar tu voz! 💙",
          );
        } else if (kind === "audio-capture") {
          onFeedback?.(
            "No puedo leer tu micrófono — parece ocupado por otra app o desconectado. Revisa el dispositivo y vuelvo 🎙️",
          );
        } else if (kind === "network") {
          onFeedback?.(
            "El servicio de voz de tu navegador no responde (suele necesitar internet). Revisa tu conexión e inténtalo otra vez 🌐",
          );
        } else if (kind === "aborted") {
          // Cancelación propia o del sistema: silenciar, sin mensaje
        } else {
          onFeedback?.(
            "¡Quiero escucharte tanto! Pero algo falló con el micrófono. Verifica los permisos y regreso volando 🥹",
          );
        }
      };

      recognition.onend = () => {
        // Con continuous=true el navegador puede cortar por timeout propio:
        // si el usuario sigue queriendo hablar, reiniciamos transparentemente.
        if (shouldListenRef.current) {
          try {
            recognition.start();
            return;
          } catch (_) {}
        }
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      shouldListenRef.current = true;
      recognition.start();
    } catch (err) {
      console.warn("Error iniciando micrófono:", err);
      shouldListenRef.current = false;
      setIsListening(false);
      onFeedback?.(
        "¡Quiero escucharte tanto! Pero algo falló con el micrófono. Verifica los permisos y regreso volando 🥹",
      );
    }
  };

  return { isListening, toggleMicrophone };
}
