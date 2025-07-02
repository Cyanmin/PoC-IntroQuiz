import { useEffect } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useQuizStore } from '../../stores/useQuizStore';
import type { WSIncoming } from '../../types/websocket';

const RoomPage: React.FC = () => {
  const { send, messages } = useWebSocket();
  const {
    roomId,
    playerId,
    startTimestamp,
    setRoomId,
    setPlayerId,
    setStartTimestamp,
  } = useQuizStore();

  useEffect(() => {
    const last = messages[messages.length - 1] as WSIncoming | undefined;
    if (!last) return;
    if (
      last.type === 'joinRoomAck' &&
      typeof last.roomId === 'string' &&
      typeof last.playerId === 'string'
    ) {
      setRoomId(last.roomId);
      setPlayerId(last.playerId);
    } else if (
      last.type === 'quizStarted' &&
      typeof last.startTimestamp === 'number'
    ) {
      setStartTimestamp(last.startTimestamp);
    }
  }, [messages, setPlayerId, setRoomId, setStartTimestamp]);

  const handleJoin = () => {
    if (!roomId || !playerId) return;
    send({ action: 'joinRoom', roomId, playerId });
  };

  const handleStartQuiz = () => {
    if (!roomId) return;
    send({ action: 'startQuiz', roomId });
  };

  const handleBuzz = () => {
    if (!startTimestamp) return;
    const elapsed = performance.now() - startTimestamp;
    send({ action: 'buzz', elapsed });
  };

  return (
    <div>
      <h1>Room Page</h1>
      <input
        type="text"
        placeholder="roomId"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />
      <input
        type="text"
        placeholder="playerId"
        value={playerId}
        onChange={(e) => setPlayerId(e.target.value)}
      />
      <button onClick={handleJoin}>Join Room</button>
      <button onClick={handleStartQuiz}>Start Quiz</button>
      <button onClick={handleBuzz}>Buzz</button>
    </div>
  );
};

export default RoomPage;
