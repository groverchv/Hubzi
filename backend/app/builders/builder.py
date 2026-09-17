import uuid
from typing import List, Optional
from app.schemas.schemas import CardSchema, NodeSchema, GameBoardResponse

class GameBoardBuilder:
    """
    Patrón Builder para ensamblar paso a paso el objeto GameBoardResponse,
    sus Nodes receptores y su baraja de Cards correspondientes.
    """
    def __init__(self, title: str = "Tablero de Aprendizaje Zen", board_id: Optional[str] = None):
        self._board_id: str = board_id or str(uuid.uuid4())
        self._title: str = title
        self._cards: List[CardSchema] = []
        self._nodes: List[NodeSchema] = []

    def set_title(self, title: str) -> "GameBoardBuilder":
        if title and title.strip():
            self._title = title.strip()
        return self

    def add_card(
        self, 
        card_id: str, 
        concept_name: str, 
        content: str, 
        points_multiplier: str = "1x"
    ) -> "GameBoardBuilder":
        card = CardSchema(
            id=card_id,
            concept_name=concept_name,
            content=content,
            points_multiplier=points_multiplier
        )
        self._cards.append(card)
        return self

    def add_node(
        self, 
        node_id: str, 
        correct_card_id: str, 
        description: str
    ) -> "GameBoardBuilder":
        node = NodeSchema(
            id=node_id,
            correct_card_id=correct_card_id,
            description=description
        )
        self._nodes.append(node)
        return self

    def build(self) -> GameBoardResponse:
        """Construye y valida el objeto GameBoardResponse final."""
        return GameBoardResponse(
            id_tablero=self._board_id,
            title=self._title,
            nodes=self._nodes,
            cards=self._cards
        )
