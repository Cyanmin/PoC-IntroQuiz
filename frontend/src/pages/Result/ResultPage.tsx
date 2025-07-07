import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useNavigate } from 'react-router-dom';

type Ranking = { playerName: string; score: number };

const ResultPage: React.FC = () => {
  const { messages } = useWebSocket();
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // quizEnded 経由で rankings を取得
    const last = messages[messages.length - 1];
    if (last && last.type === 'quizEnded' && Array.isArray(last.rankings)) {
      setRankings(last.rankings as Ranking[]);
    }
  }, [messages]);

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', padding: 24, border: '1px solid #ccc', borderRadius: 8 }}>
      <h1>ランキング</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>順位</th>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>プレイヤー名</th>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'right' }}>スコア</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((r, i) => (
            <tr key={r.playerName}>
              <td>{i + 1}</td>
              <td>{r.playerName}</td>
              <td style={{ textAlign: 'right' }}>{r.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={() => navigate('/')} style={{ width: '100%' }}>
        もう一度遊ぶ
      </button>
    </div>
  );
};

export default ResultPage;
