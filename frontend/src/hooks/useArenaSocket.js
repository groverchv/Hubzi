import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom Hook para manejar conexión WebSocket de baja latencia en la Arena 1v1 en vivo.
 * Administra presencia, quién tiene el turno y sincronización en milisegundos.
 */
export function useArenaSocket(roomId, clientId) {
  const [isConnected, setIsConnected] = useState(false);
  const [isOpponentConnected, setIsOpponentConnected] = useState(false);
  const [lastOpponentMove, setLastOpponentMove] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  
  // Estado de Turnos en Vivo
  const [currentTurnClientId, setCurrentTurnClientId] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [turnNumber, setTurnNumber] = useState(1);
  const [gameStarted, setGameStarted] = useState(false);

  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    // Si no hay sala o es modo solo, no conectar websocket
    if (!roomId || !clientId || roomId === 'sala-solo') {
      setIsConnected(false);
      setIsOpponentConnected(false);
      return;
    }

    const host = window.location.hostname || 'localhost';
    const wsUrl = `ws://${host}:8001/ws/arena/${roomId}/${clientId}`;

    console.log(`[WS] Conectando a: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setConnectionStatus('connected');
      console.log(`[WS] Conectado a la sala [${roomId}] (Client: ${clientId})`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[WS] Mensaje recibido:', data);

        // 1. Partida iniciada cuando se conectan ambos jugadores
        if (data.type === 'game_started') {
          setIsOpponentConnected(true);
          setGameStarted(true);
          setCurrentTurnClientId(data.current_turn_client_id);
          const myTurn = data.current_turn_client_id === clientId;
          setIsMyTurn(myTurn);
          setTurnNumber(data.turn_number || 1);
          console.log(`[WS] Partida iniciada. ¿Es mi turno? ${myTurn} (Turno de: ${data.current_turn_client_id})`);
        } 
        // 2. Cambio de turno emitido por el servidor
        else if (data.type === 'turn_switched') {
          setIsOpponentConnected(true);
          setGameStarted(true);
          setCurrentTurnClientId(data.current_turn_client_id);
          const myTurn = data.current_turn_client_id === clientId;
          setIsMyTurn(myTurn);
          setTurnNumber(data.turn_number || 1);
          console.log(`[WS] Turno cambiado. ¿Es mi turno? ${myTurn}`);
        }
        // 3. Notificación cuando entra el rival
        else if (data.type === 'player_joined') {
          setIsOpponentConnected(true);
          if (data.total_players >= 2) {
            setGameStarted(true);
          }
        } 
        // 4. Notificación cuando sale el rival
        else if (data.type === 'player_left') {
          setIsOpponentConnected(false);
          setGameStarted(false);
        }

        // 5. Movimiento de juego del rival
        if (data.action === 'card_placed' || data.action === 'board_completed') {
          setIsOpponentConnected(true);
          setLastOpponentMove(data);
          // Si el rival colocó carta, el turno pasa inmediatamente a este jugador
          setIsMyTurn(true);
        }
      } catch (err) {
        console.error('[WS] Error parseando mensaje entrante:', err);
      }
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
      setIsOpponentConnected(false);

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 2500);
    };

    ws.onerror = (err) => {
      console.error('[WS] Error en la conexión WebSocket:', err);
      ws.close();
    };
  }, [roomId, clientId]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const sendMove = useCallback((moveData) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(moveData));
    } else {
      console.warn('[WS] No se puede enviar el movimiento, socket no está abierto.');
    }
  }, []);

  return {
    isConnected,
    isOpponentConnected,
    lastOpponentMove,
    connectionStatus,
    currentTurnClientId,
    isMyTurn,
    turnNumber,
    gameStarted,
    sendMove,
  };
}
