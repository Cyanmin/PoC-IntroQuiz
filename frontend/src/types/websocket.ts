export type WSOutgoing =
  | { action: "joinRoom"; roomId: string; playerName: string; playerId: string }
  | { action: "createRoom"; roomId: string; roomName: string }
  | { action: "setPlaylist"; roomId: string; playlistUrl: string }
  | { action: "startQuiz"; roomId: string }
  | {
      action: "buzz";
      roomId: string;
      playerId: string;
      elapsed: number;
      questionIndex: number;
    }
  | {
      action: "answer";
      roomId: string;
      playerId: string;
      answer: string;
      questionIndex: number;
    }
  | { action: "endQuiz"; roomId: string }
  | { action: string; [key: string]: unknown };

export type Ranking = { playerName: string; score: number };

export type WSIncoming =
  | {
      type: "joinRoomResult";
      status: "ok" | "error";
      playerList?: string[];
      message?: string;
    }
  | { type: "playerListUpdate"; players: string[] }
  | { type: "startQuiz"; videoId: string; questionIndex: number }
  | { type: "buzzAccepted" }
  | { type: "buzzResult" }
  | {
      type: "answerResult";
      result: "correct" | "incorrect";
      videoTitle: string;
    }
  | { type: "quizEnded"; rankings: Ranking[] } // ← ここを追加
  | { type: "roomInfo"; roomName: string; players: string[] }
  | { type: string; [key: string]: unknown };
