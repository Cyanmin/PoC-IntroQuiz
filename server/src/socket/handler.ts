import { Server, Socket } from "socket.io";

export const registerSocketHandlers = (io: Server) => {
	io.on("connection", (socket: Socket) => {
		console.log("クライアントに接続されました:", socket.id);

		socket.on("joinRoom", (data) => {
			console.log(`ルームに参加しました: ${JSON.stringify( data )}`);
			// TODO: ルーム参加処理
		});

		socket.on("startQuiz", (data) => {
			console.log('クイズ開始リクエストを受信');
			// TODO: クイズ開始処理（全クライアントに startQuestion を送信）
		});

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
}