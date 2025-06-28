import { Room } from "../types";

const rooms = new Map<string, Room>();

export const roomStore = {
  get: (roomId: string) => rooms.get(roomId),
  set: (roomId: string, room: Room) => rooms.set(roomId, room),
  has: (roomId: string) => rooms.has(roomId),
  delete: (roomId: string) => rooms.delete(roomId),
  getAll: () => Array.from(rooms.values()),
};
