import { create } from 'zustand';

interface RoomState {
  roomId: string;
  roomName: string;
  players: string[];
  setRoomId: (id: string) => void;
  setRoomName: (name: string) => void;
  setPlayers: (players: string[]) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  roomId: '',
  roomName: '',
  players: [],
  setRoomId: (roomId) => set({ roomId }),
  setRoomName: (roomName) => set({ roomName }),
  setPlayers: (players) => set({ players }),
}));
