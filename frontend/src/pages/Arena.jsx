import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RotateCcw, Heart, ArrowRight } from 'lucide-react';
import Card from '../components/Card';
import Node from '../components/Node';

// Mock Data de Biología Celular para el Sprint 2
const INITIAL_NODES = [
  {
    id: 1,
    role: 'Nodo Fuente',
    label: 'Generador de Energía',
    expectedCategory: 'Organelo',
    expectedCardId: 'c1',
    placedCard: null,
  },
  {
    id: 2,
    role: 'Nodo Enlace',
    label: 'Empaquetado y Envíos',
    expectedCategory: 'Transporte',
    expectedCardId: 'c2',
    placedCard: null,
  },
  {
    id: 3,
    role: 'Nodo Control',
    label: 'Centro de Información',
    expectedCategory: 'Núcleo',
    expectedCardId: 'c3',
    placedCard: null,
  },
];

const INITIAL_HAND_CARDS = [
  {
    id: 'c1',
    title: 'Mitocondria',
    category: 'Organelo',
    description: 'Produce la mayor parte del ATP celular a través de la respiración celular.',
  },
  {
    id: 'c2',
    title: 'Aparato de Golgi',
    category: 'Transporte',
    description: 'Modifica, clasifica y empaqueta proteínas para secreción o uso interno.',
  },
  {
    id: 'c3',
    title: 'Núcleo Celular',
    category: 'Núcleo',
    description: 'Alberga el material genético (ADN) y dirige las funciones celulares.',
  },
];

const CAPIGUARA_QUOTES = [
  "¡Tú puedes, respira! No hay prisa, el aprendizaje es un viaje.",
  "La calma es tu mejor aliada para conectar conceptos.",
  "Inhala paz, exhala estrés. Cada carta tiene su lugar natural.",
  "¡Excelente enfoque! Tu mente se expande con serenidad.",
];

export default function Arena() {
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [handCards, setHandCards] = useState(INITIAL_HAND_CARDS);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Manejo de colisión al soltar la carta con el ratón/touch
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

      // Si el nodo está vacío y coincide
      if (targetNode && !targetNode.placedCard && cardToPlace) {
        setNodes((prevNodes) =>
          prevNodes.map((n) =>
            n.id === targetNodeId ? { ...n, placedCard: cardToPlace } : n
          )
        );

        setHandCards((prevCards) => prevCards.filter((c) => c.id !== cardId));
        setQuoteIndex((prev) => (prev + 1) % CAPIGUARA_QUOTES.length);

        // Verificar si se completó el tablero
        const remainingCount = handCards.filter((c) => c.id !== cardId).length;
        if (remainingCount === 0) {
          setCompleted(true);
        }
      }
    }
  };

  const handleReset = () => {
    setNodes(INITIAL_NODES);
    setHandCards(INITIAL_HAND_CARDS);
    setCompleted(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-8 max-w-7xl mx-auto">
      {/* 1. SECCIÓN SUPERIOR: Saludo y Presencia del Capiguara Zen */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-6 bg-white/70 backdrop-blur-md rounded-3xl border border-mint/50 shadow-sm"
      >
        <div className="flex items-center gap-4">
          {/* Avatar del Capiguara con animación suave de respiración */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="w-16 h-16 rounded-2xl bg-oat/60 border-2 border-sage/40 flex items-center justify-center text-3xl shadow-sm cursor-pointer select-none"
            onClick={() => setQuoteIndex((prev) => (prev + 1) % CAPIGUARA_QUOTES.length)}
          >
            🌿🦫
          </motion.div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                Capiguara Zen
              </h2>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-mint text-slate-700">
                Guía Tutor
              </span>
            </div>
            <motion.p
              key={quoteIndex}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs sm:text-sm text-slate-600 mt-0.5 italic"
            >
              "{CAPIGUARA_QUOTES[quoteIndex]}"
            </motion.p>
          </div>
        </div>

        {/* Acciones de la Arena */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-oat/50 hover:bg-oat text-slate-700 text-xs font-semibold transition-all border border-oat-dark/30 shadow-sm active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reiniciar tablero
          </button>
        </div>
      </motion.header>

      {/* 2. SECCIÓN CENTRAL: El Diagrama / Red Neuronal (3 Nodos) */}
      <main className="flex-1 flex flex-col items-center justify-center my-8">
        <div className="text-center mb-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Fase de Integración Lógica
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
            Circuito Biológico Fundamental
          </h1>
        </div>

        {/* Nodos interactivos conectados */}
        <div className="relative flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-10 w-full">
          {nodes.map((node, index) => (
            <React.Fragment key={node.id}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                <Node
                  id={node.id}
                  label={node.label}
                  role={node.role}
                  expectedCategory={node.expectedCategory}
                  placedCard={node.placedCard}
                />
              </motion.div>

              {/* Conectores visuales zen entre nodos */}
              {index < nodes.length - 1 && (
                <div className="hidden md:flex items-center text-sage/40">
                  <ArrowRight className="w-6 h-6 animate-pulse" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Notificación al completar el tablero */}
        <AnimatePresence>
          {completed && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="mt-8 px-6 py-3 bg-mint/50 border border-sage/60 rounded-3xl flex items-center gap-2.5 text-slate-800 text-sm font-semibold shadow-sm"
            >
              <Sparkles className="w-5 h-5 text-sage" />
              <span>¡Tablero sincronizado en completa serenidad! Sin errores.</span>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 3. SECCIÓN INFERIOR: Mano del Jugador con las Cartas */}
      <footer className="w-full bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-mint/50 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">
              Tu mano de cartas ({handCards.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Arrastra cada concepto a su nodo correspondiente
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 min-h-[140px]">
          <AnimatePresence>
            {handCards.length > 0 ? (
              handCards.map((card) => (
                <motion.div
                  key={card.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                >
                  <Card
                    id={card.id}
                    title={card.title}
                    category={card.category}
                    description={card.description}
                    onDragEnd={handleDragEnd}
                  />
                </motion.div>
              ))
            ) : (
              <p className="text-xs text-slate-400 font-medium py-4">
                Has colocado todas tus cartas. ¡Gran trabajo!
              </p>
            )}
          </AnimatePresence>
        </div>
      </footer>
    </div>
  );
}
