// ルームに参加するためのクライアント→サーバーペイロード
export interface JoinRoomPayload {
	roomId: string;
	name: string;
	clientId: string;
}

// サーバー→クライアントへの成功応答
export interface JoinSuccessPayload {
	player: Player;
	room: Room;
}

// プレイヤー構造
export interface Player {
	id: string;
	name: string;
	score: number;
	clientId: string;
	connected: boolean;
}

// ルーム構造
export interface Room {
	id: string;
	playListUrl: string;
	introDuration: number;
	questions: Video[];
	players: Player[];
	status: 'waiting' | 'inProgress' | 'finished';
	createdAt: string;
}

// 動画構造
export interface Video {
	id: string;
	title: string;
	duration: number;
	thumbnail: string;
	url: string;
}

// ------------------------------
// startQuiz関連
// ------------------------------

// クライアント → サーバー：クイズ開始要求
export interface StartQuizPayload {
  roomId: string;
}

// サーバー → クライアント：最初の問題再生指示（startQuestion）
export interface StartQuestionPayload {
  roomId: string;
}

// ------------------------------
// その他イベント（予告定義）
// ------------------------------

// サーバー → クライアント：buzzResult
export interface BuzzResultPayload {
  playerId: string;
  playerName: string;
}

// サーバー → クライアント：scoreUpdate
export interface ScoreUpdatePayload {
  players: Player[];
}

// サーバー → クライアント：quizEnd
export interface QuizEndPayload {
  finalScores: Player[];
}