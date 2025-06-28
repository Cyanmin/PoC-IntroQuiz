import { Server, Socket } from "socket.io";
import { JoinRoomPayload, JoinSuccessPayload } from "../types";
import { roomManager } from "../roomManager";

export const HandleJoinRoom = (io: Server, socket: Socket) => {
  socket.on("joinRoom", (payload: JoinRoomPayload) => {
    const { roomId, name, clientId } = payload;
    const { player, room } = roomManager.joinRoom(roomId, name, clientId, socket.id);
    socket.join(roomId);
    const response: JoinSuccessPayload = { player, room };
    socket.emit("joinSuccess", response);
    io.to(roomId).emit("playerUpdate", room.players);
  });
};
