import { Server, Socket } from "socket.io";
import { HandleJoinRoom } from "./handlers/handleJoinRoom";
import { HandleStartQuiz } from "./handlers/handleStartQuiz";
import { HandleStartQuestion } from "./handlers/handleStartQuestion";
import { HandleBuzz } from "./handlers/handleBuzz";
import { HandleReconnect } from "./handlers/handleReconnect";
import { HandleDisconnect } from "./handlers/handleDisconnect";

export const registerSocketHandlers = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log("クライアントに接続されました:", socket.id);

    HandleJoinRoom(io, socket);
    HandleStartQuiz(io, socket);
    HandleStartQuestion(io, socket);
    HandleBuzz(io, socket);
    HandleReconnect(io, socket);
    HandleDisconnect(io, socket);
  });
};
