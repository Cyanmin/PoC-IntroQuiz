import React, { useEffect, useState } from 'react';
import { socket } from './socket';

export default function App() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [name, setName] = useState('');
  const [players, setPlayers] = useState<{id:string,name:string}[]>([]);
  const [joined, setJoined] = useState(false);

  const handleCreate = () => {
    socket.emit('createRoom', (res: { roomId: string }) => {
      setRoomId(res.roomId);
    });
  };

  const handleJoin = () => {
    socket.emit('joinRoom', { roomId: joinRoomId, name }, res => {
      if (!res.error) {
        setJoined(true);
      }
    });
  };

  useEffect(() => {
    socket.on('playerJoined', player => {
      setPlayers(prev => [...prev, player]);
      console.log('player joined', player);
    });
  }, []);

  return (
    <div>
      <h1>Hello Quiz!</h1>
      {roomId ? (
        <p>Room ID: {roomId}</p>
      ) : (
        <button onClick={handleCreate}>Create Room</button>
      )}

      <div>
        <input
          placeholder="Room ID"
          value={joinRoomId}
          onChange={e => setJoinRoomId(e.target.value)}
        />
        <input
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <button onClick={handleJoin}>Join Room</button>
      </div>

      {joined && (
        <ul>
          {players.map(p => (
            <li key={p.id}>{p.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
