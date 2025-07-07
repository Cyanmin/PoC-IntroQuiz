export type WSOutgoing =
  | { action: 'joinRoom'; roomId: string; playerId: string }
  | { action: 'fetchPlaylist'; playlistId: string }
  | { action: 'startQuiz'; roomId: string }
  | { action: 'buzz'; elapsed: number };

export type WSIncoming =
  | { type: 'joinRoomAck'; roomId: string; playerId: string }
  | { type: 'playlistFetched'; playlistId: string; videos: string[] }
  | { type: 'startQuiz'; videoId: string; questionIndex: number }
  | { type: 'playerListUpdate'; players: string[] }
  | { type: 'buzzAccepted' }
  | { type: 'buzzResult' }
  | { type: 'answerResult'; correct: boolean; title: string }
  | { type: 'quizEnded' }
  | { type: 'roomInfo'; roomName: string; players: string[] }
  | { type: string; [key: string]: unknown };
