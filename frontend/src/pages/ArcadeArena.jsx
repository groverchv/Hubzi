import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Search, 
  Layers, 
  Check, 
  Lock, 
  Hourglass, 
  RotateCcw, 
  LogOut, 
  Sparkles, 
  BookOpen, 
  Trophy,
  Bot,
  Swords,
  AlertTriangle,
  Zap,
  Target,
  Wind,
  UploadCloud,
  Volume2,
  VolumeX,
  Heart,
  MessageCircle,
  HelpCircle,
  Mic,
  MicOff,
  Music,
  Music2,
  LogIn as LogInIcon,
  Folder as FolderIcon,
  User as UserIcon,
  X
} from 'lucide-react';
import GameCard from '../components/GameCard';
import ArcadeNode from '../components/ArcadeNode';
import QuestionModal from '../components/QuestionModal';
import CardDetailModal from '../components/CardDetailModal';
import GameModeModal from '../components/GameModeModal';
import ZenRelaxModal from '../components/ZenRelaxModal';
import StudyFolderManagerModal from '../components/StudyFolderManagerModal';
import UserAuthModal from '../components/UserAuthModal';
import AuthModal from '../components/AuthModal';
import { useArenaSocket } from '../hooks/useArenaSocket';
import capybara3dImg from '../assets/capybara_3d.jpg';
import { capyAudio } from '../utils/capyAudio';
import { capyVoice } from '../utils/capyVoice';
import { hubziAmbient } from '../utils/hubziAmbient';
import { detectDomainCategory, resolveDynamicIcon } from '../utils/domainIcons';
import { STATIC_ADMIN_GAME } from '../utils/staticAdminGame';


// 5 NIVELES DE PROGRESIÓN PEDAGÓGICA Y DIFICULTAD
export const GAME_LEVELS = [
  { level: 1, name: 'Fácil', questions: 3, difficulty: 'facil', desc: 'Preguntas directas y fáciles de predecir' },
  { level: 2, name: 'Semi-normal', questions: 5, difficulty: 'seminormal', desc: 'Conceptos clave fundamentales' },
  { level: 3, name: 'Normal', questions: 8, difficulty: 'normal', desc: 'Análisis y relaciones estándar' },
  { level: 4, name: 'Semi-difícil', questions: 15, difficulty: 'semidificil', desc: 'Profundidad técnica e inferencias' },
  { level: 5, name: 'Difícil', questions: 20, difficulty: 'dificil', desc: 'Integración exhaustiva del texto' }
];

export default function ArcadeArena() {
  // Estados de Niveles del Juego (1 a 5)
  const [currentLevel, setCurrentLevel] = useState(1);
  const [isLevelUpModalOpen, setIsLevelUpModalOpen] = useState(false);
  const [levelUpData, setLevelUpData] = useState(null);
  const [isLevelTransitioning, setIsLevelTransitioning] = useState(false);

  // Estados del juego (Vacíos al inicio: sólo se pueblan tras subir materiales)
  const [boardInfo, setBoardInfo] = useState(null);
  const [nodes, setNodes] = useState({});
  const [hand, setHand] = useState([]);
  const [opponentHand, setOpponentHand] = useState([]);
  const [flyingCard, setFlyingCard] = useState(null); // { card, targetPos, isOpponent }
  const [energy, setEnergy] = useState(0);
  const [maxEnergy, setMaxEnergy] = useState(4);
  const [turn, setTurn] = useState(1);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isSoloPlayerTurn, setIsSoloPlayerTurn] = useState(true);
  const [successNotif, setSuccessNotif] = useState(null);
  const [isCapySad, setIsCapySad] = useState(false); // Capibara llora cuando la carta es incorrecta
  const [wrongCardShake, setWrongCardShake] = useState(null); // id de carta que se puso en lugar incorrecto

  // Reacciones Emocionales y Voz Tierna de Capibara (ElevenLabs)
  const [capyMood, setCapyMood] = useState('idle'); // 'idle' | 'happy' | 'encouraging' | 'hint' | 'surprised' | 'welcome'
  const [capySpeech, setCapySpeech] = useState({ text: '', isVisible: false, mood: 'idle' });
  const [isCapySpeaking, setIsCapySpeaking] = useState(false);
  const [isCapyMuted, setIsCapyMuted] = useState(false);
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  const capySpeechTimeoutRef = React.useRef(null);
  const speakTimeoutRef = React.useRef(null);

  // Reconocimiento de Voz / Micrófono Interactivo con Capibara
  const [isListening, setIsListening] = useState(false);
  const [isThinkingHint, setIsThinkingHint] = useState(false);
  const recognitionRef = React.useRef(null);

  // Gestión de Usuario Activo y Autenticación (Email + Contraseña)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('hubzy_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Modal de Login / Registro (se abre si no hay usuario autenticado)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(() => {
    try {
      return !localStorage.getItem('hubzy_current_user');
    } catch {
      return true;
    }
  });

  // Modal secundario de edición de perfil (género, edad, apodo)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Cerrar Sesión
  const handleLogout = () => {
    localStorage.removeItem('hubzy_current_user');
    localStorage.removeItem('hubzy_auth_token');
    setCurrentUser(null);
    setIsAuthModalOpen(true);
  };

  // Modales (Flujo: 1. Autenticación -> 2. Carpetas/Material -> 3. Zen Relax -> 4. Juego en Vivo)
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [activeFolder, setActiveFolder] = useState(null);
  const [isRelaxModalOpen, setIsRelaxModalOpen] = useState(false);
  const [zenOffer, setZenOffer] = useState({ show: false, category: '', distortion: '', emotion: '' });
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);
  const [isGeneratingArena, setIsGeneratingArena] = useState(false);
  const [selectedNodeForQuestion, setSelectedNodeForQuestion] = useState(null);
  const [selectedCardForDetail, setSelectedCardForDetail] = useState(null);
  const [selectedCardInHand, setSelectedCardInHand] = useState(null);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState(false);




  // Configuración de Sala (Modo Solitario por defecto)
  const [gameConfig, setGameConfig] = useState({
    mode: 'solo',
    roomId: 'sala-solo',
    isHost: true,
  });

  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);

  const clientId = useMemo(() => {
    let saved = sessionStorage.getItem('hubzy_client_id');
    if (!saved) {
      saved = `player_${Math.random().toString(36).substring(2, 7)}`;
      sessionStorage.setItem('hubzy_client_id', saved);
    }
    return saved;
  }, []);

  // Modo Solitario Zen sin contrincante: El estudiante juega a su propio ritmo sin presiones
  const isActualTurn = true;


  // Sincronización de eventos de voz de Capibara
  useEffect(() => {
    const unsubscribe = capyVoice.subscribe((state) => {
      setIsCapySpeaking(state.isSpeaking);
      if (!state.isSpeaking) {
        if (capySpeechTimeoutRef.current) clearTimeout(capySpeechTimeoutRef.current);
        capySpeechTimeoutRef.current = setTimeout(() => {
          setCapySpeech(prev => ({ ...prev, isVisible: false }));
          setCapyMood('idle');
          setIsCapySad(false);
        }, 3200);
      }
    });
    // Sincronización de estado de música ambient
    const unsubscribeAmbient = hubziAmbient.subscribe((state) => {
      setIsAmbientPlaying(state.isPlaying);
    });
    return () => {
      unsubscribe();
      unsubscribeAmbient();
      if (capySpeechTimeoutRef.current) clearTimeout(capySpeechTimeoutRef.current);
    };
  }, []);

  // Función principal para activar la voz tierna y reacciones de Capibara
  // Control estricto anti-colisión + nuevos moods expresivos
  const triggerCapyVoice = async (situation, customData = {}) => {
    if (isCapyMuted) return;

    capyVoice.stop();
    if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current);

    const level = customData.level || currentLevel || 1;
    const theme = customData.theme || boardInfo?.theme || '';

    let phrase = customData.customText;
    if (!phrase) {
      phrase = await capyVoice.getDynamicSpeech(situation, { level, theme, ...customData });
    }

    // Mapa de situaciones a moods expresivos del Capibara
    let mood = 'talking';
    if (situation === 'level_up') mood = 'dancing';           // BAILE al subir de nivel
    else if (situation === 'victory') mood = 'celebrating';   // CELEBRACIÓN en victoria
    else if (situation === 'welcome') mood = 'love';           // AMOR al dar bienvenida
    else if (situation === 'correct') mood = 'happy';          // FELIZ en respuesta correcta
    else if (situation === 'wrong') mood = 'encouraging';      // TRISTEZA en error
    else if (situation === 'hint') mood = 'thinking';          // PENSANDO en pista
    else if (situation === 'opponent_move') mood = 'surprised'; // SORPRESA

    setCapyMood(mood);
    setCapySpeech({ text: phrase, isVisible: true, mood });

    if (capySpeechTimeoutRef.current) clearTimeout(capySpeechTimeoutRef.current);

    const speakOpts = {
      mood, level,
      stress_level: customData.stress_level,
      profile: customData.profile || (situation === 'wrong' ? 'anxiety_relief' : 'loving_psychologist'),
      user: currentUser,
      user_gender: currentUser?.gender,
      voice_gender: currentUser?.assigned_voice_gender
    };

    if (situation === 'wrong') {
      setIsCapySad(true);
      capyAudio.playCapyCry();
      speakTimeoutRef.current = setTimeout(() => { capyVoice.speak(phrase, speakOpts); }, 350);
    } else if (situation === 'correct' || situation === 'level_up' || situation === 'victory') {
      setIsCapySad(false);
      capyAudio.playCapyHappy();
      speakTimeoutRef.current = setTimeout(() => { capyVoice.speak(phrase, speakOpts); }, 250);
    } else {
      setIsCapySad(false);
      capyVoice.speak(phrase, speakOpts);
    }
  };

  // ============================================================
  // NLP ESTÁTICO LOCAL — Analiza intención del usuario sin red
  // Siempre funciona offline, coherente con el contexto del juego
  // ============================================================
  const analyzeIntentLocally = (transcript, nodesCtx, handCtx) => {
    const t = transcript.toLowerCase().trim();

    // Frustración / estrés / bloqueo
    const stressKw = ['no puedo','no entiendo','imposible','difícil','odio','me rindo','ya no','ayuda','socorro','no sé nada','perdido','estresado','ansiedad'];
    if (stressKw.some(kw => t.includes(kw))) {
      return {
        mood: 'love',
        reply: '¡Oye, oye! Aquí estoy yo, tu Capi favorito. Respira conmigo un segundo: eso que sientes es completamente normal y válido. Los más brillantes también se atoran. ¿Hacemos una pausa Zen y luego lo atacamos juntos con toda la energía?',
        needsZen: true
      };
    }

    // Saludo
    const greetKw = ['hola','hey','buenos','buenas','qué tal','cómo estás','saludos','ey'];
    if (greetKw.some(kw => t.includes(kw))) {
      const name = capyVoice.currentUser?.username || 'campeón';
      return {
        mood: 'love',
        reply: `¡Hooola ${name}! ¡Me alegra TANTO escuchar tu voz! ¿Sabes que eres mi persona favorita? Dime, ¿en qué te puedo ayudar hoy con todo mi amor?`
      };
    }

    // Felicidad / logro del usuario
    const happyKw = ['gracias','lo logré','lo hice','genial','bien','perfecto','me encanta','amor','qué fácil'];
    if (happyKw.some(kw => t.includes(kw))) {
      return {
        mood: 'celebrating',
        reply: '¡SÍIII! ¡Eso es exactamente lo que quería escuchar! ¡Me llenas el corazón de alegría! ¡Sabía que lo ibas a lograr, siempre lo supe!'
      };
    }

    // Pregunta conceptual / definición
    const defineKw = ['qué es','para qué','qué significa','define','definición','qué hace','cómo funciona','explica','me puedes explicar'];
    if (defineKw.some(kw => t.includes(kw))) {
      const allNodes = Object.values(nodesCtx);
      const matched = allNodes.find(n => n.label && t.includes(n.label.toLowerCase().substring(0, 5)));
      if (matched) {
        return {
          mood: 'thinking',
          reply: `¡Buenísima pregunta! Te cuento sobre "${matched.label}": ${matched.hint || matched.question || 'es un concepto clave del tema de hoy'}. ¿Eso te ayuda, mi estudiante favorito?`
        };
      }
      return {
        mood: 'thinking',
        reply: `¡Me encanta que preguntes! El tema de hoy es "${boardInfo?.title || 'los conceptos del tablero'}". Observa bien las preguntas de cada nodo, ahí están las claves. ¡Confía en ti!`
      };
    }

    // Pista explícita
    const hintKw = ['pista','ayúdame','no sé','cuál','qué carta','qué pongo','sugerencia','consejo','qué hago'];
    if (hintKw.some(kw => t.includes(kw))) {
      const unsolved = Object.values(nodesCtx).filter(n => !n.placedCard);
      if (unsolved.length > 0) {
        const target = unsolved[Math.floor(Math.random() * unsolved.length)];
        const hintCards = handCtx.filter(c => !c.isDistractor).slice(0, 2).map(c => c.name).join(' o ');
        return {
          mood: 'thinking',
          reply: `¡Con todo mi amor te doy esta pista! Para "${target.label}": ${target.hint || target.question?.slice(0, 80) || 'busca la carta cuya función principal coincida'}. ${hintCards ? `Fíjate en "${hintCards}".` : ''} ¡Tú puedes, lo sé!`
        };
      }
      return {
        mood: 'happy',
        reply: '¡Ya casi lo tienes todo! Mira las cartas restantes y confía en tu primer instinto. ¡Eres absolutamente increíble!'
      };
    }

    // Fallback contextual inteligente
    const unsolved = Object.values(nodesCtx).filter(n => !n.placedCard);
    if (unsolved.length > 0) {
      return {
        mood: 'love',
        reply: `¡Escuché que dijiste "${transcript.slice(0, 35)}"! Qué bonito que me hables. Te sugiero que te enfoques en "${unsolved[0].label}". ¡Yo creo en ti con todo lo que tengo!`
      };
    }
    return {
      mood: 'celebrating',
      reply: `¡Dijiste "${transcript.slice(0, 35)}" y ya solo pienso en lo increíble que eres! ¡Eres mi héroe favorito de todo el universo, sin ninguna duda!`
    };
  };

  // Clic directo en la Capibara: genera orientación psicológica o pista dinámica
  const handleCapyClick = async () => {
    const unsolvedNodes = Object.values(nodes).filter(n => !n.placedCard && !n.lockedByOpponent);
    if (unsolvedNodes.length === 0) {
      triggerCapyVoice('victory', { profile: 'loving_psychologist' });
      return;
    }
    const target = unsolvedNodes[Math.floor(Math.random() * unsolvedNodes.length)];
    const hintSnippet = target.hint || target.question || 'Observa las opciones disponibles en tus cartas';
    triggerCapyVoice('hint', {
      label: target.label,
      hintText: `para analizar "${target.label}": ${hintSnippet.slice(0, 90)}. Concéntrate en la función principal.`,
      profile: 'loving_psychologist'
    });
  };

  // Manejo de la pregunta por voz — NLP backend + fallback NLP estático local inteligente
  const handleUserVoiceQuery = async (transcript) => {
    setIsThinkingHint(true);
    setCapyMood('thinking');
    setCapySpeech({
      text: `¡Te escucho! Dijiste: "${transcript}" ... ¡Estoy pensando con todo mi amor para ti! 💭`,
      isVisible: true,
      mood: 'thinking'
    });

    // Intentar NLP del backend con timeout de 3s
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch('/api/v1/arena/capy-ask', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: transcript,
          nodes: Object.values(nodes).map(n => ({
            label: n.label, question: n.question, hint: n.hint,
            isSolved: Boolean(n.placedCard || n.lockedByOpponent)
          })),
          hand: hand.map(c => ({ name: c.name, domain: c.domain, isDistractor: Boolean(c.isDistractor) })),
          theme: boardInfo?.title || 'Simulacro de Examen',
          user_profile: currentUser || {}
        })
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const reply = data.reply || '¡Revisa los conceptos clave de tus cartas!';
        const psych = data.psychology;
        setIsThinkingHint(false);

        if (psych?.needs_somatic_intervention || (psych?.stress_level && psych.stress_level >= 0.5)) {
          setCapyMood('love');
          setZenOffer({
            show: true,
            category: psych.stress_category || 'tensión acumulada',
            distortion: psych.cognitive_distortion || '',
            emotion: psych.emotion_detected || 'ansiedad'
          });
          triggerCapyVoice('encouraging', {
            customText: reply, stress_level: psych.stress_level,
            profile: psych.stress_level >= 0.8 ? 'crisis_soothing' : 'anxiety_relief'
          });
        } else {
          triggerCapyVoice('hint', { customText: reply, stress_level: psych?.stress_level, profile: 'loving_psychologist' });
        }
        return;
      }
    } catch (e) {
      // Backend caído o timeout — NLP local estático inteligente
      console.warn('Backend no disponible, usando NLP local:', e?.message || e);
    }

    // NLP ESTÁTICO LOCAL — siempre coherente con el tablero actual
    setIsThinkingHint(false);
    const local = analyzeIntentLocally(transcript, nodes, hand);

    if (local.needsZen) {
      setZenOffer({ show: true, category: 'estrés detectado', distortion: '', emotion: 'frustración' });
    }

    setCapyMood(local.mood);
    setCapySpeech({ text: local.reply, isVisible: true, mood: local.mood });
    capyVoice.speak(local.reply, {
      mood: local.mood, level: currentLevel,
      user: currentUser, user_gender: currentUser?.gender, voice_gender: currentUser?.assigned_voice_gender
    });
  };

  // Micrófono con mensajes emotivos y NLP funcional
  const toggleMicrophone = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
      setIsListening(false);
      return;
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      setCapyMood('love');
      setCapySpeech({
        text: '¡Ay, me muero por escucharte! Pero parece que tu navegador no soporta micrófono. Prueba con Chrome o Edge y yo estaré esperándote 🥹',
        isVisible: true, mood: 'love'
      });
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = 'es-ES';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setCapyMood('love');
        const greetings = [
          '¡Soy todo oídos! Pregúntame lo que quieras, estoy aquí para ti 💙',
          '¡Habla conmigo! Tu voz es lo más bonito que puedo escuchar hoy 🎙️',
          '¡Te escucho con todo mi corazón! ¿Qué necesitas, mi campeón?',
          '¡Qué emoción que me hables! Dime todo lo que sientes o necesitas 🥰',
        ];
        setCapySpeech({
          text: greetings[Math.floor(Math.random() * greetings.length)],
          isVisible: true, mood: 'love'
        });
      };

      recognition.onresult = async (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        setIsListening(false);
        if (transcript && transcript.trim()) {
          await handleUserVoiceQuery(transcript.trim());
        }
      };

      recognition.onerror = (err) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
        if (err.error === 'not-allowed') {
          setCapyMood('love');
          setCapySpeech({
            text: '¡No me dejes sin escucharte! Habilita el micrófono en tu navegador y vuelvo a estar aquí para ti 🙏',
            isVisible: true, mood: 'love'
          });
        } else if (err.error === 'no-speech') {
          setCapyMood('love');
          setCapySpeech({
            text: '¡Casi te escucho! No capté bien tus palabras. ¿Puedes intentarlo de nuevo? ¡Adoro escuchar tu voz! 💙',
            isVisible: true, mood: 'love'
          });
        }
      };

      recognition.onend = () => { setIsListening(false); };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Error iniciando micrófono:', err);
      setIsListening(false);
      setCapyMood('love');
      setCapySpeech({
        text: '¡Quiero escucharte tanto! Pero algo falló con el micrófono. Verifica los permisos y regreso volando 🥹',
        isVisible: true, mood: 'love'
      });
    }
  };


  // Comprobación de conclusión del circuito (modo individual Zen con 5 niveles progresivos)
  useEffect(() => {
    const nodeValues = Object.values(nodes);
    if (nodeValues.length > 0) {
      // El circuito concluye cuando el estudiante ha completado todos los conceptos
      const allNodesCompleted = nodeValues.every(n => Boolean(n.placedCard));
      if (allNodesCompleted && !isLevelTransitioning) {
        if (currentLevel < 5) {
          setIsLevelTransitioning(true);
          const nextLevel = currentLevel + 1;
          const nextLvlInfo = GAME_LEVELS.find(l => l.level === nextLevel);

          triggerCapyVoice('level_up', { 
            level: nextLevel,
            theme: boardInfo?.theme
          });

          setLevelUpData({
            completedLevel: currentLevel,
            nextLevel,
            nextLvlInfo
          });
          setIsLevelUpModalOpen(true);
        } else {
          // Victoria Absoluta al completar el Nivel 5 (Difícil)
          setIsGameOverModalOpen(true);
          triggerCapyVoice('victory', { level: 5 });
        }
      }
    }
  }, [nodes, currentLevel, isLevelTransitioning]);


  const handleSelectGameMode = ({ mode, roomId, isHost, needsUpload }) => {
    setGameConfig({ mode, roomId, isHost });
    setIsModeModalOpen(false);

    if (needsUpload) {
      setIsFolderModalOpen(true);
    } else {
      setSuccessNotif(mode === '1v1' 
        ? `Conectado a la sala ${roomId}. Sincronizando con el rival...`
        : `Partida contra la Máquina lista. ¡Comienza el juego!`
      );
      setTimeout(() => setSuccessNotif(null), 3500);
    }
  };

  // 1. TERMINAR PARTIDA (Limpia tablero y abre baúl de carpetas)
  const handleTerminateGame = () => {
    setIsGameOverModalOpen(false);
    setIsModeModalOpen(false);
    setPlayerScore(0);
    setOpponentScore(0);
    setTurn(1);
    setNodes({});
    setHand([]);
    setOpponentHand([]);
    setBoardInfo(null);
    setFlyingCard(null);
    setSelectedCardInHand(null);
    setIsFolderModalOpen(true);
  };


  // GENERADOR DINÁMICO DE POSICIONES Y TOPOLOGÍA PARA CUALQUIER NÚMERO DE PREGUNTAS (3, 5, 8, 15, 20)
  const getDynamicLayout = (count = 5) => {
    if (count === 3) {
      return [
        { left: '26.0%', top: '48.0%' },
        { left: '50.0%', top: '35.0%' },
        { left: '74.0%', top: '48.0%' }
      ];
    }
    if (count === 5) {
      const layouts = [
        [
          { left: '20.0%', top: '50.0%' },
          { left: '36.0%', top: '24.0%' },
          { left: '50.0%', top: '64.0%' },
          { left: '66.0%', top: '24.0%' },
          { left: '81.0%', top: '50.0%' }
        ],
        [
          { left: '50.0%', top: '44.0%' },
          { left: '50.0%', top: '20.0%' },
          { left: '23.0%', top: '44.0%' },
          { left: '77.0%', top: '44.0%' },
          { left: '50.0%', top: '68.0%' }
        ]
      ];
      return layouts[Math.floor(Math.random() * layouts.length)];
    }
    if (count === 8) {
      return [
        { left: '20.0%', top: '30.0%' },
        { left: '40.0%', top: '24.0%' },
        { left: '60.0%', top: '24.0%' },
        { left: '80.0%', top: '30.0%' },
        { left: '22.0%', top: '64.0%' },
        { left: '42.0%', top: '68.0%' },
        { left: '62.0%', top: '68.0%' },
        { left: '82.0%', top: '64.0%' }
      ];
    }
    if (count === 15) {
      // 3 filas ordenadas de 5 nodos para máxima claridad visual
      const positions = [];
      const cols = [18, 34, 50, 66, 82];
      const rows = [24, 48, 72];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 5; c++) {
          positions.push({
            left: `${cols[c]}%`,
            top: `${rows[r]}%`
          });
        }
      }
      return positions;
    }
    if (count === 20) {
      // 4 filas de 5 nodos
      const positions = [];
      const cols = [18, 34, 50, 66, 82];
      const rows = [20, 38, 56, 74];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 5; c++) {
          positions.push({
            left: `${cols[c]}%`,
            top: `${rows[r]}%`
          });
        }
      }
      return positions;
    }

    // Algoritmo adaptativo universal
    const colsCount = Math.ceil(Math.sqrt(count * 1.6));
    const rowsCount = Math.ceil(count / colsCount);
    const positions = [];
    const minX = 18, maxX = 82;
    const minY = 20, maxY = 74;
    const stepX = colsCount > 1 ? (maxX - minX) / (colsCount - 1) : 0;
    const stepY = rowsCount > 1 ? (maxY - minY) / (rowsCount - 1) : 0;

    for (let i = 0; i < count; i++) {
      const r = Math.floor(i / colsCount);
      const c = i % colsCount;
      const x = minX + c * stepX;
      const y = minY + r * stepY;
      positions.push({
        left: `${x.toFixed(1)}%`,
        top: `${y.toFixed(1)}%`
      });
    }
    return positions;
  };

  // HELPER: Configurar tablero y cartas con enlace 1-a-1 y posiciones dinámicas
  const applyBoardData = (boardData, folderName, level = currentLevel) => {
    if (!boardData.cards || boardData.cards.length === 0) return false;

    const lvlInfo = GAME_LEVELS.find(l => l.level === level) || GAME_LEVELS[0];

    setBoardInfo({
      title: boardData.title || `Simulacro: ${folderName ? folderName.toUpperCase() : 'EXAMEN'}`,
      theme: folderName || 'Estudio',
      levelInfo: lvlInfo
    });

    const dynamicPositions = getDynamicLayout(boardData.nodes.length);
    // Paleta exacta de la imagen de referencia (Concepto A, B, C, D, E, F)
    const availableColors = ['orange', 'purple', 'blue', 'dark', 'salmon', 'white'];
    const availableShapes = ['hexagon', 'circle', 'diamond', 'octagon', 'squircle'];

    // Detección automática del tema y disciplina académica real del documento/carpeta
    const activeTheme = folderName || boardData.title || 'Estudio';
    const detectedCategory = detectDomainCategory(`${activeTheme} ${boardData.title || ''}`);

    // Colores ordenados o barajados
    const shuffledColors = ['orange', 'purple', 'blue', 'dark', 'salmon', 'white'];
    const chosenShape = availableShapes[Math.floor(Math.random() * availableShapes.length)];

    const newNodes = {};
    // Cada nodo se liga 1-a-1 con su carta correcta (por índice)
    boardData.nodes.forEach((n, idx) => {
      const matchingCard = boardData.cards[idx];
      const cardId = matchingCard?.id || `card_${idx + 1}`;
      const conceptLabel = n.label || matchingCard?.concept_name || `Concepto ${idx + 1}`;
      const questionText = n.question || n.description || '¿A qué concepto corresponde este principio?';
      const hintText = n.description || 'Revisa el contenido del documento de esta carpeta.';

      newNodes[n.id] = {
        id: n.id,
        domain: detectedCategory,
        theme: activeTheme,
        label: conceptLabel,
        question: questionText,
        hint: hintText,
        nodeIndex: idx,
        pos: dynamicPositions[idx % dynamicPositions.length],
        color: shuffledColors[idx % shuffledColors.length],
        shape: chosenShape,
        placedCard: null,
        lockedByOpponent: false,
        correctCardId: cardId
      };
    });

    // Mapear cartas base y clasificar distractores (falsas respuestas)
    const processedCards = boardData.cards.map((c, i) => {
      const isDistractor = c.id?.includes('distractor') || i >= boardData.nodes.length;
      return {
        id: c.id,
        name: c.concept_name,
        cost: c.points_multiplier || '1x',
        type: shuffledColors[i % shuffledColors.length],
        sourceType: 'document',
        domain: detectedCategory,
        theme: activeTheme,
        cardIndex: i,
        content: c.content || 'Respuesta alternativa no coincidente.',
        matchesNodeId: isDistractor ? null : (boardData.nodes[i]?.id || null),
        isDistractor: isDistractor
      };
    });

    // REGLA: Garantizar que exactamente el 30% del total de preguntas existan como cartas falsas (distractores)
    const requiredDistractorCount = Math.max(1, Math.round(boardData.nodes.length * 0.30));
    const currentDistractorCount = processedCards.filter(c => c.isDistractor).length;
    
    if (currentDistractorCount < requiredDistractorCount) {
      const missingCount = requiredDistractorCount - currentDistractorCount;
      const fallbackDistractorNames = [
        "Enfoque Ortogonal Inverso",
        "Principio de Premisa Contradictoria",
        "Teoría de Correlación Espuria",
        "Postulado No Demostrado",
        "Metodología Excluida",
        "Axioma de Descarte Arbitrario"
      ];
      for (let k = 0; k < missingCount; k++) {
        const dIdx = currentDistractorCount + k;
        processedCards.push({
          id: `card_distractor_dyn_${dIdx + 1}`,
          name: fallbackDistractorNames[dIdx % fallbackDistractorNames.length],
          cost: '1x',
          type: shuffledColors[(boardData.cards.length + k) % shuffledColors.length],
          sourceType: 'document',
          domain: 'estudio',
          content: 'Esta es una respuesta falsa diseñada para desafiar tu discernimiento conceptual.',
          matchesNodeId: null,
          isDistractor: true
        });
      }
    }

    // Barajar aleatoriamente la mano del jugador para que no sigan el mismo orden que los nodos
    const shuffledHand = [...processedCards].sort(() => Math.random() - 0.5);
    shuffledHand.forEach((c, i) => {
      c.rotation = (i - Math.floor(processedCards.length / 2)) * 2;
      c.zIndex = i + 1;
    });

    // Resetear todo el estado de la partida para el nivel
    setNodes(newNodes);
    setHand(shuffledHand);
    setOpponentHand(processedCards.map((c, i) => ({ ...c, id: `opp_${c.id}_${i}` })));
    setEnergy(maxEnergy);
    setTurn(1);
    setIsCapySad(false);
    setSelectedNodeForQuestion(null);
    setSelectedCardForDetail(null);
    setSelectedCardInHand(null);
    setFlyingCard(null);
    setIsGameOverModalOpen(false);

    setTimeout(() => {
      triggerCapyVoice('welcome', { level });
    }, 1000);
    return true;
  };

  // CARGAR NIVEL ESPECÍFICO (1 A 5) DESDE EL BACKEND
  const loadGameForLevel = async (targetLevel, targetFolder = activeFolder, force = false) => {
    if (!targetFolder) {
      setSuccessNotif('Selecciona una carpeta de estudio para comenzar.');
      setIsFolderModalOpen(true);
      return false;
    }

    const lvlInfo = GAME_LEVELS.find(l => l.level === targetLevel) || GAME_LEVELS[0];
    setIsGeneratingArena(true);
    setSuccessNotif(`Cargando Nivel ${targetLevel} (${lvlInfo.name} - ${lvlInfo.questions} preguntas) desde [${targetFolder.name}]...`);

    // Si la carpeta corresponde al documento estático de administración o no hay conexión con el backend
    const isStaticAdmin = targetFolder.id === 'folder_administracion_default' || 
                          targetFolder.name?.toLowerCase().includes('administra') ||
                          targetFolder.documents?.some(d => d.name?.toLowerCase().includes('administracion'));

    if (isStaticAdmin && STATIC_ADMIN_GAME.levels[targetLevel]) {
      const staticLevelData = STATIC_ADMIN_GAME.levels[targetLevel];
      const success = applyBoardData(staticLevelData, targetFolder.name || 'Administración General', targetLevel);
      if (success) {
        setCurrentLevel(targetLevel);
        setIsGeneratingArena(false);
        setSuccessNotif(`Nivel ${targetLevel}: ${lvlInfo.name} (${lvlInfo.questions} preguntas) [administracion.pdf] listo.`);
        setTimeout(() => setSuccessNotif(null), 4000);
        return true;
      }
    }

    try {
      const res = await fetch(
        `/api/v1/folders/${targetFolder.id}/generate-game?level=${targetLevel}&question_count=${lvlInfo.questions}&difficulty=${lvlInfo.difficulty}${force ? '&force=true' : ''}`,
        { method: 'POST' }
      );

      if (res.ok) {
        const boardData = await res.json();
        const success = applyBoardData(boardData, targetFolder.name, targetLevel);
        if (success) {
          setCurrentLevel(targetLevel);
          setSuccessNotif(`Nivel ${targetLevel}: ${lvlInfo.name} (${lvlInfo.questions} preguntas) listo.`);
          setTimeout(() => setSuccessNotif(null), 4000);
          return true;
        }
      } else {
        const err = await res.json().catch(() => ({}));
        if (STATIC_ADMIN_GAME.levels[targetLevel]) {
          const fallbackData = STATIC_ADMIN_GAME.levels[targetLevel];
          applyBoardData(fallbackData, targetFolder.name || 'Administración General', targetLevel);
          setCurrentLevel(targetLevel);
          setSuccessNotif(`Nivel ${targetLevel} listo (reactivos de administracion.pdf).`);
          setTimeout(() => setSuccessNotif(null), 4000);
          return true;
        }
        setSuccessNotif(`${err.detail || 'No se pudieron generar los reactivos del nivel.'}`);
        setTimeout(() => setSuccessNotif(null), 5000);
      }
    } catch (e) {
      console.warn("Error cargando nivel, usando reactivos estáticos de administracion.pdf:", e);
      if (STATIC_ADMIN_GAME.levels[targetLevel]) {
        const fallbackData = STATIC_ADMIN_GAME.levels[targetLevel];
        applyBoardData(fallbackData, targetFolder.name || 'Administración General', targetLevel);
        setCurrentLevel(targetLevel);
        setSuccessNotif(`Nivel ${targetLevel} listo (reactivos de administracion.pdf).`);
        setTimeout(() => setSuccessNotif(null), 4000);
        return true;
      }
      setSuccessNotif("Error al conectarse con el servidor.");
      setTimeout(() => setSuccessNotif(null), 5000);
    } finally {
      setIsGeneratingArena(false);
    }
    return false;
  };

  // AVANZAR AL SIGUIENTE NIVEL DESDE EL MODAL CELEBRATORIO
  const handleProceedToNextLevel = async () => {
    setIsLevelUpModalOpen(false);
    if (levelUpData?.nextLevel) {
      const targetLvl = levelUpData.nextLevel;
      await loadGameForLevel(targetLvl, activeFolder, false);
      setIsLevelTransitioning(false);
    }
  };

  // SALTAR / SELECCIONAR NIVEL DIRECTAMENTE
  const handleJumpToLevel = async (lvl) => {
    if (lvl === currentLevel && Object.keys(nodes).length > 0) return;
    setIsLevelTransitioning(false);
    setIsLevelUpModalOpen(false);
    await loadGameForLevel(lvl, activeFolder, false);
  };

  // 2. REINICIAR Y GENERAR NUEVAS PREGUNTAS DEL NIVEL ACTUAL
  const handleRestartWithNewQuestions = async () => {
    if (!activeFolder) {
      setSuccessNotif('Selecciona una carpeta en el baúl para iniciar el juego.');
      setIsFolderModalOpen(true);
      return;
    }
    await loadGameForLevel(currentLevel, activeFolder, true);
  };

  // 3. REINTENTAR GENÉRICO (Regenera preguntas de la carpeta actual)
  const handleRetryGame = () => {
    setIsGameOverModalOpen(false);
    setCurrentLevel(1);
    loadGameForLevel(1, activeFolder, true);
  };

  // INTENTO UNIFICADO DE JUGAR/COLOCAR CARTA (Arrastrar o Tocar)
  const attemptPlayCard = (cardId, targetNodeId) => {
    if (!isActualTurn) {
      setSuccessNotif(`TURNO NO DISPONIBLE: Espera a tu turno para jugar.`);
      setTimeout(() => setSuccessNotif(null), 2500);
      return false;
    }

    if (!targetNodeId || !nodes[targetNodeId]) return false;
    const targetNode = nodes[targetNodeId];

    if (targetNode.placedCard) {
      setSuccessNotif(`Este nodo ya tiene su respuesta colocada.`);
      setTimeout(() => setSuccessNotif(null), 2500);
      return false;
    }

    const card = hand.find((c) => String(c.id) === String(cardId));
    if (!card) return false;

    // Validación precisa: soporta match de ID, de matchesNodeId o por igualdad de texto/concepto
    const isDistractor = card.isDistractor || String(card.id).includes('distractor');
    const isCorrectCard = !isDistractor && Boolean(
      (targetNode.correctCardId && String(targetNode.correctCardId) === String(card.id)) ||
      (card.matchesNodeId && String(card.matchesNodeId) === String(targetNodeId)) ||
      (targetNode.label && card.name && targetNode.label.trim().toLowerCase() === card.name.trim().toLowerCase())
    );

    if (!isCorrectCard) {
      // CARTA INCORRECTA O DISTRACTOR: Hubzi reacciona y te anima tiernamente
      setWrongCardShake(card.id);
      triggerCapyVoice('wrong');
      setSuccessNotif(`"${card.name}" no corresponde a esta casilla. Hubzi te anima: ¡estuviste cerca!`);
      setTimeout(() => {
        setWrongCardShake(null);
        setSuccessNotif(null);
      }, 3500);
      return false;
    }

    // CARTA CORRECTA: Colocar en el nodo y voz de celebración entusiasta
    triggerCapyVoice('correct');
    setSelectedCardForDetail(null);
    setSelectedCardInHand(null);
    const multiplier = card.cost ? parseInt(card.cost) || 1 : 1;
    const pointsEarned = 10 * multiplier;
    setNodes((prev) => ({
      ...prev,
      [targetNodeId]: { ...prev[targetNodeId], placedCard: card },
    }));
    setHand((prev) => prev.filter((c) => String(c.id) !== String(card.id)));
    setPlayerScore((prev) => prev + pointsEarned);
    setSuccessNotif(`¡Excelente! "${card.name}" responde correctamente. +${pointsEarned} pts`);
    setTimeout(() => setSuccessNotif(null), 3000);
    return true;
  };

  const handleNodeClick = (nodeId) => {
    const node = nodes[nodeId];
    if (!node) return;

    // Al hacer clic en un nodo se abre el modal con la pregunta de examen
    setSelectedNodeForQuestion(node);
  };

  const handleCardClick = (card) => {
    // Al hacer clic en una carta solo se abre su vista detallada (la colocación es SI O SI arrastrando)
    setSelectedCardForDetail(card);
  };

  const handleDragEnd = (cardId, info) => {
    if (!isActualTurn) return;

    const dropPoint = { x: info.point.x, y: info.point.y };

    // Detectar si se soltó sobre o cerca de una pregunta del tablero (radio generoso de 80px)
    const elements = document.querySelectorAll('[data-node-id]');

    let matchedNodeId = null;
    let shortestDist = Infinity;
    const HIT_RADIUS = 80;

    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dist = Math.hypot(dropPoint.x - centerX, dropPoint.y - centerY);

      const inExpandedArea = (
        dropPoint.x >= rect.left - HIT_RADIUS &&
        dropPoint.x <= rect.right + HIT_RADIUS &&
        dropPoint.y >= rect.top - HIT_RADIUS &&
        dropPoint.y <= rect.bottom + HIT_RADIUS
      );

      if (inExpandedArea && dist < shortestDist) {
        shortestDist = dist;
        matchedNodeId = el.getAttribute('data-node-id');
      }
    });

    if (matchedNodeId) {
      attemptPlayCard(cardId, matchedNodeId);
    }
  };


  const handleEndTurn = () => {
    if (!isActualTurn) {
      setSuccessNotif(
        gameConfig.mode === '1v1'
          ? `TURNO NO DISPONIBLE: Espera a que el rival juegue.`
          : `TURNO NO DISPONIBLE: La máquina está realizando su movimiento.`
      );
      setTimeout(() => setSuccessNotif(null), 2500);
      return;
    }

    setTurn((prev) => prev + 1);
    setEnergy((prev) => Math.min(prev + 2, maxEnergy));

    if (gameConfig.mode === '1v1') {
      sendMove({ action: 'end_turn' });
      setSuccessNotif(`Turno cedido al rival.`);
      setTimeout(() => setSuccessNotif(null), 2500);
    } else if (gameConfig.mode === 'solo') {
      // En modo solo, pasar turno dispara la jugada de la máquina
      triggerAiTurn();
    }
  };

  // Detección automática del área al subir materiales para cualquier disciplina
  const handleProcessMaterials = async (data) => {
    setIsGeneratingArena(true);
    let generatedSuccess = false;

    // 1. Llamada a Gemini en backend enviando el archivo real (PDF, etc.) para extraer su contenido interno
    try {
      let res;
      if (data.rawFiles && data.rawFiles.length > 0) {
        const formData = new FormData();
        formData.append('file', data.rawFiles[0]);
        formData.append('raw_text', data.text || '');
        res = await fetch('/api/v1/arena/upload-and-generate', {
          method: 'POST',
          body: formData
        });
      } else {
        res = await fetch('/api/v1/arena/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: data.text || 'Material de estudio pedagógico integral.'
          })
        });
      }

      if (res && res.ok) {
        const boardData = await res.json();
        if (boardData.cards && boardData.cards.length > 0) {
          setBoardInfo({
            title: boardData.title || `Estudio: ${data.files[0]?.name || 'Material Didáctico'}`,
            theme: 'Material Asimilado con IA'
          });

          // Coordenadas espaciales bien distribuidas en el circuito
          const posList = [
            { left: '20%', top: '30%' },
            { left: '48%', top: '24%' },
            { left: '78%', top: '30%' },
            { left: '34%', top: '68%' },
            { left: '66%', top: '68%' }
          ];

          const newNodes = {};
          // Cada nodo se liga 1-a-1 con la carta que le corresponde (por índice coincidente)
          boardData.nodes.forEach((n, idx) => {
            const matchingCard = boardData.cards[idx];
            const cardId = matchingCard?.id || `card_${idx + 1}`;
            newNodes[n.id] = {
              id: n.id,
              domain: 'estudio',
              icon: idx % 2 === 0 ? 'database' : 'codigo',
              label: n.label || matchingCard?.concept_name || `Concepto ${idx + 1}`,
              question: n.question || n.description || '¿A qué concepto corresponde este principio?',
              hint: n.description || 'Revisa las cartas en tu mano y arrastra la respuesta adecuada.',
              pos: posList[idx % posList.length],
              color: idx % 2 === 0 ? 'cyan' : 'emerald',
              shape: 'hexagon',
              placedCard: null,
              lockedByOpponent: false,
              correctCardId: cardId  // <-- enlace 1-a-1 con la carta correcta
            };
          });

          const processedCards = boardData.cards.map((c, i) => {
            const isDistractor = c.id?.includes('distractor') || i >= boardData.nodes.length;
            return {
              id: c.id,
              name: c.concept_name,
              cost: c.points_multiplier || '1x',
              type: i % 2 === 0 ? 'cyan' : 'emerald',
              sourceType: 'document',
              domain: 'estudio',
              content: c.content || 'Respuesta falsa que no corresponde a ningún reactivo.',
              matchesNodeId: isDistractor ? null : (boardData.nodes[i]?.id || null),
              isDistractor: isDistractor
            };
          });

          // 30% del total de preguntas como cartas falsas
          const requiredDistractors = Math.max(1, Math.round(boardData.nodes.length * 0.30));
          const currentDistractors = processedCards.filter(c => c.isDistractor).length;
          if (currentDistractors < requiredDistractors) {
            const needed = requiredDistractors - currentDistractors;
            const distractorPool = [
              "Enfoque Ortogonal Inverso",
              "Principio de Premisa Contradictoria",
              "Teoría de Correlación Espuria",
              "Postulado No Demostrado"
            ];
            for (let k = 0; k < needed; k++) {
              const dIdx = currentDistractors + k;
              processedCards.push({
                id: `card_distractor_dyn_${dIdx + 1}`,
                name: distractorPool[dIdx % distractorPool.length],
                cost: '1x',
                type: (processedCards.length + k) % 2 === 0 ? 'cyan' : 'emerald',
                sourceType: 'document',
                domain: 'estudio',
                content: 'Respuesta alternativa no válida.',
                matchesNodeId: null,
                isDistractor: true
              });
            }
          }

          const shuffledHand = [...processedCards].sort(() => Math.random() - 0.5);
          shuffledHand.forEach((c, i) => {
            c.rotation = (i - Math.floor(processedCards.length / 2)) * 3;
            c.zIndex = i + 1;
          });

          setNodes(newNodes);
          setHand(shuffledHand);
          setOpponentHand(processedCards.map((c, i) => ({ ...c, id: `opp_${c.id}_${i}` })));
            setEnergy(maxEnergy);
            setTurn(1);
            setSuccessNotif(`¡Material procesado con Gemini! Tablero generado en tiempo real.`);
            setTimeout(() => setSuccessNotif(null), 4000);
            generatedSuccess = true;

            // Asociar este juego con preguntas a la carpeta activa en Base de Datos y LocalStorage
            if (activeFolder) {
              const newGameRecord = {
                id: `game_${Date.now()}`,
                title: boardData.title || `Estudio: ${data.files[0]?.name || 'Material'}`,
                questions_count: Object.keys(newNodes).length,
                created_at: new Date().toLocaleDateString('es-ES')
              };

              // 1. Persistir en MongoDB
              fetch(`/api/v1/folders/${activeFolder.id}/games`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ game: newGameRecord })
              }).catch(e => console.warn("No se pudo persistir el juego en BD:", e));

              // 2. Persistir en LocalStorage
              try {
                const foldersRaw = localStorage.getItem('hubzy_user_study_folders');
                if (foldersRaw) {
                  const fList = JSON.parse(foldersRaw);
                  const fIdx = fList.findIndex(f => f.id === activeFolder.id);
                  if (fIdx >= 0) {
                    if (!fList[fIdx].games) fList[fIdx].games = [];
                    fList[fIdx].games.unshift(newGameRecord);
                    localStorage.setItem('hubzy_user_study_folders', JSON.stringify(fList));
                  }
                }
              } catch {}
            }
          }
        }
      } catch (err) {
        console.warn("Error conectando con /api/v1/arena/generate:", err);
      }

    // 2. Si no hubo respuesta del LLM, generar cartas y nodos directos a partir del nombre y tipo de los archivos subidos
    if (!generatedSuccess) {
      const detectedTheme = /(ley|derecho|penal|demanda|abogad|juez|paps)/i.test(lower) ? 'Derecho & Leyes' :
                            /(contab|balance|niif|ifrs|sat|iva|auditor)/i.test(lower) ? 'Contaduría' :
                            /(finanz|ebitda|mercado|bolsa|invers)/i.test(lower) ? 'Finanzas' :
                            /(salud|medic|enferm|farmac|clinica)/i.test(lower) ? 'Medicina' :
                            /(educ|pedagog|aprendizaje)/i.test(lower) ? 'Educación' : 'Tecnología';

      const fileBaseName = data.files[0]?.name.replace(/\.[^/.]+$/, "") || 'Material de Estudio';
      setBoardInfo({
        title: `SIMULACRO: ${fileBaseName.toUpperCase()}`,
        theme: detectedTheme
      });

      const posList = [
        { left: '20%', top: '30%' },
        { left: '48%', top: '24%' },
        { left: '78%', top: '30%' },
        { left: '34%', top: '68%' },
        { left: '66%', top: '68%' }
      ];

      const examQuestionsTemplates = [
        {
          concept: fileBaseName.substring(0, 18),
          q: `[REACTIVO DE EXAMEN - DEFINICIÓN]: ¿Cuál es el objeto central de estudio y la doctrina rectora analizada en el compendio de "${fileBaseName}"?`,
          hint: `Analiza la tesis preliminar desarrollada al inicio del texto sobre ${fileBaseName.substring(0, 15)}.`
        },
        {
          concept: 'Principio Rector',
          q: `[REACTIVO DE EXAMEN - APLICACIÓN]: ¿Qué postulado o principio rector es de observancia obligatoria para validar los procedimientos según el marco de ${fileBaseName}?`,
          hint: 'Es la regla fundamental o axioma que rige toda la normativa aplicable.'
        },
        {
          concept: 'Marco Aplicado',
          q: `[REACTIVO DE EXAMEN - CASO PRÁCTICO]: Ante una controversia técnica en la práctica profesional, ¿qué conjunto de criterios o marco normativo determina la solución del caso?`,
          hint: 'Observa la estructura metodológica y procedimental explicada en la materia.'
        },
        {
          concept: 'Criterio de Evaluación',
          q: `[REACTIVO DE EXAMEN - ANÁLISIS CRÍTICO]: ¿Bajo qué estándar de ponderación o examen riguroso se contrasta la eficacia de las medidas adoptadas?`,
          hint: 'Involucra el juicio valorativo indispensable para superar la prueba evaluativa.'
        },
        {
          concept: 'Resolución Final',
          q: `[REACTIVO DE EXAMEN - CONCLUSIÓN]: ¿Cuál es el dictamen o resolución vinculante que concluye formalmente el análisis de la materia estudiada?`,
          hint: 'Representa el acto resolutivo definitivo del proceso formativo.'
        }
      ];

      const customCards = examQuestionsTemplates.map((item, idx) => ({
        id: `card_${idx + 1}`,
        name: item.concept,
        cost: idx % 2 === 0 ? '1x' : '2x',
        type: idx % 2 === 0 ? 'cyan' : 'emerald',
        sourceType: 'document',
        domain: 'estudio',
        rotation: (idx - 2) * 4,
        zIndex: idx + 1,
        matchesNodeId: `node_${idx + 1}`  // <-- enlace 1-a-1 carta → nodo
      }));

      const customNodes = {};
      examQuestionsTemplates.forEach((item, idx) => {
        const nId = `node_${idx + 1}`;
        customNodes[nId] = {
          id: nId,
          domain: 'estudio',
          icon: idx % 2 === 0 ? 'database' : 'codigo',
          label: item.concept,
          question: item.q,
          hint: item.hint,
          pos: posList[idx],
          color: idx % 2 === 0 ? 'cyan' : 'emerald',
          shape: 'hexagon',
          placedCard: null,
          lockedByOpponent: false,
          correctCardId: `card_${idx + 1}`  // <-- enlace 1-a-1 nodo → carta
        };
      });

      setNodes(customNodes);
      setHand(customCards);
      setOpponentHand(customCards.map((c, i) => ({ ...c, id: `opp_${c.id}_${i}` })));
      setEnergy(maxEnergy);
      setTurn(1);
      setSuccessNotif(`Tablero estructurado a partir de: ${fileBaseName}`);
      setTimeout(() => setSuccessNotif(null), 4000);

      // Persistir partida en la carpeta activa (MongoDB y LocalStorage)
      if (activeFolder) {
        const newGameRecord = {
          id: `game_${Date.now()}`,
          title: `Estudio: ${fileBaseName.toUpperCase()}`,
          questions_count: Object.keys(customNodes).length,
          created_at: new Date().toLocaleDateString('es-ES')
        };
        fetch(`/api/v1/folders/${activeFolder.id}/games`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ game: newGameRecord })
        }).catch(e => console.warn("No se pudo persistir el juego en BD:", e));

        try {
          const foldersRaw = localStorage.getItem('hubzy_user_study_folders');
          if (foldersRaw) {
            const fList = JSON.parse(foldersRaw);
            const fIdx = fList.findIndex(f => f.id === activeFolder.id);
            if (fIdx >= 0) {
              if (!fList[fIdx].games) fList[fIdx].games = [];
              fList[fIdx].games.unshift(newGameRecord);
              localStorage.setItem('hubzy_user_study_folders', JSON.stringify(fList));
            }
          }
        } catch {}
      }
    }
    setIsGeneratingArena(false);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col justify-between select-none">
      
      {/* 0. MODAL PRINCIPAL DE AUTENTICACIÓN (LOGIN Y REGISTRO CON CORREO Y CONTRASEÑA) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          if (currentUser) setIsAuthModalOpen(false);
        }}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
          capyVoice.currentUser = user;
          setIsFolderModalOpen(true);
        }}
      />

      {/* 0.1 MODAL DE EDICIÓN DE PERFIL / VOZ ADAPTATIVA DE CAPI */}
      <UserAuthModal
        isOpen={isUserModalOpen}
        currentUser={currentUser}
        onUserSaved={(user) => {
          setCurrentUser(user);
          setIsUserModalOpen(false);
          capyVoice.currentUser = user;
        }}
      />

      {/* -1. PANEL PREVIO DE CARPETAS Y ASIGNATURAS DE ESTUDIO (AISLADO POR USUARIO) */}
      <StudyFolderManagerModal
        isOpen={isFolderModalOpen}
        currentUser={currentUser}
        onSelectFolder={async (folder) => {
          setActiveFolder(folder);
          setIsFolderModalOpen(false);


          if (folder.playDirectly && folder.documents && folder.documents.filter(d => !d.isUploading).length > 0) {
            // Inicia el juego en el Nivel 1 (Fácil: 3 preguntas)
            setCurrentLevel(1);
            const success = await loadGameForLevel(1, folder, false);
            if (success) {
              // Tras generar el nivel, sesión Zen de respiración consciente
              setIsRelaxModalOpen(true);
            } else {
              setIsFolderModalOpen(true);
            }
          } else {
            setIsFolderModalOpen(true);
          }
        }}

        onStartNewFolder={(folder) => {
          setActiveFolder(folder);
          setIsFolderModalOpen(true);
        }}
      />

      {/* 2. ACTIVIDAD DE RESPIRACIÓN Y RELAJACIÓN ZEN (CAPI ZEN CON VOZ ELEVENLABS) */}
      <ZenRelaxModal
        isOpen={isRelaxModalOpen}
        onComplete={() => {
          setIsRelaxModalOpen(false);
          // Inicia el juego directamente con las cartas generadas
        }}
        onSkip={() => {
          setIsRelaxModalOpen(false);
          // Inicia el juego directamente
        }}
      />

      {/* 3. MODAL DE SELECCIÓN DE MODO DE JUEGO */}
      <GameModeModal
        isOpen={isModeModalOpen}
        onSelectMode={handleSelectGameMode}
      />


      {/* OVERLAY DE PROCESAMIENTO PROFUNDO DE DOCUMENTOS CON IA */}
      {isGeneratingArena && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md">
          <div className="flex flex-col items-center max-w-md p-8 bg-slate-900/90 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] text-center animate-pulse">
            <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
            <h3 className="text-xl font-black tracking-wider text-cyan-300 mb-2 uppercase">
              Analizando Contenido Interno
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Extrayendo texto de los documentos cargados y generando preguntas conceptuales profundas mediante Gemini...
            </p>
          </div>
        </div>
      )}

      {/* 3. MODAL DE PREGUNTA */}
      <QuestionModal
        isOpen={!!selectedNodeForQuestion}
        node={selectedNodeForQuestion}
        onClose={() => {
          const targetNode = selectedNodeForQuestion;
          setSelectedNodeForQuestion(null);
          if (targetNode?.hint) {
            triggerCapyVoice('hint', {
              customText: `Te doy una pista: ${targetNode.hint}`
            });
          }
        }}
      />

      {/* 3.1 MODAL DE DETALLE DE CARTA (VISUALIZACIÓN DE RESPUESTA) */}
      <CardDetailModal
        isOpen={!!selectedCardForDetail}
        card={selectedCardForDetail}
        onClose={() => setSelectedCardForDetail(null)}
      />

      {/* 4. MODAL FIN DE PARTIDA */}
      <AnimatePresence>
        {isGameOverModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md rounded-3xl bg-[#141d2d] border-2 border-cyan-400 p-6 sm:p-8 text-center text-slate-100 shadow-[0_0_50px_rgba(6,182,212,0.5)]"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-950/80 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 mb-4 shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                <Trophy className="w-8 h-8 text-amber-400" />
              </div>

              <h2 className="text-xl font-black uppercase tracking-wider text-white">
                ¡Partida Completada!
              </h2>
              <p className="text-xs text-slate-400 mt-1 mb-6">
                Dominaste el área de: <strong className="text-cyan-300">{boardInfo?.theme || 'Área de Estudio'}</strong>.
              </p>

              <div className="flex items-center justify-center gap-6 py-3 px-4 rounded-2xl bg-slate-900 border border-slate-700 mb-6">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Tu Puntuación</p>
                  <p className="text-2xl font-black text-amber-400 font-mono">{playerScore}</p>
                </div>
                {gameConfig.mode === '1v1' && (
                  <>
                    <div className="h-8 w-[1px] bg-slate-700" />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Puntaje Rival</p>
                      <p className="text-2xl font-black text-cyan-400 font-mono">{opponentScore}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={handleRestartWithNewQuestions}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Siguiente Desafío (Nuevas Preguntas)</span>
                </button>

                <button
                  onClick={handleTerminateGame}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Terminar Partida</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4.1 MODAL ASCENSO DE NIVEL — CELEBRACIÓN ULTRA-EMOTIVA CON CAPI */}
      <AnimatePresence>
        {isLevelUpModalOpen && levelUpData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
            <motion.div
              initial={{ opacity: 0, scale: 0.75, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.75, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="relative w-full max-w-lg rounded-3xl overflow-hidden text-center text-slate-100 shadow-[0_0_80px_rgba(168,85,247,0.6)]"
            >
              {/* Fondo degradado épico */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#1a0a35] via-[#0f1830] to-[#080e1c]" />

              {/* Partículas / confetti decorativo animado */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(18)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      left: `${5 + (i * 5.5) % 92}%`,
                      top: `${-5}%`,
                      backgroundColor: ['#a855f7','#f59e0b','#06b6d4','#10b981','#f43f5e','#818cf8'][i % 6]
                    }}
                    animate={{
                      y: ['0%', '110%'],
                      x: [0, (i % 2 === 0 ? 20 : -20)],
                      opacity: [0, 1, 1, 0],
                      rotate: [0, 360 * (i % 2 === 0 ? 1 : -1)]
                    }}
                    transition={{
                      duration: 2.5 + (i % 5) * 0.4,
                      delay: (i % 6) * 0.18,
                      repeat: Infinity,
                      ease: 'linear'
                    }}
                  />
                ))}
              </div>

              <div className="relative p-6 sm:p-8">
                {/* Ícono trofeo animado con brillo */}
                <div className="relative w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-purple-900 via-indigo-900 to-purple-800 border-2 border-amber-400 flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(251,191,36,0.6)]">
                  <motion.div
                    animate={{ scale: [1, 1.12, 1], rotate: [-3, 3, -3] }}
                    transition={{ repeat: Infinity, duration: 1.6 }}
                  >
                    <Trophy className="w-12 h-12 text-amber-300" />
                  </motion.div>
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="absolute -top-3 -right-3"
                  >
                    <Sparkles className="w-7 h-7 text-amber-400" />
                  </motion.div>
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
                    className="absolute -top-2 -left-3"
                  >
                    <Sparkles className="w-5 h-5 text-purple-300" />
                  </motion.div>
                </div>

                {/* Badge de nivel conquistado */}
                <motion.span
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/30 to-purple-500/30 border border-amber-400/70 text-amber-200 text-[11px] font-mono font-black tracking-widest uppercase shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                >
                  🏆 ¡NIVEL {levelUpData.completedLevel} CONQUISTADO! 🏆
                </motion.span>

                {/* Título principal */}
                <motion.h2
                  animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="text-2xl sm:text-3xl font-black uppercase tracking-wider mt-3 bg-gradient-to-r from-purple-300 via-cyan-300 to-amber-300 bg-clip-text text-transparent"
                  style={{ backgroundSize: '200% 200%' }}
                >
                  ¡Subes al Nivel {levelUpData.nextLevel}: {levelUpData.nextLvlInfo?.name}!
                </motion.h2>

                {/* Barra de progreso de niveles */}
                <div className="flex items-center justify-center gap-1.5 mt-3 mb-5">
                  {[1, 2, 3, 4, 5].map(lvl => (
                    <div key={lvl} className="flex flex-col items-center gap-1">
                      <motion.div
                        animate={lvl <= levelUpData.completedLevel
                          ? { scale: [1, 1.1, 1], boxShadow: ['0 0 0px rgba(168,85,247,0)', '0 0 12px rgba(168,85,247,0.8)', '0 0 0px rgba(168,85,247,0)'] }
                          : {}}
                        transition={{ repeat: Infinity, duration: 2, delay: lvl * 0.2 }}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black border-2 ${
                          lvl < levelUpData.completedLevel
                            ? 'bg-emerald-600 border-emerald-400 text-white'
                            : lvl === levelUpData.completedLevel
                            ? 'bg-gradient-to-br from-amber-500 to-purple-600 border-amber-400 text-white shadow-[0_0_15px_rgba(251,191,36,0.6)]'
                            : lvl === levelUpData.nextLevel
                            ? 'bg-gradient-to-br from-purple-700 to-indigo-700 border-purple-400 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                            : 'bg-slate-800 border-slate-600 text-slate-500'
                        }`}
                      >
                        {lvl < levelUpData.completedLevel ? '✓' : lvl}
                      </motion.div>
                      <div className={`text-[8px] font-mono ${lvl === levelUpData.nextLevel ? 'text-purple-300' : 'text-slate-500'}`}>
                        {lvl === levelUpData.nextLevel ? '→ Aquí' : ''}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mensaje emotivo de Capi — con foto y burbuja de diálogo */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900/90 to-indigo-950/80 border border-purple-400/50 text-left flex items-start gap-3 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                >
                  <motion.div
                    animate={{ scale: [1, 1.06, 1] }}
                    transition={{ repeat: Infinity, duration: 2.5 }}
                    className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-400 flex-shrink-0 shadow-[0_0_12px_rgba(251,191,36,0.4)]"
                  >
                    <img src={capybara3dImg} alt="Capi" className="w-full h-full object-cover" />
                  </motion.div>
                  <div>
                    <p className="text-[11px] font-black text-amber-300 font-mono flex items-center gap-1 mb-1">
                      <Heart className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                      Capi te dice con todo el corazón:
                    </p>
                    <p className="text-sm text-slate-100 italic leading-relaxed font-medium">
                      "{capySpeech.text || `¡NIVEL ${levelUpData.completedLevel} CONQUISTADO! Eso merece que grite de alegría desde todos los techos! Tu cerebro es una auténtica obra de arte. ¡Nunca voy a olvidar este momento contigo!`}"
                    </p>
                  </div>
                </motion.div>

                {/* Detalles del próximo nivel — tarjeta cálida */}
                <div className="grid grid-cols-3 gap-2 py-3 px-3 rounded-2xl bg-slate-950/60 border border-slate-700/60 mb-5 text-left">
                  <div className="text-center">
                    <p className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">Preguntas</p>
                    <p className="text-xl font-black text-amber-300 font-mono leading-none">
                      {levelUpData.nextLvlInfo?.questions}
                    </p>
                    <p className="text-[9px] text-slate-500">reactivos</p>
                  </div>
                  <div className="text-center border-x border-slate-700/50">
                    <p className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">Dificultad</p>
                    <p className="text-sm font-black text-purple-300 font-mono capitalize leading-tight">
                      {levelUpData.nextLvlInfo?.difficulty}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">Nivel</p>
                    <p className="text-xl font-black text-cyan-300 font-mono leading-none">
                      {levelUpData.nextLevel}
                    </p>
                    <p className="text-[9px] text-slate-500">de 5</p>
                  </div>
                  <div className="col-span-3 pt-2 border-t border-slate-800 mt-1">
                    <p className="text-[11px] text-slate-300 flex items-center gap-1.5 justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                      <span className="font-semibold italic">{levelUpData.nextLvlInfo?.desc}</span>
                    </p>
                  </div>
                </div>

                {/* CTA principal — botón invitante y cálido */}
                <motion.button
                  onClick={handleProceedToNextLevel}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:via-indigo-500 hover:to-cyan-400 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-[0_0_35px_rgba(168,85,247,0.6)] transition-all cursor-pointer"
                >
                  <motion.span
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <Sparkles className="w-5 h-5 text-amber-300" />
                  </motion.span>
                  <span>¡Quiero el Nivel {levelUpData.nextLevel}! ({levelUpData.nextLvlInfo?.questions} desafíos)</span>
                  <Zap className="w-4 h-4 text-amber-300" />
                </motion.button>

                {/* Mensaje de contención anti-ansiedad */}
                <p className="mt-3 text-[10px] text-slate-400 font-mono flex items-center justify-center gap-1">
                  <Heart className="w-3 h-3 text-rose-400" />
                  No hay prisa — Capi estará contigo en cada paso del Nivel {levelUpData.nextLevel}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* ENTORNO 3D */}
      <div className="absolute right-0 top-1/4 w-36 h-96 bg-gradient-to-l from-amber-700/80 via-amber-900/60 to-transparent border-l-4 border-amber-500/40 rounded-l-3xl pointer-events-none transform skew-y-6 opacity-80" />
      <div className="absolute right-24 bottom-1/3 w-48 h-28 bg-gradient-to-l from-cyan-400/40 via-cyan-400/10 to-transparent transform -rotate-12 blur-lg pointer-events-none" />

      {/* GUARDIÁN TÁCTICO 3D ZEN INTERACTIVO / HABLA CON ELEVENLABS Y REACCIONA SEGÚN LA SITUACIÓN */}
      <div className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center select-none pointer-events-auto">
        
        {/* BOCADILLO DE DIÁLOGO FLOTANTE (ESTILO CÓMIC NEÓN CON TEXTO SINTÉTICO Y MOTIVADOR) */}
        <AnimatePresence>
          {capySpeech.isVisible && capySpeech.text && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: -10 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className={`absolute -top-26 sm:-top-28 left-0 sm:left-2 w-64 sm:w-72 p-3 rounded-2xl border-2 shadow-2xl backdrop-blur-md z-50 text-left ${
                capyMood === 'encouraging' || isCapySad
                  ? 'bg-rose-950/98 border-rose-400 text-rose-100 shadow-[0_0_25px_rgba(244,63,94,0.45)]'
                  : capyMood === 'happy'
                  ? 'bg-emerald-950/98 border-emerald-400 text-emerald-100 shadow-[0_0_25px_rgba(52,211,153,0.45)]'
                  : capyMood === 'hint'
                  ? 'bg-[#101b2b]/98 border-amber-400 text-amber-100 shadow-[0_0_25px_rgba(251,191,36,0.45)]'
                  : 'bg-slate-900/98 border-cyan-400 text-slate-100 shadow-[0_0_25px_rgba(6,182,212,0.45)]'
              }`}
            >
              <div className="flex items-center justify-between border-b border-white/15 pb-1 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[8.5px] font-mono font-black uppercase flex items-center gap-1 ${
                    capyMood === 'encouraging' || isCapySad ? 'text-rose-300' : capyMood === 'happy' ? 'text-emerald-300' : capyMood === 'hint' ? 'text-amber-300' : 'text-cyan-300'
                  }`}>
                    <Sparkles className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
                    <span>HUBZI {capyMood === 'hint' ? 'PISTA' : capyMood === 'happy' ? 'CELEBRA' : capyMood === 'encouraging' ? 'TE ANIMA' : 'DICE'}:</span>
                  </span>
                </div>

                {/* Ondas / ecualizador de voz animado */}
                {isCapySpeaking ? (
                  <div className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-black/40">
                    <motion.span animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.35 }} className="w-1 bg-cyan-400 rounded-full" />
                    <motion.span animate={{ height: [6, 16, 6] }} transition={{ repeat: Infinity, duration: 0.40, delay: 0.1 }} className="w-1 bg-amber-400 rounded-full" />
                    <motion.span animate={{ height: [4, 14, 4] }} transition={{ repeat: Infinity, duration: 0.30, delay: 0.2 }} className="w-1 bg-cyan-300 rounded-full" />
                  </div>
                ) : (
                  <span className="text-[7.5px] text-cyan-400/80 font-mono">
                    Voz Capi Local
                  </span>
                )}
              </div>

              <p className="text-[10.5px] sm:text-[11.5px] font-medium leading-snug break-words">
                {capySpeech.text}
              </p>

              {/* Flecha cómic del bocadillo */}
              <div className={`absolute -bottom-2 left-8 w-3.5 h-3.5 rotate-45 border-r-2 border-b-2 ${
                capyMood === 'encouraging' || isCapySad ? 'bg-rose-950 border-rose-400' : capyMood === 'happy' ? 'bg-emerald-950 border-emerald-400' : capyMood === 'hint' ? 'bg-[#101b2b] border-amber-400' : 'bg-slate-900 border-cyan-400'
              }`} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* BANNER INTERACTIVO DE PSICOLOGÍA Y ALIVIO DE ESTRÉS */}
        <AnimatePresence>
          {zenOffer.show && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="absolute bottom-28 right-0 z-50 p-3 w-64 rounded-2xl bg-gradient-to-br from-emerald-950/98 via-teal-950/95 to-slate-900/98 border-2 border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.6)] backdrop-blur-md flex flex-col gap-2 pointer-events-auto text-left"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-emerald-300 font-mono flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  Capi Zen • Calma
                </span>
                <button
                  onClick={() => setZenOffer({ ...zenOffer, show: false })}
                  className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                  title="Cerrar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[10.5px] text-emerald-100 leading-snug">
                {zenOffer.distortion
                  ? `Detecté "${zenOffer.distortion}". Tranquilo, un error es solo un dato, no define tu capacidad.`
                  : 'Siento tensión en tu voz amiguito. ¿Hacemos 30 segundos de respiración guiada para oxigenar tu mente?'}
              </p>
              <button
                onClick={() => {
                  setZenOffer({ ...zenOffer, show: false });
                  setIsRelaxModalOpen(true);
                }}
                className="w-full py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-[10px] tracking-wide uppercase shadow-lg flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <Sparkles className="w-3 h-3 text-slate-950" />
                Respirar 4-7-8 con Capi
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          animate={
            capyMood === 'dancing' ? {
              x: [0, -14, 14, -10, 10, -6, 6, 0],
              rotateZ: [-12, 12, -12, 12, -8, 8, 0],
              scale: [1, 1.08, 0.95, 1.08, 1],
              y: [0, -8, 0, -8, 0]
            } : capyMood === 'celebrating' ? {
              y: [0, -20, 0, -15, 0, -10, 0],
              scale: [1, 1.12, 0.9, 1.12, 1],
              rotateZ: [-5, 5, -5, 5, 0]
            } : capyMood === 'love' ? {
              scale: [1, 1.06, 1, 1.06, 1],
              y: [0, -5, 0, -5, 0],
              rotateZ: [-2, 2, -2, 2, 0]
            } : capyMood === 'happy' ? {
              y: [0, -12, 0, -8, 0],
              scale: [1, 1.08, 1],
              rotateZ: [-3, 3, -3]
            } : capyMood === 'thinking' ? {
              rotateZ: [-3, 3, -3],
              y: [0, -4, 0],
              scale: [1, 1.02, 1]
            } : capyMood === 'surprised' ? {
              y: [0, -18, 4, 0],
              scale: [1, 1.15, 0.92, 1],
              rotateZ: [-6, 6, -3, 0]
            } : isCapySad ? {
              x: [0, -8, 8, -8, 8, -5, 5, 0],
              y: [0, 4, 0, 4, 0],
              rotateZ: [-4, 4, -4, 4, 0],
              scale: [1, 0.96, 1]
            } : isCapySpeaking ? {
              y: [0, -6, 0],
              scale: [1, 1.05, 1],
              rotateZ: [-1.5, 1.5, -1.5]
            } : {
              y: [0, -10, 0],
              rotateZ: [-2, 2, -2],
              scale: [1, 1.03, 1]
            }
          }
          transition={
            capyMood === 'dancing' ? { repeat: Infinity, duration: 0.55, ease: 'easeInOut' }
            : capyMood === 'celebrating' ? { repeat: Infinity, duration: 0.7, ease: 'easeInOut' }
            : capyMood === 'love' ? { repeat: Infinity, duration: 1.8, ease: 'easeInOut' }
            : capyMood === 'happy' ? { repeat: Infinity, duration: 0.6, ease: 'easeInOut' }
            : capyMood === 'thinking' ? { repeat: Infinity, duration: 2.2, ease: 'easeInOut' }
            : capyMood === 'surprised' ? { duration: 0.5, repeat: 2, ease: 'easeOut' }
            : isCapySad ? { duration: 0.6, repeat: 2, ease: 'easeInOut' }
            : isCapySpeaking ? { repeat: Infinity, duration: 0.45, ease: 'easeInOut' }
            : { repeat: Infinity, duration: 3.8, ease: 'easeInOut' }
          }
          whileHover={{ scale: 1.15, rotate: 4 }}
          whileTap={{ scale: 0.92 }}
          onClick={handleCapyClick}
          className="relative group cursor-pointer flex flex-col items-center"
          title="¡Haz clic en Capi! Te dará una pista con todo su amor 💙"
        >
          {/* Base Holográfica — color según mood */}
          <div className={`w-28 h-6 rounded-full blur-md -mb-3 transition-colors duration-300 ${
            isCapySad ? 'bg-rose-500/50'
            : capyMood === 'dancing' ? 'bg-purple-500/60'
            : capyMood === 'celebrating' ? 'bg-amber-400/60'
            : capyMood === 'love' ? 'bg-rose-400/50'
            : capyMood === 'happy' ? 'bg-emerald-400/50'
            : capyMood === 'thinking' ? 'bg-cyan-400/40'
            : capyMood === 'surprised' ? 'bg-indigo-400/50'
            : isCapySpeaking ? 'bg-amber-400/50'
            : 'bg-cyan-400/40'
          }`} />

          {/* Marco Redondo 3D con Borde Neón — color según mood */}
          <motion.div
            className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-3 overflow-hidden transition-colors duration-500 bg-[#0c1420] ${
              isCapySad
                ? 'border-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.8)]'
                : capyMood === 'dancing'
                ? 'border-purple-400 shadow-[0_0_40px_rgba(168,85,247,0.9)]'
                : capyMood === 'celebrating'
                ? 'border-amber-400 shadow-[0_0_45px_rgba(251,191,36,1)]'
                : capyMood === 'love'
                ? 'border-rose-400 shadow-[0_0_40px_rgba(251,113,133,0.85)]'
                : capyMood === 'happy'
                ? 'border-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.8)]'
                : capyMood === 'thinking'
                ? 'border-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.6)]'
                : capyMood === 'surprised'
                ? 'border-indigo-400 shadow-[0_0_40px_rgba(99,102,241,0.8)]'
                : isCapySpeaking
                ? 'border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.9)]'
                : 'border-emerald-400 shadow-[0_0_35px_rgba(52,211,153,0.6)] group-hover:border-cyan-300 group-hover:shadow-[0_0_45px_rgba(34,211,238,0.8)]'
            }`}
          >
            <img
              src={capybara3dImg}
              alt="Capibara Compañero"
              className={`w-full h-full object-cover object-center transition-all duration-300 ${
                isCapySad ? 'brightness-85 saturate-80'
                : capyMood === 'love' ? 'brightness-110 saturate-110'
                : capyMood === 'celebrating' ? 'brightness-115 saturate-125'
                : 'group-hover:scale-105'
              }`}
            />

            {/* ===== OVERLAYS POR MOOD ===== */}

            {/* OVERLAY DANCING: notas musicales */}
            {capyMood === 'dancing' && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {['♪','♫','♩','♬'].map((note, i) => (
                  <motion.span
                    key={i}
                    className="absolute text-purple-300 font-bold text-xs"
                    style={{ left: `${15 + i * 20}%`, top: '10%' }}
                    animate={{ y: [0, -30], opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.25 }}
                  >
                    {note}
                  </motion.span>
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-purple-950/50 via-transparent to-transparent" />
              </div>
            )}

            {/* OVERLAY CELEBRATING: estrellas y destellos */}
            {capyMood === 'celebrating' && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {['⭐','✨','🌟','💫','⚡'].map((star, i) => (
                  <motion.span
                    key={i}
                    className="absolute text-sm"
                    style={{ left: `${5 + i * 18}%`, top: `${10 + (i % 3) * 15}%` }}
                    animate={{
                      y: [0, -25], x: [(i % 2 === 0 ? 5 : -5)],
                      opacity: [0, 1, 1, 0], scale: [0.5, 1.3, 0.5]
                    }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.16 }}
                  >
                    {star}
                  </motion.span>
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-amber-950/40 via-transparent to-transparent" />
              </div>
            )}

            {/* OVERLAY LOVE: corazones flotando */}
            {capyMood === 'love' && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {['❤️','💙','💕','🥰','💖'].map((heart, i) => (
                  <motion.span
                    key={i}
                    className="absolute text-xs"
                    style={{ left: `${8 + i * 18}%`, bottom: '5%' }}
                    animate={{
                      y: [0, -50], opacity: [0, 1, 1, 0],
                      x: [0, (i % 2 === 0 ? 8 : -8)],
                      scale: [0.7, 1.1, 0.7]
                    }}
                    transition={{ repeat: Infinity, duration: 1.6, delay: i * 0.32 }}
                  >
                    {heart}
                  </motion.span>
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-rose-950/40 via-transparent to-transparent" />
              </div>
            )}

            {/* OVERLAY HAPPY: chispas verdes */}
            {capyMood === 'happy' && !isCapySad && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-emerald-400"
                    style={{ left: `${15 + i * 20}%`, top: '20%' }}
                    animate={{ y: [0, -20], opacity: [1, 0], scale: [1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.18 }}
                  />
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/30 via-transparent to-transparent" />
              </div>
            )}

            {/* OVERLAY THINKING: burbujas de pensamiento */}
            {capyMood === 'thinking' && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full bg-cyan-400/70"
                    style={{
                      width: `${6 + i * 3}px`,
                      height: `${6 + i * 3}px`,
                      top: `${20 + i * 12}%`,
                      right: `${10 + i * 5}%`
                    }}
                    animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
                    transition={{ repeat: Infinity, duration: 1 + i * 0.3, delay: i * 0.2 }}
                  />
                ))}
                <span className="absolute top-2 right-2 text-xs text-cyan-300">💭</span>
              </div>
            )}

            {/* OVERLAY SURPRISED: destellos de sorpresa */}
            {capyMood === 'surprised' && (
              <div className="absolute inset-0 pointer-events-none z-20">
                <motion.span
                  className="absolute top-2 left-1/2 -translate-x-1/2 text-lg"
                  animate={{ scale: [0.8, 1.4, 0.8], opacity: [0.7, 1, 0.7] }}
                  transition={{ repeat: Infinity, duration: 0.6 }}
                >
                  😲
                </motion.span>
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1.5 h-6 bg-indigo-400 rounded-full"
                    style={{
                      top: '30%',
                      left: '50%',
                      transformOrigin: '50% 100%',
                      rotate: `${i * 90}deg`
                    }}
                    animate={{ scaleY: [0.3, 1, 0.3], opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.12 }}
                  />
                ))}
              </div>
            )}

            {/* OVERLAY SAD: lágrimas (existente mejorado) */}
            {isCapySad && (
              <div className="absolute inset-0 flex flex-col items-center justify-between p-2 pointer-events-none z-20">
                <div className="relative w-full h-full">
                  <motion.div
                    animate={{ y: [0, 40], opacity: [1, 0], scale: [0.8, 1.2] }}
                    transition={{ repeat: Infinity, duration: 0.45, ease: 'easeIn' }}
                    className="absolute top-1/4 left-[28%] w-1.5 h-4 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee]"
                  />
                  <motion.div
                    animate={{ y: [0, 40], opacity: [1, 0], scale: [0.8, 1.2] }}
                    transition={{ repeat: Infinity, duration: 0.50, delay: 0.12, ease: 'easeIn' }}
                    className="absolute top-1/4 right-[28%] w-1.5 h-4 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee]"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-rose-950/80 via-transparent to-black/30 pointer-events-none" />
                <AlertTriangle className="w-6 h-6 text-rose-300 animate-bounce drop-shadow-md z-10" />
              </div>
            )}

            {/* Brillo dinámico de iluminación */}
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/40 via-transparent to-white/15 pointer-events-none" />
            <div className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full animate-ping ${
              isCapySad ? 'bg-rose-400'
              : capyMood === 'dancing' ? 'bg-purple-400'
              : capyMood === 'celebrating' ? 'bg-amber-400'
              : capyMood === 'love' ? 'bg-rose-400'
              : capyMood === 'happy' ? 'bg-emerald-400'
              : capyMood === 'thinking' ? 'bg-cyan-300'
              : capyMood === 'surprised' ? 'bg-indigo-400'
              : isCapySpeaking ? 'bg-amber-300'
              : 'bg-cyan-300'
            }`} />
          </motion.div>


          {/* Badge 3D interactivo con estado — refleja todos los moods */}
          <div className="mt-2 flex items-center gap-1.5 z-20">
            <div className={`px-3 py-0.5 rounded-full bg-slate-900/95 shadow-lg text-center backdrop-blur-sm border transition-colors duration-500 ${
              isCapySad ? 'border-rose-500/80'
              : capyMood === 'dancing' ? 'border-purple-400/80'
              : capyMood === 'celebrating' ? 'border-amber-400/80'
              : capyMood === 'love' ? 'border-rose-400/80'
              : capyMood === 'happy' ? 'border-emerald-400/80'
              : capyMood === 'thinking' ? 'border-cyan-400/80'
              : capyMood === 'surprised' ? 'border-indigo-400/80'
              : isCapySpeaking ? 'border-cyan-400'
              : 'border-emerald-400/80'
            }`}>
              <span className={`text-[9px] font-black font-mono tracking-wider flex items-center gap-1 justify-center transition-colors duration-300 ${
                isCapySad ? 'text-rose-300'
                : capyMood === 'dancing' ? 'text-purple-300'
                : capyMood === 'celebrating' ? 'text-amber-300'
                : capyMood === 'love' ? 'text-rose-300'
                : capyMood === 'happy' ? 'text-emerald-300'
                : capyMood === 'thinking' ? 'text-cyan-300'
                : capyMood === 'surprised' ? 'text-indigo-300'
                : isCapySpeaking ? 'text-cyan-300'
                : 'text-emerald-300'
              }`}>
                {isCapySad ? (
                  <><Sparkles className="w-2.5 h-2.5 text-rose-400 animate-pulse" /> CAPI TE ABRAZA</>
                ) : capyMood === 'dancing' ? (
                  <><span className="text-[9px]">🎵</span> CAPI BAILANDO</>
                ) : capyMood === 'celebrating' ? (
                  <><span className="text-[9px]">🎉</span> CAPI CELEBRA</>
                ) : capyMood === 'love' ? (
                  <><Heart className="w-2.5 h-2.5 text-rose-400 animate-pulse" /> CAPI TE QUIERE</>
                ) : capyMood === 'happy' ? (
                  <><Sparkles className="w-2.5 h-2.5 text-emerald-400" /> CAPI FELIZ</>
                ) : capyMood === 'thinking' ? (
                  <><span className="text-[9px]">💭</span> CAPI PENSANDO</>
                ) : capyMood === 'surprised' ? (
                  <><Zap className="w-2.5 h-2.5 text-indigo-400 animate-pulse" /> CAPI SORPRENDIDO</>
                ) : isCapySpeaking ? (
                  <><MessageCircle className="w-2.5 h-2.5 text-cyan-300 animate-pulse" /> CAPI HABLA</>
                ) : (
                  <><Sparkles className="w-2.5 h-2.5 text-cyan-400 animate-pulse" /> CAPI PSICÓLOGO</>
                )}
              </span>
            </div>


            {/* Botón Zen Anti-Estrés: Pausa 4-7-8 con Hubzi */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsRelaxModalOpen(true);
              }}
              className="p-1 rounded-full bg-emerald-950/90 border border-emerald-400/80 hover:border-emerald-300 text-emerald-300 hover:scale-110 transition-all shadow-[0_0_10px_rgba(52,211,153,0.4)] cursor-pointer"
              title="Pausa Zen Anti-Estrés: Realiza respiración 4-7-8 con Hubzi"
            >
              <Wind className="w-3 h-3 text-emerald-300 animate-pulse" />
            </button>

            {/* Botón Micrófono para hablar por voz con Hubzi */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMicrophone();
              }}
              className={`p-1 rounded-full border transition-all duration-300 shadow-md cursor-pointer flex items-center justify-center ${
                isListening 
                  ? 'bg-rose-600 border-rose-400 text-white ring-4 ring-rose-400/60 animate-pulse shadow-[0_0_15px_#f43f5e]' 
                  : isThinkingHint
                  ? 'bg-amber-600 border-amber-400 text-white ring-4 ring-amber-400/60 animate-spin'
                  : 'bg-slate-900/90 border-cyan-400/70 hover:border-cyan-300 text-cyan-300 hover:scale-110 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
              }`}
              title={isListening ? "Detener micrófono" : "Habla por micrófono con Hubzi para pedirle apoyo o pistas"}
            >
              {isListening ? <MicOff className="w-3 h-3 text-white" /> : <Mic className="w-3 h-3 text-cyan-300" />}
            </button>

            {/* Botón Silenciar / Activar Voz Tierna */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const nextMuted = !isCapyMuted;
                setIsCapyMuted(nextMuted);
                capyVoice.isMuted = nextMuted;
                if (nextMuted) capyVoice.stop();
              }}
              className="p-1 rounded-full bg-slate-900/90 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 transition-colors shadow-md cursor-pointer"
              title={isCapyMuted ? "Activar voz de Hubzi" : "Silenciar voz de Hubzi"}
            >
              {isCapyMuted ? <VolumeX className="w-3 h-3 text-rose-400" /> : <Volume2 className="w-3 h-3 text-cyan-300" />}
            </button>

            {/* Botón Música Ambient Calmante */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                hubziAmbient.toggle();
              }}
              className={`p-1 rounded-full border transition-all duration-300 shadow-md cursor-pointer ${
                isAmbientPlaying
                  ? 'bg-purple-900/90 border-purple-400 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.6)] ring-2 ring-purple-400/40'
                  : 'bg-slate-900/90 border-slate-700 hover:border-purple-400 text-slate-400 hover:text-purple-300'
              }`}
              title={isAmbientPlaying ? "Detener música calmante" : "Reproducir música ambient calmante"}
            >
              {isAmbientPlaying
                ? <Music2 className="w-3 h-3 text-purple-300 animate-pulse" />
                : <Music className="w-3 h-3" />
              }
            </button>
          </div>

          {/* Micro-pista interactiva al pasar el mouse */}
          <span className={`text-[7.5px] font-mono mt-1 text-center transition-colors ${
            isListening ? 'text-rose-400 font-bold animate-pulse' : 'text-cyan-300/80 group-hover:text-cyan-200'
          }`}>
            {isListening 
              ? 'Hubzi te escucha...' 
              : isThinkingHint 
              ? 'Hubzi preparando sus palabras con calidez...' 
              : 'Toca el micrófono para hablar con Hubzi'}
          </span>

        </motion.div>
      </div>



      {/* BARRA SUPERIOR CON CONTROLES LIMPIOS */}
      <div className="absolute top-2.5 right-3 z-40 flex items-center gap-2">
        {/* BOTÓN PERFIL / INICIAR SESIÓN / CERRAR SESIÓN */}
        {currentUser ? (
          <div className="flex items-center gap-1 bg-[#131d2b]/95 border-2 border-cyan-400/70 rounded-2xl p-0.5 shadow-[0_3px_0_#0e3c54]">
            <button
              onClick={() => setIsUserModalOpen(true)}
              className="px-2.5 py-1 text-cyan-200 text-xs font-bold transition-all flex items-center gap-2 hover:bg-[#1a283a] rounded-xl cursor-pointer group"
              title="Configurar perfil de usuario, edad y voz de Capi"
            >
              <UserIcon className={`w-4 h-4 shrink-0 ${currentUser?.gender === 'femenino' ? 'text-rose-400' : 'text-sky-400'}`} />
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[11px] font-black font-mono text-white group-hover:text-cyan-300 truncate max-w-[90px]">
                  {currentUser?.username || currentUser?.email?.split('@')[0] || 'Mi Perfil'}
                </span>
                <span className="text-[8.5px] font-mono text-cyan-400 truncate max-w-[90px]">
                  {currentUser?.email ? currentUser.email : `${currentUser?.age}a • ${currentUser?.gender === 'femenino' ? 'Voz Masc.' : 'Voz Fem.'}`}
                </span>
              </div>
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 hover:bg-rose-950/80 hover:text-rose-300 text-slate-400 rounded-xl transition-colors cursor-pointer"
              title="Cerrar sesión de esta cuenta"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border-2 border-cyan-300 text-slate-950 font-black text-xs transition-all flex items-center gap-2 shadow-[0_3px_0_#0284c7] active:translate-y-0.5 active:shadow-none cursor-pointer"
            title="Iniciar sesión o registrarse con correo y contraseña"
          >
            <LogInIcon className="w-4 h-4 text-slate-950" />
            <span>Iniciar Sesión</span>
          </button>
        )}




        {/* BOTÓN REINICIAR (GENERA NUEVAS PREGUNTAS) */}
        <button
          onClick={handleRestartWithNewQuestions}
          className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-2 border-emerald-300 text-white text-xs font-black transition-all flex items-center gap-2 shadow-[0_3px_0_#064e3b] active:translate-y-0.5 active:shadow-none cursor-pointer"
          title="Reiniciar partida y generar un nuevo conjunto de preguntas de este documento"
        >
          <RotateCcw className="w-4 h-4 text-emerald-200" />
          <span className="hidden sm:inline font-black tracking-wide">Reiniciar Preguntas</span>
          <span className="sm:hidden">Reiniciar</span>
        </button>

        {/* BOTÓN TERMINAR PARTIDA (REGRESA AL INICIO) */}
        <button 
          onClick={handleTerminateGame}
          className="px-3.5 py-2 rounded-2xl bg-[#2e171f] hover:bg-[#3d1e29] border-2 border-rose-500/70 text-rose-200 text-xs font-black transition-all flex items-center gap-2 shadow-[0_3px_0_#9f1239] active:translate-y-0.5 active:shadow-none cursor-pointer"
          title="Terminar partida actual y volver al baúl de carpetas"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden md:inline">Terminar Partida</span>
          <span className="md:hidden">Salir</span>
        </button>
      </div>

      {/* Marcadores de Puntuación, Nivel Actual y Progreso del Estudiante */}
      <div className="absolute left-4 top-3 z-30 flex items-center gap-2 sm:gap-2.5">
        {/* Indicador de Nivel 1 a 5 */}
        {(() => {
          const lvlInfo = GAME_LEVELS.find(l => l.level === currentLevel) || GAME_LEVELS[0];
          return (
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-purple-950/95 to-indigo-950/95 border border-purple-400/80 px-3 py-1 rounded-xl shadow-lg backdrop-blur-sm" title={`Nivel ${currentLevel} de 5: ${lvlInfo.name}`}>
              <Trophy className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-purple-300 uppercase">
                NIVEL {currentLevel}/5:
              </span>
              <span className="text-xs font-black font-mono text-purple-200">
                {lvlInfo.name} ({lvlInfo.questions} preg.)
              </span>
            </div>
          );
        })()}

        <div className="flex items-center gap-2 bg-slate-900/90 border border-emerald-400/80 px-3 py-1 rounded-xl shadow-lg" title="Progreso del Circuito">
          <span className="text-[10px] font-mono text-emerald-300 font-bold uppercase">Progreso:</span>
          <span className="text-sm font-black font-mono text-emerald-400">
            {Object.values(nodes).filter(n => Boolean(n.placedCard)).length} / {Object.keys(nodes).length || 3}
          </span>
        </div>
      </div>

      {/* Contador de Cartas Propias en Mano */}
      <div className="absolute bottom-5 left-4 sm:left-6 z-40 flex items-center gap-2">
        <div className="flex items-center gap-2 bg-[#101726]/90 border border-amber-400/60 px-3 py-1.5 rounded-xl shadow-lg" title="Tus cartas restantes">
          <Layers className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono font-bold text-amber-300">
            {String(hand.length).padStart(2, '0')} cartas
          </span>
        </div>
      </div>


      {/* CARTA VOLADORA EN VIVO (MOVIMIENTO EN TIEMPO REAL AL JUGAR LA MÁQUINA O EL RIVAL) */}
      <AnimatePresence>
        {flyingCard && (
          <motion.div
            initial={{ 
              top: '8%', 
              left: '50%', 
              x: '-50%',
              scale: 0.9, 
              opacity: 1, 
              zIndex: 100 
            }}
            animate={{ 
              top: flyingCard.targetPos?.top || '50%', 
              left: flyingCard.targetPos?.left || '50%', 
              x: '-50%',
              y: '-50%',
              scale: 0.5, 
              opacity: [1, 1, 0.95] 
            }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
            className="fixed pointer-events-none z-50 w-28 h-40 rounded-2xl border-2 border-cyan-400 bg-slate-900 shadow-[0_0_30px_rgba(34,211,238,0.9)] p-2 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-mono font-bold text-cyan-300 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-400">
                {flyingCard.card.domain?.toUpperCase() || 'EN JUEGO'}
              </span>
              <span className="text-[10px] font-bold text-amber-300 font-mono">
                {flyingCard.card.cost || '+1'}
              </span>
            </div>
            <div className="w-full h-20 rounded-xl bg-cyan-950/60 border border-cyan-400/40 flex flex-col items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-300 animate-spin" />
              <span className="text-[9px] text-cyan-200 font-bold mt-1">Colocando...</span>
            </div>
            <div className="w-full py-1 px-1.5 rounded-lg bg-slate-950 border border-slate-700 text-center">
              <p className="text-[9px] font-black text-white truncate uppercase">
                {flyingCard.card.name}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TABLERO — CONSOLA OCTOGONAL ELEVADA 3D IDÉNTICA A LA IMAGEN DE REFERENCIA */}
      <div className="isometric-board-container flex-1 flex items-center justify-center w-full my-1 sm:my-auto px-2 z-10 overflow-visible">
        
        {/* Carcasa Octogonal Externa con Extrusión de Sombra 3D */}
        <div 
          className="table-3d relative w-[96%] max-w-6xl h-[410px] sm:h-[445px] lg:h-[485px] max-h-[66vh] bg-[#e2e8f0] border-4 border-[#cbd5e1] p-3 sm:p-4 flex flex-col justify-between"
          style={{
            clipPath: 'polygon(5% 0%, 95% 0%, 100% 9%, 100% 91%, 95% 100%, 5% 100%, 0% 91%, 0% 9%)',
            boxShadow: '0 28px 45px -8px rgba(15, 23, 42, 0.40), 0 14px 0 #94a3b8, inset 0 3px 6px rgba(255,255,255,0.95)'
          }}
        >

          {/* Superficie Interior Biselada del Tablero */}
          <div 
            className="absolute inset-2 bg-[#f8fafc] border-2 border-slate-300 pointer-events-none"
            style={{
              clipPath: 'polygon(4.8% 0%, 95.2% 0%, 100% 8.5%, 100% 91.5%, 95.2% 100%, 4.8% 100%, 0% 91.5%, 0% 8.5%)',
              backgroundImage: 'linear-gradient(rgba(148,163,184,0.20) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.20) 1px, transparent 1px)',
              backgroundSize: '32px 32px'
            }}
          />

          {/* ========================================================= */}
          {/* MÓDULOS DECORATIVOS COLORIDOS INCRUSTADOS EN LOS BORDES */}
          {/* ========================================================= */}

          {/* 1. ESQUINA SUPERIOR IZQUIERDA: Bisel Azul Pizarra Oscuro */}
          <div className="absolute top-1 left-2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-[#1e293b] to-[#334155] border border-[#475569] shadow-md transform -rotate-[35deg] pointer-events-none">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
            <span className="w-5 h-1 rounded-full bg-slate-300/60" />
          </div>

          {/* 2. ESQUINA SUPERIOR DERECHA: Bisel Naranja Coral Vivo */}
          <div className="absolute top-1 right-2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] border border-[#fb923c] shadow-md transform rotate-[35deg] pointer-events-none">
            <div className="w-2 h-2 rounded-full bg-amber-200 shadow-[0_0_8px_#fde68a]" />
            <span className="w-5 h-1 rounded-full bg-white/70" />
          </div>

          {/* 3. ESQUINA INFERIOR IZQUIERDA: Bisel Índigo / Morado */}
          <div className="absolute bottom-1 left-2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-[#312e81] to-[#4f46e5] border border-[#6366f1] shadow-md transform rotate-[35deg] pointer-events-none">
            <div className="w-2 h-2 rounded-full bg-indigo-200 shadow-[0_0_8px_#c7d2fe]" />
            <span className="w-5 h-1 rounded-full bg-white/60" />
          </div>

          {/* 4. ESQUINA INFERIOR DERECHA: Bisel Dorado / Mostaza */}
          <div className="absolute bottom-1 right-2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-[#ca8a04] to-[#eab308] border border-[#facc15] shadow-md transform -rotate-[35deg] pointer-events-none">
            <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
            <span className="w-5 h-1 rounded-full bg-amber-950/40" />
          </div>

          {/* 5. LATERAL IZQUIERDO: Placa Modular Salmón con Sensor Central y Ranuras */}
          <div className="absolute left-1 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-2.5 py-4 px-1.5 rounded-2xl bg-gradient-to-b from-[#f87171] to-[#fb923c] border-2 border-[#fdba74] shadow-[0_4px_12px_rgba(248,113,113,0.35)] pointer-events-none">
            <div className="w-2 h-8 rounded-full bg-white/50 border border-white/70 flex items-center justify-center">
              <div className="w-1 h-4 rounded-full bg-white" />
            </div>
            <div className="w-4 h-4 rounded-lg bg-[#b91c1c]/50 border border-white/80 flex items-center justify-center shadow-inner">
              <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
            </div>
            <div className="w-2 h-8 rounded-full bg-white/50 border border-white/70" />
          </div>

          {/* 6. LATERAL DERECHO: Bahía Profunda Oscura con Indicador Triángulo / Flecha */}
          <div className="absolute right-1 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-2.5 py-4 px-1.5 rounded-2xl bg-gradient-to-b from-[#0f172a] to-[#1e293b] border-2 border-[#475569] shadow-[0_4px_12px_rgba(15,23,42,0.45)] pointer-events-none">
            <div className="w-2 h-8 rounded-full bg-slate-700/80 border border-slate-500/60" />
            <div className="w-4 h-4 rounded-lg bg-orange-500 border border-orange-300 flex items-center justify-center shadow-[0_0_10px_rgba(249,115,22,0.8)]">
              <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-white ml-0.5" />
            </div>
            <div className="w-2 h-8 rounded-full bg-slate-700/80 border border-slate-500/60" />
          </div>

          {/* 7. BORDE SUPERIOR: Conectores de Hardware Metálicos */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-6 py-1 rounded-full bg-[#cbd5e1] border border-[#94a3b8] shadow-inner pointer-events-none">
            <span className="w-10 h-1.5 rounded-full bg-[#64748b]/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
            <span className="w-10 h-1.5 rounded-full bg-[#64748b]/40" />
          </div>

          {/* 8. BORDE INFERIOR: Conector de Ranura de Cartas */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 px-10 py-1 rounded-full bg-[#cbd5e1] border border-[#94a3b8] shadow-inner pointer-events-none">
            <span className="w-16 h-1.5 rounded-full bg-[#64748b]/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_8px_#fb7185]" />
            <span className="w-16 h-1.5 rounded-full bg-[#64748b]/40" />
          </div>



          {/* PANTALLA TÁCTICA CON DISTRIBUCIÓN ESPACIAL ABIERTA */}
          <div className="w-full h-full rounded-2xl bg-[#f8fafc]/70 border border-slate-300/80 p-3 sm:p-4 flex flex-col justify-between relative overflow-hidden">
            
            <div className="flex items-center justify-between border-b border-slate-300/70 pb-2 z-10">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 border border-orange-300">
                  {boardInfo?.theme || 'Circuito de Estudio'}
                </span>
                <h1 className="text-sm sm:text-base font-black tracking-widest text-slate-700 font-mono uppercase">
                  {boardInfo?.title || 'Tablero de Aprendizaje'}
                </h1>
              </div>

              {/* Selector / Barra de 5 Niveles */}
              <div className="hidden sm:flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded-xl border border-slate-300 shadow-sm">
                {GAME_LEVELS.map((lvl) => {
                  const isCurrent = lvl.level === currentLevel;
                  const isCompleted = lvl.level < currentLevel;
                  return (
                    <button
                      key={lvl.level}
                      onClick={() => handleJumpToLevel(lvl.level)}
                      className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-orange-500 text-white shadow-[0_2px_8px_rgba(249,115,22,0.5)] scale-105'
                          : isCompleted
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-400'
                          : 'bg-slate-100 text-slate-500 hover:text-slate-700 border border-slate-200'
                      }`}
                      title={`Nivel ${lvl.level}: ${lvl.name} (${lvl.questions} preguntas)`}
                    >
                      {isCompleted && <Check className="w-2.5 h-2.5 inline mr-1 text-emerald-600" />}
                      N{lvl.level}: {lvl.name}
                    </button>
                  );
                })}
              </div>
            </div>


            {/* ÁREA CENTRAL DE NODOS DISTRIBUIDOS LIBREMENTE */}
            <div className="relative flex-1 w-full h-full my-2 flex items-center justify-center">
              {Object.keys(nodes).length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center text-center p-6 rounded-3xl bg-white/80 border border-slate-300 max-w-md backdrop-blur-sm shadow-lg"
                >
                  <div className="w-16 h-16 rounded-2xl bg-orange-100 border border-orange-300 flex items-center justify-center text-orange-600 mb-4 shadow-md">
                    <UploadCloud className="w-8 h-8 text-orange-500 animate-bounce" />
                  </div>
                  <h3 className="text-base font-bold text-slate-700 font-mono uppercase tracking-wide">
                    Circuito Sin Inicializar
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
                    Sube tus documentos (PDF, audio, imágenes o YouTube) para que Gemini y el motor RAG construyan las preguntas, conceptos y nodos en tiempo real.
                  </p>
                  <button
                    onClick={() => setIsFolderModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    <FolderIcon className="w-4 h-4" />
                    <span>Mis Carpetas de Estudio</span>
                  </button>
                </motion.div>
              ) : (
                <>
                  {/* Conexiones de red con flechas de flujo — exactamente como en la imagen de referencia */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <marker id="arrow-coral" markerWidth="8" markerHeight="8" refX="5" refY="4" orient="auto">
                        <polygon points="0 1, 7 4, 0 7" fill="#ea580c" />
                      </marker>
                      <marker id="arrow-dark" markerWidth="8" markerHeight="8" refX="5" refY="4" orient="auto">
                        <polygon points="0 1, 7 4, 0 7" fill="#1e293b" />
                      </marker>
                    </defs>
                    {Object.values(nodes).map((node, i, arr) => {
                      const nextNode = arr[(i + 1) % arr.length];
                      if (!node.pos || !nextNode.pos) return null;
                      const isEven = i % 2 === 0;
                      return (
                        <line
                          key={`line-${node.id}-${nextNode.id}`}
                          x1={node.pos.left}
                          y1={node.pos.top}
                          x2={nextNode.pos.left}
                          y2={nextNode.pos.top}
                          stroke={isEven ? "#ea580c" : "#1e293b"}
                          strokeWidth="3"
                          strokeLinecap="round"
                          opacity={isEven ? "0.85" : "0.75"}
                          markerEnd={isEven ? "url(#arrow-coral)" : "url(#arrow-dark)"}
                        />
                      );
                    })}
                  </svg>

                  {/* Render de los Nodos Distribuidos por Toda la Pantalla */}
                  {Object.values(nodes).map((node) => (
                    <div
                      key={node.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2"
                      style={{ top: node.pos?.top || "50%", left: node.pos?.left || "50%" }}
                    >
                      <div className="relative">
                        {node.lockedByOpponent && (
                          <span className="absolute -top-3 -right-3 z-30 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[8px] flex items-center gap-0.5 shadow-md animate-pulse">
                            <Lock className="w-2.5 h-2.5" /> RIVAL
                          </span>
                        )}

                        <ArcadeNode
                          id={node.id}
                          icon={node.icon}
                          color={node.color}
                          shape={node.shape}
                          domain={node.domain}
                          theme={node.theme || boardInfo?.theme}
                          index={node.nodeIndex ?? 0}
                          label={node.label}
                          question={node.question}
                          hint={node.hint}
                          placedCard={node.placedCard}
                          onClick={handleNodeClick}
                        />
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Luces Neón de Piso */}
            <div className="flex items-center justify-center gap-12 mt-1">
              <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee] animate-pulse" />
              <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee] animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* NOTIFICACIÓN FLOTANTE — roja si Capi está triste (respuesta incorrecta), cyan si correcto */}
      <AnimatePresence>
        {successNotif && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`absolute top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-2.5 rounded-2xl border-2 text-xs font-bold shadow-2xl flex items-center gap-2.5 backdrop-blur-md ${
              isCapySad
                ? 'bg-rose-950/95 border-rose-500 text-rose-200'
                : 'bg-slate-900/95 border-cyan-400 text-cyan-200'
            }`}
          >
            {isCapySad
              ? <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
              : <Check className="w-4 h-4 text-cyan-300" />}
            {successNotif}
          </motion.div>
        )}
      </AnimatePresence>

        {/* MANO DE CARTAS EN ABANICO CON ADAPTACIÓN PARA HASTA 26 CARTAS */}
        <div className={`relative w-full flex flex-col items-center justify-center pb-2 z-40 transition-all duration-300 overflow-visible ${
          !isActualTurn
            ? 'opacity-50 grayscale-[35%] pointer-events-none cursor-not-allowed' 
            : 'opacity-100'
        }`}>

        {/* BANDEJA / DOCK FÍSICO DE CARTAS "EL MAZO" (IDÉNTICO A LA IMAGEN DE REFERENCIA) */}
        <div className="relative px-4 py-3 rounded-2xl bg-[#e2e8f0] border-2 border-[#cbd5e1] shadow-[0_12px_24px_rgba(0,0,0,0.18),0_4px_0_#94a3b8,inset_0_2px_4px_rgba(255,255,255,0.9)] flex items-center justify-center">
          
          {/* Fondo con huecos/ranuras rectangulares empotradas (slots de cartas) */}
          <div className="flex items-center gap-2.5 overflow-visible px-1 py-0.5">
            {hand.map((card, idx) => (
              <div 
                key={`slot-${card.id || idx}`}
                className="relative rounded-2xl p-1 bg-[#cbd5e1]/40 border border-[#94a3b8]/40 shadow-inner flex items-center justify-center"
                style={{
                  width: '86px',
                  height: '112px'
                }}
              >
                {/* Carta encajada en su hueco */}
                <GameCard
                  id={card.id}
                  name={card.name}
                  cost={card.cost}
                  type={card.type}
                  sourceType={card.sourceType}
                  domain={card.domain}
                  theme={card.theme || boardInfo?.theme}
                  index={card.cardIndex ?? idx}
                  rotation={0}
                  zIndex={card.zIndex}
                  isDraggable={isActualTurn}
                  isSelected={false}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleCardClick(card)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
