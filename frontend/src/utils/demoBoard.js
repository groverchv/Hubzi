// Tablero DEMO local — se juega sin subir documentos ni llamar a la IA.
// Se usa desde el baúl vacío ("Probar con documento de ejemplo") para que
// la primera partida sea inmediata. Formato idéntico al de generate-game.
export const DEMO_BOARD = {
  title: "El Sistema Solar",
  nodes: [
    {
      id: "demo_node_1",
      label: "Planeta rojo",
      question: "¿Qué planeta es conocido como el planeta rojo?",
      description:
        "Está entre la Tierra y Júpiter; su color viene del óxido de hierro de su superficie.",
    },
    {
      id: "demo_node_2",
      label: "Estrella central",
      question: "¿Qué estrella está en el centro del Sistema Solar?",
      description: "Nos da luz y calor cada día; todos los planetas giran a su alrededor.",
    },
    {
      id: "demo_node_3",
      label: "Planeta de los anillos",
      question: "¿Qué planeta es famoso por sus grandes anillos visibles?",
      description: "Sus anillos están hechos de hielo y roca; es el segundo más grande.",
    },
    {
      id: "demo_node_4",
      label: "El gigante gaseoso",
      question: "¿Cuál es el planeta más grande del Sistema Solar?",
      description: "Es tan grande que cabrían todos los demás planetas dentro de él.",
    },
    {
      id: "demo_node_5",
      label: "Nuestro hogar",
      question: "¿Cuál es el único planeta conocido con vida?",
      description: "El tercer planeta desde el Sol; el 70% de su superficie es agua.",
    },
  ],
  cards: [
    {
      id: "demo_card_1",
      concept_name: "Marte",
      content: "El planeta rojo, cuarto desde el Sol.",
      points_multiplier: "1x",
    },
    {
      id: "demo_card_2",
      concept_name: "El Sol",
      content: "La estrella en el centro del Sistema Solar.",
      points_multiplier: "1x",
    },
    {
      id: "demo_card_3",
      concept_name: "Saturno",
      content: "El planeta de los anillos de hielo y roca.",
      points_multiplier: "1x",
    },
    {
      id: "demo_card_4",
      concept_name: "Júpiter",
      content: "El planeta más grande del Sistema Solar.",
      points_multiplier: "1x",
    },
    {
      id: "demo_card_5",
      concept_name: "La Tierra",
      content: "Nuestro planeta, el único con vida conocida.",
      points_multiplier: "1x",
    },
    {
      id: "demo_card_trap_1",
      concept_name: "Plutón es el más grande",
      content: "¡Carta trampa! Plutón es un planeta enano, no el más grande.",
      points_multiplier: "1x",
      is_distractor: true,
    },
  ],
};

// Carpeta efímera de demostración: existe solo en memoria, no se persiste
// en el backend (is_demo filtra el PUT de progreso).
export const DEMO_FOLDER = {
  id: "hubzy_demo_folder",
  name: "El Sistema Solar (Demo)",
  description: "Documento de ejemplo para probar Hubzy sin subir archivos",
  created_at: null,
  documents: [
    { id: "demo_doc_1", name: "sistema_solar_ejemplo.pdf", size: "—" },
  ],
  games: [],
  islands: [],
  campaign_progress: null,
  is_demo: true,
};
