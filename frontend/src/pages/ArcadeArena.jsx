import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  RotateCcw,
  LogOut,
  Sparkles,
  BookOpen,
  Trophy,
  LogIn as LogInIcon,
  Folder as FolderIcon,
  User as UserIcon,
  Home,
  Crown,
  Compass,
} from "lucide-react";
import QuestionModal from "../components/QuestionModal";
import CardDetailModal from "../components/CardDetailModal";
import GameModeModal from "../components/GameModeModal";
import ZenRelaxModal from "../components/ZenRelaxModal";
import StudyFolderManagerModal from "../components/StudyFolderManagerModal";
import UserAuthModal from "../components/UserAuthModal";
import AuthModal from "../components/AuthModal";
import SubscriptionModal from "../components/SubscriptionModal";
import TutorialModal from "../components/TutorialModal";
import VictoryModal from "../components/VictoryModal";
import WelcomeScreen from "../components/WelcomeScreen";
import GenerationOverlay from "../components/GenerationOverlay";
import AdventureMap from "../components/AdventureMap";
import LegalModal from "../components/LegalModal";
import CookieConsentBanner from "../components/CookieConsentBanner";
import GameOverModal from "../components/GameOverModal";
import LevelUpModal from "../components/LevelUpModal";
import CapyCompanion from "../components/CapyCompanion";
import RestartOptionsModal from "../components/RestartOptionsModal";
import HandTray from "../components/HandTray";
import BoardConsole from "../components/BoardConsole";
import { capyAudio } from "../utils/capyAudio";
import { capyVoice } from "../utils/capyVoice";
import { hubziAmbient } from "../utils/hubziAmbient";
import { detectDomainCategory } from "../utils/domainIcons";
import { STATIC_ADMIN_GAME } from "../utils/staticAdminGame";
import { fetchWithAuth } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { useCrisis, checkCrisisFlag } from "../lib/crisis.jsx";
import { GAME_LEVELS } from "../utils/gameConfig";
import { analyzeIntentLocally } from "../utils/localNlp";
import { getDynamicLayout } from "../utils/boardLayout";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { bandForAge, getBand } from "../utils/ageConfig";

export default function ArcadeArena() {
  const { reportCrisis } = useCrisis();
  const setAuthSession = useAuthStore((s) => s.setSession);
  // Estados de Niveles del Juego (1 a 5) y Mapa de Aventura
  const [currentLevel, setCurrentLevel] = useState(1);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [levelStars, setLevelStars] = useState({ 1: 0 });
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [isLevelUpModalOpen, setIsLevelUpModalOpen] = useState(false);
  const [levelUpData, setLevelUpData] = useState(null);
  const [isLevelTransitioning, setIsLevelTransitioning] = useState(false);
  const [isRestartOptionsModalOpen, setIsRestartOptionsModalOpen] =
    useState(false);

  // Estados del juego (Vacíos al inicio: sólo se pueblan tras subir materiales)
  const [boardInfo, setBoardInfo] = useState(null);
  const [nodes, setNodes] = useState({});
  const [hand, setHand] = useState([]);
  const [handPage, setHandPage] = useState(0); // Paginación inteligente del mazo (8 cartas por vista)
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
  const [capyMood, setCapyMood] = useState("idle"); // 'idle' | 'happy' | 'encouraging' | 'hint' | 'surprised' | 'welcome'
  const [capySpeech, setCapySpeech] = useState({
    text: "",
    isVisible: false,
    mood: "idle",
  });
  const [isCapySpeaking, setIsCapySpeaking] = useState(false);
  const [isCapyMuted, setIsCapyMuted] = useState(false);
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  const capySpeechTimeoutRef = React.useRef(null);
  const speakTimeoutRef = React.useRef(null);

  // Reconocimiento de Voz / Micrófono Interactivo con Capibara
  const [isThinkingHint, setIsThinkingHint] = useState(false);

  // Gestión de Usuario Activo y Autenticación (Email + Contraseña)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("hubzy_current_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Banda de edad del jugador — gobierna densidad, celebración y presión
  const userAgeBand = currentUser?.age_band || bandForAge(currentUser?.age);
  const userBandConfig = getBand(userAgeBand);
  const kidMode = !userBandConfig.pressure;

  // Registro adaptativo BKT (fire-and-forget — nunca bloquea el juego)
  const recordAdaptiveAttempt = (node, correct) => {
    const topic = node?.answerSpec?.topic || node?.domain || "general";
    fetchWithAuth("/api/v1/adaptive/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        domain: node?.domain === "trampa" ? "general" : (node?.domain || "general"),
        topic,
        correct,
      }),
    }).catch(() => {});
  };

  // Pantalla Inicial de Bienvenida (Estilo Card Clash)
  const [isWelcomeScreenVisible, setIsWelcomeScreenVisible] = useState(true);

  // Modal de Login / Registro
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Modal secundario de edición de perfil (género, edad, apodo)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Cerrar Sesión
  const handleLogout = () => {
    localStorage.removeItem("hubzy_current_user");
    localStorage.removeItem("hubzy_auth_token");
    useAuthStore.getState().logout();
    setCurrentUser(null);
    setIsAuthModalOpen(true);
  };

  // Modal de Suscripción Stripe (Hubzy Pro)
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  // Modal Legal y Transparencia (Términos, Privacidad, Reembolsos, Cookies)
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState("terms");

  const handleOpenLegal = (tab = "terms") => {
    setLegalModalTab(tab);
    setIsLegalModalOpen(true);
  };

  // Escuchar si el usuario regresa de Stripe con ?payment=success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const sessionId = params.get("session_id");

    if (payment === "success" && sessionId) {
      fetchWithAuth(`/api/v1/payments/verify-session/${sessionId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.is_paid) {
            setSuccessNotif(
              "¡Pago confirmado en Stripe! Bienvenido a Hubzy Pro 🎉",
            );
            if (currentUser) {
              const updated = { ...currentUser, plan: "pro" };
              setCurrentUser(updated);
              localStorage.setItem(
                "hubzy_current_user",
                JSON.stringify(updated),
              );
            }
          }
        })
        .catch(console.error)
        .finally(() => {
          // Limpiar URL sin recargar
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
          setTimeout(() => setSuccessNotif(null), 5000);
        });
    } else if (payment === "cancelled") {
      setSuccessNotif("Pago cancelado en Stripe.");
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => setSuccessNotif(null), 4000);
    }

    // Deep-link desde el Dashboard: /arena?upgrade=1 abre el modal Pro
    if (params.get("upgrade") === "1") {
      setIsSubscriptionModalOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [currentUser]);

  // Modales (Flujo: 1. Autenticación -> 2. Carpetas/Material -> 3. Zen Relax -> 4. Juego en Vivo)
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState(false);
  const [victoryStats, setVictoryStats] = useState({
    accuracy: 100,
    totalQuestions: 5,
  });
  const [activeFolder, setActiveFolder] = useState(null);
  const [isRelaxModalOpen, setIsRelaxModalOpen] = useState(false);
  const [zenOffer, setZenOffer] = useState({
    show: false,
    category: "",
    distortion: "",
    emotion: "",
  });
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);
  const [isGeneratingArena, setIsGeneratingArena] = useState(false);
  const [selectedNodeForQuestion, setSelectedNodeForQuestion] = useState(null);
  const [selectedCardForDetail, setSelectedCardForDetail] = useState(null);
  const [selectedCardInHand, setSelectedCardInHand] = useState(null);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState(false);

  // Accesibilidad (A11y): Cerrar cualquier modal activo al presionar la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isLegalModalOpen) setIsLegalModalOpen(false);
        else if (selectedNodeForQuestion) setSelectedNodeForQuestion(null);
        else if (selectedCardForDetail) setSelectedCardForDetail(null);
        else if (isFolderModalOpen) setIsFolderModalOpen(false);
        else if (isTutorialOpen) setIsTutorialOpen(false);
        else if (isSubscriptionModalOpen) setIsSubscriptionModalOpen(false);
        else if (isRelaxModalOpen) setIsRelaxModalOpen(false);
        else if (isUserModalOpen) setIsUserModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isLegalModalOpen,
    selectedNodeForQuestion,
    selectedCardForDetail,
    isFolderModalOpen,
    isTutorialOpen,
    isSubscriptionModalOpen,
    isRelaxModalOpen,
    isUserModalOpen,
  ]);

  // AYUDA PEDAGÓGICA ANTI-FRUSTRACIÓN: Flecha y destello tras 30s de inactividad
  const [hintCardId, setHintCardId] = useState(null);
  const [hintNodeId, setHintNodeId] = useState(null);
  const lastActionTimestampRef = React.useRef(Date.now());

  // Reiniciar temporizador con cualquier interacción
  const registerUserActivity = () => {
    lastActionTimestampRef.current = Date.now();
    if (hintCardId) {
      setHintCardId(null);
      setHintNodeId(null);
    }
  };

  // Temporizador de 30 segundos
  useEffect(() => {
    const checkInterval = setInterval(() => {
      // Solo disparar si hay una partida en curso y cartas en mano
      if (
        hand.length > 0 &&
        Object.keys(nodes).length > 0 &&
        !isVictoryModalOpen
      ) {
        const elapsed = (Date.now() - lastActionTimestampRef.current) / 1000;
        if (elapsed >= 30 && !hintCardId) {
          // Encontrar el primer nodo vacío que aún no tenga carta colocada
          const emptyNode = Object.values(nodes).find((n) => !n.placedCard);
          if (emptyNode) {
            // Buscar la carta en la mano que corresponde a este nodo
            const matchingCard = hand.find(
              (c) =>
                (emptyNode.correctCardId &&
                  String(emptyNode.correctCardId) === String(c.id)) ||
                (c.matchesNodeId &&
                  String(c.matchesNodeId) === String(emptyNode.id)) ||
                (emptyNode.label &&
                  c.name &&
                  emptyNode.label.trim().toLowerCase() ===
                    c.name.trim().toLowerCase()),
            );

            if (matchingCard) {
              setHintCardId(matchingCard.id);
              setHintNodeId(emptyNode.id);
              setSuccessNotif(
                `💡 Pista de Capi: ¡Esta carta pertenece a la casilla "${emptyNode.label || "en espera"}"!`,
              );
              setTimeout(() => setSuccessNotif(null), 6000);
            }
          }
        }
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [hand, nodes, hintCardId, isVictoryModalOpen]);

  // Configuración de Sala (Modo Solitario por defecto)
  const [gameConfig, setGameConfig] = useState({
    mode: "solo",
    roomId: "sala-solo",
    isHost: true,
  });

  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);

  const clientId = useMemo(() => {
    let saved = sessionStorage.getItem("hubzy_client_id");
    if (!saved) {
      saved = `player_${Math.random().toString(36).substring(2, 7)}`;
      sessionStorage.setItem("hubzy_client_id", saved);
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
        if (capySpeechTimeoutRef.current)
          clearTimeout(capySpeechTimeoutRef.current);
        capySpeechTimeoutRef.current = setTimeout(() => {
          setCapySpeech((prev) => ({ ...prev, isVisible: false }));
          setCapyMood("idle");
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
      if (capySpeechTimeoutRef.current)
        clearTimeout(capySpeechTimeoutRef.current);
    };
  }, []);

  // Función principal para activar la voz tierna y reacciones de Capibara
  // Control estricto anti-colisión + nuevos moods expresivos
  const triggerCapyVoice = async (situation, customData = {}) => {
    if (isCapyMuted) return;

    capyVoice.stop();
    if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current);

    const level = customData.level || currentLevel || 1;
    const theme = customData.theme || boardInfo?.theme || "";

    let phrase = customData.customText;
    if (!phrase) {
      phrase = await capyVoice.getDynamicSpeech(situation, {
        level,
        theme,
        ...customData,
      });
    }

    // Mapa de situaciones a moods expresivos del Capibara
    let mood = "talking";
    if (situation === "level_up")
      mood = "dancing"; // BAILE al subir de nivel
    else if (situation === "victory")
      mood = "celebrating"; // CELEBRACIÓN en victoria
    else if (situation === "welcome")
      mood = "love"; // AMOR al dar bienvenida
    else if (situation === "correct")
      mood = "happy"; // FELIZ en respuesta correcta
    else if (situation === "wrong")
      mood = "encouraging"; // TRISTEZA en error
    else if (situation === "hint")
      mood = "thinking"; // PENSANDO en pista
    else if (situation === "opponent_move") mood = "surprised"; // SORPRESA

    setCapyMood(mood);
    setCapySpeech({ text: phrase, isVisible: true, mood });

    if (capySpeechTimeoutRef.current)
      clearTimeout(capySpeechTimeoutRef.current);

    const speakOpts = {
      mood,
      level,
      stress_level: customData.stress_level,
      profile:
        customData.profile ||
        (situation === "wrong" ? "anxiety_relief" : "loving_psychologist"),
      user: currentUser,
      user_gender: currentUser?.gender,
      voice_gender: currentUser?.assigned_voice_gender,
    };

    if (situation === "wrong") {
      setIsCapySad(true);
      capyAudio.playCapyCry();
      speakTimeoutRef.current = setTimeout(() => {
        capyVoice.speak(phrase, speakOpts);
      }, 350);
    } else if (
      situation === "correct" ||
      situation === "level_up" ||
      situation === "victory"
    ) {
      setIsCapySad(false);
      capyAudio.playCapyHappy();
      speakTimeoutRef.current = setTimeout(() => {
        capyVoice.speak(phrase, speakOpts);
      }, 250);
    } else {
      setIsCapySad(false);
      capyVoice.speak(phrase, speakOpts);
    }
  };

  // ============================================================
  // NLP ESTÁTICO LOCAL — Analiza intención del usuario sin red
  // Siempre funciona offline, coherente con el contexto del juego
  // ============================================================
  const runLocalIntent = (transcript, nodesCtx, handCtx) =>
    analyzeIntentLocally(transcript, nodesCtx, handCtx, {
      boardTitle: boardInfo?.title,
      username: capyVoice.currentUser?.username,
    });

  // Clic directo en la Capibara: genera orientación psicológica o pista dinámica
  const handleCapyClick = async () => {
    const unsolvedNodes = Object.values(nodes).filter(
      (n) => !n.placedCard && !n.lockedByOpponent,
    );
    if (unsolvedNodes.length === 0) {
      triggerCapyVoice("victory", { profile: "loving_psychologist" });
      return;
    }
    const target =
      unsolvedNodes[Math.floor(Math.random() * unsolvedNodes.length)];
    const hintSnippet =
      target.hint ||
      target.question ||
      "Observa las opciones disponibles en tus cartas";
    triggerCapyVoice("hint", {
      label: target.label,
      hintText: `para analizar "${target.label}": ${hintSnippet.slice(0, 90)}. Concéntrate en la función principal.`,
      profile: "loving_psychologist",
    });
  };

  // Manejo de la pregunta por voz — NLP backend + fallback NLP estático local inteligente
  const handleUserVoiceQuery = async (transcript) => {
    setIsThinkingHint(true);
    setCapyMood("thinking");
    setCapySpeech({
      text: `¡Te escucho! Dijiste: "${transcript}" ... ¡Estoy pensando con todo mi amor para ti! 💭`,
      isVisible: true,
      mood: "thinking",
    });

    // Intentar NLP del backend con timeout de 3s
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetchWithAuth("/api/v1/arena/capy-ask", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: transcript,
          nodes: Object.values(nodes).map((n) => ({
            label: n.label,
            question: n.question,
            hint: n.hint,
            isSolved: Boolean(n.placedCard || n.lockedByOpponent),
          })),
          hand: hand.map((c) => ({
            name: c.name,
            domain: c.domain,
            isDistractor: Boolean(c.isDistractor),
          })),
          theme: boardInfo?.title || "Simulacro de Examen",
          user_profile: currentUser || {},
        }),
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const reply =
          data.reply || "¡Revisa los conceptos clave de tus cartas!";
        const psych = data.psychology;
        checkCrisisFlag(data, reportCrisis);
        setIsThinkingHint(false);

        if (
          psych?.needs_somatic_intervention ||
          (psych?.stress_level && psych.stress_level >= 0.5)
        ) {
          setCapyMood("love");
          setZenOffer({
            show: true,
            category: psych.stress_category || "tensión acumulada",
            distortion: psych.cognitive_distortion || "",
            emotion: psych.emotion_detected || "ansiedad",
          });
          triggerCapyVoice("encouraging", {
            customText: reply,
            stress_level: psych.stress_level,
            profile:
              psych.stress_level >= 0.8 ? "crisis_soothing" : "anxiety_relief",
          });
        } else {
          triggerCapyVoice("hint", {
            customText: reply,
            stress_level: psych?.stress_level,
            profile: "loving_psychologist",
          });
        }
        return;
      }
    } catch (e) {
      // Backend caído o timeout — NLP local estático inteligente
      console.warn("Backend no disponible, usando NLP local:", e?.message || e);
    }

    // NLP ESTÁTICO LOCAL — siempre coherente con el tablero actual
    setIsThinkingHint(false);
    const local = runLocalIntent(transcript, nodes, hand);

    if (local.needsZen) {
      setZenOffer({
        show: true,
        category: "estrés detectado",
        distortion: "",
        emotion: "frustración",
      });
    }

    setCapyMood(local.mood);
    setCapySpeech({ text: local.reply, isVisible: true, mood: local.mood });
    capyVoice.speak(local.reply, {
      mood: local.mood,
      level: currentLevel,
      user: currentUser,
      user_gender: currentUser?.gender,
      voice_gender: currentUser?.assigned_voice_gender,
    });
  };

  // Micrófono con mensajes emotivos y NLP funcional
  const { isListening, toggleMicrophone } = useSpeechRecognition({
    onTranscript: handleUserVoiceQuery,
    onFeedback: (text) => {
      setCapyMood("love");
      setCapySpeech({ text, isVisible: true, mood: "love" });
    },
  });

  // Comprobación de conclusión del circuito (Campaña de 20 niveles)
  useEffect(() => {
    const nodeValues = Object.values(nodes);
    if (nodeValues.length > 0) {
      // El circuito concluye cuando el estudiante ha completado todos los conceptos
      const allNodesCompleted = nodeValues.every((n) => Boolean(n.placedCard));
      if (allNodesCompleted && !isLevelTransitioning && !isVictoryModalOpen) {
        setIsLevelTransitioning(true);

        // Calcular precisión basada en energía restante o aciertos directos
        const totalQ = nodeValues.length;
        const accuracyCalc = energy >= maxEnergy ? 100 : Math.max(50, Math.round((energy / maxEnergy) * 100));

        setVictoryStats({
          accuracy: accuracyCalc,
          totalQuestions: totalQ
        });

        triggerCapyVoice("victory", { level: currentLevel });
        setIsVictoryModalOpen(true);
      }
    }
  }, [nodes, currentLevel, isLevelTransitioning, isVictoryModalOpen, energy, maxEnergy]);

  const handleSelectGameMode = ({ mode, roomId, isHost, needsUpload }) => {
    setGameConfig({ mode, roomId, isHost });
    setIsModeModalOpen(false);

    if (needsUpload) {
      setIsFolderModalOpen(true);
    } else {
      setSuccessNotif(
        mode === "1v1"
          ? `Conectado a la sala ${roomId}. Sincronizando con el rival...`
          : `Partida contra la Máquina lista. ¡Comienza el juego!`,
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

  // GENERADOR DINÁMICO DE POSICIONES Y TOPOLOGÍA PARA CUALQUIER NÚMERO DE PREGUNTAS (1 A 20)
  // HELPER: Configurar tablero y cartas con enlace 1-a-1 y posiciones dinámicas
  const applyBoardData = (boardData, folderName, level = currentLevel) => {
    if (!boardData.cards || boardData.cards.length === 0) return false;

    const lvlInfo =
      GAME_LEVELS.find((l) => l.level === level) || GAME_LEVELS[0];

    // REGLA ESTRICTA: El Nivel K debe tener exactamente K preguntas (N1 = 1, N2 = 2, N3 = 3 ... N20 = 20)
    const targetQuestions = Math.min(lvlInfo.questions, Math.max(1, boardData.nodes.length));
    const activeNodes = boardData.nodes.slice(0, targetQuestions);
    const activeMatchingCards = boardData.cards.slice(0, targetQuestions);

    setBoardInfo({
      title:
        boardData.title ||
        (folderName ? folderName.toUpperCase() : "ARENA DE ESTUDIO"),
      theme: folderName || "Estudio",
      levelInfo: lvlInfo,
    });

    const dynamicPositions = getDynamicLayout(activeNodes.length);
    // Paleta exacta de la imagen de referencia (Concepto A, B, C, D, E, F)
    const availableColors = [
      "orange",
      "purple",
      "blue",
      "dark",
      "salmon",
      "white",
    ];
    const availableShapes = [
      "hexagon",
      "circle",
      "diamond",
      "octagon",
      "squircle",
    ];

    // Detección automática del tema y disciplina académica real del documento/carpeta
    const activeTheme = folderName || boardData.title || "Estudio";
    const detectedCategory = detectDomainCategory(
      `${activeTheme} ${boardData.title || ""}`,
    );

    // Colores ordenados o barajados
    const shuffledColors = [
      "orange",
      "purple",
      "blue",
      "dark",
      "salmon",
      "white",
    ];
    const chosenShape =
      availableShapes[Math.floor(Math.random() * availableShapes.length)];

    const newNodes = {};
    // Cada nodo se liga 1-a-1 con su carta correcta (por índice)
    activeNodes.forEach((n, idx) => {
      const matchingCard = activeMatchingCards[idx];
      const cardId = matchingCard?.id || `card_${idx + 1}`;
      const conceptLabel =
        n.label || matchingCard?.concept_name || `Concepto ${idx + 1}`;
      const questionText =
        n.question ||
        n.description ||
        "¿A qué concepto corresponde este principio?";
      const hintText =
        n.description || "Revisa el contenido del documento de esta carpeta.";

      newNodes[n.id] = {
        id: n.id,
        domain: detectedCategory,
        theme: activeTheme,
        label: conceptLabel,
        question: questionText,
        questionLatex: n.question_latex || null,
        answerSpec: n.answer_spec || null,
        hint: hintText,
        nodeIndex: idx,
        pos: dynamicPositions[idx % dynamicPositions.length],
        color: shuffledColors[idx % shuffledColors.length],
        shape: chosenShape,
        placedCard: null,
        lockedByOpponent: false,
        correctCardId: cardId,
      };
    });

    // Mapear cartas base coincidentes con los nodos activos de este nivel
    const processedCards = activeMatchingCards.map((c, i) => {
      return {
        id: c.id,
        name: c.concept_name,
        cost: c.points_multiplier || "1x",
        type: shuffledColors[i % shuffledColors.length],
        sourceType: "document",
        domain: detectedCategory,
        theme: activeTheme,
        cardIndex: i,
        content: c.content || "Respuesta conceptual del tema.",
        matchesNodeId: activeNodes[i]?.id || null,
        isDistractor: false,
      };
    });

    // REGLA DE CARTAS TRAMPA: A partir del Nivel 3 se inyectan cartas trampa en el mazo
    const levelHasTraps = lvlInfo.hasTraps;
    const requiredTrapCount = levelHasTraps ? lvlInfo.trapCount || 1 : 0;
    const currentDistractorCount = processedCards.filter(
      (c) => c.isDistractor,
    ).length;

    if (requiredTrapCount > 0 && currentDistractorCount < requiredTrapCount) {
      const missingCount = requiredTrapCount - currentDistractorCount;
      const fallbackDistractorNames = [
        "Premisa Contradictoria",
        "Correlación Falsa",
        "Hipótesis Descartada",
        "Axioma Inválido",
        "Metodología Excluida",
        "Trampa Conceptual",
      ];
      for (let k = 0; k < missingCount; k++) {
        const dIdx = currentDistractorCount + k;
        processedCards.push({
          id: `card_trap_dyn_${dIdx + 1}`,
          name: fallbackDistractorNames[dIdx % fallbackDistractorNames.length],
          cost: "1x",
          type: "dark", // Estilo oscuro / amenaza
          sourceType: "document",
          domain: "trampa",
          content:
            "¡Carta trampa! Esta afirmación contradice el contenido oficial del tema.",
          matchesNodeId: null,
          isDistractor: true,
          isTrap: true,
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
    setHandPage(0);
    setOpponentHand(
      processedCards.map((c, i) => ({ ...c, id: `opp_${c.id}_${i}` })),
    );
    setEnergy(maxEnergy);
    setTurn(1);
    setIsCapySad(false);
    setSelectedNodeForQuestion(null);
    setSelectedCardForDetail(null);
    setSelectedCardInHand(null);
    setFlyingCard(null);
    setIsGameOverModalOpen(false);

    setTimeout(() => {
      triggerCapyVoice("welcome", { level });
    }, 1000);
    return true;
  };

  // CARGAR NIVEL ESPECÍFICO (1 A 5) DESDE EL BACKEND
  const loadGameForLevel = async (
    targetLevel,
    targetFolder = activeFolder,
    force = false,
  ) => {
    if (!targetFolder) {
      setSuccessNotif("Selecciona una carpeta de estudio para comenzar.");
      setIsFolderModalOpen(true);
      return false;
    }

    const lvlInfo =
      GAME_LEVELS.find((l) => l.level === targetLevel) || GAME_LEVELS[0];
    setIsGeneratingArena(true);
    setSuccessNotif(
      `Cargando Nivel ${targetLevel} (${lvlInfo.name} - ${lvlInfo.questions} preguntas) desde [${targetFolder.name}]...`,
    );

    // 0. VERIFICACIÓN INSTANTÁNEA EN MEMORIA / CACHÉ LOCAL (0 ms, 0 tokens)
    if (!force) {
      const cachedBoards = targetFolder.cached_boards || {};
      const lvlKey = `level_${targetLevel}`;
      // Solo reutilizar caché si pertenece exactamente a este nivel o si tiene la cantidad de preguntas esperada
      const localCachedBoard =
        cachedBoards[lvlKey] ||
        (targetFolder.cached_board &&
        targetFolder.cached_board.cards?.length === lvlInfo.questions
          ? targetFolder.cached_board
          : null);

      if (
        localCachedBoard &&
        localCachedBoard.cards &&
        localCachedBoard.cards.length >= lvlInfo.questions
      ) {
        const success = applyBoardData(
          localCachedBoard,
          targetFolder.name,
          targetLevel,
        );
        if (success) {
          setCurrentLevel(targetLevel);
          setIsGeneratingArena(false);
          setSuccessNotif(
            `⚡ Nivel ${targetLevel} listo al instante (análisis previo en memoria).`,
          );
          setTimeout(() => setSuccessNotif(null), 3000);
          return true;
        }
      }
    }

    // Únicamente si es la carpeta demo de muestra sin archivos subidos propios
    const isStaticDemoFolder =
      targetFolder.id === "folder_administracion_default" &&
      (!targetFolder.documents || targetFolder.documents.length === 0);

    if (isStaticDemoFolder && STATIC_ADMIN_GAME.levels[targetLevel]) {
      const staticLevelData = STATIC_ADMIN_GAME.levels[targetLevel];
      const success = applyBoardData(
        staticLevelData,
        targetFolder.name || "Administración General",
        targetLevel,
      );
      if (success) {
        setCurrentLevel(targetLevel);
        setIsGeneratingArena(false);
        setSuccessNotif(
          `Nivel ${targetLevel}: ${lvlInfo.name} (${lvlInfo.questions} preguntas) [administracion.pdf demo] listo.`,
        );
        setTimeout(() => setSuccessNotif(null), 4000);
        return true;
      }
    }

    try {
      const res = await fetchWithAuth(
        `/api/v1/folders/${targetFolder.id}/generate-game?level=${targetLevel}&question_count=${lvlInfo.questions}&difficulty=${lvlInfo.difficulty}${force ? "&force=true" : ""}`,
        { method: "POST" },
      );

      if (res.ok) {
        const boardData = await res.json();

        // Guardar en la carpeta en memoria y localStorage para futuras cargas a 0 ms
        if (!targetFolder.cached_boards) targetFolder.cached_boards = {};
        targetFolder.cached_boards[`level_${targetLevel}`] = boardData;
        targetFolder.cached_board = boardData;

        try {
          const userStorageKey = currentUser?.id
            ? `hubzy_user_study_folders_${currentUser.id}`
            : "hubzy_user_study_folders";
          const savedFolders = JSON.parse(
            localStorage.getItem(userStorageKey) || "[]",
          );
          const idx = savedFolders.findIndex((f) => f.id === targetFolder.id);
          if (idx !== -1) {
            savedFolders[idx].cached_boards = targetFolder.cached_boards;
            savedFolders[idx].cached_board = boardData;
            localStorage.setItem(userStorageKey, JSON.stringify(savedFolders));
          }
        } catch (_) {}

        const success = applyBoardData(
          boardData,
          targetFolder.name,
          targetLevel,
        );
        if (success) {
          setCurrentLevel(targetLevel);
          setSuccessNotif(
            `Nivel ${targetLevel}: ${lvlInfo.name} (${lvlInfo.questions} preguntas) listo.`,
          );
          setTimeout(() => setSuccessNotif(null), 4000);
          return true;
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setSuccessNotif(
          `${err.detail || "No se pudieron generar los reactivos del nivel con IA."}`,
        );
        setTimeout(() => setSuccessNotif(null), 5000);
      }
    } catch (e) {
      console.warn("Error cargando nivel desde el backend:", e);
      setSuccessNotif("Error al conectarse con el servidor de análisis.");
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

  // 2A. REINTENTAR PARTIDA (OPCIÓN A: RESET TABLERO INSTANTÁNEO 0 MS)
  // Devuelve todas las cartas a la mano, reinicia energía y vacía los nodos sin llamar a la IA
  const handleResetCurrentBoard = () => {
    setIsRestartOptionsModalOpen(false);
    setIsVictoryModalOpen(false);
    setIsGameOverModalOpen(false);

    // Recolectar todas las cartas colocadas en los nodos más las que queden en mano
    const allCardsInPlay = [...hand];
    Object.values(nodes).forEach((n) => {
      if (n.placedCard) {
        allCardsInPlay.push(n.placedCard);
      }
    });

    // Desocupar todos los nodos
    setNodes((prev) => {
      const reset = {};
      Object.entries(prev).forEach(([id, node]) => {
        reset[id] = {
          ...node,
          placedCard: null,
          lockedByOpponent: false,
        };
      });
      return reset;
    });

    // Barajar aleatoriamente las cartas en la mano
    const shuffledHand = [...allCardsInPlay].sort(() => Math.random() - 0.5);
    shuffledHand.forEach((c, i) => {
      c.rotation = (i - Math.floor(allCardsInPlay.length / 2)) * 2;
      c.zIndex = i + 1;
    });

    setHand(shuffledHand);
    setHandPage(0);
    setEnergy(maxEnergy);
    setTurn(1);
    setIsCapySad(false);
    setSelectedNodeForQuestion(null);
    setSelectedCardForDetail(null);
    setSelectedCardInHand(null);
    setFlyingCard(null);
    setSuccessNotif(
      "⚡ Tablero reiniciado: Vuelve a intentar este mismo examen.",
    );
    setTimeout(() => setSuccessNotif(null), 3000);
  };

  // 2B. REGENERAR NUEVAS PREGUNTAS (OPCIÓN B: CONSULTA A GEMINI IA)
  const handleRegenerateWithNewQuestions = async () => {
    setIsRestartOptionsModalOpen(false);
    setIsVictoryModalOpen(false);
    setIsGameOverModalOpen(false);
    if (!activeFolder) {
      setSuccessNotif(
        "Selecciona una carpeta en el baúl para iniciar el juego.",
      );
      setIsFolderModalOpen(true);
      return;
    }
    await loadGameForLevel(currentLevel, activeFolder, true);
  };

  // Alias compatible
  const handleRestartWithNewQuestions = () => {
    setIsRestartOptionsModalOpen(true);
  };

  // 3. REINTENTAR GENÉRICO (Abre modal de opciones de reinicio)
  const handleRetryGame = () => {
    setIsGameOverModalOpen(false);
    setIsVictoryModalOpen(false);
    setIsRestartOptionsModalOpen(true);
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
    const isDistractor =
      card.isDistractor || String(card.id).includes("distractor");
    const isCorrectCard =
      !isDistractor &&
      Boolean(
        (targetNode.correctCardId &&
          String(targetNode.correctCardId) === String(card.id)) ||
        (card.matchesNodeId &&
          String(card.matchesNodeId) === String(targetNodeId)) ||
        (targetNode.label &&
          card.name &&
          targetNode.label.trim().toLowerCase() ===
            card.name.trim().toLowerCase()),
      );

    if (!isCorrectCard) {
      // CARTA TRAMPA O DISTRACTOR: Hubzi penaliza (solo bandas con presión)
      setWrongCardShake(card.id);
      triggerCapyVoice("wrong");
      recordAdaptiveAttempt(targetNode, false);

      const isTrap = Boolean(card.isTrap || isDistractor);
      if (isTrap && userBandConfig.pressure) {
        // Penalización por carta trampa: Resta 1 de energía si el nivel tiene trampas
        setEnergy((prev) => Math.max(0, prev - 1));
      }

      const pedagogicalHint =
        targetNode.hint ||
        `Revisa con atención: esta casilla evalúa el principio "${targetNode.label}".`;
      setCapyMood(isTrap ? "surprised" : "encouraging");
      setCapySpeech({
        text: kidMode
          ? `¡Casi! "${card.name}" no era esa. ${pedagogicalHint}`
          : isTrap
            ? `¡Cuidado, es una CARTA TRAMPA! ⚡ Pierdes 1 de energía. Pista: ${pedagogicalHint}`
            : `¡Casi! "${card.name}" no va aquí. Pista: ${pedagogicalHint}`,
        isVisible: true,
        mood: isTrap ? "surprised" : "encouraging",
      });
      setSuccessNotif(
        kidMode
          ? `"${card.name}" no era. Pista: ${pedagogicalHint}`
          : isTrap
            ? `⚠️ ¡CARTA TRAMPA DETONADA! -1 Energía. Pista: ${pedagogicalHint}`
            : `"${card.name}" no corresponde a "${targetNode.label}". Pista: ${pedagogicalHint}`,
      );

      setTimeout(() => {
        setWrongCardShake(null);
        setSuccessNotif(null);
      }, 4500);
      return false;
    }

    // CARTA CORRECTA: Colocar en el nodo y voz de celebración entusiasta
    triggerCapyVoice("correct");
    recordAdaptiveAttempt(targetNode, true);
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
    setSuccessNotif(
      `¡Excelente! "${card.name}" responde correctamente. +${pointsEarned} pts`,
    );
    setTimeout(() => setSuccessNotif(null), 3000);
    return true;
  };

  const handleNodeClick = (nodeId) => {
    const node = nodes[nodeId];
    if (!node) return;

    // Si el jugador tiene una carta seleccionada en la mano (modo táctil / Tap-to-Place)
    if (selectedCardInHand && !node.placedCard) {
      const cardToPlay = selectedCardInHand;
      const success = attemptPlayCard(cardToPlay.id, nodeId);
      if (success) {
        setSelectedCardInHand(null);
        return;
      }
    }

    // De lo contrario, abrir modal de lectura detallada del reactivo
    setSelectedNodeForQuestion(node);
  };

  const handleCardClick = (card) => {
    // Modo Táctil / Accesibilidad: si tocas una carta ya seleccionada, deseleccionar
    if (selectedCardInHand?.id === card.id) {
      setSelectedCardInHand(null);
      setSelectedCardForDetail(card);
    } else {
      setSelectedCardInHand(card);
      setSuccessNotif(
        `Carta "${card.name}" seleccionada. Toca la casilla correspondiente en el tablero.`,
      );
      setTimeout(() => setSuccessNotif(null), 3000);
    }
  };

  const handleDragEnd = (cardId, info) => {
    if (!isActualTurn) return;

    const dropPoint = { x: info.point.x, y: info.point.y };

    // Detectar si se soltó sobre o cerca de una pregunta del tablero (radio generoso de 80px)
    const elements = document.querySelectorAll("[data-node-id]");

    let matchedNodeId = null;
    let shortestDist = Infinity;
    const HIT_RADIUS = 80;

    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dist = Math.hypot(dropPoint.x - centerX, dropPoint.y - centerY);

      const inExpandedArea =
        dropPoint.x >= rect.left - HIT_RADIUS &&
        dropPoint.x <= rect.right + HIT_RADIUS &&
        dropPoint.y >= rect.top - HIT_RADIUS &&
        dropPoint.y <= rect.bottom + HIT_RADIUS;

      if (inExpandedArea && dist < shortestDist) {
        shortestDist = dist;
        matchedNodeId = el.getAttribute("data-node-id");
      }
    });

    if (matchedNodeId) {
      attemptPlayCard(cardId, matchedNodeId);
    }
  };

  const handleEndTurn = () => {
    if (!isActualTurn) {
      setSuccessNotif(
        gameConfig.mode === "1v1"
          ? `TURNO NO DISPONIBLE: Espera a que el rival juegue.`
          : `TURNO NO DISPONIBLE: La máquina está realizando su movimiento.`,
      );
      setTimeout(() => setSuccessNotif(null), 2500);
      return;
    }

    setTurn((prev) => prev + 1);
    setEnergy((prev) => Math.min(prev + 2, maxEnergy));

    if (gameConfig.mode === "1v1") {
      sendMove({ action: "end_turn" });
      setSuccessNotif(`Turno cedido al rival.`);
      setTimeout(() => setSuccessNotif(null), 2500);
    } else if (gameConfig.mode === "solo") {
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
        formData.append("file", data.rawFiles[0]);
        formData.append("raw_text", data.text || "");
        res = await fetchWithAuth("/api/v1/arena/upload-and-generate", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetchWithAuth("/api/v1/arena/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: data.text || "Material de estudio pedagógico integral.",
          }),
        });
      }

      if (res && res.ok) {
        const boardData = await res.json();
        if (boardData.cards && boardData.cards.length > 0) {
          setBoardInfo({
            title:
              boardData.title ||
              `Estudio: ${data.files[0]?.name || "Material Didáctico"}`,
            theme: "Material Asimilado con IA",
          });

          // Coordenadas espaciales bien distribuidas en el circuito
          const posList = [
            { left: "20%", top: "30%" },
            { left: "48%", top: "24%" },
            { left: "78%", top: "30%" },
            { left: "34%", top: "68%" },
            { left: "66%", top: "68%" },
          ];

          const newNodes = {};
          // Cada nodo se liga 1-a-1 con la carta que le corresponde (por índice coincidente)
          boardData.nodes.forEach((n, idx) => {
            const matchingCard = boardData.cards[idx];
            const cardId = matchingCard?.id || `card_${idx + 1}`;
            newNodes[n.id] = {
              id: n.id,
              domain: "estudio",
              icon: idx % 2 === 0 ? "database" : "codigo",
              label:
                n.label || matchingCard?.concept_name || `Concepto ${idx + 1}`,
              question:
                n.question ||
                n.description ||
                "¿A qué concepto corresponde este principio?",
              questionLatex: n.question_latex || null,
              answerSpec: n.answer_spec || null,
              hint:
                n.description ||
                "Revisa las cartas en tu mano y arrastra la respuesta adecuada.",
              pos: posList[idx % posList.length],
              color: idx % 2 === 0 ? "cyan" : "emerald",
              shape: "hexagon",
              placedCard: null,
              lockedByOpponent: false,
              correctCardId: cardId, // <-- enlace 1-a-1 con la carta correcta
            };
          });

          const processedCards = boardData.cards.map((c, i) => {
            const isDistractor =
              c.id?.includes("distractor") || i >= boardData.nodes.length;
            return {
              id: c.id,
              name: c.concept_name,
              cost: c.points_multiplier || "1x",
              type: i % 2 === 0 ? "cyan" : "emerald",
              sourceType: "document",
              domain: "estudio",
              content:
                c.content ||
                "Respuesta falsa que no corresponde a ningún reactivo.",
              matchesNodeId: isDistractor
                ? null
                : boardData.nodes[i]?.id || null,
              isDistractor: isDistractor,
            };
          });

          // 30% del total de preguntas como cartas falsas
          const requiredDistractors = Math.max(
            1,
            Math.round(boardData.nodes.length * 0.3),
          );
          const currentDistractors = processedCards.filter(
            (c) => c.isDistractor,
          ).length;
          if (currentDistractors < requiredDistractors) {
            const needed = requiredDistractors - currentDistractors;
            const distractorPool = [
              "Enfoque Ortogonal Inverso",
              "Principio de Premisa Contradictoria",
              "Teoría de Correlación Espuria",
              "Postulado No Demostrado",
            ];
            for (let k = 0; k < needed; k++) {
              const dIdx = currentDistractors + k;
              processedCards.push({
                id: `card_distractor_dyn_${dIdx + 1}`,
                name: distractorPool[dIdx % distractorPool.length],
                cost: "1x",
                type:
                  (processedCards.length + k) % 2 === 0 ? "cyan" : "emerald",
                sourceType: "document",
                domain: "estudio",
                content: "Respuesta alternativa no válida.",
                matchesNodeId: null,
                isDistractor: true,
              });
            }
          }

          const shuffledHand = [...processedCards].sort(
            () => Math.random() - 0.5,
          );
          shuffledHand.forEach((c, i) => {
            c.rotation = (i - Math.floor(processedCards.length / 2)) * 3;
            c.zIndex = i + 1;
          });

          setNodes(newNodes);
          setHand(shuffledHand);
          setOpponentHand(
            processedCards.map((c, i) => ({ ...c, id: `opp_${c.id}_${i}` })),
          );
          setEnergy(maxEnergy);
          setTurn(1);
          setSuccessNotif(
            `¡Material procesado con Gemini! Tablero generado en tiempo real.`,
          );
          setTimeout(() => setSuccessNotif(null), 4000);
          generatedSuccess = true;

          // Asociar este juego con preguntas a la carpeta activa en Base de Datos y LocalStorage
          if (activeFolder) {
            const newGameRecord = {
              id: `game_${Date.now()}`,
              title:
                boardData.title ||
                `Estudio: ${data.files[0]?.name || "Material"}`,
              questions_count: Object.keys(newNodes).length,
              created_at: new Date().toLocaleDateString("es-ES"),
            };

            // 1. Persistir en MongoDB
            fetchWithAuth(`/api/v1/folders/${activeFolder.id}/games`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ game: newGameRecord }),
            }).catch((e) =>
              console.warn("No se pudo persistir el juego en BD:", e),
            );

            // 2. Persistir en LocalStorage
            try {
              const foldersRaw = localStorage.getItem(
                "hubzy_user_study_folders",
              );
              if (foldersRaw) {
                const fList = JSON.parse(foldersRaw);
                const fIdx = fList.findIndex((f) => f.id === activeFolder.id);
                if (fIdx >= 0) {
                  if (!fList[fIdx].games) fList[fIdx].games = [];
                  fList[fIdx].games.unshift(newGameRecord);
                  localStorage.setItem(
                    "hubzy_user_study_folders",
                    JSON.stringify(fList),
                  );
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
      const detectedTheme =
        /(ley|derecho|penal|demanda|abogad|juez|paps)/i.test(lower)
          ? "Derecho & Leyes"
          : /(contab|balance|niif|ifrs|sat|iva|auditor)/i.test(lower)
            ? "Contaduría"
            : /(finanz|ebitda|mercado|bolsa|invers)/i.test(lower)
              ? "Finanzas"
              : /(salud|medic|enferm|farmac|clinica)/i.test(lower)
                ? "Medicina"
                : /(educ|pedagog|aprendizaje)/i.test(lower)
                  ? "Educación"
                  : "Tecnología";

      const fileBaseName =
        data.files[0]?.name.replace(/\.[^/.]+$/, "") || "Material de Estudio";
      setBoardInfo({
        title: `SIMULACRO: ${fileBaseName.toUpperCase()}`,
        theme: detectedTheme,
      });

      const posList = [
        { left: "20%", top: "30%" },
        { left: "48%", top: "24%" },
        { left: "78%", top: "30%" },
        { left: "34%", top: "68%" },
        { left: "66%", top: "68%" },
      ];

      const examQuestionsTemplates = [
        {
          concept: fileBaseName.substring(0, 18),
          q: `[REACTIVO DE EXAMEN - DEFINICIÓN]: ¿Cuál es el objeto central de estudio y la doctrina rectora analizada en el compendio de "${fileBaseName}"?`,
          hint: `Analiza la tesis preliminar desarrollada al inicio del texto sobre ${fileBaseName.substring(0, 15)}.`,
        },
        {
          concept: "Principio Rector",
          q: `[REACTIVO DE EXAMEN - APLICACIÓN]: ¿Qué postulado o principio rector es de observancia obligatoria para validar los procedimientos según el marco de ${fileBaseName}?`,
          hint: "Es la regla fundamental o axioma que rige toda la normativa aplicable.",
        },
        {
          concept: "Marco Aplicado",
          q: `[REACTIVO DE EXAMEN - CASO PRÁCTICO]: Ante una controversia técnica en la práctica profesional, ¿qué conjunto de criterios o marco normativo determina la solución del caso?`,
          hint: "Observa la estructura metodológica y procedimental explicada en la materia.",
        },
        {
          concept: "Criterio de Evaluación",
          q: `[REACTIVO DE EXAMEN - ANÁLISIS CRÍTICO]: ¿Bajo qué estándar de ponderación o examen riguroso se contrasta la eficacia de las medidas adoptadas?`,
          hint: "Involucra el juicio valorativo indispensable para superar la prueba evaluativa.",
        },
        {
          concept: "Resolución Final",
          q: `[REACTIVO DE EXAMEN - CONCLUSIÓN]: ¿Cuál es el dictamen o resolución vinculante que concluye formalmente el análisis de la materia estudiada?`,
          hint: "Representa el acto resolutivo definitivo del proceso formativo.",
        },
      ];

      const customCards = examQuestionsTemplates.map((item, idx) => ({
        id: `card_${idx + 1}`,
        name: item.concept,
        cost: idx % 2 === 0 ? "1x" : "2x",
        type: idx % 2 === 0 ? "cyan" : "emerald",
        sourceType: "document",
        domain: "estudio",
        rotation: (idx - 2) * 4,
        zIndex: idx + 1,
        matchesNodeId: `node_${idx + 1}`, // <-- enlace 1-a-1 carta → nodo
      }));

      const customNodes = {};
      examQuestionsTemplates.forEach((item, idx) => {
        const nId = `node_${idx + 1}`;
        customNodes[nId] = {
          id: nId,
          domain: "estudio",
          icon: idx % 2 === 0 ? "database" : "codigo",
          label: item.concept,
          question: item.q,
          hint: item.hint,
          pos: posList[idx],
          color: idx % 2 === 0 ? "cyan" : "emerald",
          shape: "hexagon",
          placedCard: null,
          lockedByOpponent: false,
          correctCardId: `card_${idx + 1}`, // <-- enlace 1-a-1 nodo → carta
        };
      });

      setNodes(customNodes);
      setHand(customCards);
      setOpponentHand(
        customCards.map((c, i) => ({ ...c, id: `opp_${c.id}_${i}` })),
      );
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
          created_at: new Date().toLocaleDateString("es-ES"),
        };
        fetchWithAuth(`/api/v1/folders/${activeFolder.id}/games`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ game: newGameRecord }),
        }).catch((e) =>
          console.warn("No se pudo persistir el juego en BD:", e),
        );

        try {
          const foldersRaw = localStorage.getItem("hubzy_user_study_folders");
          if (foldersRaw) {
            const fList = JSON.parse(foldersRaw);
            const fIdx = fList.findIndex((f) => f.id === activeFolder.id);
            if (fIdx >= 0) {
              if (!fList[fIdx].games) fList[fIdx].games = [];
              fList[fIdx].games.unshift(newGameRecord);
              localStorage.setItem(
                "hubzy_user_study_folders",
                JSON.stringify(fList),
              );
            }
          }
        } catch {}
      }
    }
    setIsGeneratingArena(false);
  };

  // SI LA PANTALLA DE BIENVENIDA ESTÁ ACTIVA, SE MUESTRA EXCLUSIVAMENTE ELLA (SIN EL TABLERO NI EL JUEGO ABAJO)
  if (isWelcomeScreenVisible) {
    return (
      <div className="relative w-screen h-screen overflow-hidden select-none">
        <WelcomeScreen
          isLoggedIn={Boolean(currentUser)}
          username={currentUser?.username || currentUser?.email?.split("@")[0]}
          onOpenLogin={() => setIsAuthModalOpen(true)}
          onOpenTutorial={() => setIsTutorialOpen(true)}
          onStartDemo={() => {
            // Entrar de inmediato a la partida demostrativa con administracion.pdf
            const demoUser = currentUser || {
              id: "guest_demo",
              username: "Estudiante Demo",
              email: "demo@hubzi.app",
              is_guest: true,
            };
            if (!currentUser) setCurrentUser(demoUser);
            setIsWelcomeScreenVisible(false);
            const defaultFolder = {
              id: "folder_administracion_default",
              name: "Administración General",
              documents: [{ name: "administracion.pdf" }],
            };
            setActiveFolder(defaultFolder);
            setIsMapVisible(true);
            loadGameForLevel(1, defaultFolder, false);
          }}
          onContinue={() => {
            if (!currentUser) {
              // Si no inició sesión, abre el modal de login
              setIsAuthModalOpen(true);
              return;
            }
            setIsWelcomeScreenVisible(false);
            setIsFolderModalOpen(true);
          }}
        />

        {/* Modal de Tutorial cuando se abre desde la bienvenida */}
        <TutorialModal
          isOpen={isTutorialOpen}
          onClose={() => setIsTutorialOpen(false)}
        />

        {/* Modal de Login cuando se toca Iniciar Sesión desde la bienvenida */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => {
            // Al presionar la X, permanece en la pantalla de bienvenida y NO entra al juego
            setIsAuthModalOpen(false);
            setIsWelcomeScreenVisible(true);
          }}
          onAuthSuccess={(user) => {
            setCurrentUser(user);
            setIsAuthModalOpen(false);
            capyVoice.currentUser = user;
            setIsWelcomeScreenVisible(false);
            setIsFolderModalOpen(true);
          }}
        />

        {/* Modal Legal y de Transparencia */}
        <LegalModal
          isOpen={isLegalModalOpen}
          onClose={() => setIsLegalModalOpen(false)}
          initialTab={legalModalTab}
        />

        {/* Banner de Consentimiento de Cookies */}
        <CookieConsentBanner onOpenLegal={handleOpenLegal} />

        {/* Footer Legal en Pantalla de Bienvenida */}
        <footer className="absolute bottom-2 inset-x-0 py-1.5 px-4 flex flex-wrap items-center justify-center select-none z-20">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 shadow-lg backdrop-blur-md text-slate-300 text-[11px]">
            <span className="font-bold text-amber-400">
              Hubzy © {new Date().getFullYear()}
            </span>
            <span className="text-slate-600">•</span>
            <button
              onClick={() => handleOpenLegal("terms")}
              className="hover:text-amber-300 transition-colors font-medium underline underline-offset-2 cursor-pointer"
            >
              Términos de Servicio
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={() => handleOpenLegal("privacy")}
              className="hover:text-amber-300 transition-colors font-medium underline underline-offset-2 cursor-pointer"
            >
              Privacidad
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={() => handleOpenLegal("refunds")}
              className="hover:text-amber-300 transition-colors font-medium underline underline-offset-2 cursor-pointer"
            >
              Reembolsos
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={() => handleOpenLegal("business")}
              className="hover:text-amber-300 transition-colors font-medium underline underline-offset-2 cursor-pointer"
            >
              Datos del Negocio
            </button>
          </div>
        </footer>
      </div>
    );
  }

  // RENDERIZADO DEL MAPA DE AVENTURA (MUNDOS E ISLAS ESTILO MONSTER LEGENDS)
  if (isMapVisible) {
    return (
      <div className="relative w-screen h-screen overflow-hidden select-none">
        <AdventureMap
          folderName={activeFolder?.name || "Mundo de Aprendizaje"}
          documentTitle={
            boardInfo?.theme ||
            activeFolder?.documents?.[0]?.name ||
            "Tema de Estudio"
          }
          levels={GAME_LEVELS}
          currentLevel={currentLevel}
          unlockedLevel={unlockedLevel}
          levelStars={levelStars}
          onSelectLevel={async (lvlNum) => {
            setCurrentLevel(lvlNum);
            if (activeFolder) {
              await loadGameForLevel(lvlNum, activeFolder, false);
            }
            // Entrar directamente al tablero de ese nivel
            setIsMapVisible(false);
          }}
          onBackToFolders={() => {
            setIsFolderModalOpen(true);
          }}
          onOpenTutorial={() => setIsTutorialOpen(true)}
        />

        {/* Modal del Baúl de Carpetas accesible directamente desde el Mapa */}
        <StudyFolderManagerModal
          isOpen={isFolderModalOpen}
          currentUser={currentUser}
          onClose={() => setIsFolderModalOpen(false)}
          onUpgradeToPro={() => {
            setIsSubscriptionModalOpen(true);
          }}
          onBackToMenu={() => {
            setIsFolderModalOpen(false);
            setIsMapVisible(false);
            setIsWelcomeScreenVisible(true);
          }}
          onSelectFolder={async (folder) => {
            setActiveFolder(folder);
            setIsFolderModalOpen(false);

            if (
              folder.playDirectly &&
              folder.documents &&
              folder.documents.filter((d) => !d.isUploading).length > 0
            ) {
              setCurrentLevel(1);
              setIsMapVisible(true);
              await loadGameForLevel(1, folder, false);
            }
          }}
          onStartNewFolder={(folder) => {
            setActiveFolder(folder);
            setIsFolderModalOpen(true);
          }}
        />

        {/* Modal de Tutorial accesible desde el Mapa */}
        <TutorialModal
          isOpen={isTutorialOpen}
          onClose={() => setIsTutorialOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col justify-between select-none">
      {/* 0. MODAL PRINCIPAL DE AUTENTICACIÓN (LOGIN Y REGISTRO CON CORREO Y CONTRASEÑA) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
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
        onClose={() => setIsFolderModalOpen(false)}
        onUpgradeToPro={() => {
          setIsSubscriptionModalOpen(true);
        }}
        onBackToMenu={() => {
          setIsFolderModalOpen(false);
          setIsWelcomeScreenVisible(true);
        }}
        onSelectFolder={async (folder) => {
          setActiveFolder(folder);
          setIsFolderModalOpen(false);

          if (
            folder.playDirectly &&
            folder.documents &&
            folder.documents.filter((d) => !d.isUploading).length > 0
          ) {
            // Inicia el juego en el Nivel 1 (Fácil: 3 preguntas)
            setCurrentLevel(1);
            const success = await loadGameForLevel(1, folder, false);
            if (success) {
              // Tras generar el nivel 1, pre-generar en segundo plano los niveles 2 a 5
              // para que la transición entre niveles sea instantánea (0 ms) sin volver a escanear
              (async () => {
                for (let lvl = 2; lvl <= 5; lvl++) {
                  try {
                    const lvlInfo = GAME_LEVELS.find((l) => l.level === lvl);
                    if (
                      folder.cached_boards &&
                      folder.cached_boards[`level_${lvl}`]
                    )
                      continue;
                    const res = await fetchWithAuth(
                      `/api/v1/folders/${folder.id}/generate-game?level=${lvl}&question_count=${lvlInfo.questions}&difficulty=${lvlInfo.difficulty}`,
                      { method: "POST" },
                    );
                    if (res.ok) {
                      const data = await res.json();
                      if (!folder.cached_boards) folder.cached_boards = {};
                      folder.cached_boards[`level_${lvl}`] = data;
                      // Guardar en localStorage
                      try {
                        const userStorageKey = currentUser?.id
                          ? `hubzy_user_study_folders_${currentUser.id}`
                          : "hubzy_user_study_folders";
                        const savedFolders = JSON.parse(
                          localStorage.getItem(userStorageKey) || "[]",
                        );
                        const idx = savedFolders.findIndex(
                          (f) => f.id === folder.id,
                        );
                        if (idx !== -1) {
                          savedFolders[idx].cached_boards =
                            folder.cached_boards;
                          localStorage.setItem(
                            userStorageKey,
                            JSON.stringify(savedFolders),
                          );
                        }
                      } catch (_) {}
                    }
                  } catch (preloadErr) {
                    console.debug(
                      `Pre-carga nivel ${lvl} omitida o en segundo plano:`,
                      preloadErr,
                    );
                  }
                }
              })();

              // Enviar directamente al Mapa de Aventura de 20 niveles
              setIsMapVisible(true);
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
          // Abre el mapa de niveles para que el estudiante elija su nivel
          setIsMapVisible(true);
        }}
        onSkip={() => {
          setIsRelaxModalOpen(false);
          // Abre el mapa de niveles
          setIsMapVisible(true);
        }}
      />

      {/* 3. MODAL DE SELECCIÓN DE MODO DE JUEGO */}
      <GameModeModal
        isOpen={isModeModalOpen}
        onSelectMode={handleSelectGameMode}
      />

      {/* OVERLAY DE PROCESAMIENTO PROFUNDO DE DOCUMENTOS CON IA */}
      {isGeneratingArena && <GenerationOverlay />}

      {/* 3. MODAL DE PREGUNTA */}
      <QuestionModal
        isOpen={!!selectedNodeForQuestion}
        node={selectedNodeForQuestion}
        ageBand={userAgeBand}
        onClose={() => {
          const targetNode = selectedNodeForQuestion;
          setSelectedNodeForQuestion(null);
          if (targetNode?.hint) {
            triggerCapyVoice("hint", {
              customText: `Te doy una pista: ${targetNode.hint}`,
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
      <GameOverModal
        open={isGameOverModalOpen}
        theme={boardInfo?.theme}
        playerScore={playerScore}
        opponentScore={opponentScore}
        showOpponentScore={gameConfig.mode === "1v1"}
        onRestart={handleRestartWithNewQuestions}
        onTerminate={handleTerminateGame}
      />

      {/* 4.1 MODAL ASCENSO DE NIVEL — CELEBRACIÓN ULTRA-EMOTIVA CON CAPI */}
      <LevelUpModal
        open={isLevelUpModalOpen}
        levelUpData={levelUpData}
        capyText={capySpeech.text}
        onProceed={handleProceedToNextLevel}
      />

      {/* ENTORNO 3D & ILUMINACIÓN ATMOSFÉRICA CARD CLASH */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[700px] h-48 bg-radial from-white/40 via-sky-300/15 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute right-0 top-1/3 w-64 h-64 bg-radial from-amber-300/20 via-orange-400/10 to-transparent blur-3xl pointer-events-none" />

      {/* GUARDIÁN TÁCTICO 3D ZEN INTERACTIVO / HABLA CON ELEVENLABS Y REACCIONA SEGÚN LA SITUACIÓN */}
      <CapyCompanion
        capySpeech={capySpeech}
        capyMood={capyMood}
        isCapySad={isCapySad}
        isCapySpeaking={isCapySpeaking}
        isListening={isListening}
        isThinkingHint={isThinkingHint}
        isCapyMuted={isCapyMuted}
        isAmbientPlaying={isAmbientPlaying}
        zenOffer={zenOffer}
        nodes={nodes}
        currentLevel={currentLevel}
        boardInfo={boardInfo}
        activeFolder={activeFolder}
        currentUser={currentUser}
        onCapyClick={handleCapyClick}
        onToggleMicrophone={toggleMicrophone}
        onToggleMute={setIsCapyMuted}
        onZenAccept={() => setIsRelaxModalOpen(true)}
        onZenDismiss={() => setZenOffer((prev) => ({ ...prev, show: false }))}
      />

      {/* BARRA SUPERIOR CON CONTROLES LIMPIOS ESTILO CARD CLASH */}
      <div className="absolute top-2.5 right-3 z-40 flex items-center gap-2">
        {/* BOTÓN VOLVER AL MAPA DE NIVELES */}
        <button
          onClick={() => setIsMapVisible(true)}
          className="px-3.5 py-2 rounded-2xl bg-[#122443] hover:bg-[#1a335e] border-2 border-[#1e3a6c] border-b-4 border-b-[#050a13] text-[#48C838] text-xs font-black uppercase tracking-wide transition-all flex items-center gap-1.5 shadow-[0_4px_0_#28871E] active:translate-y-1 active:shadow-none cursor-pointer"
          title="Ver Mapa de Aventura y Niveles"
        >
          <Compass className="w-4 h-4 text-[#48C838]" />
          <span className="hidden sm:inline">Mapa</span>
        </button>

        {/* BOTÓN VOLVER AL MENÚ PRINCIPAL */}
        <button
          onClick={() => {
            setIsFolderModalOpen(false);
            setIsWelcomeScreenVisible(true);
          }}
          className="px-3.5 py-2 rounded-2xl bg-[#122443] hover:bg-[#1a335e] border-2 border-[#1e3a6c] border-b-4 border-b-[#050a13] text-[#FFB400] text-xs font-black uppercase tracking-wide transition-all flex items-center gap-1.5 shadow-[0_4px_0_#050a13] active:translate-y-1 active:shadow-none cursor-pointer"
          title="Volver a la pantalla de bienvenida / Menú de Inicio"
        >
          <Home className="w-4 h-4 text-[#FFB400]" />
          <span className="hidden sm:inline">Menú</span>
        </button>

        {/* BOTÓN CÓMO JUGAR / TUTORIAL (ESTILO CARD CLASH PLAY TUTORIAL) */}
        <button
          onClick={() => setIsTutorialOpen(true)}
          className="px-3.5 py-2 rounded-2xl bg-[#122443] hover:bg-[#1a335e] border-2 border-[#1e3a6c] border-b-4 border-b-[#050a13] text-[#FFB400] text-xs font-black uppercase tracking-wide transition-all flex items-center gap-1.5 shadow-[0_4px_0_#FF7A00] active:translate-y-1 active:shadow-none cursor-pointer"
          title="Ver tutorial rápido de cómo jugar"
        >
          <BookOpen className="w-4 h-4 text-[#FFB400]" />
          <span className="hidden lg:inline">Tutorial</span>
        </button>

        {/* BOTÓN CARPETAS / MATERIALES */}
        <button
          onClick={() => setIsFolderModalOpen(true)}
          className="px-3.5 py-2 rounded-2xl bg-[#122443] hover:bg-[#1a335e] border-2 border-[#1e3a6c] border-b-4 border-b-[#050a13] text-white text-xs font-black uppercase tracking-wide transition-all flex items-center gap-1.5 shadow-[0_4px_0_#050a13] active:translate-y-1 active:shadow-none cursor-pointer"
          title="Abrir baúl de carpetas y subir nuevos documentos"
        >
          <FolderIcon className="w-4 h-4 text-[#45B1E8]" />
          <span className="hidden lg:inline">Carpetas</span>
        </button>

        {/* BOTÓN HUBZY PRO / STRIPE */}
        <button
          onClick={() => setIsSubscriptionModalOpen(true)}
          className={`px-3 py-2 rounded-2xl border-2 border-b-4 text-xs font-black uppercase tracking-wide transition-all flex items-center gap-1.5 cursor-pointer active:translate-y-1 active:shadow-none ${
            currentUser?.plan === "pro"
              ? "bg-emerald-600/30 hover:bg-emerald-600/50 border-emerald-500 border-b-emerald-700 text-emerald-300 shadow-[0_4px_0_#064e3b]"
              : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 border-[#0a162b] border-b-[#b45309] text-[#122443] shadow-[0_4px_0_#78350f]"
          }`}
          title="Ver planes y suscripción a Hubzy Pro"
        >
          <Crown
            className={`w-4 h-4 ${currentUser?.plan === "pro" ? "text-emerald-300" : "text-[#122443] fill-current"}`}
          />
          <span className="font-extrabold">
            {currentUser?.plan === "pro" ? "PRO" : "PLAN PRO"}
          </span>
        </button>

        {/* BOTÓN PERFIL / INICIAR SESIÓN / CERRAR SESIÓN */}
        {currentUser ? (
          <div className="flex items-center gap-1 bg-[#122443] border-3 border-[#0a162b] rounded-2xl p-1 shadow-[0_4px_0_#050a13]">
            <button
              onClick={() => setIsUserModalOpen(true)}
              className="px-2.5 py-1 text-white text-xs font-black transition-all flex items-center gap-2 hover:bg-[#1a335e] rounded-xl cursor-pointer group"
              title="Configurar perfil de usuario, edad y voz de Capi"
            >
              <UserIcon
                className={`w-4 h-4 shrink-0 ${currentUser?.gender === "femenino" ? "text-amber-400" : "text-cyan-300"}`}
              />
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[11px] font-black uppercase text-white truncate max-w-[90px]">
                  {currentUser?.username ||
                    currentUser?.email?.split("@")[0] ||
                    "Mi Perfil"}
                </span>
                <span className="text-[8.5px] font-mono text-amber-300 truncate max-w-[90px]">
                  {currentUser?.email
                    ? currentUser.email
                    : `${currentUser?.age}a • ${currentUser?.gender === "femenino" ? "Voz Masc." : "Voz Fem."}`}
                </span>
              </div>
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 hover:bg-rose-900/80 hover:text-rose-200 text-slate-300 rounded-xl transition-colors cursor-pointer"
              title="Cerrar sesión de esta cuenta"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="px-4 py-2 rounded-2xl bg-[#122443] hover:bg-[#1a335e] border-3 border-[#0a162b] border-b-4 text-white font-black text-xs uppercase tracking-wide transition-all flex items-center gap-2 shadow-[0_4px_0_#FF7A00] active:translate-y-1 active:shadow-none cursor-pointer"
            title="Iniciar sesión o registrarse con correo y contraseña"
          >
            <LogInIcon className="w-4 h-4 text-amber-400" />
            <span>Iniciar Sesión</span>
          </button>
        )}

        {/* BOTÓN REINICIAR (ESTILO CARD CLASH CON VERDE ESMERALDA Y BORDE GRUESO) */}
        <button
          onClick={handleRestartWithNewQuestions}
          className="px-3.5 py-2 rounded-2xl bg-[#48C838] hover:bg-[#3bb82b] border-2 border-[#67dc59] border-b-4 border-b-[#28871e] text-white text-xs font-black uppercase tracking-wide transition-all flex items-center gap-2 shadow-[0_4px_0_#122443] active:translate-y-1 active:shadow-none cursor-pointer"
          title="Reiniciar partida y generar un nuevo conjunto de preguntas de este documento"
        >
          <RotateCcw className="w-4 h-4 text-white" />
          <span className="hidden sm:inline font-black tracking-wide">
            Reiniciar
          </span>
        </button>
      </div>

      {/* Marcadores de Puntuación, Nivel Actual y Progreso del Estudiante estilo Card Clash */}
      <div className="absolute left-4 top-3 z-30 flex items-center gap-2 sm:gap-2.5">
        {/* Indicador de Nivel 1 a 20 */}
        {(() => {
          const lvlInfo =
            GAME_LEVELS.find((l) => l.level === currentLevel) || GAME_LEVELS[0];
          return (
            <div
              className="flex items-center gap-1.5 bg-[#122443] border-2 border-[#1e3a6c] border-b-3 border-b-[#0a162b] px-3.5 py-1.5 rounded-2xl shadow-[0_3px_0_#050a13]"
              title={`Nivel ${currentLevel} de 20: ${lvlInfo.name}`}
            >
              <Trophy className="w-4 h-4 text-[#FFB400] animate-bounce" />
              <span className="text-[10px] font-black uppercase text-[#FFB400] tracking-wider">
                NIVEL {currentLevel}/20:
              </span>
              <span className="text-xs font-black text-white uppercase tracking-wide">
                {lvlInfo.name} ({lvlInfo.questions})
              </span>
            </div>
          );
        })()}

        <div
          className="flex items-center gap-2 bg-[#122443] border-2 border-[#1e3a6c] border-b-3 border-b-[#0a162b] px-3.5 py-1.5 rounded-2xl shadow-[0_3px_0_#050a13]"
          title="Progreso del Circuito"
        >
          <span className="text-[10px] font-black uppercase text-[#48C838] tracking-wider">
            Progreso:
          </span>
          <span className="text-sm font-black text-white">
            {Object.values(nodes).filter((n) => Boolean(n.placedCard)).length} /{" "}
            {Object.keys(nodes).length || 3}
          </span>
        </div>
      </div>

      {/* Contador de Cartas Propias en Mano */}
      <div className="absolute bottom-5 left-4 sm:left-6 z-40 flex items-center gap-2">
        <div
          className="flex items-center gap-2 bg-[#101726]/90 border border-amber-400/60 px-3 py-1.5 rounded-xl shadow-lg"
          title="Tus cartas restantes"
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono font-bold text-amber-300">
            {String(hand.length).padStart(2, "0")} cartas
          </span>
        </div>
      </div>

      {/* CARTA VOLADORA EN VIVO (MOVIMIENTO EN TIEMPO REAL AL JUGAR LA MÁQUINA O EL RIVAL) */}
      <AnimatePresence>
        {flyingCard && (
          <motion.div
            initial={{
              top: "8%",
              left: "50%",
              x: "-50%",
              scale: 0.9,
              opacity: 1,
              zIndex: 100,
            }}
            animate={{
              top: flyingCard.targetPos?.top || "50%",
              left: flyingCard.targetPos?.left || "50%",
              x: "-50%",
              y: "-50%",
              scale: 0.5,
              opacity: [1, 1, 0.95],
            }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
            className="fixed pointer-events-none z-50 w-28 h-40 rounded-2xl border-2 border-cyan-400 bg-slate-900 shadow-[0_0_30px_rgba(34,211,238,0.9)] p-2 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-mono font-bold text-cyan-300 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-400">
                {flyingCard.card.domain?.toUpperCase() || "EN JUEGO"}
              </span>
              <span className="text-[10px] font-bold text-amber-300 font-mono">
                {flyingCard.card.cost || "+1"}
              </span>
            </div>
            <div className="w-full h-20 rounded-xl bg-cyan-950/60 border border-cyan-400/40 flex flex-col items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-300 animate-spin" />
              <span className="text-[9px] text-cyan-200 font-bold mt-1">
                Colocando...
              </span>
            </div>
            <div className="w-full py-1 px-1.5 rounded-lg bg-slate-950 border border-slate-700 text-center">
              <p className="text-[9px] font-black text-white truncate uppercase">
                {flyingCard.card.name}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SI EL JUEGO NO HA INICIADO: NO MOSTRAR LA TABLA NI EL MAZO VACÍO, MOSTRAR PASOS PARA INICIAR */}
      {Object.keys(nodes).length === 0 ? (
        <div className="flex-1 flex items-center justify-center w-full px-4 z-20 my-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-xl bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border-4 border-[#122443] shadow-[0_20px_40px_rgba(18,36,67,0.2),0_10px_0_#122443] flex flex-col items-center text-center relative overflow-hidden"
          >
            {/* Cabecera / Banner estilizado */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 border-3 border-[#122443] flex items-center justify-center text-white mb-4 shadow-[0_6px_0_#122443]">
              <Sparkles className="w-9 h-9 animate-bounce text-white drop-shadow" />
            </div>

            <div className="inline-block px-4 py-1 rounded-full bg-orange-100 border-2 border-orange-400 text-orange-800 font-black text-[11px] tracking-wider uppercase mb-2">
              Hubzy
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-[#122443] tracking-wide uppercase mb-2">
              ¡Aún no has iniciado tu partida!
            </h2>
            <p className="text-slate-600 font-medium text-sm sm:text-base max-w-md mb-6 leading-relaxed">
              El tablero y tus cartas de batalla se generarán automáticamente a
              partir de lo que desees estudiar hoy.
            </p>

            {/* Pasos requeridos con diseño arcade */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 text-left">
              <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 flex flex-col items-start gap-1.5 shadow-sm">
                <span className="w-6 h-6 rounded-full bg-[#122443] text-white text-xs font-black flex items-center justify-center">
                  1
                </span>
                <span className="font-bold text-xs text-slate-800 uppercase">
                  Abre tus carpetas
                </span>
                <span className="text-[11px] text-slate-500">
                  Haz clic en el botón de carpetas de estudio.
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 flex flex-col items-start gap-1.5 shadow-sm">
                <span className="w-6 h-6 rounded-full bg-[#FF7A00] text-white text-xs font-black flex items-center justify-center">
                  2
                </span>
                <span className="font-bold text-xs text-slate-800 uppercase">
                  Sube tu tema
                </span>
                <span className="text-[11px] text-slate-500">
                  Carga un PDF, video, audio o documento.
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 flex flex-col items-start gap-1.5 shadow-sm">
                <span className="w-6 h-6 rounded-full bg-[#48C838] text-white text-xs font-black flex items-center justify-center">
                  3
                </span>
                <span className="font-bold text-xs text-slate-800 uppercase">
                  Genera el circuito
                </span>
                <span className="text-[11px] text-slate-500">
                  Presiona "Iniciar Juego" y que comience el duelo.
                </span>
              </div>
            </div>

            {/* Botón de acción principal Card Clash */}
            <button
              onClick={() => setIsFolderModalOpen(true)}
              className="btn-arcade-banner-orange w-full sm:w-auto px-8 py-3.5 rounded-2xl text-base font-black uppercase tracking-wider flex items-center justify-center gap-3 cursor-pointer shadow-lg active:scale-95 transition-transform"
            >
              <FolderIcon className="w-5 h-5 text-white" />
              <span>Abrir Carpetas y Seleccionar Tema</span>
            </button>
          </motion.div>
        </div>
      ) : (
        <>
          {/* TABLERO — CONSOLA OCTOGONAL ELEVADA 3D IDÉNTICA A LA IMAGEN DE REFERENCIA */}
          <BoardConsole
            boardInfo={boardInfo}
            currentLevel={currentLevel}
            nodes={nodes}
            hintNodeId={hintNodeId}
            onNodeClick={handleNodeClick}
          />

          {/* MANO DE CARTAS EN ABANICO — SOLO SI HAY PARTIDA ACTIVA */}
          <HandTray
            hand={hand}
            handPage={handPage}
            setHandPage={setHandPage}
            hintCardId={hintCardId}
            selectedCardInHand={selectedCardInHand}
            isActualTurn={isActualTurn}
            theme={boardInfo?.theme}
            onCardClick={(card) => {
              registerUserActivity();
              handleCardClick(card);
            }}
            onCardDragEnd={(id, info) => {
              registerUserActivity();
              handleDragEnd(id, info);
            }}
          />
        </>
      )}

      {/* MODAL DE TUTORIAL RÁPIDO INTERACTIVO */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />

      {/* MODAL DE VICTORIA Y ESTRELLAS CON EFECTO CONFETTI */}
      <VictoryModal
        isOpen={isVictoryModalOpen}
        level={currentLevel}
        accuracy={victoryStats.accuracy}
        totalQuestions={victoryStats.totalQuestions}
        masteredConcepts={Object.values(nodes)
          .map((n) => n.placedCard)
          .filter(Boolean)}
        onNextLevel={() => {
          setIsVictoryModalOpen(false);
          setIsLevelTransitioning(false);
          // Calcular estrellas (1 a 3)
          const earnedStars =
            victoryStats.accuracy >= 90
              ? 3
              : victoryStats.accuracy >= 70
                ? 2
                : 1;
          setLevelStars((prev) => ({
            ...prev,
            [currentLevel]: Math.max(prev[currentLevel] || 0, earnedStars),
          }));
          // Desbloquear siguiente nivel si no estaba desbloqueado (hasta nivel 20)
          if (currentLevel < 20) {
            setUnlockedLevel((prev) => Math.max(prev, currentLevel + 1));
            setCurrentLevel((prev) => prev + 1);
          }
          // Regresar al mapa de aventura con el nuevo nivel listo
          setIsMapVisible(true);
        }}
        onRetry={() => {
          setIsVictoryModalOpen(false);
          setIsLevelTransitioning(false);
          handleRestartWithNewQuestions();
        }}
        onGoToMenu={() => {
          setIsVictoryModalOpen(false);
          setIsLevelTransitioning(false);
          // Si el jugador superó el nivel con al menos 2 estrellas, registrar avance antes de salir
          const earnedStars =
            victoryStats.accuracy >= 90 ? 3 : victoryStats.accuracy >= 70 ? 2 : 1;
          if (earnedStars >= 2) {
            setLevelStars((prev) => ({
              ...prev,
              [currentLevel]: Math.max(prev[currentLevel] || 0, earnedStars),
            }));
            if (currentLevel < 20) {
              setUnlockedLevel((prev) => Math.max(prev, currentLevel + 1));
            }
          }
          setIsMapVisible(true);
        }}
        onReview={() => {
          setIsVictoryModalOpen(false);
          setIsLevelTransitioning(false);
        }}
      />

      {/* MODAL DE OPCIONES DE REINICIO (OPCIÓN A: REPETIR MISMO EXAMEN VS OPCIÓN B: NUEVAS PREGUNTAS CON IA) */}
      <RestartOptionsModal
        open={isRestartOptionsModalOpen}
        onClose={() => setIsRestartOptionsModalOpen(false)}
        onSameExam={handleResetCurrentBoard}
        onNewQuestions={handleRegenerateWithNewQuestions}
      />

      {/* MODAL DE SUSCRIPCIÓN STRIPE CHECKOUT (HUBZY PRO) */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        currentUser={currentUser}
        onSubscriptionSuccess={() => {
          setIsSubscriptionModalOpen(false);
          setSuccessNotif("¡Tu cuenta ahora tiene acceso a Hubzy Pro!");
        }}
      />

      {/* MODAL LEGAL Y DE TRANSPARENCIA (TÉRMINOS, PRIVACIDAD, REEMBOLSOS) */}
      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalModalTab}
      />

      {/* BANNER DE CONSENTIMIENTO DE COOKIES */}
      <CookieConsentBanner onOpenLegal={handleOpenLegal} />
    </div>
  );
}
