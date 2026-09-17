import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Wifi, WifiOff, Lock, Sparkles, Trophy, RotateCcw, ArrowRight } from 'lucide-react';
import Card from '../components/Card';
import Node from '../components/Node';
import { useArenaSocket } from '../hooks/useArenaSocket';

// Tablero de estudio sincronizado para ambos jugadores
const INITIAL_NODES = [
  { id: 1, role: 'Nodo Energía', label: 'Producción de ATP', expectedCategory: 'Organelo', placedCard: null, lockedByOpponent: false },
  { id: 2, role: 'Nodo Transporte', label: 'Empaque de Proteínas', expectedCategory: 'Transporte', placedCard: null, lockedByOpponent: false },
  { id: 3, role: 'Nodo Genético', label: 'Bóveda de ADN', expectedCategory: 'Núcleo', placedCard: null, lockedByOpponent: false },
];

const INITIAL_HAND_CARDS = [
  { id: 'c1', title: 'Mitocondria', category: 'Organelo', description: 'Central de respiración celular y generación de ATP.' },
  { id: 'c2', title: 'Aparato de Golgi', category: 'Transporte', description: 'Empaqueta y secreta vesículas proteicas.' },
  { id: 'c3', title: 'Núcleo Celular', category: 'Núcleo', description: 'Custodia el material genético de la célula.' },
];

export default function MultiplayerArena() {
  const [roomId] = useState('sala-zen-101');
  // Generar ID único para este jugador
  const clientId = useMemo(() => `player_${Math.random().toString(36).substring(2, 7)}`, []);

  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [handCards, setHandCards] = useState(INITIAL_HAND_CARDS);
  const [opponentScore, setOpponentScore] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);

  // Hook WebSocket personalizado
  const { isConnected, isOpponentConnected, lastOpponentMove, sendMove } = useArenaSocket(roomId, clientId);

  // Escuchar movimientos del rival en tiempo real
  useEffect(() => {
    if (!lastOpponentMove) return;

    if (lastOpponentMove.action === 'card_placed') {
      const { node_id, card_name } = lastOpponentMove;
      
      // Bloquear el nodo que el rival completó primero
      setNodes((prevNodes) =>
        prevNodes.map((n) =>
          n.id === Number(node_id)
            ? { ...n, lockedByOpponent: true, opponentClaimedCard: card_name }
            : n
        )
      );

      setOpponentScore((prev) => prev + 100);
    }
  }, [lastOpponentMove]);

  // Manejar jugada local al soltar una carta
  const handleDragEnd = (cardId, info) => {
    const dropPoint = { x: info.point.x, y: info.point.y };
    const nodeElements = document.querySelectorAll('[data-node-id]');

    let targetNodeId = null;
    nodeElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (
        dropPoint.x >= rect.left &&
        dropPoint.x <= rect.right &&
        dropPoint.y >= rect.top &&
        dropPoint.y <= rect.bottom
      ) {
        targetNodeId = parseInt(el.getAttribute('data-node-id'), 10);
      }
    });

    if (targetNodeId) {
      const targetNode = nodes.find((n) => n.id === targetNodeId);
      const cardToPlace = handCards.find((c) => c.id === cardId);

      // Si el nodo no está bloqueado por el rival ni colocado ya
      if (targetNode && !targetNode.placedCard && !targetNode.lockedByOpponent && cardToPlace) {
        // 1. Actualizar estado local
        setNodes((prev) =>
          prev.map((n) => (n.id === targetNodeId ? { ...n, placedCard: cardToPlace } : n))
        );
        setHandCards((prev) => prev.filter((c) => c.id !== cardId));
        setPlayerScore((prev) => prev + 100);

        // 2. Emitir movimiento por WebSocket al rival
        sendMove({
          action: 'card_placed',
          node_id: targetNodeId,
          card_id: cardId,
          card_name: cardToPlace.title,
        });
      }
    }
  };

  const handleReset = () => {
    setNodes(INITIAL_NODES);
    setHandCards(INITIAL_HAND_CARDS);
    setPlayerScore(0);
    setOpponentScore(0);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-8 max-w-7xl mx-auto">
      {/* CABECERA MULTIJUGADOR */}
      <motion.header
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-white/80 backdrop-blur-md rounded-3xl p-4 sm:p-6 border border-mint/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-oat/60 border border-sage/40 flex items-center justify-center text-3xl shadow-sm">
            🦫⚔️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-800">Arena de Batalla Zen 1v1</h1>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-oat text-slate-700 font-mono">
                {roomId}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Conecta los conceptos antes que tu colega sin perder la serenidad.
            </p>
          </div>
        </div>

        {/* Indicadores de Conexión & Marcador */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200/60">
            {/* Estado local */}
            <div className="flex items-center gap-1.5">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-emerald-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-rose-400" />
              )}
              <span className="text-xs font-medium text-slate-600">Tú ({playerScore} pts)</span>
            </div>

            <div className="h-4 w-[1px] bg-slate-200" />

            {/* Estado rival con Capiguara */}
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${isOpponentConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-xs font-medium text-slate-700">
                {isOpponentConnected ? 'Capiguara Rival 🟢' : 'Esperando Rival 🟡'}
              </span>
              <span className="text-xs font-bold text-slate-500">({opponentScore} pts)</span>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="p-2.5 rounded-2xl bg-oat/50 hover:bg-oat text-slate-700 transition-colors border border-oat-dark/30 shadow-sm active:scale-95"
            title="Reiniciar Tablero"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </motion.header>

      {/* ÁREA CENTRAL: DIAGRAMA CON NODOS SINCRONIZADOS */}
      <main className="flex-1 flex flex-col items-center justify-center my-8">
        <div className="text-center mb-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Sincronización en Tiempo Real
          </span>
          <h2 className="text-xl font-bold text-slate-800 mt-1">
            Reclama los Nodos con Serenidad
          </h2>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-8 w-full">
          {nodes.map((node, index) => (
            <React.Fragment key={node.id}>
              <div className="relative">
                {/* Si el rival tomó el nodo primero */}
                {node.lockedByOpponent && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute -top-3 -right-3 z-30 px-3 py-1 bg-amber-100 border border-amber-300 rounded-full shadow-sm flex items-center gap-1 text-[11px] font-semibold text-amber-800"
                  >
                    <Lock className="w-3 h-3 text-amber-600" />
                    Rival reclamó: {node.opponentClaimedCard}
                  </motion.div>
                )}

                <div className={node.lockedByOpponent ? 'opacity-60 pointer-events-none' : ''}>
                  <Node
                    id={node.id}
                    label={node.label}
                    role={node.role}
                    expectedCategory={node.expectedCategory}
                    placedCard={node.placedCard}
                  />
                </div>
              </div>

              {index < nodes.length - 1 && (
                <div className="hidden md:flex items-center text-sage/40">
                  <ArrowRight className="w-5 h-5 animate-pulse" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </main>

      {/* MANO DEL JUGADOR */}
      <footer className="w-full bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-mint/60 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sage" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">
              Tus cartas disponibles ({handCards.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {handCards.length === 0 ? '¡Has colocado todas tus cartas!' : 'Arrastra una carta al nodo libre'}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 min-h-[140px]">
          <AnimatePresence>
            {handCards.map((card) => (
              <motion.div
                key={card.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
              >
                <Card
                  id={card.id}
                  title={card.title}
                  category={card.category}
                  description={card.description}
                  onDragEnd={handleDragEnd}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </footer>
    </div>
  );
}
