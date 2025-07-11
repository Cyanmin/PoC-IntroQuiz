import { useState, useCallback, useEffect } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useNavigate } from 'react-router-dom';
import { useRoomStore } from '../../stores/useRoomStore';
import { usePlayerStore } from '../../stores/usePlayerStore';

const TopPage: React.FC = () => {
  const { send, messages } = useWebSocket();
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  // Generate a playerId only once when the component mounts
  const [playerId] = useState(() => crypto.randomUUID());
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setRoomIdStore = useRoomStore((state) => state.setRoomId);
  const setPlayerIdStore = usePlayerStore((state) => state.setPlayerId);

  // joinRoomResultやerrorを監視
  const handleJoin = useCallback(() => {
    setError('');
    if (!roomId || !playerName) {
      setError('Room IDとプレイヤー名を入力してください');
      return;
    }
    setRoomIdStore(roomId);
    setPlayerIdStore(playerId);
    send({ action: 'joinRoom', roomId, playerName, playerId });
  }, [roomId, playerName, playerId, send, setRoomIdStore, setPlayerIdStore]);

  // メッセージ監視
  useEffect(() => {
    if (messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.type === 'joinRoomResult') {
        if (last.status === 'ok') {
          navigate('/room');
        } else if (last.status === 'error') {
          setError(typeof last.message === 'string' ? last.message : '不明なエラーが発生しました');
        }
      } else if (last.type === 'error') {
        setError(typeof last.message === 'string' ? last.message : '不明なエラーが発生しました');
      }
    }
  }, [messages, navigate]);

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', padding: 24, border: '1px solid #ccc', borderRadius: 8 }}>
      <h1>ルーム参加</h1>
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Room ID"
          value={roomId}
          onChange={e => setRoomId(e.target.value)}
          style={{ width: '100%', marginBottom: 8 }}
        />
        <input
          type="text"
          placeholder="プレイヤー名"
          value={playerName}
          onChange={e => setPlayerName(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>
      <button onClick={handleJoin} style={{ width: '100%' }}>ルームに参加</button>
      {error && <div style={{ color: 'red', marginTop: 16 }}>{error}</div>}
    </div>
  );
};

export default TopPage;
