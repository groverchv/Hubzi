import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Search, 
  Layers, 
  Check, 
  Lock, 
  Hourglass, 
  PlayCircle, 
  RotateCcw, 
  LogOut, 
  Sparkles, 
  BookOpen, 
  Trash2, 
  Flame,
  Trophy,
  Bot,
  Swords,
  AlertTriangle,
  Zap,
  Target,
  CircleDot,
  Wind,
  UploadCloud,
  Folder as FolderIcon
} from 'lucide-react';
import GameCard from '../components/GameCard';
import ArcadeNode from '../components/ArcadeNode';
import QuestionModal from '../components/QuestionModal';
import CardDetailModal from '../components/CardDetailModal';
import GameModeModal from '../components/GameModeModal';
import ZenRelaxModal from '../components/ZenRelaxModal';
import StudyFolderManagerModal from '../components/StudyFolderManagerModal';
import { useArenaSocket } from '../hooks/useArenaSocket';
import capybara3dImg from '../assets/capybara_3d.jpg';
import trashBin3dImg from '../assets/trash_bin_3d.jpg';
import { capyAudio } from '../utils/capyAudio';

export default function ArcadeArena() {
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

  // Modales (Flujo: 1. Carpetas/Material -> 2. Generación -> 3. Zen Relax -> 4. Juego en Vivo)
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(true);
  const [activeFolder, setActiveFolder] = useState(null);
  const [isRelaxModalOpen, setIsRelaxModalOpen] = useState(false);
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);
  const [isGeneratingArena, setIsGeneratingArena] = useState(false);
  const [selectedNodeForQuestion, setSelectedNodeForQuestion] = useState(null);
  const [selectedCardForDetail, setSelectedCardForDetail] = useState(null);
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

  const { 
    isConnected, 
    isOpponentConnected, 
    lastOpponentMove, 
    isMyTurn, 
    turnNumber, 
    gameStarted, 
    sendMove 
  } = useArenaSocket(
    gameConfig.mode === '1v1' ? gameConfig.roomId : null,
    clientId
  );

  // REGLA: ¿Es el turno real del usuario?
  // En 1v1: depende de WebSocket `isMyTurn` y que el oponente esté conectado
  // En Solo: depende de `isSoloPlayerTurn` y que la IA no esté pensando
  const isActualTurn = gameConfig.mode === '1v1' 
    ? (isOpponentConnected && isMyTurn)
    : (isSoloPlayerTurn && !isAiThinking);

  // Sincronización de notificaciones de turno
  useEffect(() => {
    if (gameConfig.mode !== '1v1') return;

    if (isOpponentConnected) {
      if (isMyTurn) {
        setSuccessNotif(`¡ES TU TURNO! Arrastra una carta.`);
      } else {
        setSuccessNotif(`Turno del rival. Espera su jugada...`);
      }
      setTimeout(() => setSuccessNotif(null), 4000);
    }
  }, [isOpponentConnected, isMyTurn, gameConfig.mode]);

  // Ejecución y animación en vivo de movimientos del rival (1v1 WebSocket)
  useEffect(() => {
    if (!lastOpponentMove || gameConfig.mode !== '1v1') return;

    if (lastOpponentMove.action === 'card_placed') {
      const { node_id, card_id, card_name, card_type, card_domain } = lastOpponentMove;
      
      // Animar carta del oponente viajando hacia el nodo objetivo
      const targetNode = nodes[node_id];
      const cardObj = {
        id: card_id || 'opp_card',
        name: card_name || 'Concepto Rival',
        type: card_type || 'blue',
        domain: card_domain || ''
      };

      setFlyingCard({
        card: cardObj,
        targetPos: targetNode?.pos || { left: '50%', top: '50%' },
        isOpponent: true
      });

      // Retirar la carta de la mano del oponente
      setOpponentHand(prev => {
        const foundIndex = prev.findIndex(c => c.id === card_id || c.name === card_name);
        if (foundIndex >= 0) {
          const next = [...prev];
          next.splice(foundIndex, 1);
          return next;
        }
        return prev.slice(0, Math.max(0, prev.length - 1));
      });

      // Al completar el vuelo, fijar el nodo
      setTimeout(() => {
        setFlyingCard(null);
        setNodes((prev) => {
          if (!prev[node_id]) return prev;
          return {
            ...prev,
            [node_id]: {
              ...prev[node_id],
              lockedByOpponent: true,
              opponentClaimedCard: card_name || 'Concepto Rival'
            }
          };
        });

        setOpponentScore((prev) => prev + 10);
        setSuccessNotif(`El rival jugó [${card_name || 'una carta'}]. Ahora es TU TURNO.`);
        setTimeout(() => setSuccessNotif(null), 3500);
      }, 1000);
    } 
    else if (lastOpponentMove.action === 'game_reset') {
      setNodes({});
      setHand([]);
      setOpponentHand([]);
      setBoardInfo(null);
      setIsFolderModalOpen(true);
    }
  }, [lastOpponentMove, gameConfig.mode]);

  // Turno de la Máquina (Modo Solo / IA)
  const triggerAiTurn = () => {
    if (gameConfig.mode !== 'solo' || opponentHand.length === 0) return;

    setIsSoloPlayerTurn(false);
    setIsAiThinking(true);
    setSuccessNotif(`TURNO DE LA MÁQUINA: Analizando jugada...`);

    setTimeout(() => {
      // Buscar nodos disponibles no reclamados
      const availableNodeKeys = Object.keys(nodes).filter(
        k => !nodes[k].placedCard && !nodes[k].lockedByOpponent
      );

      if (availableNodeKeys.length === 0 || opponentHand.length === 0) {
        setIsAiThinking(false);
        setIsSoloPlayerTurn(true);
        setSuccessNotif(`¡ES TU TURNO! Elige una carta para responder.`);
        setTimeout(() => setSuccessNotif(null), 3500);
        return;
      }

      // La máquina elige una carta y un nodo al azar
      const chosenNodeId = availableNodeKeys[Math.floor(Math.random() * availableNodeKeys.length)];
      const targetNode = nodes[chosenNodeId];
      const chosenCardIndex = Math.floor(Math.random() * opponentHand.length);
      const chosenCard = opponentHand[chosenCardIndex];

      // Disparar animación en vivo del vuelo de la carta de la máquina
      setFlyingCard({
        card: chosenCard,
        targetPos: targetNode?.pos || { left: '50%', top: '50%' },
        isOpponent: true
      });

      // Retirar carta de la mano de la máquina
      setOpponentHand(prev => prev.filter((_, idx) => idx !== chosenCardIndex));

      setTimeout(() => {
        setFlyingCard(null);
        setNodes(prev => ({
          ...prev,
          [chosenNodeId]: {
            ...prev[chosenNodeId],
            lockedByOpponent: true,
            opponentClaimedCard: chosenCard.name
          }
        }));

        setOpponentScore(prev => prev + 10);
        setIsAiThinking(false);
        setIsSoloPlayerTurn(true); // Regresar el turno al usuario
        setSuccessNotif(`¡ES TU TURNO! La Máquina jugó [${chosenCard.name}].`);
        setTimeout(() => setSuccessNotif(null), 4000);
      }, 1100);
    }, 1800);
  };

  useEffect(() => {
    if (Object.keys(nodes).length > 0 && hand.length === 0 && opponentHand.length === 0) {
      setIsGameOverModalOpen(true);
    }
  }, [hand, opponentHand, nodes]);

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
    setIsFolderModalOpen(true);
  };

  // GENERADOR DINÁMICO DE POSICIONES Y TOPOLOGÍA DEL CIRCUITO
  const getDynamicLayout = () => {
    // 5 arquetipos topológicos distribuidos por todo el lienzo táctico
    const layouts = [
      // Arquetipo 0: Constelación Zig-Zag (dinámica y fluida)
      [
        { left: 20, top: 50 },
        { left: 36, top: 22 },
        { left: 50, top: 64 },
        { left: 66, top: 24 },
        { left: 81, top: 52 }
      ],
      // Arquetipo 1: Diamante Táctico con Núcleo Central
      [
        { left: 50, top: 44 }, // Centro
        { left: 50, top: 18 }, // Norte
        { left: 22, top: 44 }, // Oeste
        { left: 78, top: 44 }, // Este
        { left: 50, top: 70 }  // Sur
      ],
      // Arquetipo 2: Arco Orbital Cóncavo
      [
        { left: 19, top: 62 },
        { left: 34, top: 32 },
        { left: 50, top: 18 },
        { left: 66, top: 32 },
        { left: 81, top: 62 }
      ],
      // Arquetipo 3: Doble Flanco Asimétrico
      [
        { left: 23, top: 25 },
        { left: 22, top: 65 },
        { left: 50, top: 44 },
        { left: 77, top: 25 },
        { left: 78, top: 65 }
      ],
      // Arquetipo 4: Pentágono Invertido Clásico
      [
        { left: 22, top: 28 },
        { left: 50, top: 18 },
        { left: 78, top: 28 },
        { left: 34, top: 66 },
        { left: 66, top: 66 }
      ]
    ];

    // Seleccionar un arquetipo al azar
    const chosen = layouts[Math.floor(Math.random() * layouts.length)];

    // Aplicar micro-variación orgánica (jitter aleatorio de ±2.5%) para que cada reinicio sea 100% único
    return chosen.map(p => {
      const jitterX = (Math.random() * 5 - 2.5);
      const jitterY = (Math.random() * 5 - 2.5);
      const clampX = Math.max(17, Math.min(83, p.left + jitterX));
      const clampY = Math.max(17, Math.min(73, p.top + jitterY));
      return {
        left: `${clampX.toFixed(1)}%`,
        top: `${clampY.toFixed(1)}%`
      };
    });
  };

  // HELPER: Configurar tablero y cartas con enlace 1-a-1 y posiciones dinámicas
  const applyBoardData = (boardData, folderName) => {
    if (!boardData.cards || boardData.cards.length === 0) return false;

    setBoardInfo({
      title: boardData.title || `Simulacro: ${folderName ? folderName.toUpperCase() : 'EXAMEN'}`,
      theme: folderName || 'Estudio'
    });

    const dynamicPositions = getDynamicLayout();
    const availableColors = ['cyan', 'emerald', 'yellow', 'purple', 'rose', 'indigo', 'blue'];
    const availableShapes = ['hexagon', 'circle', 'diamond', 'octagon', 'squircle'];
    const availableIcons = ['database', 'codigo', 'cpu', 'terminal', 'book'];

    // Barajar paleta de colores para este juego específico
    const shuffledColors = [...availableColors].sort(() => Math.random() - 0.5);
    const chosenShape = availableShapes[Math.floor(Math.random() * availableShapes.length)];

    const newNodes = {};
    // Cada nodo se liga 1-a-1 con su carta correcta (por índice)
    boardData.nodes.forEach((n, idx) => {
      const matchingCard = boardData.cards[idx];
      const cardId = matchingCard?.id || `card_${idx + 1}`;
      newNodes[n.id] = {
        id: n.id,
        domain: 'estudio',
        icon: availableIcons[idx % availableIcons.length],
        label: n.label || matchingCard?.concept_name || `Concepto ${idx + 1}`,
        question: n.question || n.description || '¿A qué concepto corresponde este principio?',
        hint: n.description || 'Revisa el contenido del documento de esta carpeta.',
        pos: dynamicPositions[idx % dynamicPositions.length],
        color: shuffledColors[idx % shuffledColors.length],
        shape: chosenShape,
        placedCard: null,
        lockedByOpponent: false,
        correctCardId: cardId
      };
    });

    const newCards = boardData.cards.map((c, i) => ({
      id: c.id,
      name: c.concept_name,
      cost: c.points_multiplier || '1x',
      type: shuffledColors[i % shuffledColors.length],
      sourceType: 'document',
      domain: 'estudio',
      content: c.content,
      matchesNodeId: boardData.nodes[i]?.id
    }));

    // Barajar aleatoriamente la mano del jugador para que no sigan el mismo orden que los nodos
    const shuffledHand = [...newCards].sort(() => Math.random() - 0.5);
    shuffledHand.forEach((c, i) => {
      c.rotation = (i - 2) * 4;
      c.zIndex = i + 1;
    });

    // Resetear todo el estado de la partida
    setNodes(newNodes);
    setHand(shuffledHand);
    setOpponentHand(newCards.map((c, i) => ({ ...c, id: `opp_${c.id}_${i}` })));
    setEnergy(maxEnergy);
    setTurn(1);
    setPlayerScore(0);
    setOpponentScore(0);
    setIsCapySad(false);
    setSelectedNodeForQuestion(null);
    setSelectedCardForDetail(null);
    setFlyingCard(null);
    setIsGameOverModalOpen(false);
    return true;
  };

  // 2. REINICIAR Y GENERAR NUEVAS PREGUNTAS DESDE LA CARPETA ACTUAL
  const handleRestartWithNewQuestions = async () => {
    if (!activeFolder) {
      setSuccessNotif('Selecciona una carpeta en el baúl para iniciar el juego.');
      setIsFolderModalOpen(true);
      return;
    }

    // Limpieza total e inmediata del tablero para reflejar el reinicio completo
    setNodes({});
    setHand([]);
    setOpponentHand([]);
    setPlayerScore(0);
    setOpponentScore(0);
    setTurn(1);
    setIsCapySad(false);
    setSelectedNodeForQuestion(null);
    setSelectedCardForDetail(null);
    setFlyingCard(null);
    setIsGameOverModalOpen(false);
    setIsGeneratingArena(true);
    setSuccessNotif(`⚡ Reiniciando partida: reubicando nodos y formulando NUEVAS preguntas desde [${activeFolder.name}]...`);

    try {
      const res = await fetch(`/api/v1/folders/${activeFolder.id}/generate-game?force=true`, {
        method: 'POST'
      });

      if (res.ok) {
        const boardData = await res.json();
        const success = applyBoardData(boardData, activeFolder.name);
        if (success) {
          setSuccessNotif(`✅ ¡Tablero, ubicaciones y preguntas completamente renovados para [${activeFolder.name}]!`);
          setTimeout(() => setSuccessNotif(null), 4000);
          // Iniciar con la relajación Zen antes de la nueva ronda
          setIsRelaxModalOpen(true);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setSuccessNotif(`⚠️ ${err.detail || 'No se pudieron generar nuevas preguntas.'}`);
        setTimeout(() => setSuccessNotif(null), 5000);
      }
    } catch (e) {
      console.warn('Error regenerando preguntas:', e);
      setSuccessNotif('⚠️ Error de conexión al generar nuevas preguntas.');
      setTimeout(() => setSuccessNotif(null), 5000);
    } finally {
      setIsGeneratingArena(false);
    }
  };

  // 3. REINTENTAR GENÉRICO (Regenera preguntas de la carpeta actual)
  const handleRetryGame = () => {
    setIsGameOverModalOpen(false);
    handleRestartWithNewQuestions();
  };

  const handleNodeClick = (nodeId) => {
    const node = nodes[nodeId];
    if (node) {
      setSelectedNodeForQuestion(node);
    }
  };

  const handleDragEnd = (cardId, info) => {
    // REGLA ESTRICTA: No permitir mover ni jugar cartas si no es tu turno
    if (!isActualTurn) {
      setSuccessNotif(
        gameConfig.mode === '1v1'
          ? `TURNO NO DISPONIBLE: Actualmente juega el rival en vivo.`
          : `TURNO NO DISPONIBLE: La máquina está calculando su jugada.`
      );
      setTimeout(() => setSuccessNotif(null), 3000);
      return;
    }

    const dropPoint = { x: info.point.x, y: info.point.y };

    // 1. Detectar si se soltó sobre el BASURERO DE CARTAS (Lado Derecho)
    const trashEl = document.getElementById('card-trash-bin');
    if (trashEl) {
      const tRect = trashEl.getBoundingClientRect();
      if (
        dropPoint.x >= tRect.left &&
        dropPoint.x <= tRect.right &&
        dropPoint.y >= tRect.top &&
        dropPoint.y <= tRect.bottom
      ) {
        const discardedCard = hand.find((c) => c.id === cardId);
        setHand((prev) => prev.filter((c) => c.id !== cardId));
        setSuccessNotif(`Carta [${discardedCard?.name || 'descartada'}] enviada a incineración.`);
        setTimeout(() => setSuccessNotif(null), 2500);
        return;
      }
    }

    // 2. Detectar si se soltó sobre una pregunta del tablero
    const elements = document.querySelectorAll('[data-node-id]');

    let matchedNodeId = null;
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (
        dropPoint.x >= rect.left &&
        dropPoint.x <= rect.right &&
        dropPoint.y >= rect.top &&
        dropPoint.y <= rect.bottom
      ) {
        matchedNodeId = el.getAttribute('data-node-id');
      }
    });

    if (matchedNodeId && nodes[matchedNodeId]) {
      const targetNode = nodes[matchedNodeId];
      if (targetNode.lockedByOpponent) {
        setSuccessNotif(`Este nodo ya fue reclamado por tu rival.`);
        setTimeout(() => setSuccessNotif(null), 2500);
        return;
      }

      const card = hand.find((c) => c.id === cardId);
      if (card) {
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // REGLA ESTRICTA: La carta debe ser la respuesta exacta al nodo
        // Cada carta tiene 1 solo nodo correcto (matchesNodeId)
        // Cada nodo acepta 1 sola carta correcta (correctCardId)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const hasStrictMatch = targetNode.correctCardId && card.matchesNodeId;
        const isCorrectCard = hasStrictMatch
          ? (targetNode.correctCardId === card.id || card.matchesNodeId === matchedNodeId)
          : true; // Si no hay enlace definido, aceptar (modo fallback sin IA)

        if (!isCorrectCard) {
          // ❌ CARTA INCORRECTA: Capibara se pone triste y llora de verdad con sonidos de emoción
          setIsCapySad(true);
          setWrongCardShake(cardId);
          capyAudio.playCapyCry(); // 😭 Sonido realista de sollozos y gemidos de la Capibara
          setSuccessNotif(`❌ ¡Respuesta incorrecta! La carta "${card.name}" no responde esa pregunta. Capi llora desconsolado... 😭`);
          setTimeout(() => {
            setIsCapySad(false);
            setWrongCardShake(null);
            setSuccessNotif(null);
          }, 3200);
          return; // La carta regresa a la mano sin moverse
        }

        // ✅ CARTA CORRECTA: Colocar en el nodo y sonido feliz
        capyAudio.playCapyHappy(); // ✨ Sonido alegre y victorioso de la Capibara
        const multiplier = card.cost ? parseInt(card.cost) || 1 : 1;
        const pointsEarned = 10 * multiplier;
        setNodes((prev) => ({
          ...prev,
          [matchedNodeId]: { ...prev[matchedNodeId], placedCard: card },
        }));
        setHand((prev) => prev.filter((c) => c.id !== cardId));
        setPlayerScore((prev) => prev + pointsEarned);
        setSuccessNotif(`✅ ¡Correcto! "${card.name}" responde esta pregunta. +${pointsEarned} pts`);
        setTimeout(() => setSuccessNotif(null), 3000);

        if (gameConfig.mode === '1v1') {
          sendMove({
            action: 'card_placed',
            node_id: matchedNodeId,
            card_id: cardId,
            card_name: card.name,
            card_type: card.type,
            card_domain: card.domain
          });
        } else if (gameConfig.mode === 'solo') {
          // En modo máquina, la IA responde con una jugada después de tu movimiento
          setTimeout(() => {
            triggerAiTurn();
          }, 1200);
        }
      }
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

          const newCards = boardData.cards.map((c, i) => ({
            id: c.id,
            name: c.concept_name,
            cost: c.points_multiplier || '1x',
            type: i % 2 === 0 ? 'cyan' : 'emerald',
            sourceType: 'document',
            domain: 'estudio',
            rotation: (i - 2) * 4,
            zIndex: i + 1,
            content: c.content,
            matchesNodeId: boardData.nodes[i]?.id  // <-- enlace inverso 1-a-1
          }));

            setNodes(newNodes);
            setHand(newCards);
            setOpponentHand(newCards.map((c, i) => ({ ...c, id: `opp_${c.id}_${i}` })));
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
      
      {/* -1. PANEL PREVIO DE CARPETAS Y ASIGNATURAS DE ESTUDIO */}
      <StudyFolderManagerModal
        isOpen={isFolderModalOpen}
        onSelectFolder={async (folder) => {
          setActiveFolder(folder);
          setIsFolderModalOpen(false);

          if (folder.playDirectly && folder.documents && folder.documents.filter(d => !d.isUploading).length > 0) {
            // Generar juego usando EXCLUSIVAMENTE el texto de los documentos de ESTA carpeta
            // El backend recupera el texto extraído desde MongoDB (aislado por folder_id)
            setIsGeneratingArena(true);
            setSuccessNotif(`⚡ Generando simulacro de examen con los materiales de [${folder.name}]...`);

            try {
              const res = await fetch(`/api/v1/folders/${folder.id}/generate-game`, {
                method: 'POST'
              });

              if (res.ok) {
                const boardData = await res.json();
                const success = applyBoardData(boardData, folder.name);

                if (success) {
                  setSuccessNotif(`✅ Simulacro generado con ${boardData.cards.length} reactivos de [${folder.name}]`);
                  setTimeout(() => setSuccessNotif(null), 5000);

                  // PASO 3: Tras analizar y generar el juego, aparece la actividad de respiración Zen!
                  setIsRelaxModalOpen(true);
                }
              } else {
                const err = await res.json().catch(() => ({}));
                setSuccessNotif(`⚠️ ${err.detail || 'No se pudo generar el simulacro.'}`);
                setTimeout(() => setSuccessNotif(null), 6000);
                setIsFolderModalOpen(true);
              }
            } catch (e) {
              console.warn('Error generando juego desde carpeta:', e);
              setIsFolderModalOpen(true);
            } finally {
              setIsGeneratingArena(false);
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
        onClose={() => setSelectedNodeForQuestion(null)}
      />

      {/* 3.1 MODAL DE DETALLE DE CARTA (VISUALIZACIÓN DE RESPUESTA) */}
      <CardDetailModal
        isOpen={!!selectedCardForDetail}
        card={selectedCardForDetail}
        matchingNode={
          selectedCardForDetail
            ? Object.values(nodes).find(n => n.label === selectedCardForDetail.name || n.correctCardId === selectedCardForDetail.id)
            : null
        }
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
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Siguiente Desafío (Nuevas Preguntas)</span>
                </button>

                <button
                  onClick={handleTerminateGame}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Terminar Partida</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ENTORNO 3D */}
      <div className="absolute right-0 top-1/4 w-36 h-96 bg-gradient-to-l from-amber-700/80 via-amber-900/60 to-transparent border-l-4 border-amber-500/40 rounded-l-3xl pointer-events-none transform skew-y-6 opacity-80" />
      <div className="absolute right-24 bottom-1/3 w-48 h-28 bg-gradient-to-l from-cyan-400/40 via-cyan-400/10 to-transparent transform -rotate-12 blur-lg pointer-events-none" />

      {/* GUARDIÁN TÁCTICO 3D ZEN ANIMADO / LLORA CUANDO LA CARTA ES INCORRECTA */}
      <div className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center select-none pointer-events-auto">
        <motion.div
          animate={isCapySad ? {
            // Animación de llanto: sacudida intensa + caída emocional
            x: [0, -10, 10, -10, 10, -8, 8, -5, 5, 0],
            y: [0, 4, 0, 4, 0],
            rotateZ: [-5, 5, -5, 5, 0],
            scale: [1, 0.95, 1]
          } : {
            y: [0, -12, 0],
            rotateZ: [-2.5, 2.5, -2.5],
            scale: [1, 1.04, 1]
          }}
          transition={isCapySad ? {
            duration: 0.6,
            repeat: 3,
            ease: 'easeInOut'
          } : {
            repeat: Infinity,
            duration: 3.8,
            ease: 'easeInOut'
          }}
          whileHover={!isCapySad ? { scale: 1.2, rotate: 6 } : {}}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            if (isCapySad) {
              capyAudio.playCapyCry();
            } else {
              capyAudio.playCapyHappy();
            }
          }}
          className="relative group cursor-pointer flex flex-col items-center"
          title={isCapySad ? '¡Carta incorrecta! Capi llora... 😭 (Haz clic para escucharlo)' : 'Capibara Zen 3D - Tu Guardián Táctico (Haz clic para escuchar su saludo feliz)'}
        >
          {/* Base Holográfica: roja si triste, cyan si zen */}
          <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full blur-md animate-pulse pointer-events-none transition-colors duration-500 ${
            isCapySad ? 'bg-rose-400/40' : 'bg-cyan-400/25'
          }`} />
          <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-3 border rounded-full pointer-events-none transition-colors duration-500 ${
            isCapySad ? 'border-rose-400/90 shadow-[0_0_15px_#f43f5e]' : 'border-cyan-400/70 shadow-[0_0_15px_#22d3ee]'
          }`} />

          {/* Figura 3D del Capibara: temblor de llanto, borde rojo y filtro si está triste */}
          <motion.div 
            animate={isCapySad ? {
              x: [-2, 2, -3, 3, -1, 1, 0],
              y: [0, 3, 0, 4, 0],
              rotate: [-1.5, 1.5, -1, 1, 0]
            } : {}}
            transition={isCapySad ? { repeat: Infinity, duration: 0.28, ease: "easeInOut" } : {}}
            className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 transition-all duration-300 ${
              isCapySad
                ? 'border-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.85)] ring-4 ring-rose-500/30'
                : 'border-emerald-400 shadow-[0_0_35px_rgba(52,211,153,0.6)] group-hover:border-cyan-300 group-hover:shadow-[0_0_45px_rgba(34,211,238,0.8)]'
            } bg-[#0c1420]`}
          >
            <img
              src={capybara3dImg}
              alt={isCapySad ? 'Capibara Triste' : 'Capibara 3D'}
              className={`w-full h-full object-cover object-center transition-all duration-300 ${
                isCapySad ? 'brightness-70 saturate-75 contrast-125' : 'group-hover:scale-110'
              }`}
            />
            {/* Overlay de tristeza con cascada de lágrimas animadas */}
            {isCapySad && (
              <div className="absolute inset-0 flex flex-col items-center justify-between p-2 pointer-events-none z-20">
                {/* Gotas de lágrimas que caen a borbotones */}
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
                  <motion.div
                    animate={{ y: [0, 35], opacity: [0.9, 0] }}
                    transition={{ repeat: Infinity, duration: 0.40, delay: 0.22, ease: 'easeIn' }}
                    className="absolute top-1/3 left-[38%] w-1 h-3 rounded-full bg-sky-200"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-rose-950/80 via-transparent to-black/30 pointer-events-none" />
                <span className="text-white text-xl animate-bounce drop-shadow-md">😭</span>
              </div>
            )}
            {/* Brillo dinámico de iluminación */}
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/50 via-transparent to-white/20 pointer-events-none" />
            {!isCapySad && <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-cyan-300 animate-ping" />}
            {isCapySad && <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping" />}
          </motion.div>

          {/* Badge 3D: rojo si triste */}
          <div className={`mt-2 px-3 py-0.5 rounded-full bg-slate-900/95 shadow-lg text-center backdrop-blur-sm border transition-colors duration-500 ${
            isCapySad ? 'border-rose-500/80' : 'border-emerald-400/80'
          }`}>
            <span className={`text-[9px] font-black font-mono tracking-wider flex items-center gap-1 justify-center transition-colors duration-300 ${
              isCapySad ? 'text-rose-300' : 'text-emerald-300'
            }`}>
              {isCapySad
                ? <><AlertTriangle className="w-2.5 h-2.5 text-rose-400" /> CAPI TRISTE</>
                : <><Sparkles className="w-2.5 h-2.5 text-amber-400" /> CAPI 3D ZEN</>}
            </span>
          </div>

          {/* Globo de Diálogo Flotante */}
          {isCapySad ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap bg-rose-950/95 border border-rose-500 text-rose-200 text-[8.5px] font-mono font-bold px-2.5 py-1.5 rounded-xl shadow-2xl pointer-events-none flex flex-col items-center gap-0.5 z-50"
            >
              <span>😭 ¡Esa no era la respuesta!</span>
              <span className="text-[7.5px] text-rose-300/80">Cada carta va en su nodo correcto</span>
            </motion.div>
          ) : (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/95 border border-cyan-400 text-cyan-200 text-[8.5px] font-mono font-bold px-2.5 py-1 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>¡Tú puedes, enfócate y gana!</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* BASURERO INCINERADOR 3D TÁCTICO */}
      <div 
        id="card-trash-bin"
        className="absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center pointer-events-auto select-none"
      >
        <motion.div
          animate={{
            y: [0, -6, 0],
            boxShadow: [
              '0 0 20px rgba(244,63,94,0.4)',
              '0 0 35px rgba(239,68,68,0.8)',
              '0 0 20px rgba(244,63,94,0.4)'
            ]
          }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          whileHover={{ scale: 1.15 }}
          className="relative w-22 sm:w-26 h-28 sm:h-32 rounded-2xl overflow-hidden border-2 border-rose-500 bg-[#0d131f] flex flex-col items-center justify-between p-1.5 group transition-all duration-300 cursor-pointer"
        >
          {/* Imagen Render 3D del Incinerador de Basura */}
          <div className="relative w-full h-20 sm:h-22 rounded-xl overflow-hidden border border-rose-500/40">
            <img 
              src={trashBin3dImg} 
              alt="Basurero 3D" 
              className="w-full h-full object-cover object-center group-hover:scale-115 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-rose-500/20 pointer-events-none" />
            <div className="absolute top-1 right-1 flex items-center gap-0.5 bg-rose-950/90 border border-rose-400/60 px-1 rounded text-[7px] text-rose-300 font-bold font-mono">
              <Flame className="w-2.5 h-2.5 text-rose-400 animate-bounce" /> INCINERAR
            </div>
          </div>

          {/* Instrucción de arrastre */}
          <span className="text-[7.5px] font-mono font-bold text-rose-200 text-center uppercase tracking-tight py-0.5 px-1 rounded bg-slate-950/90 border border-slate-700/80 w-full flex items-center justify-center gap-1">
            <Trash2 className="w-2.5 h-2.5 text-rose-400" />
            <span>Arrastra y bota</span>
          </span>
        </motion.div>
      </div>

      {/* BARRA SUPERIOR CON CONTROLES LIMPIOS Y TURNO */}
      <div className="absolute top-2.5 right-3 z-40 flex items-center gap-2">
        
        {/* BANNER DE TURNO EN VIVO (PARA 1v1 Y MÁQUINA) */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 backdrop-blur-md shadow-xl transition-all ${
          gameConfig.mode === '1v1' && !isOpponentConnected
            ? 'bg-slate-900/90 border-amber-500/60 text-amber-300'
            : isActualTurn
            ? 'bg-emerald-950/95 border-emerald-400 text-emerald-100 shadow-[0_0_20px_rgba(52,211,153,0.5)] animate-pulse'
            : 'bg-rose-950/90 border-rose-500/80 text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
        }`}>
          {gameConfig.mode === '1v1' && !isOpponentConnected ? (
            <>
              <Hourglass className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span className="text-[11px] font-bold font-mono">
                Sala <strong className="text-white underline">{gameConfig.roomId}</strong>: Esperando Rival...
              </span>
            </>
          ) : isActualTurn ? (
            <>
              <PlayCircle className="w-4 h-4 text-emerald-400 animate-bounce" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                  <CircleDot className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400" />
                  <span>TU TURNO</span>
                </span>
                <span className="text-[8px] text-emerald-100/80 font-mono hidden sm:inline">
                  Arrastra una carta al circuito o basurero
                </span>
              </div>
            </>
          ) : (
            <>
              <Hourglass className="w-3.5 h-3.5 text-rose-400 animate-spin" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-300 flex items-center gap-1">
                  <CircleDot className="w-2.5 h-2.5 text-rose-400 fill-rose-400" />
                  <span>{gameConfig.mode === 'solo' ? 'TURNO MÁQUINA' : 'TURNO RIVAL'}</span>
                </span>
                <span className="text-[8px] text-rose-200/80 font-mono hidden sm:inline">
                  {gameConfig.mode === 'solo' ? 'Analizando...' : 'Jugando...'}
                </span>
              </div>
            </>
          )}
        </div>

        {/* BOTÓN PANEL DE CARPETAS DE ESTUDIO */}
        <button
          onClick={() => setIsFolderModalOpen(true)}
          className="px-3.5 py-2 rounded-2xl bg-[#1a2638] hover:bg-[#23334d] border-2 border-amber-400/70 text-amber-300 text-xs font-black transition-all flex items-center gap-2 shadow-[0_3px_0_#92400e] active:translate-y-0.5 active:shadow-none cursor-pointer"
          title="Ver baúl de carpetas y seleccionar material"
        >
          <FolderIcon className="w-4 h-4 text-amber-400" />
          <span className="hidden md:inline">
            {activeFolder ? `Carpeta: ${activeFolder.name}` : 'Carpetas'}
          </span>
          <span className="md:hidden">Carpetas</span>
        </button>

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

      {/* Marcadores de Puntuación */}
      <div className="absolute left-4 top-3 z-30 flex items-center gap-2.5">
        <div className="flex items-center gap-2 bg-slate-900/90 border border-amber-400/80 px-2.5 py-1 rounded-xl shadow-lg" title="Tu Puntuación">
          <span className="text-[10px] font-mono text-amber-300 font-bold uppercase">Puntos:</span>
          <span className="text-sm font-black font-mono text-amber-400">{playerScore}</span>
        </div>
        {gameConfig.mode === '1v1' && (
          <div className="flex items-center gap-2 bg-slate-900/90 border border-cyan-400/80 px-2.5 py-1 rounded-xl shadow-lg" title="Puntuación Rival">
            <span className="text-[10px] font-mono text-cyan-300 font-bold uppercase">Rival:</span>
            <span className="text-sm font-black font-mono text-cyan-400">{opponentScore}</span>
          </div>
        )}
      </div>

      {/* Indicadores Inferiores Izquierdos */}
      <div className="absolute bottom-6 left-6 z-40 flex flex-col gap-2">
        <div className="flex items-center gap-2 bg-[#101726]/90 border border-amber-400/60 px-3 py-1.5 rounded-xl shadow-lg" title="Cartas restantes en tu mazo">
          <Layers className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono font-bold text-amber-300">
            {String(hand.length).padStart(2, '0')}
          </span>
        </div>
        <div className="flex items-center gap-2 bg-[#101726]/90 border border-cyan-400/60 px-3 py-1.5 rounded-xl shadow-lg" title="Cartas restantes del rival">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold text-cyan-300">
            {String(opponentHand.length).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* MANO DEL CONTRINCANTE AL FRENTE (COMPACTA Y NO INVASIVA) */}
      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex flex-col items-center">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-700 shadow-md backdrop-blur-sm mb-0.5">
          <span className="text-[7.5px] font-black uppercase tracking-wider text-rose-400 font-mono flex items-center gap-1">
            {gameConfig.mode === 'solo' ? (
              <>
                <Bot className="w-2.5 h-2.5 text-rose-400" />
                <span>MÁQUINA</span>
              </>
            ) : (
              <>
                <Swords className="w-2.5 h-2.5 text-rose-400" />
                <span>RIVAL</span>
              </>
            )}
          </span>
          <span className="text-[7.5px] font-bold text-slate-400 font-mono">
            ({opponentHand.length})
          </span>
          {isAiThinking && (
            <span className="text-[7px] text-amber-300 animate-pulse font-mono font-bold">
              [PENSANDO...]
            </span>
          )}
        </div>

        {/* Cartas miniatura del contrincante más compactas para no tapar el título */}
        <div className="flex items-center justify-center -space-x-5 hover:-space-x-2 transition-all duration-300">
          {opponentHand.map((card, idx) => (
            <motion.div
              key={card.id || `opp_${idx}`}
              initial={{ y: -15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.5 }}
              className="relative w-9 sm:w-11 h-13 sm:h-15 rounded-lg border border-rose-500/80 bg-gradient-to-b from-slate-900 via-rose-950/70 to-slate-950 p-0.5 shadow-[0_2px_8px_rgba(244,63,94,0.3)] flex flex-col justify-between"
              style={{
                transform: `rotate(${(idx - (opponentHand.length - 1) / 2) * 4}deg)`,
                zIndex: idx + 10
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[5.5px] font-mono font-bold text-rose-300 bg-rose-950/90 px-0.5 rounded truncate max-w-[28px]">
                  {card.domain?.substring(0, 3).toUpperCase() || 'RIV'}
                </span>
                <span className="text-[6px] font-black text-amber-400 font-mono">
                  {card.cost || '+1'}
                </span>
              </div>

              <div className="w-full h-5 rounded bg-black/50 border border-rose-500/30 flex items-center justify-center">
                <span className="text-rose-400 font-bold text-[7px]">
                  {gameConfig.mode === 'solo' ? 'IA' : '1v1'}
                </span>
              </div>

              <div className="w-full py-0.2 px-0.5 rounded bg-slate-950/90 text-center">
                <p className="text-[5.5px] font-bold text-slate-200 truncate uppercase">
                  {card.name}
                </p>
              </div>
            </motion.div>
          ))}
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

      {/* TABLERO ISOMÉTRICO 3D CON PREGUNTAS DISTRIBUIDAS POR TODO EL ESPACIO */}
      <div className="isometric-board-container flex-1 flex items-center justify-center w-full my-auto px-2">
        <div className="table-3d relative w-[95%] max-w-6xl h-[460px] lg:h-[490px] rounded-3xl bg-[#1e2532] border-8 border-[#3b475a] shadow-[0_25px_50px_rgba(0,0,0,0.95)] p-3 sm:p-4 flex flex-col justify-between">
          
          <div className="absolute top-2 left-1/4 w-3 h-3 rounded-full bg-yellow-400 shadow-[0_0_10px_#facc15]" />
          <div className="absolute top-2 right-1/4 w-3 h-3 rounded-full bg-yellow-400 shadow-[0_0_10px_#facc15]" />

          {/* Indicadores de Energía */}
          <div className="absolute -top-5 -left-5 z-20 flex flex-col items-center">
            <div className="w-12 h-12 bg-amber-500 border-2 border-amber-300 rounded-2xl flex items-center justify-center text-xl font-black text-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.6)]">
              {maxEnergy}
            </div>
            <div className="w-3 h-20 bg-slate-900 border border-amber-500/50 rounded-full mt-1 overflow-hidden p-0.5">
              <div className="w-full bg-amber-400 rounded-full h-3/4 shadow-[0_0_8px_#facc15]" />
            </div>
          </div>

          <div className="absolute -bottom-4 -left-4 z-20 flex flex-col items-center">
            <div className="w-3 h-16 bg-slate-900 border border-cyan-400/50 rounded-full mb-1 overflow-hidden p-0.5">
              <div className="w-full bg-cyan-400 rounded-full h-2/3 shadow-[0_0_8px_#22d3ee]" />
            </div>
            <div className="w-12 h-12 bg-cyan-500 border-2 border-cyan-300 rounded-2xl flex items-center justify-center text-xl font-black text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.6)]">
              {energy}
            </div>
          </div>

          {/* Botón FINALIZAR TURNO */}
          <div className="absolute -bottom-4 -right-4 z-30">
            <button 
              onClick={handleEndTurn}
              className={`w-28 h-14 rounded-2xl border-2 shadow-lg flex flex-col items-center justify-center font-black text-xs tracking-wider transition-all active:scale-95 ${
                gameConfig.mode === '1v1' && isOpponentConnected && !isMyTurn
                  ? 'bg-slate-900/90 border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
                  : 'bg-[#142332] hover:bg-[#1a3148] border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.5)]'
              }`}
            >
              <span>FINALIZAR TURNO</span>
              <span className="text-[10px] text-cyan-400">
                {gameConfig.mode === '1v1' ? (isMyTurn ? 'Pasar Turno' : 'Turno Rival') : `Turno ${turn}`}
              </span>
            </button>
          </div>

          {/* PANTALLA TÁCTICA CON DISTRIBUCIÓN ESPACIAL ABIERTA */}
          <div className="w-full h-full rounded-2xl bg-[#2a3443] border border-slate-600/70 p-3 sm:p-4 flex flex-col justify-between relative overflow-hidden">
            
            <div className="flex items-center justify-between border-b border-slate-600/50 pb-2 z-10">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                  {boardInfo?.theme || 'Circuito de Estudio'}
                </span>
                <h1 className="text-sm sm:text-base font-black tracking-widest text-slate-200 font-mono uppercase">
                  {boardInfo?.title || 'Tablero de Aprendizaje'}
                </h1>
              </div>

              {gameConfig.mode === '1v1' && isOpponentConnected && (
                <div className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-900/90 border border-slate-600 shadow-md">
                  {isMyTurn ? (
                    <span className="text-emerald-400">● TU TURNO DE JUGADA</span>
                  ) : (
                    <span className="text-rose-400">● TURNO DEL RIVAL</span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">
                  Haz clic en cualquier nodo para ver su pregunta
                </span>
              </div>
            </div>

            {/* ÁREA CENTRAL DE NODOS DISTRIBUIDOS LIBREMENTE */}
            <div className="relative flex-1 w-full h-full my-2 flex items-center justify-center">
              {Object.keys(nodes).length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center text-center p-6 rounded-3xl bg-slate-900/60 border border-slate-700/60 max-w-md backdrop-blur-sm shadow-xl"
                >
                  <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center text-cyan-300 mb-4 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                    <UploadCloud className="w-8 h-8 text-cyan-400 animate-bounce" />
                  </div>
                  <h3 className="text-base font-bold text-slate-100 font-mono uppercase tracking-wide">
                    Circuito Sin Inicializar
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">
                    Sube tus documentos (PDF, audio, imágenes o YouTube) para que Gemini y el motor RAG construyan las preguntas, conceptos y nodos en tiempo real.
                  </p>
                  <button
                    onClick={() => setIsFolderModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.4)] active:scale-95 transition-all cursor-pointer"
                  >
                    <FolderIcon className="w-4 h-4" />
                    <span>Mis Carpetas de Estudio</span>
                  </button>
                </motion.div>
              ) : (
                <>
                  {/* Conexiones de fondo estilo constelación / circuito neuronal conectando los nodos activos */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                    {Object.values(nodes).map((node, i, arr) => {
                      const nextNode = arr[(i + 1) % arr.length];
                      if (!node.pos || !nextNode.pos) return null;
                      return (
                        <line
                          key={`line-${node.id}-${nextNode.id}`}
                          x1={node.pos.left}
                          y1={node.pos.top}
                          x2={nextNode.pos.left}
                          y2={nextNode.pos.top}
                          stroke="#22d3ee"
                          strokeWidth="2"
                          strokeDasharray="4 4"
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

      {/* MANO DE CARTAS EN ABANICO CON ICONOS CONTEXTUALES */}
      <div className={`relative w-full flex items-center justify-center pb-2 z-40 transition-all duration-300 ${
        !isActualTurn
          ? 'opacity-50 grayscale-[35%] pointer-events-none cursor-not-allowed' 
          : 'opacity-100'
      }`}>
        <div className="flex items-center justify-center -space-x-8 sm:-space-x-10 hover:space-x-2 transition-all duration-300">
          {hand.map((card) => (
            <GameCard
              key={card.id}
              id={card.id}
              name={card.name}
              cost={card.cost}
              type={card.type}
              sourceType={card.sourceType}
              domain={card.domain}
              rotation={card.rotation}
              zIndex={card.zIndex}
              isDraggable={isActualTurn}
              onDragEnd={handleDragEnd}
              onClick={() => setSelectedCardForDetail(card)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
