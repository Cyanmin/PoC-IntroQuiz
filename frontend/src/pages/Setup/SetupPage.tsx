import React, { useState, useCallback, useEffect } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';

const SetupPage: React.FC = () => {
  const { send, messages } = useWebSocket();
  const [roomId, setRoomId] = useState('');
  const [roomName, setRoomName] = useState('');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [players, setPlayers] = useState<string[]>([]);
  const [isRoomCreated, setIsRoomCreated] = useState(false);
  const [isPlaylistSet, setIsPlaylistSet] = useState(false);
  const [error, setError] = useState('');

  // ルーム作成
  const handleCreateRoom = useCallback(() => {
    setError('');
    if (!roomId || !roomName) {
      setError('Room IDとルーム名を入力してください');
      return;
    }
    send({ action: 'createRoom', roomId, roomName });
  }, [roomId, roomName, send]);

  // プレイリスト設定
  const handleSetPlaylist = useCallback(() => {
    setError('');
    if (!playlistUrl) {
      setError('プレイリストURLを入力してください');
      return;
    }
    send({ action: 'setPlaylist', roomId, playlistUrl });
  }, [playlistUrl, roomId, send]);

  // ゲームスタート
  const handleStartQuiz = useCallback(() => {
    send({ action: 'startQuiz', roomId });
  }, [roomId, send]);

  // 集計
  const handleEndQuiz = useCallback(() => {
    send({ action: 'endQuiz', roomId });
  }, [roomId, send]);

  // メッセージ監視
  useEffect(() => {
    if (messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.type === 'createRoomResult') {
        if (last.status === 'ok') {
          setIsRoomCreated(true);
        } else {
          setError(typeof last.message === 'string' ? last.message : 'ルーム作成に失敗しました');
        }
      } else if (last.type === 'setPlaylistResult') {
        if (last.status === 'ok') {
          setIsPlaylistSet(true);
        } else {
          setError(typeof last.message === 'string' ? last.message : 'プレイリスト設定に失敗しました');
        }
      } else if (last.type === 'playerListUpdate') {
        if (Array.isArray(last.players)) {
          setPlayers(last.players);
        }
      } else if (last.type === 'error') {
        setError(typeof last.message === 'string' ? last.message : 'エラーが発生しました');
      } else if (last.type === 'endQuizResult' && last.status === 'ok') {
        // 集計完了時の遷移はここで実装（例: /result へ）
        window.location.href = '/result';
      }
    }
  }, [messages]);

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', padding: 24, border: '1px solid #ccc', borderRadius: 8 }}>
      <h1>セットアップ（ホスト専用）</h1>
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Room ID"
          value={roomId}
          onChange={e => setRoomId(e.target.value)}
          style={{ width: '100%', marginBottom: 8 }}
          disabled={isRoomCreated}
        />
        <input
          type="text"
          placeholder="ルーム名"
          value={roomName}
          onChange={e => setRoomName(e.target.value)}
          style={{ width: '100%' }}
          disabled={isRoomCreated}
        />
        <button onClick={handleCreateRoom} style={{ width: '100%', marginTop: 8 }} disabled={isRoomCreated}>
          ルーム作成
        </button>
      </div>
      <div style={{ marginBottom: 16 }}>
        <h3>現在のプレイヤー一覧</h3>
        <ul>
          {players.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </div>
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="YouTubeプレイリストURL"
          value={playlistUrl}
          onChange={e => setPlaylistUrl(e.target.value)}
          style={{ width: '100%' }}
          disabled={!isRoomCreated || isPlaylistSet}
        />
        <button onClick={handleSetPlaylist} style={{ width: '100%', marginTop: 8 }} disabled={!isRoomCreated || isPlaylistSet}>
          プレイリストを設定
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleStartQuiz} disabled={!isRoomCreated || !isPlaylistSet} style={{ flex: 1 }}>
          ゲームスタート
        </button>
        <button onClick={handleEndQuiz} disabled={!isRoomCreated} style={{ flex: 1 }}>
          集計
        </button>
      </div>
      {error && <div style={{ color: 'red', marginTop: 16 }}>{error}</div>}
    </div>
  );
};

export default SetupPage;
