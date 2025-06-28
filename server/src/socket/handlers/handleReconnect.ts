import { Server, Socket } from "socket.io";
import { ReconnectPayload } from "../types";
import { roomManager } from "../roomManager";

export const HandleReconnect = (io: Server, socket: Socket) => {
  socket.on("reconnect", (payload: ReconnectPayload) => {
    const { roomId, clientId } = payload;
    const result = roomManager.reconnectPlayer(roomId, clientId, socket.id);
    if (!result) {
      socket.emit("reconnectError", { message: "再接続に失敗しました" });
      return;
    }
    socket.join(roomId);
    socket.emit("reconnectSuccess", { player: result.player, room: result.room });
    io.to(roomId).emit("playerUpdate", result.room.players);
  });
};
