import React from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  return <h1>Intro Quiz</h1>;
}

const rootEl = document.getElementById('root')!;
createRoot(rootEl).render(<App />);
