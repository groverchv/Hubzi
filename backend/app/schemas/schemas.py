from typing import List, Literal
from pydantic import BaseModel, Field

class CardSchema(BaseModel):
    id: str = Field(..., description="Identificador único de la carta (ej. 'card_1')")
    concept_name: str = Field(..., description="Nombre del concepto clave extraído")
    content: str = Field(..., description="Descripción breve o explicación del concepto")
    points_multiplier: Literal["1x", "2x", "3x"] = Field(
        default="1x", 
        description="Multiplicador de puntos según dificultad del concepto"
    )

class NodeSchema(BaseModel):
    id: str = Field(..., description="Identificador único del nodo en el tablero (ej. 'node_1')")
    correct_card_id: str = Field(..., description="ID de la carta que encaja en este nodo")
    description: str = Field(..., description="Pista o rol del nodo que orienta al estudiante sin revelar el nombre")

class GameBoardResponse(BaseModel):
    id_tablero: str = Field(..., description="UUID o identificador único del tablero de juego")
    title: str = Field(..., description="Título sintético y motivador del tema de estudio")
    nodes: List[NodeSchema] = Field(default_factory=list, description="Lista de nodos receptores del diagrama")
    cards: List[CardSchema] = Field(default_factory=list, description="Mano de cartas que el jugador debe posicionar")

class GenerateBoardRequest(BaseModel):
    text: str = Field(
        ..., 
        min_length=15, 
        description="Texto denso de estudio o fragmento de PDF a procesar"
    )
