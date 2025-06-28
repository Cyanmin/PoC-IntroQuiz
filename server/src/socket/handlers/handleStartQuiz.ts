import { Server, Socket } from "socket.io";
import { StartQuizPayload, StartQuestionPayload } from "../types";
import { roomManager } from "../roomManager";

export const HandleStartQuiz = (io: Server, socket: Socket) => {
  socket.on("startQuiz", (payload: StartQuizPayload) => {
    const { roomId } = payload;
    const video = roomManager.startQuiz(roomId);
    if (!video) {
      socket.emit("error", { message: "クイズを開始できません" });
      return;
    }
    const index = roomManager.getQuestionIndex(roomId);
    const data: StartQuestionPayload & { video: any; index: number } = {
      roomId,
      video,
      index,
    };
    io.to(roomId).emit("startQuestion", data);
  });
};
