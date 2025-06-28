import { Server, Socket } from "socket.io";
import { HandleJoinRoom } from "./handlers/handleJoinRoom";
import { HandleStartQuiz } from "./handlers/handleStartQuiz";
import { HandleStartQuestion } from "./handlers/handleStartQuestion";

export const registerSocketHandlers = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log("クライアントに接続されました:", socket.id);

    // TODO: ルーム参加処理
    HandleJoinRoom(io, socket);

    // TODO: クイズ開始処理（全クライアントに startQuestion を送信）
    HandleStartQuiz(io, socket);

    // TODO: 問題開始処理（全クライアントに startQuestion を送信）
    HandleStartQuestion(io, socket);

    socket.on("buzz", () => {
      console.log("バズが押されました:", socket.id);
      // buzz 順管理
    });

    socket.on("disconnect", () => {
      console.log("クライアントが切断されました:", socket.id);
    });

    socket.on("reconnect", (msg: string) => {
      console.log("クライアントが再接続されました:", socket.id, msg);
      // TODO: 再接続 状態復元処理
    });
  });
};
