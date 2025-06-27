'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [joinId, setJoinId] = useState('');

  const createRoom = () => {
    const id = Math.random().toString(36).substring(2, 8);
    router.push(`/room/${id}`);
  };

  const joinRoom = () => {
    if (joinId) router.push(`/room/${joinId}`);
  };

  return (
    <div>
      <h1>Intro Quiz</h1>
      <button onClick={createRoom}>Create Room</button>
      <div>
        <input
          placeholder="Room ID"
          value={joinId}
          onChange={(e) => setJoinId(e.target.value)}
        />
        <button onClick={joinRoom}>Join Room</button>
      </div>
    </div>
  );
}
