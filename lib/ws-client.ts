export function connectRoom(
  roomId: string,
  setPlayers: (players: string[]) => void,
  setAnswer: (name: string) => void
) {
  const ws = new WebSocket('ws://localhost:3001');
  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'join', roomId }));
  };
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    switch (msg.type) {
      case 'players':
        setPlayers(msg.players);
        break;
      case 'answer':
        setAnswer(msg.name);
        break;
      default:
        break;
    }
  };
  return ws;
}
