import { Server, Socket } from "socket.io";
import { Room, StartQuizPayload } from "../types";
import { roomStore } from "../stores/roomStore";

export const HandleStartQuiz = (io: Server, socket: Socket) => {
	socket.on("startQuiz", (payload: StartQuizPayload) => {
		console.log(`クイズ開始リクエストを受信: ${JSON.stringify(payload)}`);

		const { roomId } = payload;
		const room = roomStore.get(roomId);

		if (!room) {
			socket.emit("error", { message: "指定されたルームが存在しません。" });
			return;
		}
		
		if (room.status === "inProgress") {
			socket.emit("error", { message: "クイズはすでに進行中です。" });
			return;
		}

		if (room.status !== "waiting") {
			socket.emit("error", { message: "クイズを開始できない状態です。" });
			return;
		}

		// 状態を "inProgress" に変更
		room.status = "inProgress";
		roomStore.set(roomId, room);

		// HandleStartQuestion() を呼び出して問題を開始
		// HandleStartQuestion(io, socket, room);
	});
}