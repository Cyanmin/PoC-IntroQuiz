import React, { useState } from 'react';
import { socket } from './socket';

export default function App() {
  const [roomId, setRoomId] = useState<string | null>(null);

  const handleCreate = () => {
    socket.emit('createRoom', (res: { roomId: string }) => {
      setRoomId(res.roomId);
    });
  };

  return (
    <div>
      <h1>Hello Quiz!</h1>
      {roomId ? (
        <p>Room ID: {roomId}</p>
      ) : (
        <button onClick={handleCreate}>Create Room</button>
      )}
    </div>
  );
}
