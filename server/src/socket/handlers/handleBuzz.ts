import { Server, Socket } from "socket.io";
import { BuzzResultPayload, ScoreUpdatePayload, StartQuestionPayload, QuizEndPayload } from "../types";
import { roomManager } from "../roomManager";

export const HandleBuzz = (io: Server, socket: Socket) => {
  socket.on("buzz", () => {
    const info = roomManager.findPlayerBySocket(socket.id);
    if (!info) return;
    const { roomId } = info;
    const result = roomManager.buzz(roomId, socket.id);
    if (!result) return;
    if (result.first) {
      io.to(roomId).emit("buzzResult", {
        playerId: result.player.id,
        playerName: result.player.name,
      } as BuzzResultPayload);
      roomManager.updateScore(roomId, result.player.id, 1);
      const room = roomManager.getRoom(roomId);
      if (room) {
        io.to(roomId).emit("scoreUpdate", { players: room.players } as ScoreUpdatePayload);
      }
      const video = roomManager.nextQuestion(roomId);
      if (!video) {
        const finalScores = roomManager.endQuiz(roomId);
        io.to(roomId).emit("quizEnd", { finalScores } as QuizEndPayload);
        return;
      }
      const index = roomManager.getQuestionIndex(roomId);
      const payload: StartQuestionPayload & { video: any; index: number } = {
        roomId,
        video,
        index,
      };
      io.to(roomId).emit("startQuestion", payload);
    }
  });
};
