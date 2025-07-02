export type WSOutgoing =
  | { action: 'joinRoom'; roomId: string; playerId: string }
  | { action: 'fetchPlaylist'; playlistId: string }
  | { action: 'startQuiz'; roomId: string }
  | { action: 'buzz'; elapsed: number };

export type WSIncoming =
  | { type: 'joinRoomAck'; roomId: string; playerId: string }
  | { type: 'playlistFetched'; playlistId: string; videos: string[] }
  | { type: 'quizStarted'; startTimestamp: number }
  | { type: string; [key: string]: unknown };
