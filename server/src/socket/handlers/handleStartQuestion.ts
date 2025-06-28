import { Server, Socket } from "socket.io";
import { StartQuestionPayload, QuizEndPayload } from "../types";
import { roomManager } from "../roomManager";

export const HandleStartQuestion = (io: Server, socket: Socket) => {
  socket.on("startQuestion", (payload: StartQuestionPayload) => {
    const { roomId } = payload;
    const video = roomManager.nextQuestion(roomId);
    if (!video) {
      const finalScores = roomManager.endQuiz(roomId);
      io.to(roomId).emit("quizEnd", { finalScores } as QuizEndPayload);
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
