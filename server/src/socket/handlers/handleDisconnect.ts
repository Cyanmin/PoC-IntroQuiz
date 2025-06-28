import { Server, Socket } from "socket.io";
import { roomManager } from "../roomManager";

export const HandleDisconnect = (io: Server, socket: Socket) => {
  socket.on("disconnect", () => {
    const result = roomManager.disconnectPlayer(socket.id);
    if (result) {
      io.to(result.roomId).emit("playerUpdate", result.room.players);
    }
    console.log("クライアントが切断されました:", socket.id);
  });
};
