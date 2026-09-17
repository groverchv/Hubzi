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
  CircleDot
} from 'lucide-react';
import GameCard from '../components/GameCard';
import ArcadeNode from '../components/ArcadeNode';
import ResourceModal from '../components/ResourceModal';
import QuestionModal from '../components/QuestionModal';
import GameModeModal from '../components/GameModeModal';
import { useArenaSocket } from '../hooks/useArenaSocket';
import { MULTI_DOMAIN_PRESETS, DOMAIN_CARDS_PRESETS, createRandomizedNodes } from '../utils/multiDomainPresets';
import capybara3dImg from '../assets/capybara_3d.jpg';
import trashBin3dImg from '../assets/trash_bin_3d.jpg';

export default function ArcadeArena() {
  const [presetIndex, setPresetIndex] = useState(0);
  
  // Tablero activo
  const activePreset = MULTI_DOMAIN_PRESETS[presetIndex % MULTI_DOMAIN_PRESETS.length];

  // Nodos con posicionamiento libre distribuido en la pantalla y formas aleatorias
  const [nodes, setNodes] = useState(() => {
    const randomized = createRandomizedNodes(activePreset.nodes);
    const map = {};
    randomized.forEach((n) => {
      map[n.id] = { ...n, placedCard: null, lockedByOpponent: false };
    });
    return map;
  });

  const [hand, setHand] = useState(() => DOMAIN_CARDS_PRESETS[0]);
  const [opponentHand, setOpponentHand] = useState(() => DOMAIN_CARDS_PRESETS[0]);
  const [flyingCard, setFlyingCard] = useState(null); // { card, targetPos, isOpponent }
  const [energy, setEnergy] = useState(3);
  const [maxEnergy, setMaxEnergy] = useState(4);
  const [turn, setTurn] = useState(1);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isSoloPlayerTurn, setIsSoloPlayerTurn] = useState(true); // Control estricto de turno contra la máquina
  const [successNotif, setSuccessNotif] = useState(null);

  // Modales
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [selectedNodeForQuestion, setSelectedNodeForQuestion] = useState(null);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState(false);

  // Configuración de Sala (Modo Solitario por defecto)
  const [gameConfig, setGameConfig] = useState({
    mode: 'solo',
    roomId: 'sala-solo',
    isHost: true,
  });

  const [playerScore, setPlayerScore] = useState(10);
  const [opponentScore, setOpponentScore] = useState(12);

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
      applyPreset(lastOpponentMove.preset_index || 0);
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
    if (hand.length === 0 && opponentHand.length === 0) {
      setIsGameOverModalOpen(true);
    }
  }, [hand, opponentHand]);

  const handleSelectGameMode = ({ mode, roomId, isHost, needsUpload }) => {
    setGameConfig({ mode, roomId, isHost });
    setIsModeModalOpen(false);

    if (needsUpload) {
      setIsResourceModalOpen(true);
    } else {
      setSuccessNotif(mode === '1v1' 
        ? `Conectado a la sala ${roomId}. Sincronizando con el rival...`
        : `Partida contra la Máquina lista. ¡Comienza el juego!`
      );
      setTimeout(() => setSuccessNotif(null), 3500);
    }
  };

  // 1. TERMINAR PARTIDA (Reinicia partida en modo solitario)
  const handleTerminateGame = () => {
    setIsGameOverModalOpen(false);
    setIsModeModalOpen(false);
    setPlayerScore(10);
    setOpponentScore(12);
    setTurn(1);
    applyPreset(0);
  };

  // 2. REINTENTAR PARTIDA CON ÁREA Y PREGUNTAS DISTRIBUIDAS DIFERENTES (Derecho, Contaduría, Finanzas, etc.)
  const applyPreset = (index) => {
    const pIndex = index % MULTI_DOMAIN_PRESETS.length;
    setPresetIndex(pIndex);
    const newPreset = MULTI_DOMAIN_PRESETS[pIndex];

    const randomized = createRandomizedNodes(newPreset.nodes);
    const map = {};
    randomized.forEach((n) => {
      map[n.id] = { ...n, placedCard: null, lockedByOpponent: false };
    });

    const presetCards = DOMAIN_CARDS_PRESETS[pIndex] || DOMAIN_CARDS_PRESETS[0];

    setNodes(map);
    setHand(presetCards);
    setOpponentHand(presetCards.map((c, i) => ({ ...c, id: `opp_${c.id}_${i}` })));
    setFlyingCard(null);
    setEnergy(maxEnergy);
    setTurn(1);
    setIsGameOverModalOpen(false);
    setSuccessNotif(`Desafío cargado: ${newPreset.theme}. Preguntas reconfiguradas.`);
    setTimeout(() => setSuccessNotif(null), 4000);
  };

  const handleRetryGame = () => {
    const nextIndex = (presetIndex + 1) % MULTI_DOMAIN_PRESETS.length;
    applyPreset(nextIndex);

    if (gameConfig.mode === '1v1') {
      sendMove({ action: 'game_reset', preset_index: nextIndex });
    }
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
        setNodes((prev) => ({
          ...prev,
          [matchedNodeId]: { ...prev[matchedNodeId], placedCard: card },
        }));
        setHand((prev) => prev.filter((c) => c.id !== cardId));
        setPlayerScore((prev) => prev + 10);
        setSuccessNotif(`¡Respuesta aceptada! ${card.name} colocado en ${targetNode.label}`);
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
  const handleProcessMaterials = (data) => {
    const textSample = (data.text || '') + ' ' + (data.files.map(f => f.name).join(' '));
    const lower = textSample.toLowerCase();

    // 0: Tecnología, 1: Derecho, 2: Contaduría, 3: Finanzas, 4: Medicina, 5: Educación
    let detectedPreset = 0;
    if (/(ley|derecho|abogad|juez|penal|codigo civil|demanda|jurisprudencia|constituc|delito)/i.test(lower)) {
      detectedPreset = 1; // Derecho
    } else if (/(contab|asiento|partida doble|balance general|niif|ifrs|sat|tribut|auditor|impuesto|iva)/i.test(lower)) {
      detectedPreset = 2; // Contaduría Pública
    } else if (/(finanz|ebitda|wacc|invers|accion|bono|mercado|bolsa|flujo de caja|banco|tesoreria)/i.test(lower)) {
      detectedPreset = 3; // Finanzas Corporativas
    } else if (/(medic|salud|enferm|farmac|clinica|paciente|fisiolog|anatom|biolog|virus|cardi)/i.test(lower)) {
      detectedPreset = 4; // Medicina y Salud
    } else if (/(educ|pedagog|ensenanza|aprendizaje|piaget|vygotsky|filosof|historia|literatura)/i.test(lower)) {
      detectedPreset = 5; // Educación y Humanidades
    } else {
      detectedPreset = 0; // Tecnología por defecto
    }

    applyPreset(detectedPreset);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col justify-between select-none">
      
      {/* 1. MODAL DE INICIO */}
      <GameModeModal
        isOpen={isModeModalOpen}
        onSelectMode={handleSelectGameMode}
      />

      {/* 2. MODAL DE MATERIALES */}
      <ResourceModal
        isOpen={isResourceModalOpen}
        onClose={() => setIsResourceModalOpen(false)}
        onProcessMaterials={handleProcessMaterials}
      />

      {/* 3. MODAL DE PREGUNTA */}
      <QuestionModal
        isOpen={!!selectedNodeForQuestion}
        node={selectedNodeForQuestion}
        onClose={() => setSelectedNodeForQuestion(null)}
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
                Dominaste el área de: <strong className="text-cyan-300">{activePreset.theme}</strong>.
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
                  onClick={handleRetryGame}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Siguiente Desafío</span>
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

      {/* GUARDIÁN TÁCTICO 3D ZEN ANIMADO */}
      <div className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center select-none pointer-events-auto">
        <motion.div
          animate={{ 
            y: [0, -12, 0], 
            rotateZ: [-2.5, 2.5, -2.5],
            scale: [1, 1.04, 1]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 3.8, 
            ease: 'easeInOut' 
          }}
          whileHover={{ scale: 1.2, rotate: 6 }}
          whileTap={{ scale: 0.92 }}
          className="relative group cursor-pointer flex flex-col items-center"
          title="Capibara Zen 3D - Tu Guardián Táctico"
        >
          {/* Base Holográfica 3D Iluminada */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-cyan-400/25 rounded-full blur-md animate-pulse pointer-events-none" />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-3 border border-cyan-400/70 rounded-full shadow-[0_0_15px_#22d3ee] pointer-events-none" />

          {/* Figura 3D del Capibara en alta resolución */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 border-emerald-400 shadow-[0_0_35px_rgba(52,211,153,0.6)] bg-[#0c1420] transition-all duration-300 group-hover:border-cyan-300 group-hover:shadow-[0_0_45px_rgba(34,211,238,0.8)]">
            <img 
              src={capybara3dImg} 
              alt="Capibara 3D" 
              className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
            />
            {/* Brillo dinámico de iluminación */}
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/50 via-transparent to-white/20 pointer-events-none" />
            <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-cyan-300 animate-ping" />
          </div>

          {/* Badge 3D */}
          <div className="mt-2 px-3 py-0.5 rounded-full bg-slate-900/95 border border-emerald-400/80 shadow-lg text-center backdrop-blur-sm">
            <span className="text-[9px] font-black text-emerald-300 font-mono tracking-wider flex items-center gap-1 justify-center">
              <Sparkles className="w-2.5 h-2.5 text-amber-400" /> CAPI 3D ZEN
            </span>
          </div>

          {/* Globo de Diálogo Flotante */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/95 border border-cyan-400 text-cyan-200 text-[8.5px] font-mono font-bold px-2.5 py-1 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>¡Tú puedes, enfócate y gana!</span>
          </div>
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

        {/* BOTÓN REINTENTAR (CAMBIA EL ÁREA Y LAS PREGUNTAS) */}
        <button
          onClick={handleRetryGame}
          className="px-2.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-400 text-emerald-300 text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)] active:scale-95"
          title="Cambiar desafío y preguntas"
        >
          <RotateCcw className="w-3 h-3" />
          <span className="hidden md:inline">Reintentar (Nueva Área)</span>
          <span className="md:hidden">Área</span>
        </button>

        {/* BOTÓN TERMINAR PARTIDA (REGRESA AL INICIO) */}
        <button 
          onClick={handleTerminateGame}
          className="px-2.5 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500 text-rose-200 text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(244,63,94,0.3)] active:scale-95"
          title="Terminar partida actual y volver a la selección de modo"
        >
          <LogOut className="w-3 h-3 text-rose-400" />
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
        <div className="flex items-center gap-2 bg-[#101726]/90 border border-amber-400/60 px-3 py-1.5 rounded-xl shadow-lg">
          <Layers className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono font-bold text-amber-300">08</span>
        </div>
        <div className="flex items-center gap-2 bg-[#101726]/90 border border-cyan-400/60 px-3 py-1.5 rounded-xl shadow-lg">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold text-cyan-300">05</span>
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
                  {activePreset.theme}
                </span>
                <h1 className="text-sm sm:text-base font-black tracking-widest text-slate-200 font-mono uppercase">
                  {activePreset.title}
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
            <div className="relative flex-1 w-full h-full my-2">
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
            </div>

            {/* Luces Neón de Piso */}
            <div className="flex items-center justify-center gap-12 mt-1">
              <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee] animate-pulse" />
              <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee] animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* NOTIFICACIÓN FLOTANTE */}
      <AnimatePresence>
        {successNotif && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-2.5 rounded-2xl bg-slate-900/95 border-2 border-cyan-400 text-cyan-200 text-xs font-bold shadow-2xl flex items-center gap-2.5 backdrop-blur-md"
          >
            <Check className="w-4 h-4 text-cyan-300" />
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
            />
          ))}
        </div>
      </div>
    </div>
  );
}
