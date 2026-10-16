import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.database import db_manager
from app.websockets.manager import connection_manager

logger = logging.getLogger("hubzy.ws")
router = APIRouter(tags=["Multiplayer"])


@router.websocket("/ws/arena/{room_id}/{client_id}")
async def websocket_arena_endpoint(websocket: WebSocket, room_id: str, client_id: str):
    """
    WebSocket bidireccional para batallas 1v1.
    Sincroniza presencia, asigna primer turno y alterna turnos en vivo.
    """
    await connection_manager.connect(websocket, room_id, client_id)

    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            logger.info(f"Evento recibido en sala {room_id} de {client_id}: {action}")

            if action == "end_turn":
                await connection_manager.switch_turn(room_id, client_id)
                continue

            payload_to_broadcast = {
                "sender_id": client_id,
                "room_id": room_id,
                **data
            }

            if action in ("card_placed", "game_over") and db_manager.db is not None:
                try:
                    await db_manager.db["game_sessions"].insert_one({
                        "room_id": room_id,
                        "client_id": client_id,
                        "action": action,
                        "data": data
                    })
                except Exception as dbe:
                    logger.warning(f"Error guardando movimiento en MongoDB: {dbe}")

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
