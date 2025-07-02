import { create } from 'zustand';

interface QuizState {
  roomId: string;
  playerId: string;
  startTimestamp: number | null;
  setRoomId: (id: string) => void;
  setPlayerId: (id: string) => void;
  setStartTimestamp: (ts: number | null) => void;
}

export const useQuizStore = create<QuizState>((set) => ({
  roomId: '',
  playerId: '',
  startTimestamp: null,
  setRoomId: (id) => set({ roomId: id }),
  setPlayerId: (id) => set({ playerId: id }),
  setStartTimestamp: (ts) => set({ startTimestamp: ts }),
}));
