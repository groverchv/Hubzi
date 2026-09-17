import logging
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.schemas.schemas import GameBoardResponse, GenerateBoardRequest
from app.services.ai_service import ai_service
from app.builders.builder import GameBoardBuilder
from app.websockets.manager import connection_manager

logger = logging.getLogger("hubzy.main")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API para Hubzy (SynapseHub) - Gamificación EdTech anti-estrés con Gemini, RAG y WebSockets.",
    version=settings.VERSION,
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", status_code=status.HTTP_200_OK, tags=["System"])
async def health_check():
    """Endpoint básico de monitoreo de salud del sistema."""
    return {
        "status": "healthy",
        "project": "Hubzy API",
        "team": "SynapseHub",
        "mode": "zen"
    }


@app.post(
    "/api/v1/arena/generate",
    response_model=GameBoardResponse,
    status_code=status.HTTP_200_OK,
    tags=["Arena"]
)
async def generate_arena_board(payload: GenerateBoardRequest):
    """
    Recibe un texto denso de estudio, invoca a Gemini para extraer 5 conceptos clave
    y utiliza el Patrón Builder para ensamblar el GameBoardResponse final.
    """
    try:
        ai_data = ai_service.extract_concepts_from_text(payload.text)
        
        concepts = ai_data.get("concepts", [])
        if not concepts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudieron identificar conceptos válidos en el texto provisto."
            )

        builder = GameBoardBuilder(title=ai_data.get("title", "Tablero de Aprendizaje"))
        
        for idx, item in enumerate(concepts, start=1):
            card_id = f"card_{idx}"
            node_id = f"node_{idx}"
            
            builder.add_card(
                card_id=card_id,
                concept_name=item.get("concept_name", f"Concepto {idx}"),
                content=item.get("content", ""),
                points_multiplier=item.get("points_multiplier", "1x")
            )
            
            builder.add_node(
                node_id=node_id,
                correct_card_id=card_id,
                description=item.get("node_hint", f"Pista para el concepto {idx}")
            )

        return builder.build()

    except ValueError as ve:
        logger.warning(f"Error de formato IA: {ve}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except RuntimeError as re:
        logger.error(f"Error en comunicación con LLM: {re}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(re)
        )
    except Exception as ex:
        logger.error(f"Error inesperado procesando arena: {ex}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error inesperado al generar el tablero de juego."
        )


# ==========================================
# WEBSOCKET MULTIPLAYER 1v1 ARENA EN VIVO
# ==========================================
@app.websocket("/ws/arena/{room_id}/{client_id}")
async def websocket_arena_endpoint(websocket: WebSocket, room_id: str, client_id: str):
    """
    Endpoint WebSocket bidireccional para batallas 1v1.
    Sincroniza presencia, asigna primer turno y alterna turnos en vivo.
    """
    await connection_manager.connect(websocket, room_id, client_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            logger.info(f"Evento recibido en sala {room_id} de {client_id}: {action}")

            # Si el jugador presiona END TURN, alternar el turno en la sala
            if action == "end_turn":
                await connection_manager.switch_turn(room_id, client_id)
                continue

            # Para movimientos de cartas y respuestas
            payload_to_broadcast = {
                "sender_id": client_id,
                "room_id": room_id,
                **data
            }

            await connection_manager.broadcast_to_room(
                room_id=room_id,
                message=payload_to_broadcast,
                exclude_client=client_id
            )

    except WebSocketDisconnect:
        disconnected_id = connection_manager.disconnect(websocket, room_id)
        logger.info(f"Desconexión limpia de {disconnected_id} de sala {room_id}")
        
        await connection_manager.broadcast_to_room(room_id, {
            "type": "player_left",
            "client_id": disconnected_id,
            "room_id": room_id,
            "total_players": connection_manager.get_room_players_count(room_id)
        })
    except Exception as e:
        logger.error(f"Error en WebSocket para {client_id} en sala {room_id}: {e}")
        connection_manager.disconnect(websocket, room_id)
