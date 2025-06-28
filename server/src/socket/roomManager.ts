import { Player, Room, Video } from "./types";

interface RoomState {
  room: Room;
  questionIndex: number;
  buzzQueue: string[]; // store player socket ids in the order they buzzed
}

export class RoomManager {
  private rooms = new Map<string, RoomState>();

  /** Get existing room or create new one */
  private getOrCreateRoom(roomId: string): RoomState {
    let state = this.rooms.get(roomId);
    if (!state) {
      const room: Room = {
        id: roomId,
        playListUrl: "",
        introDuration: 0,
        questions: [],
        players: [],
        status: "waiting",
        createdAt: new Date().toISOString(),
      };
      state = { room, questionIndex: 0, buzzQueue: [] };
      this.rooms.set(roomId, state);
    }
    return state;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId)?.room;
  }

  joinRoom(roomId: string, name: string, clientId: string, socketId: string) {
    const state = this.getOrCreateRoom(roomId);
    let player = state.room.players.find((p) => p.clientId === clientId);

    if (player) {
      player.name = name;
      player.id = socketId;
      player.connected = true;
    } else {
      player = { id: socketId, name, score: 0, clientId, connected: true };
      state.room.players.push(player);
    }

    return { player, room: state.room };
  }

  reconnectPlayer(roomId: string, clientId: string, socketId: string) {
    const state = this.rooms.get(roomId);
    if (!state) return null;
    const player = state.room.players.find((p) => p.clientId === clientId);
    if (!player) return null;
    player.id = socketId;
    player.connected = true;
    return { player, room: state.room };
  }

  disconnectPlayer(socketId: string) {
    for (const [roomId, state] of this.rooms.entries()) {
      const player = state.room.players.find((p) => p.id === socketId);
      if (player) {
        player.connected = false;
        return { roomId, room: state.room };
      }
    }
    return null;
  }

  findPlayerBySocket(socketId: string) {
    for (const [roomId, state] of this.rooms.entries()) {
      const player = state.room.players.find((p) => p.id === socketId);
      if (player) return { roomId, player };
    }
    return null;
  }

  startQuiz(roomId: string): Video | null {
    const state = this.rooms.get(roomId);
    if (!state) return null;
    state.room.status = "inProgress";
    state.questionIndex = 0;
    state.buzzQueue = [];
    return state.room.questions[state.questionIndex] || null;
  }

  nextQuestion(roomId: string): Video | null {
    const state = this.rooms.get(roomId);
    if (!state) return null;
    state.questionIndex += 1;
    state.buzzQueue = [];
    return state.room.questions[state.questionIndex] || null;
  }

  getQuestionIndex(roomId: string): number {
    const state = this.rooms.get(roomId);
    return state ? state.questionIndex : 0;
  }

  buzz(roomId: string, socketId: string) {
    const state = this.rooms.get(roomId);
    if (!state) return null;
    const player = state.room.players.find((p) => p.id === socketId);
    if (!player) return null;
    if (state.buzzQueue.includes(socketId)) return { player, first: false };
    state.buzzQueue.push(socketId);
    return { player, first: state.buzzQueue.length === 1 };
  }

  updateScore(roomId: string, playerId: string, delta: number) {
    const state = this.rooms.get(roomId);
    if (!state) return [] as Player[];
    const player = state.room.players.find((p) => p.id === playerId);
    if (player) player.score += delta;
    return state.room.players;
  }

  endQuiz(roomId: string) {
    const state = this.rooms.get(roomId);
    if (!state) return [] as Player[];
    state.room.status = "finished";
    return [...state.room.players].sort((a, b) => b.score - a.score);
  }
}

export const roomManager = new RoomManager();
