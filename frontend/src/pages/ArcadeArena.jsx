import React, { useState, useEffect, useRef } from "react";
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
  Compass,
  CheckCircle2,
  AlertCircle,
  Flame,
  School,
} from "lucide-react";

import QuestionModal from "../components/QuestionModal";
import CardDetailModal from "../components/CardDetailModal";
import ZenRelaxModal from "../components/ZenRelaxModal";
import StudyFolderManagerModal from "../components/StudyFolderManagerModal";
import InstitutionModal from "../components/InstitutionModal";
import UserAuthModal from "../components/UserAuthModal";
import AuthModal from "../components/AuthModal";
import SubscriptionModal from "../components/SubscriptionModal";
import TutorialModal from "../components/TutorialModal";
import VictoryModal from "../components/VictoryModal";
import WelcomeScreen from "../components/WelcomeScreen";
import GenerationOverlay from "../components/GenerationOverlay";
import CoachMark from "../components/CoachMark";
import AdventureMap from "../components/AdventureMap";
import LegalModal from "../components/LegalModal";
import CookieConsentBanner from "../components/CookieConsentBanner";
import CapyCompanion from "../components/CapyCompanion";
import RestartOptionsModal from "../components/RestartOptionsModal";
import HandTray from "../components/HandTray";
import BoardConsole from "../components/BoardConsole";
import { capyAudio } from "../utils/capyAudio";
import { capyVoice } from "../utils/capyVoice";
import { hubziAmbient } from "../utils/hubziAmbient";
import { sfx } from "../utils/sfx";
import { detectDomainCategory } from "../utils/domainIcons";

import { fetchWithAuth } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { useCrisis, checkCrisisFlag } from "../lib/crisis.jsx";
import { GAME_LEVELS } from "../utils/gameConfig";
import { analyzeIntentLocally } from "../utils/localNlp";
import { getDynamicLayout } from "../utils/boardLayout";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { bandForAge, getBand } from "../utils/ageConfig";
import { lockLandscape } from "../utils/orientation";

export default function ArcadeArena() {
  const { reportCrisis } = useCrisis();
  // Estados de Niveles del Juego (1 a 5) y Mapa de Aventura
  const [currentLevel, setCurrentLevel] = useState(1);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [levelStars, setLevelStars] = useState({ 1: 0 });
  const [isMapVisible, setIsMapVisible] = useState(false);
  // El juego se diseñó para horizontal: pedir lock cuando el mapa abre
  // (manifest ya lo fuerza en PWA; esto cubre navegadores Android).
  useEffect(() => {
    if (isMapVisible) lockLandscape();
  }, [isMapVisible]);
  const [isLevelTransitioning, setIsLevelTransitioning] = useState(false);
  const [isRestartOptionsModalOpen, setIsRestartOptionsModalOpen] =
    useState(false);

  // Estados del juego (Vacíos al inicio: sólo se pueblan tras subir materiales)
  const [boardInfo, setBoardInfo] = useState(null);
  const [nodes, setNodes] = useState({});
  const [hand, setHand] = useState([]);
  const [handPage, setHandPage] = useState(0); // Paginación inteligente del mazo (8 cartas por vista)
  const [flyingCard, setFlyingCard] = useState(null); // { card, targetPos, isOpponent }
  // Racha de aciertos consecutivos (feedback positivo — nunca castiga)
  const [streak, setStreak] = useState(0);
  const [successNotif, setSuccessNotif] = useState(null);
  const [errorNotif, setErrorNotif] = useState(null);
  const [isCapySad, setIsCapySad] = useState(false); // Capibara llora cuando la carta es incorrecta

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

  // Registro adaptativo BKT — la respuesta alimenta la maestría por tema
  // (p_mastery) que luego sugiere repasos en la pantalla de victoria.
  const recordAdaptiveAttempt = (node, correct) => {
    const domain =
      node?.domain === "trampa" ? "general" : node?.domain || "general";
    const topic = node?.answerSpec?.topic || domain;
    fetchWithAuth("/api/v1/adaptive/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain, topic, correct }),
    })
      .then(async (res) => {
        if (res.ok) masteryRef.current[topic] = await res.json();
      })
      .catch(() => {});
  };

  // Pantalla Inicial de Bienvenida (Estilo Card Clash).
  // Solo se muestra si no hay sesión previa y el usuario nunca entró:
  // quien ya conoce Hubzy vuelve directo a la arena (resume sin fricción).
  const [isWelcomeScreenVisible, setIsWelcomeScreenVisible] = useState(() => {
    try {
      if (localStorage.getItem("hubzy_current_user")) return false;
      return !localStorage.getItem("hubzy_seen_welcome");
    } catch {
      return true;
    }
  });

  // Al salir de la bienvenida una vez, queda vista para siempre.
  useEffect(() => {
    if (!isWelcomeScreenVisible) {
      try {
        localStorage.setItem("hubzy_seen_welcome", "1");
      } catch {
        /* almacenamiento no disponible */
      }
    }
  }, [isWelcomeScreenVisible]);

  // Modal de Login / Registro
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Modal secundario de edición de perfil (género, edad, apodo)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Cerrar Sesión
  const handleLogout = () => {
    localStorage.removeItem("hubzy_current_user");
    localStorage.removeItem("hubzy_auth_token");
    chatHistoryRef.current = []; // la memoria de Hubzi es privada por sesión
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
              "¡Pago confirmado en Stripe! Bienvenido a Hubzy Pro",
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
        });
    } else if (payment === "cancelled") {
      setSuccessNotif("Pago cancelado en Stripe.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Retorno de Stripe del checkout INSTITUCIONAL (?school_payment=success)
    const schoolPayment = params.get("school_payment");
    if (schoolPayment === "success" && sessionId) {
      fetchWithAuth(`/api/v1/payments/verify-session/${sessionId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.is_paid) {
            setSuccessNotif(
              "¡Licencia escolar activada! Tu colegio ya puede matricular estudiantes.",
            );
          } else {
            setSuccessNotif(
              "Pago registrado — la licencia se activará automáticamente al confirmarse.",
            );
          }
        })
        .catch(() => {
          setErrorNotif(
            "No se pudo confirmar el pago aún — si ya pagaste, la licencia se activa sola en unos minutos.",
          );
        })
        .finally(() => {
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
        });
    } else if (schoolPayment === "cancelled") {
      setErrorNotif("Pago de licencia escolar cancelado.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Deep-link desde el Dashboard: /arena?upgrade=1 abre el modal Pro
    if (params.get("upgrade") === "1") {
      setIsSubscriptionModalOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [currentUser]);

  // Modales (Flujo: 1. Autenticación -> 2. Carpetas/Material -> 3. Zen Relax -> 4. Juego en Vivo)
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isInstitutionModalOpen, setIsInstitutionModalOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState(false);
  const [victoryStats, setVictoryStats] = useState({
    accuracy: 100,
    totalQuestions: 5,
  });
  const [activeFolder, setActiveFolder] = useState(null);
  const [activeIsland, setActiveIsland] = useState(null); // isla temática activa (null = campaña general)
  const [isRelaxModalOpen, setIsRelaxModalOpen] = useState(false);
  const [zenOffer, setZenOffer] = useState({
    show: false,
    category: "",
    distortion: "",
    emotion: "",
  });
  const [isGeneratingArena, setIsGeneratingArena] = useState(false);
  const [genStage, setGenStage] = useState(null); // Etapa real reportada por el job async
  const [genError, setGenError] = useState(null); // { message } — mantiene el overlay con opción de reintentar
  const genAbortRef = useRef(null); // AbortController de la generación en curso
  const lastGenRef = useRef(null); // último intento {level, folder, island, force} para reintentar
  const victoryConsumedRef = useRef(false); // true mientras el tablero completado siga en pantalla (anti victoria fantasma)
  const failedNodesRef = useRef(new Set()); // nodos con ≥1 intento fallido → precisión real
  const failStreakRef = useRef(0); // fallos consecutivos → trigger de apoyo Zen
  const masteryRef = useRef({}); // topic → {p_mastery, mastered, recommendation} (BKT)
  const chatHistoryRef = useRef([]); // memoria conversacional de Hubzi [{role, text}]
  const breakOfferedRef = useRef(false); // micro-pausa sugerida una vez por sesión
  const [selectedNodeForQuestion, setSelectedNodeForQuestion] = useState(null);
  const [selectedCardForDetail, setSelectedCardForDetail] = useState(null);
  const [selectedCardInHand, setSelectedCardInHand] = useState(null);

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
                `Pista de Hubzi: ¡Esta carta pertenece a la casilla "${emptyNode.label || "en espera"}"!`,
              );
            }
          }
        }
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [hand, nodes, hintCardId, isVictoryModalOpen]);

  const [playerScore, setPlayerScore] = useState(0);

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
    // La música arranca activada: el navegador exige un gesto del usuario,
    // así que arranca en la primera interacción (o ya si está permitido).
    const disarmAmbientAutostart = hubziAmbient.autoStart();
    return () => {
      unsubscribe();
      unsubscribeAmbient();
      disarmAmbientAutostart();
      if (capySpeechTimeoutRef.current)
        clearTimeout(capySpeechTimeoutRef.current);
    };
  }, []);

  // Al desmontar la arena: soltar voz de Hubzi, música ambient y cualquier
  // generación en vuelo — sin esto seguían sonando/corriendo sin pantalla.
  useEffect(() => {
    return () => {
      try {
        capyVoice.stop();
      } catch (_) {}
      try {
        hubziAmbient.stop(0);
      } catch (_) {}
      try {
        genAbortRef.current?.abort();
      } catch (_) {}
      if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current);
      if (capySpeechTimeoutRef.current) clearTimeout(capySpeechTimeoutRef.current);
    };
  }, []);

  // -------------------------------------------------------------------
  // Progreso de campaña persistente (estrellas, nivel desbloqueado y actual)
  // -------------------------------------------------------------------

  // Claves por isla: cada tema tiene su propia campaña y su propio caché.
  const campaignKey = (folderId, islandId) =>
    `hubzy_campaign_progress_${folderId}${islandId ? `_${islandId}` : ""}`;
  const lvlCacheKey = (lvl, island) =>
    island ? `${island.id}__level_${lvl}` : `level_${lvl}`;
  const islandQuery = (island) => (island ? `&island_id=${island.id}` : "");
  // Niveles de la campaña activa: los de la isla o los 20 de la carpeta
  const maxLevel = activeIsland?.total_levels || 20;
  const activeLevels =
    maxLevel < GAME_LEVELS.length ? GAME_LEVELS.slice(0, maxLevel) : GAME_LEVELS;

  // Hidratar progreso al cambiar de carpeta/isla: primero del objeto
  // (GET /folders incluye campaign_progress e islands[].campaign_progress)
  // y si no hay, del espejo local.
  useEffect(() => {
    if (!activeFolder?.id) return;
    const cap = activeIsland?.total_levels || 20;
    let stars = { 1: 0 };
    let unlocked = 1;
    let current = 1;
    const p = activeIsland
      ? activeIsland.campaign_progress
      : activeFolder.campaign_progress;
    if (p && (p.level_stars || p.unlocked_level > 1)) {
      stars =
        p.level_stars && Object.keys(p.level_stars).length
          ? p.level_stars
          : { 1: 0 };
      unlocked = Math.min(cap, Math.max(1, p.unlocked_level || 1));
      current = Math.min(cap, Math.max(1, p.current_level || unlocked));
    } else {
      try {
        const saved = JSON.parse(
          localStorage.getItem(
            campaignKey(activeFolder.id, activeIsland?.id),
          ) || "null",
        );
        if (saved) {
          if (saved.level_stars && Object.keys(saved.level_stars).length)
            stars = saved.level_stars;
          if (saved.unlocked_level)
            unlocked = Math.min(cap, Math.max(1, saved.unlocked_level));
          if (saved.current_level)
            current = Math.min(cap, Math.max(1, saved.current_level));
        }
      } catch {}
    }
    setLevelStars(stars);
    setUnlockedLevel(unlocked);
    setCurrentLevel(current);

    // Repaso espaciado suave: si lleva ≥2 días sin jugar esta carpeta,
    // Hubzi lo celebra al volver (retención sin culpa — jamás un regaño).
    const lastPlayed = p?.last_played_at;
    if (lastPlayed && unlocked > 1) {
      const days = Math.floor(
        (Date.now() - new Date(lastPlayed).getTime()) / 86400000,
      );
      if (days >= 2) {
        setCapyMood("encouraging");
        setCapySpeech({
          text: `¡Qué gusto verte! Pasaron ${days} días — un repaso rápido ahora afianza todo lo que ya dominaste.`,
          isVisible: true,
          mood: "encouraging",
        });
      }
    }
    // Solo hidratar al cambiar de carpeta/isla: persistCampaignProgress
    // actualiza el progreso y no debe pisar el estado local más fresco.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFolder?.id, activeIsland?.id]);

  // Micro-pausa anti-fatiga: tras ~25 min de juego activo en un tablero,
  // Hubzi sugiere respirar. Oferta suave (jamás bloqueo), una vez por sesión.
  const hasActiveBoard = Object.keys(nodes).length > 0;
  useEffect(() => {
    if (!hasActiveBoard || breakOfferedRef.current) return;
    const t = setTimeout(() => {
      if (breakOfferedRef.current) return;
      breakOfferedRef.current = true;
      setZenOffer({
        show: true,
        category: "pausa activa",
        distortion: "",
        emotion: "fatiga",
      });
      setCapyMood("encouraging");
      setCapySpeech({
        text: "Llevas un buen rato concentrado — un respiro de 2 minutos ayuda a que todo se fije mejor. ¿Respiramos juntos?",
        isVisible: true,
        mood: "encouraging",
      });
    }, 25 * 60 * 1000);
    return () => clearTimeout(t);
  }, [hasActiveBoard]);

  // Nivel desde el que continuar: del progreso del servidor o del espejo local
  const getResumeLevel = (folder, island = null) => {
    const cap = island?.total_levels || 20;
    const p = island ? island.campaign_progress : folder?.campaign_progress;
    let lvl = p?.current_level || p?.unlocked_level || 1;
    if (lvl <= 1) {
      try {
        const s = JSON.parse(
          localStorage.getItem(campaignKey(folder.id, island?.id)) || "null",
        );
        if (s?.current_level) lvl = s.current_level;
        else if (s?.unlocked_level) lvl = s.unlocked_level;
      } catch {}
    }
    return Math.min(cap, Math.max(1, lvl));
  };

  // Persistencia de victoria UNIFICADA: los 4 botones del modal la llaman
  // antes de divergir — una victoria de 1★ ya no se pierde al ir al menú,
  // y repetir/repasar tampoco abandona estrellas ni XP. El merge del backend
  // es max-wins, así que es seguro llamarla más de una vez por nivel.
  const persistVictoryProgress = (targetCurrent) => {
    const earnedStars =
      victoryStats.accuracy >= 90 ? 3 : victoryStats.accuracy >= 70 ? 2 : 1;
    const nextStars = {
      ...levelStars,
      [currentLevel]: Math.max(levelStars[currentLevel] || 0, earnedStars),
    };
    const nextUnlocked =
      currentLevel < maxLevel
        ? Math.max(unlockedLevel, currentLevel + 1)
        : unlockedLevel;
    setLevelStars(nextStars);
    if (currentLevel < maxLevel) setUnlockedLevel(nextUnlocked);
    persistCampaignProgress({
      level_stars: nextStars,
      unlocked_level: nextUnlocked,
      current_level: targetCurrent,
      xp_gained: playerScore,
    });
    return nextUnlocked;
  };

  // Guardar progreso: espejo localStorage (invitados/offline) + servidor.
  const persistCampaignProgress = (progress) => {
    if (!activeFolder?.id) return;
    try {
      localStorage.setItem(
        campaignKey(activeFolder.id, activeIsland?.id),
        JSON.stringify(progress),
      );
    } catch {}
    setActiveFolder((prev) => {
      if (!prev) return prev;
      if (activeIsland) {
        return {
          ...prev,
          islands: (prev.islands || []).map((i) =>
            i.id === activeIsland.id
              ? { ...i, campaign_progress: progress }
              : i,
          ),
        };
      }
      return { ...prev, campaign_progress: progress };
    });
    fetchWithAuth(`/api/v1/folders/${activeFolder.id}/campaign-progress`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...progress,
        island_id: activeIsland?.id,
        total_levels: activeIsland?.total_levels,
        // Día LOCAL del jugador para la racha (el servidor usaría UTC y
        // partiría sesiones nocturnas contra el día equivocado).
        study_date: new Date().toLocaleDateString("sv-SE"),
      }),
    }).catch((e) => console.warn("No se pudo guardar el progreso:", e));
  };

  // Auto-cierre de toasts: cada notificación nueva reinicia su timer — los
  // setTimeout manuales encadenados mataban la notificación NUEVA cuando
  // expiraba el timer de la anterior.
  useEffect(() => {
    if (!successNotif) return;
    const t = setTimeout(() => setSuccessNotif(null), 5000);
    return () => clearTimeout(t);
  }, [successNotif]);
  useEffect(() => {
    if (!errorNotif) return;
    const t = setTimeout(() => setErrorNotif(null), 5500);
    return () => clearTimeout(t);
  }, [errorNotif]);

  // Snapshot del progreso para guardar al ocultar/salir de la pestaña.
  const progressSnapshotRef = useRef(null);
  useEffect(() => {
    progressSnapshotRef.current = {
      level_stars: levelStars,
      unlocked_level: unlockedLevel,
      current_level: currentLevel,
    };
  }, [levelStars, unlockedLevel, currentLevel]);

  useEffect(() => {
    const onHide = () => {
      if (
        document.visibilityState === "hidden" &&
        progressSnapshotRef.current?.unlocked_level > 1
      ) {
        persistCampaignProgress(progressSnapshotRef.current);
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFolder?.id, activeIsland?.id]);

  // Reiniciar campaña completa (estrellas y desbloqueo vuelven al nivel 1).
  const handleResetCampaign = async () => {
    if (!activeFolder?.id) return;
    if (
      !window.confirm(
        "¿Reiniciar la campaña? Se borrarán tus estrellas y volverás al Nivel 1.",
      )
    )
      return;
    setLevelStars({ 1: 0 });
    setUnlockedLevel(1);
    setCurrentLevel(1);
    try {
      localStorage.removeItem(
        campaignKey(activeFolder.id, activeIsland?.id),
      );
    } catch {}
    setActiveFolder((prev) => {
      if (!prev) return prev;
      if (activeIsland) {
        return {
          ...prev,
          islands: (prev.islands || []).map((i) =>
            i.id === activeIsland.id ? { ...i, campaign_progress: null } : i,
          ),
        };
      }
      return { ...prev, campaign_progress: null };
    });
    await fetchWithAuth(
      `/api/v1/folders/${activeFolder.id}/campaign-progress${activeIsland ? `?island_id=${activeIsland.id}` : ""}`,
      { method: "DELETE" },
    ).catch((e) => console.warn("No se pudo reiniciar el progreso:", e));
    setSuccessNotif("Campaña reiniciada. ¡De nuevo al Nivel 1!");
  };

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
      text: `¡Te escucho! Dijiste: "${transcript}" ... ¡Estoy pensando con todo mi amor para ti!`,
      isVisible: true,
      mood: "thinking",
    });

    // Registrar el mensaje del usuario en la memoria conversacional (máx 12)
    chatHistoryRef.current.push({ role: "user", text: transcript });
    if (chatHistoryRef.current.length > 12) chatHistoryRef.current.shift();
    const historyPayload = chatHistoryRef.current.slice(0, -1); // sin el actual

    // Intentar NLP del backend con timeout de 8s (Gemini necesita más que 3s)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetchWithAuth("/api/v1/arena/capy-ask", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: transcript,
          history: historyPayload,
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

        // Guardar la respuesta de Hubzi en la memoria
        chatHistoryRef.current.push({ role: "capi", text: reply });
        if (chatHistoryRef.current.length > 12) chatHistoryRef.current.shift();

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
    chatHistoryRef.current.push({ role: "capi", text: local.reply });
    if (chatHistoryRef.current.length > 12) chatHistoryRef.current.shift();
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
      if (
        allNodesCompleted &&
        !victoryConsumedRef.current &&
        !isLevelTransitioning &&
        !isVictoryModalOpen
      ) {
        victoryConsumedRef.current = true; // se resetea al cargar un tablero NUEVO
        setIsLevelTransitioning(true);

        // Precisión real: % de nodos resueltos al primer intento (honestidad pedagógica)
        const totalQ = nodeValues.length;
        const failedNodes = nodeValues.filter((n) =>
          failedNodesRef.current.has(n.id),
        );
        const accuracyCalc = Math.round(
          ((totalQ - failedNodes.length) / totalQ) * 100,
        );

        // Repaso inteligente: temas que fallaron O donde el motor BKT
        // aún estima maestría baja (incluye sesiones previas)
        const weakTopics = new Set(
          failedNodes
            .map((n) => n.answerSpec?.topic || n.label)
            .filter(Boolean),
        );
        Object.entries(masteryRef.current).forEach(([topic, m]) => {
          if (
            m?.recommendation?.action === "remediate" ||
            (typeof m?.p_mastery === "number" && m.p_mastery < 0.4)
          ) {
            weakTopics.add(topic);
          }
        });

        setVictoryStats({
          accuracy: accuracyCalc,
          totalQuestions: totalQ,
          firstTry: Math.max(0, totalQ - failedNodes.length),
          weakNodes: [...weakTopics],
        });

        sfx.victory();
        triggerCapyVoice("victory", { level: currentLevel });
        setIsVictoryModalOpen(true);
      }
    }
    // triggerCapyVoice cambia cada render; incluirla re-dispararía la detección de victoria.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, currentLevel, isLevelTransitioning, isVictoryModalOpen]);



  // GENERADOR DINÁMICO DE POSICIONES Y TOPOLOGÍA PARA CUALQUIER NÚMERO DE PREGUNTAS (1 A 20)
  // HELPER: Configurar tablero y cartas con enlace 1-a-1 y posiciones dinámicas
  const applyBoardData = (boardData, folderName, level = currentLevel) => {
    if (!boardData.cards || boardData.cards.length === 0) return false;

    const lvlInfo =
      GAME_LEVELS.find((l) => l.level === level) || GAME_LEVELS[0];

    // Separar cartas reales de las TRAMPA antes de cortar: un slice ciego
    // podía meter una trampa como "carta correcta" o dejar un nodo sin su
    // match — nivel imposible de terminar (soft-lock).
    const isTrapCard = (c) =>
      c.is_distractor ||
      c.isDistractor ||
      String(c.id || "").includes("distractor") ||
      String(c.id || "").includes("trap");
    const realCards = (boardData.cards || []).filter((c) => !isTrapCard(c));
    const backendTrapCards = (boardData.cards || []).filter(isTrapCard);

    // REGLA ESTRICTA: El Nivel K debe tener exactamente K preguntas (N1 = 1, N2 = 2, N3 = 3 ... N20 = 20)
    const targetQuestions = Math.min(
      lvlInfo.questions,
      Math.max(1, boardData.nodes.length),
      Math.max(1, realCards.length),
    );
    const activeNodes = boardData.nodes.slice(0, targetQuestions);
    const activeMatchingCards = realCards.slice(0, targetQuestions);

    setBoardInfo({
      title:
        boardData.title ||
        (folderName ? folderName.toUpperCase() : "ARENA DE ESTUDIO"),
      theme: folderName || "Estudio",
      levelInfo: lvlInfo,
    });

    const dynamicPositions = getDynamicLayout(activeNodes.length);
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

    // REGLA DE CARTAS TRAMPA: A partir del Nivel 3 se inyectan cartas trampa en el mazo.
    // Preferir las trampas REALES del backend (conceptos incorrectos del doc)
    // antes que los placeholders genéricos.
    const levelHasTraps = lvlInfo.hasTraps;
    const requiredTrapCount = levelHasTraps ? lvlInfo.trapCount || 1 : 0;
    backendTrapCards.slice(0, requiredTrapCount).forEach((c, i) => {
      processedCards.push({
        id: c.id || `card_trap_backend_${i + 1}`,
        name: c.concept_name || c.name || "Afirmación Incorrecta",
        cost: c.points_multiplier || "1x",
        type: "dark",
        sourceType: "document",
        domain: "trampa",
        content: c.content || "¡Carta trampa! Esta afirmación no corresponde al tema.",
        matchesNodeId: null,
        isDistractor: true,
        isTrap: true,
      });
    });
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
    victoryConsumedRef.current = false; // tablero nuevo → victoria habilitada otra vez
    failedNodesRef.current = new Set(); // precisión del nivel se mide desde cero
    failStreakRef.current = 0;
    setNodes(newNodes);
    setHand(shuffledHand);
    setHandPage(0);
    setStreak(0);
    setPlayerScore(0);
    setIsCapySad(false);
    setSelectedNodeForQuestion(null);
    setSelectedCardForDetail(null);
    setSelectedCardInHand(null);
    setFlyingCard(null);

    setTimeout(() => {
      triggerCapyVoice("welcome", { level });
    }, 1000);
    return true;
  };

  // CARGAR NIVEL ESPECÍFICO (1 A 5) DESDE EL BACKEND
  // Cancela la espera de generación. El job del backend termina igual y su
  // resultado queda en caché, así que cancelar no desperdicia el trabajo.
  const handleCancelGeneration = () => {
    genAbortRef.current?.abort();
    genAbortRef.current = null;
    setIsGeneratingArena(false);
    setGenStage(null);
    setGenError(null);
  };

  // Reintenta la última generación con los mismos parámetros (la caché del
  // backend puede resolverlo al instante si el job previo ya terminó).
  const handleRetryGeneration = () => {
    const last = lastGenRef.current;
    setGenError(null);
    setIsGeneratingArena(false);
    if (!last) return;
    setTimeout(
      () => loadGameForLevel(last.level, last.folder, last.force, last.island),
      0,
    );
  };

  // Sondeo del job async del backend → tablero final o error con status_code.
  const pollGenerationJob = async (jobId, signal) => {
    while (true) {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      const jr = await fetchWithAuth(`/api/v1/jobs/${jobId}`, { signal });
      if (!jr.ok)
        throw new Error(`No se pudo consultar el progreso (${jr.status}).`);
      const job = await jr.json();
      setGenStage(job.stage);
      if (job.status === "done") return job.result;
      if (job.status === "error") {
        const e = new Error(
          job.error || "No se pudieron generar los reactivos del nivel con IA.",
        );
        e.status = job.status_code || 500;
        throw e;
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
  };

  const loadGameForLevel = async (
    targetLevel,
    targetFolder = activeFolder,
    force = false,
    targetIsland = activeIsland,
  ) => {
    if (isGeneratingArena) return false; // guard anti doble-submit
    if (!targetFolder) {
      setSuccessNotif("Selecciona una carpeta de estudio para comenzar.");
      setIsFolderModalOpen(true);
      return false;
    }

    const lvlInfo =
      GAME_LEVELS.find((l) => l.level === targetLevel) || GAME_LEVELS[0];
    const topicLabel = targetIsland ? ` · ${targetIsland.name}` : "";
    lastGenRef.current = {
      level: targetLevel,
      folder: targetFolder,
      island: targetIsland,
      force,
    };
    setIsGeneratingArena(true);
    setGenStage("queued");
    setGenError(null);
    const controller = new AbortController();
    genAbortRef.current = controller;
    setSuccessNotif(
      `Cargando Nivel ${targetLevel} (${lvlInfo.name} - ${lvlInfo.questions} preguntas) desde [${targetFolder.name}${topicLabel}]...`,
    );

    // 0. VERIFICACIÓN INSTANTÁNEA EN MEMORIA / CACHÉ LOCAL (0 ms, 0 tokens)
    if (!force) {
      const cachedBoards = targetFolder.cached_boards || {};
      const lvlKey = lvlCacheKey(targetLevel, targetIsland);
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
          setGenStage(null);
          setSuccessNotif(
            `Nivel ${targetLevel} listo al instante (análisis previo en memoria).`,
          );
          return true;
        }
      }
    }

    try {
      const res = await fetchWithAuth(
        `/api/v1/folders/${targetFolder.id}/generate-game?level=${targetLevel}&question_count=${lvlInfo.questions}&difficulty=${lvlInfo.difficulty}&async=true${islandQuery(targetIsland)}${force ? "&force=true" : ""}`,
        { method: "POST", signal: controller.signal },
      );

      let boardData = null;
      if (res.status === 202) {
        // Pipeline async: sondear el job para progreso real por etapas.
        const { job_id } = await res.json();
        boardData = await pollGenerationJob(job_id, controller.signal);
      } else if (res.ok) {
        boardData = await res.json();
      } else {
        const err = await res.json().catch(() => ({}));
        const msg =
          err.detail || "No se pudieron generar los reactivos del nivel con IA.";
        if (res.status === 402) {
          setErrorNotif(msg);
        } else {
          setGenError({ message: msg });
        }
        return false;
      }

      if (boardData && boardData.cards) {
        // Guardar en la carpeta en memoria y localStorage para futuras cargas a 0 ms
        if (!targetFolder.cached_boards) targetFolder.cached_boards = {};
        targetFolder.cached_boards[lvlCacheKey(targetLevel, targetIsland)] =
          boardData;
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
        } catch {}

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
          return true;
        }
      }
      setGenError({ message: "El análisis no devolvió reactivos válidos." });
    } catch (e) {
      if (e.name === "AbortError") return false; // cancelado por el usuario
      console.warn("Error cargando nivel desde el backend:", e);
      if (e.status === 402) {
        setErrorNotif(e.message);
      } else {
        setGenError({
          message:
            e.message || "Error al conectarse con el servidor de análisis.",
        });
      }
    } finally {
      // Solo la generación dueña del ref apaga el estado: si el usuario
      // canceló y reintentó, el finally de la anterior no debe ocultar el
      // overlay ni re-habilitar el botón de la nueva en curso.
      if (genAbortRef.current === controller) {
        genAbortRef.current = null;
        setIsGeneratingArena(false);
        setGenStage(null);
      }
    }
    return false;
  };

  // 2A. REINTENTAR PARTIDA (OPCIÓN A: RESET TABLERO INSTANTÁNEO 0 MS)
  // Devuelve todas las cartas a la mano, reinicia energía y vacía los nodos sin llamar a la IA
  const handleResetCurrentBoard = () => {
    setIsRestartOptionsModalOpen(false);
    setIsVictoryModalOpen(false);

    // Recolectar todas las cartas colocadas en los nodos más las que queden en mano
    const allCardsInPlay = [...hand];
    Object.values(nodes).forEach((n) => {
      if (n.placedCard) {
        allCardsInPlay.push(n.placedCard);
      }
    });

    // Desocupar todos los nodos — el examen se juega de nuevo, así que
    // la victoria vuelve a estar habilitada para este mismo tablero.
    victoryConsumedRef.current = false;
    failedNodesRef.current = new Set(); // reintento honesto: la precisión se vuelve a medir
    failStreakRef.current = 0;
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
    setStreak(0);
    setPlayerScore(0);
    setIsCapySad(false);
    setSelectedNodeForQuestion(null);
    setSelectedCardForDetail(null);
    setSelectedCardInHand(null);
    setFlyingCard(null);
    setSuccessNotif(
      "Tablero reiniciado: Vuelve a intentar este mismo examen.",
    );
  };

  // 2B. REGENERAR NUEVAS PREGUNTAS (OPCIÓN B: CONSULTA A GEMINI IA)
  const handleRegenerateWithNewQuestions = async () => {
    setIsRestartOptionsModalOpen(false);
    setIsVictoryModalOpen(false);
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

  // INTENTO UNIFICADO DE JUGAR/COLOCAR CARTA (Arrastrar o Tocar)
  const attemptPlayCard = (cardId, targetNodeId) => {
    if (!targetNodeId || !nodes[targetNodeId]) return false;
    const targetNode = nodes[targetNodeId];

    if (targetNode.placedCard) {
      setSuccessNotif(`Este nodo ya tiene su respuesta colocada.`);
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
      // CARTA INCORRECTA O TRAMPA: apoyo sin castigo — el error enseña
      sfx.error();
      triggerCapyVoice("wrong");
      recordAdaptiveAttempt(targetNode, false);
      failedNodesRef.current.add(targetNodeId);
      setStreak(0); // la racha se reinicia (feedback visual, no daño)

      // Anti-estrés: 3 fallos seguidos → Hubzi ofrece una pausa Zen
      failStreakRef.current += 1;
      if (failStreakRef.current >= 3) {
        failStreakRef.current = 0;
        setZenOffer({
          show: true,
          category: "repetición de intentos",
          distortion: "",
          emotion: "frustración",
        });
      }

      const isTrap = Boolean(card.isTrap || isDistractor);
      if (isTrap) {
        // La trampa se desvanece del mazo (nunca puede ser correcta en ningún nodo)
        sfx.trap();
        setHand((prev) =>
          prev.filter((c) => String(c.id) !== String(card.id)),
        );
      }

      const pedagogicalHint =
        targetNode.hint ||
        `Revisa con atención: esta casilla evalúa el principio "${targetNode.label}".`;
      setCapyMood(isTrap ? "surprised" : "encouraging");
      setCapySpeech({
        text: kidMode
          ? `¡Casi! "${card.name}" no era esa. ${pedagogicalHint}`
          : isTrap
            ? `¡Sorpresa, es una CARTA TRAMPA! Se desvanece del mazo. Pista: ${pedagogicalHint}`
            : `¡Casi! "${card.name}" no va aquí. Pista: ${pedagogicalHint}`,
        isVisible: true,
        mood: isTrap ? "surprised" : "encouraging",
      });
      setSuccessNotif(
        kidMode
          ? `"${card.name}" no era. Pista: ${pedagogicalHint}`
          : isTrap
            ? `¡CARTA TRAMPA! Se desvanece del mazo. Pista: ${pedagogicalHint}`
            : `"${card.name}" no corresponde a "${targetNode.label}". Pista: ${pedagogicalHint}`,
      );

      setTimeout(() => {
        setSuccessNotif(null);
      }, 4500);
      return false;
    }

    // CARTA CORRECTA: Colocar en el nodo, racha sube y voz de celebración entusiasta
    sfx.success();
    triggerCapyVoice("correct");
    recordAdaptiveAttempt(targetNode, true);
    setStreak((prev) => prev + 1);
    failStreakRef.current = 0;
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
      sfx.flip();
      setSelectedCardInHand(card);
      setSuccessNotif(
        `Carta "${card.name}" seleccionada. Toca la casilla correspondiente en el tablero.`,
      );
    }
  };

  const handleDragEnd = (cardId, info) => {
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

  // OVERLAY + TOASTS compartidos: la generación puede lanzarse desde el mapa
  // (onSelectLevel) o desde la demo de bienvenida — sin esto corría invisible.
  const generationOverlay = (isGeneratingArena || genError) && (
    <GenerationOverlay
      stage={genError ? "error" : genStage}
      errorMessage={genError?.message}
      onCancel={handleCancelGeneration}
      onRetry={genError ? handleRetryGeneration : null}
    />
  );

  const notificationToasts = (
    <AnimatePresence>
      {successNotif && (
        <motion.div
          key="success-notif"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-emerald-600/95 border-2 border-emerald-300/60 text-white text-sm font-bold shadow-[0_8px_30px_rgba(16,185,129,0.35)] max-w-lg"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successNotif}</span>
        </motion.div>
      )}
      {errorNotif && (
        <motion.div
          key="error-notif"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-rose-600/95 border-2 border-rose-300/60 text-white text-sm font-bold shadow-[0_8px_30px_rgba(244,63,94,0.35)] max-w-lg"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorNotif}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // SI LA PANTALLA DE BIENVENIDA ESTÁ ACTIVA, SE MUESTRA EXCLUSIVAMENTE ELLA (SIN EL TABLERO NI EL JUEGO ABAJO)
  if (isWelcomeScreenVisible) {
    return (
      <div className="relative w-screen h-screen overflow-hidden select-none">
        <WelcomeScreen
          isLoggedIn={Boolean(currentUser)}
          username={currentUser?.username || currentUser?.email?.split("@")[0]}
          onOpenLogin={() => setIsAuthModalOpen(true)}
          onOpenTutorial={() => setIsTutorialOpen(true)}
          onContinue={() => {
            if (!currentUser) {
              // Si no inició sesión, abre el modal de login
              setIsAuthModalOpen(true);
              return;
            }
            setIsWelcomeScreenVisible(false);
            setIsFolderModalOpen(true);
          }}
          onOpenLegal={handleOpenLegal}
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
      </div>
    );
  }

  // RENDERIZADO DEL MAPA DE AVENTURA (MUNDOS E ISLAS ESTILO MONSTER LEGENDS)
  if (isMapVisible) {
    return (
      <div className="relative w-screen h-screen overflow-hidden select-none">
        <AdventureMap
          folderName={
            activeIsland
              ? `${activeFolder?.name || "Carpeta"} · ${activeIsland.name}`
              : activeFolder?.name || "Mundo de Aprendizaje"
          }
          documentTitle={
            activeIsland?.name ||
            boardInfo?.theme ||
            activeFolder?.documents?.[0]?.name ||
            "Tema de Estudio"
          }
          levels={activeLevels}
          currentLevel={currentLevel}
          unlockedLevel={unlockedLevel}
          levelStars={levelStars}
          studyStreak={
            (activeIsland
              ? activeIsland.campaign_progress?.study_streak
              : activeFolder?.campaign_progress?.study_streak) || 0
          }
          onSelectLevel={async (lvlNum) => {
            setCurrentLevel(lvlNum);
            persistCampaignProgress({
              level_stars: levelStars,
              unlocked_level: unlockedLevel,
              current_level: lvlNum,
            });
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
          onResetCampaign={handleResetCampaign}
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
            const island = folder.selectedIsland || null;
            setActiveFolder(folder);
            setActiveIsland(island);
            setIsFolderModalOpen(false);

            if (
              folder.playDirectly &&
              folder.documents &&
              folder.documents.filter((d) => !d.isUploading).length > 0
            ) {
              // Reanudar donde quedó el jugador (progreso persistente)
              const resumeLevel = getResumeLevel(folder, island);
              setCurrentLevel(resumeLevel);
              setIsMapVisible(true);
              await loadGameForLevel(resumeLevel, folder, false, island);
            }
          }}
        />

        {/* Modal de Tutorial accesible desde el Mapa */}
        <TutorialModal
          isOpen={isTutorialOpen}
          onClose={() => setIsTutorialOpen(false)}
        />

        {/* Overlay/toasts: la generación desde el mapa también es visible */}
        {generationOverlay}
        {notificationToasts}
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

      {/* 0.1 MODAL DE EDICIÓN DE PERFIL / VOZ ADAPTATIVA DE Hubzi */}
      <UserAuthModal
        isOpen={isUserModalOpen}
        currentUser={currentUser}
        onUserSaved={(user) => {
          setCurrentUser(user);
          setIsUserModalOpen(false);
          capyVoice.currentUser = user;
        }}
        onLogout={() => {
          setIsUserModalOpen(false);
          handleLogout();
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
          const island = folder.selectedIsland || null;
          setActiveFolder(folder);
          setActiveIsland(island);
          setIsFolderModalOpen(false);

          if (
            folder.playDirectly &&
            folder.documents &&
            folder.documents.filter((d) => !d.isUploading).length > 0
          ) {
            // Reanudar donde quedó el jugador (progreso persistente)
            const resumeLevel = getResumeLevel(folder, island);
            const islandCap = island?.total_levels || 20;
            setCurrentLevel(resumeLevel);
            const success = await loadGameForLevel(
              resumeLevel,
              folder,
              false,
              island,
            );
            if (success) {
              // Tras cargar el nivel actual, pre-generar en segundo plano los
              // 4 siguientes para transición instantánea entre niveles
              (async () => {
                for (
                  let lvl = resumeLevel + 1;
                  lvl <= Math.min(resumeLevel + 4, islandCap);
                  lvl++
                ) {
                  try {
                    const lvlInfo = GAME_LEVELS.find((l) => l.level === lvl);
                    const key = lvlCacheKey(lvl, island);
                    if (folder.cached_boards && folder.cached_boards[key])
                      continue;
                    const res = await fetchWithAuth(
                      `/api/v1/folders/${folder.id}/generate-game?level=${lvl}&question_count=${lvlInfo.questions}&difficulty=${lvlInfo.difficulty}${islandQuery(island)}`,
                      { method: "POST" },
                    );
                    if (res.ok) {
                      const data = await res.json();
                      if (!folder.cached_boards) folder.cached_boards = {};
                      folder.cached_boards[key] = data;
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
                      } catch {}
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
      />

      {/* 1.9 PANEL INSTITUCIONAL (COLEGIOS: GRADOS, MATERIAS, PANEL DOCENTE) */}
      <InstitutionModal
        isOpen={isInstitutionModalOpen}
        onClose={() => setIsInstitutionModalOpen(false)}
      />

      {/* 2. ACTIVIDAD DE RESPIRACIÓN Y RELAJACIÓN ZEN (HUBZI ZEN CON VOZ ELEVENLABS) */}
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

      {/* OVERLAY DE PROCESAMIENTO PROFUNDO DE DOCUMENTOS CON IA */}
      {generationOverlay}

      {/* TOASTS DE NOTIFICACIÓN — feedback visible de éxito y error */}
      {notificationToasts}

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

      {/* ENTORNO 3D & ILUMINACIÓN ATMOSFÉRICA CARD CLASH */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[700px] h-48 bg-radial from-white/40 via-sky-300/15 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute right-0 top-1/3 w-64 h-64 bg-radial from-amber-300/20 via-orange-400/10 to-transparent blur-3xl pointer-events-none" />

      {/* GUARDIÁN TÁCTICO 3D ZEN INTERACTIVO / SÓLO VISIBLE CUANDO EL TABLERO YA FUE GENERADO */}
      {Object.keys(nodes).length > 0 && (
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
      )}

      {/* RACHA DE ACIERTOS EN VIVO — feedback positivo, nunca castigo */}
      {streak >= 2 && (
        <motion.div
          key={`streak-${streak}`}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
          className="absolute top-16 left-4 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[var(--color-arcade-navy-dark)]/90 border-2 border-[var(--color-arcade-orange)]/70 shadow-[0_4px_0_var(--color-arcade-ink)] pointer-events-none"
          title="Aciertos consecutivos"
        >
          <Flame className="w-4 h-4 text-[var(--color-arcade-orange)] fill-current" />
          <span className="text-sm font-black text-white">x{streak}</span>
        </motion.div>
      )}

      {/* BARRA SUPERIOR CON CONTROLES LIMPIOS ESTILO CARD CLASH */}
      <div className="absolute top-2.5 right-3 z-40 flex items-center gap-2">
        {/* BOTÓN VOLVER AL MAPA DE NIVELES */}
        <button
          onClick={() => setIsMapVisible(true)}
          className="px-3.5 py-2 rounded-2xl bg-[var(--color-arcade-navy)] hover:bg-[var(--color-arcade-navy-hover)] border-2 border-[var(--color-arcade-navy-light)] border-b-4 border-b-[var(--color-arcade-ink)] text-[var(--color-arcade-green)] text-xs font-black uppercase tracking-wide transition-all flex items-center gap-1.5 shadow-[0_4px_0_var(--color-arcade-green-shadow)] active:translate-y-1 active:shadow-none cursor-pointer"
          title="Ver Mapa de Aventura y Niveles"
        >
          <Compass className="w-4 h-4 text-[var(--color-arcade-green)]" />
          <span className="hidden sm:inline">Mapa</span>
        </button>

        {/* BOTÓN VOLVER AL MENÚ PRINCIPAL */}
        <button
          onClick={() => {
            setIsFolderModalOpen(false);
            setIsWelcomeScreenVisible(true);
          }}
          className="px-3.5 py-2 rounded-2xl bg-[var(--color-arcade-navy)] hover:bg-[var(--color-arcade-navy-hover)] border-2 border-[var(--color-arcade-navy-light)] border-b-4 border-b-[var(--color-arcade-ink)] text-[var(--color-arcade-yellow)] text-xs font-black uppercase tracking-wide transition-all flex items-center gap-1.5 shadow-[0_4px_0_var(--color-arcade-ink)] active:translate-y-1 active:shadow-none cursor-pointer"
          title="Volver a la pantalla de bienvenida / Menú de Inicio"
        >
          <Home className="w-4 h-4 text-[var(--color-arcade-yellow)]" />
          <span className="hidden sm:inline">Menú</span>
        </button>

        {/* BOTÓN CÓMO JUGAR / TUTORIAL (ESTILO CARD CLASH PLAY TUTORIAL) */}
        <button
          onClick={() => setIsTutorialOpen(true)}
          className="px-3.5 py-2 rounded-2xl bg-[var(--color-arcade-navy)] hover:bg-[var(--color-arcade-navy-hover)] border-2 border-[var(--color-arcade-navy-light)] border-b-4 border-b-[var(--color-arcade-ink)] text-[var(--color-arcade-yellow)] text-xs font-black uppercase tracking-wide transition-all flex items-center gap-1.5 shadow-[0_4px_0_var(--color-arcade-orange)] active:translate-y-1 active:shadow-none cursor-pointer"
          title="Ver tutorial rápido de cómo jugar"
        >
          <BookOpen className="w-4 h-4 text-[var(--color-arcade-yellow)]" />
          <span className="hidden lg:inline">Tutorial</span>
        </button>

        {/* BOTÓN CARPETAS / MATERIALES */}
        <button
          onClick={() => setIsFolderModalOpen(true)}
          className="px-3.5 py-2 rounded-2xl bg-[var(--color-arcade-navy)] hover:bg-[var(--color-arcade-navy-hover)] border-2 border-[var(--color-arcade-navy-light)] border-b-4 border-b-[var(--color-arcade-ink)] text-white text-xs font-black uppercase tracking-wide transition-all flex items-center gap-1.5 shadow-[0_4px_0_var(--color-arcade-ink)] active:translate-y-1 active:shadow-none cursor-pointer"
          title="Abrir baúl de carpetas y subir nuevos documentos"
        >
          <FolderIcon className="w-4 h-4 text-[var(--color-arcade-cyan)]" />
          <span className="hidden lg:inline">Carpetas</span>
        </button>

        {/* BOTÓN COLEGIO / INSTITUCIÓN */}
        {currentUser && (
          <span className="relative inline-flex">
            <CoachMark id="school">
              ¿Eres docente? Crea tu colegio, genera códigos de clase y mira el progreso de tus estudiantes aquí.
            </CoachMark>
            <button
              onClick={() => setIsInstitutionModalOpen(true)}
              className="px-3.5 py-2 rounded-2xl bg-[var(--color-arcade-navy)] hover:bg-[var(--color-arcade-navy-hover)] border-2 border-[var(--color-arcade-navy-light)] border-b-4 border-b-[var(--color-arcade-ink)] text-white text-xs font-black uppercase tracking-wide transition-all flex items-center gap-1.5 shadow-[0_4px_0_var(--color-arcade-ink)] active:translate-y-1 active:shadow-none cursor-pointer"
              title="Hubzy para Colegios: grados, materias y panel docente"
              aria-label="Abrir Hubzy para Colegios"
            >
              <School className="w-4 h-4 text-emerald-300" />
              <span className="hidden lg:inline">Colegio</span>
            </button>
          </span>
        )}
        {/* BOTÓN PERFIL / INICIAR SESIÓN / CERRAR SESIÓN */}
        {currentUser ? (
          <div className="flex items-center gap-1 bg-[var(--color-arcade-navy)] border-3 border-[var(--color-arcade-navy-dark)] rounded-2xl p-1 shadow-[0_4px_0_var(--color-arcade-ink)]">
            <button
              onClick={() => setIsUserModalOpen(true)}
              className="px-2.5 py-1 text-white text-xs font-black transition-all flex items-center gap-2 hover:bg-[var(--color-arcade-navy-hover)] rounded-xl cursor-pointer group"
              title="Configurar perfil de usuario, edad y voz de Hubzi"
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
              className="px-2.5 py-1.5 hover:bg-rose-900/80 hover:text-rose-200 text-slate-300 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              title="Cerrar sesión de esta cuenta"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-[10px] font-black uppercase tracking-wide">Salir</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="px-4 py-2 rounded-2xl bg-[var(--color-arcade-navy)] hover:bg-[var(--color-arcade-navy-hover)] border-3 border-[var(--color-arcade-navy-dark)] border-b-4 text-white font-black text-xs uppercase tracking-wide transition-all flex items-center gap-2 shadow-[0_4px_0_var(--color-arcade-orange)] active:translate-y-1 active:shadow-none cursor-pointer"
            title="Iniciar sesión o registrarse con correo y contraseña"
          >
            <LogInIcon className="w-4 h-4 text-amber-400" />
            <span>Iniciar Sesión</span>
          </button>
        )}

        {/* BOTÓN REINICIAR (ESTILO CARD CLASH CON VERDE ESMERALDA Y BORDE GRUESO) */}
        <button
          onClick={handleRestartWithNewQuestions}
          className="px-3.5 py-2 rounded-2xl bg-[var(--color-arcade-green)] hover:bg-[#3bb82b] border-2 border-[var(--color-arcade-green-light)] border-b-4 border-b-[var(--color-arcade-green-shadow)] text-white text-xs font-black uppercase tracking-wide transition-all flex items-center gap-2 shadow-[0_4px_0_var(--color-arcade-navy)] active:translate-y-1 active:shadow-none cursor-pointer"
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
              className="flex items-center gap-1.5 bg-[var(--color-arcade-navy)] border-2 border-[var(--color-arcade-navy-light)] border-b-3 border-b-[var(--color-arcade-navy-dark)] px-3.5 py-1.5 rounded-2xl shadow-[0_3px_0_var(--color-arcade-ink)]"
              title={`Nivel ${currentLevel} de 20: ${lvlInfo.name}`}
            >
              <Trophy className="w-4 h-4 text-[var(--color-arcade-yellow)] animate-bounce" />
              <span className="text-[10px] font-black uppercase text-[var(--color-arcade-yellow)] tracking-wider">
                NIVEL {currentLevel}/20:
              </span>
              <span className="text-xs font-black text-white uppercase tracking-wide">
                {lvlInfo.name} ({lvlInfo.questions})
              </span>
            </div>
          );
        })()}

        <div
          className="flex items-center gap-2 bg-[var(--color-arcade-navy)] border-2 border-[var(--color-arcade-navy-light)] border-b-3 border-b-[var(--color-arcade-navy-dark)] px-3.5 py-1.5 rounded-2xl shadow-[0_3px_0_var(--color-arcade-ink)]"
          title="Progreso del Circuito"
        >
          <span className="text-[10px] font-black uppercase text-[var(--color-arcade-green)] tracking-wider">
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
            className="w-full max-w-xl bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border-4 border-[var(--color-arcade-navy)] shadow-[0_20px_40px_rgba(18,36,67,0.2),0_10px_0_var(--color-arcade-navy)] flex flex-col items-center text-center relative overflow-hidden"
          >
            {/* Cabecera / Banner estilizado */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 border-3 border-[var(--color-arcade-navy)] flex items-center justify-center text-white mb-4 shadow-[0_6px_0_var(--color-arcade-navy)]">
              <Sparkles className="w-9 h-9 animate-bounce text-white drop-shadow" />
            </div>

            <div className="inline-block px-4 py-1 rounded-full bg-orange-100 border-2 border-orange-400 text-orange-800 font-black text-[11px] tracking-wider uppercase mb-2">
              Hubzy
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-[var(--color-arcade-navy)] tracking-wide uppercase mb-2">
              ¡Aún no has iniciado tu partida!
            </h2>
            <p className="text-slate-600 font-medium text-sm sm:text-base max-w-md mb-6 leading-relaxed">
              El tablero y tus cartas de batalla se generarán automáticamente a
              partir de lo que desees estudiar hoy.
            </p>

            {/* Pasos requeridos con diseño arcade */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 text-left">
              <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 flex flex-col items-start gap-1.5 shadow-sm">
                <span className="w-6 h-6 rounded-full bg-[var(--color-arcade-navy)] text-white text-xs font-black flex items-center justify-center">
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
                <span className="w-6 h-6 rounded-full bg-[var(--color-arcade-orange)] text-white text-xs font-black flex items-center justify-center">
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
                <span className="w-6 h-6 rounded-full bg-[var(--color-arcade-green)] text-white text-xs font-black flex items-center justify-center">
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
        streak={streak}
        campaignCompleted={currentLevel === maxLevel}
        weakNodes={victoryStats.weakNodes || []}
        firstTry={victoryStats.firstTry ?? null}
        masteredConcepts={Object.values(nodes)
          .map((n) => n.placedCard)
          .filter(Boolean)}
        onNextLevel={() => {
          setIsVictoryModalOpen(false);
          setIsLevelTransitioning(false);
          // Persistir victoria apuntando al nivel siguiente como actual
          persistVictoryProgress(Math.min(currentLevel + 1, maxLevel));
          if (currentLevel < maxLevel) setCurrentLevel((prev) => prev + 1);
          // Regresar al mapa de aventura con el nuevo nivel listo
          setIsMapVisible(true);
        }}
        onRetry={() => {
          setIsVictoryModalOpen(false);
          setIsLevelTransitioning(false);
          // Persistir la victoria actual ANTES de regenerar: las estrellas
          // y el XP ganados no se abandonan por querer otro intento.
          persistVictoryProgress(currentLevel);
          handleRestartWithNewQuestions();
        }}
        onGoToMenu={() => {
          setIsVictoryModalOpen(false);
          setIsLevelTransitioning(false);
          // Cualquier victoria (incluso 1★) desbloquea y se registra — antes
          // solo se guardaba con ≥2★ y el progreso se perdía al salir.
          persistVictoryProgress(
            currentLevel < maxLevel ? currentLevel + 1 : currentLevel,
          );
          setIsMapVisible(true);
        }}
        onReview={() => {
          setIsVictoryModalOpen(false);
          setIsLevelTransitioning(false);
          persistVictoryProgress(currentLevel);
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
