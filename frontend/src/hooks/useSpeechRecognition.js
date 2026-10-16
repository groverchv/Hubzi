import { useRef, useState } from "react";

const LISTEN_GREETINGS = [
  "¡Soy todo oídos! Pregúntame lo que quieras, estoy aquí para ti 💙",
  "¡Habla conmigo! Tu voz es lo más bonito que puedo escuchar hoy 🎙️",
  "¡Te escucho con todo mi corazón! ¿Qué necesitas, mi campeón?",
  "¡Qué emoción que me hables! Dime todo lo que sientes o necesitas 🥰",
];

/**
 * Reconocimiento de voz (Web Speech API) con mensajes emotivos de Capi.
 * - onTranscript(text): se invoca con el dictado final del usuario.
 * - onFeedback(text): mensajes de estado para mostrar en la burbuja de Capi.
 */
export function useSpeechRecognition({ onTranscript, onFeedback }) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const toggleMicrophone = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setIsListening(false);
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

    try {
      const recognition = new SpeechRec();
      recognition.lang = "es-ES";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        onFeedback?.(
          LISTEN_GREETINGS[Math.floor(Math.random() * LISTEN_GREETINGS.length)],
        );
      };

      recognition.onresult = async (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        setIsListening(false);
        if (transcript && transcript.trim()) {
          await onTranscript?.(transcript.trim());
        }
      };

      recognition.onerror = (err) => {
        console.warn("Speech recognition error:", err);
        setIsListening(false);
        if (err.error === "not-allowed") {
          onFeedback?.(
            "¡No me dejes sin escucharte! Habilita el micrófono en tu navegador y vuelvo a estar aquí para ti 🙏",
          );
        } else if (err.error === "no-speech") {
          onFeedback?.(
            "¡Casi te escucho! No capté bien tus palabras. ¿Puedes intentarlo de nuevo? ¡Adoro escuchar tu voz! 💙",
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Error iniciando micrófono:", err);
      setIsListening(false);
      onFeedback?.(
        "¡Quiero escucharte tanto! Pero algo falló con el micrófono. Verifica los permisos y regreso volando 🥹",
      );
    }
  };

  return { isListening, toggleMicrophone };
}
