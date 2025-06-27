'use client';
import { useEffect, useState } from 'react';
import { connectRoom } from '../../../lib/ws-client';

export default function RoomPage({ params }: { params: { id: string } }) {
  const [players, setPlayers] = useState<string[]>([]);
  const [answer, setAnswer] = useState('');
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = connectRoom(params.id, setPlayers, setAnswer);
    setSocket(ws);
    return () => ws.close();
  }, [params.id]);

  const sendQuestion = () => socket?.send(JSON.stringify({ type: 'question' }));
  const sendAnswer = () => socket?.send(JSON.stringify({ type: 'answer' }));

  return (
    <div>
      <h2>Room: {params.id}</h2>
      <button onClick={sendQuestion}>Ask</button>
      <button onClick={sendAnswer}>Answer</button>
      <div>
        <h3>Players</h3>
        <ul>
          {players.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
      {answer && <p>First Answer: {answer}</p>}
    </div>
  );
}
