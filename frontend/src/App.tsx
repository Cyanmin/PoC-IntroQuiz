import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TopPage from './pages/Top/TopPage';
import RoomPage from './pages/Room/RoomPage';
import SetupPage from './pages/Setup/SetupPage';
import ResultPage from './pages/Result/ResultPage';
import './App.css';

// Zustandストア例（実装は別ファイルで）
// import { usePlayerStore } from './stores/usePlayerStore';
// import { useRoomStore } from './stores/useRoomStore';

// WebSocket接続管理は各ページでuseWebSocketを利用

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/top" replace />} />
        <Route path="/top" element={<TopPage />} />
        <Route path="/room" element={<RoomPage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/result" element={<ResultPage />} />
        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/top" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
