import { Server, Socket } from "socket.io";
import { JoinRoomPayload, JoinSuccessPayload, Player, Room } from "../types";
import { roomStore } from "../stores/roomStore";

export const HandleJoinRoom = (io: Server, socket: Socket) => {
  socket.on("joinRoom", (payload: JoinRoomPayload) => {
    console.log(`ルームに参加しました: ${JSON.stringify(payload)}`);

    const { roomId, name, clientId } = payload;
    const room = roomStore.get(roomId);

    if (!room) {
      socket.emit("joinRoomError", { message: "ルームが見つかりません" });
      return;
    }

    // すでに同じ clientId のプレイヤーがいる場合（再接続対応）
    let player = room.players.find((p) => p.clientId === clientId);

    if (player) {
      // 既存のプレイヤーが見つかった場合、再接続処理を行う
      player.connected = true;
      return;
    } else {
      player = {
        id: socket.id,
        name,
        score: 0,
        clientId,
        connected: true,
      };
      room.players.push(player);
    }

    socket.join(roomId);

    const response: JoinSuccessPayload = {
      player,
      room,
    };
    socket.emit("joinSuccess", response);
    io.to(roomId).emit("playerUpdate", room.players);
  });
};
