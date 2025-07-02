import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TopPage from './pages/Top/TopPage';
import RoomPage from './pages/Room/RoomPage';
import ResultPage from './pages/Result/ResultPage';
import './App.css';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TopPage />} />
        <Route path="/room" element={<RoomPage />} />
        <Route path="/result" element={<ResultPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
