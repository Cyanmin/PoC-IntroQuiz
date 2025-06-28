import { Server, Socket } from "socket.io";
import { StartQuestionPayload } from "../types";
import { roomStore } from "../stores/roomStore";

const currentQuestionIndex = new Map<string, number>();

export const HandleStartQuestion = (io: Server, socket: Socket) => {
  socket.on("startQuestion", (payload: StartQuestionPayload) => {
    console.log(`問題開始リクエストを受信: ${JSON.stringify(payload)}`);

    const { roomId } = payload;
    const room = roomStore.get(roomId);

    if (!room) {
      socket.emit("error", { message: "指定されたルームが存在しません。" });
      return;
    }

    if (room.status !== "inProgress") {
      socket.emit("error", { message: "クイズが進行中ではありません。" });
      return;
    }

    const currentIndex = currentQuestionIndex.get(roomId) ?? 0;
    const video = room.questions[currentIndex];

    if (!video) {
      io.to(roomId).emit("quizEnd", { message: "問題が存在しません。" });
      room.status = "finished";
      roomStore.set(roomId, room);
      return;
    }

    // 問題を全員に送信
    io.to(roomId).emit("startQuestion", { currentIndex, video });

    // 次のインデックスに進める
    currentQuestionIndex.set(roomId, currentIndex + 1);
  });
};
