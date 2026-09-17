import logging
import random
from typing import Dict, List, Any
from fastapi import WebSocket

logger = logging.getLogger("hubzy.websockets")

class ConnectionManager:
    """
    Patrón Singleton para administrar conexiones WebSocket agrupadas por salas (room_id).
    Controla asignación de turnos en vivo, presencia y sincronización bidireccional.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ConnectionManager, cls).__new__(cls)
            cls._instance.active_rooms: Dict[str, List[Dict[str, Any]]] = {}
            cls._instance.room_states: Dict[str, Dict[str, Any]] = {}
        return cls._instance

    async def connect(self, websocket: WebSocket, room_id: str, client_id: str):
        """Acepta la conexión y administra el inicio de turno en vivo cuando ambos se conectan."""
        await websocket.accept()
        
        # Limpiar cualquier conexión previa con el mismo client_id si refrescó
        if room_id not in self.active_rooms:
            self.active_rooms[room_id] = []
        else:
            self.active_rooms[room_id] = [
                c for c in self.active_rooms[room_id] if c["client_id"] != client_id
            ]

        self.active_rooms[room_id].append({
            "websocket": websocket,
            "client_id": client_id
        })
        
        total_players = len(self.active_rooms[room_id])
        logger.info(f"==> Cliente {client_id} conectado a sala [{room_id}]. Total en sala: {total_players}")

        # Si ya hay 2 o más jugadores en la sala (1 vs 1 en vivo)
        if total_players >= 2:
            players = [c["client_id"] for c in self.active_rooms[room_id]]
            starter_client_id = players[0] # El primer jugador que creó la sala empieza
            
            self.room_states[room_id] = {
                "current_turn_client_id": starter_client_id,
                "turn_number": 1
            }

            # Enviar mensaje de juego iniciado a TODOS en la sala sin exclusión
            logger.info(f"==> ¡SALA COMPLETA! Iniciando partida en {room_id}. Primer turno: {starter_client_id}")
            await self.broadcast_to_room(room_id, {
                "type": "game_started",
                "room_id": room_id,
                "total_players": total_players,
                "starter_client_id": starter_client_id,
                "current_turn_client_id": starter_client_id,
                "turn_number": 1,
                "message": "¡Ambos jugadores conectados! La batalla comienza."
            })
        else:
            # Solo está 1 jugador, esperando rival
            await websocket.send_json({
                "type": "waiting_opponent",
                "room_id": room_id,
                "client_id": client_id,
                "total_players": 1
            })

    def disconnect(self, websocket: WebSocket, room_id: str):
        """Remueve la conexión de la sala de forma segura."""
        if room_id in self.active_rooms:
            disconnected_client = None
            for conn in self.active_rooms[room_id]:
                if conn["websocket"] == websocket:
                    disconnected_client = conn["client_id"]
                    break

            self.active_rooms[room_id] = [
                conn for conn in self.active_rooms[room_id] if conn["websocket"] != websocket
            ]
            
            logger.info(f"Cliente {disconnected_client} desconectado de sala {room_id}")

            if not self.active_rooms[room_id]:
                del self.active_rooms[room_id]
                if room_id in self.room_states:
                    del self.room_states[room_id]
                logger.info(f"Sala {room_id} eliminada por estar vacía.")

            return disconnected_client
        return None

    async def switch_turn(self, room_id: str, caller_client_id: str):
        """Pasa el turno al otro jugador en la sala."""
        if room_id in self.active_rooms and len(self.active_rooms[room_id]) >= 2:
            players = [c["client_id"] for c in self.active_rooms[room_id]]
            next_turn_id = players[1] if caller_client_id == players[0] else players[0]
            
            curr_state = self.room_states.get(room_id, {"turn_number": 1})
            curr_state["current_turn_client_id"] = next_turn_id
            curr_state["turn_number"] = curr_state.get("turn_number", 1) + 1
            self.room_states[room_id] = curr_state

            await self.broadcast_to_room(room_id, {
                "type": "turn_switched",
                "room_id": room_id,
                "current_turn_client_id": next_turn_id,
                "turn_number": curr_state["turn_number"],
                "previous_player_id": caller_client_id
            })

    async def broadcast_to_room(self, room_id: str, message: dict, exclude_client: str = None):
        """Retransmite un mensaje JSON a todos los clientes de una sala."""
        if room_id not in self.active_rooms:
            return

        dead_connections = []
        for connection in list(self.active_rooms[room_id]):
            if exclude_client and connection["client_id"] == exclude_client:
                continue

            try:
                await connection["websocket"].send_json(message)
            except Exception as e:
                logger.warning(f"Error enviando mensaje a {connection['client_id']}: {e}")
                dead_connections.append(connection["websocket"])

        for dead_ws in dead_connections:
            self.disconnect(dead_ws, room_id)

    def get_room_players_count(self, room_id: str) -> int:
        return len(self.active_rooms.get(room_id, []))


connection_manager = ConnectionManager()
