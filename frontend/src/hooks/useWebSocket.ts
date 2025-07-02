import { useEffect, useRef, useState } from 'react';

export type WSMessage =
  | { type: 'joinRoomAck'; roomId: string; playerId: string }
  | { type: 'playlistFetched'; playlistId: string; videos: string[] }
  | { type: 'quizStarted'; startTimestamp: number }
  | { type: string; [key: string]: unknown };

export type WebSocketState = {
  connected: boolean;
  send: (msg: object) => void;
  messages: WSMessage[];
};

export const useWebSocket = (): WebSocketState => {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<WSMessage[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(import.meta.env.VITE_WEBSOCKET_ENDPOINT);
    socketRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessages((prev) => [...prev, data]);
      } catch (e) {
        console.error('Failed to parse WS message', e);
      }
    };

    return () => ws.close();
  }, []);

  const send = (msg: object) => {
    socketRef.current?.send(JSON.stringify(msg));
  };

  return { connected, send, messages };
};
