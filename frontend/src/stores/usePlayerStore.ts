import { create } from 'zustand';

interface PlayerState {
  playerId: string;
  playerName: string;
  score: number;
  setPlayerId: (id: string) => void;
  setPlayerName: (name: string) => void;
  setScore: (score: number) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  playerId: '',
  playerName: '',
  score: 0,
  setPlayerId: (playerId) => set({ playerId }),
  setPlayerName: (playerName) => set({ playerName }),
  setScore: (score) => set({ score }),
}));
