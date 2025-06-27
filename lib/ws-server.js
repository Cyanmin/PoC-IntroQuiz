const WebSocket = require('ws');
const { fetchFirstVideoTitle } = require('./youtube');

const wss = new WebSocket.Server({ port: 3001 });
const rooms = new Map();

function getRoom(id) {
  if (!rooms.has(id)) {
    rooms.set(id, { players: new Set(), answered: false });
  }
  return rooms.get(id);
}

wss.on('connection', (ws) => {
  let roomId = '';
  let name = Math.random().toString(36).substring(2, 6);

  ws.on('message', async (data) => {
    const msg = JSON.parse(data);
    if (msg.type === 'join') {
      roomId = msg.roomId;
      const room = getRoom(roomId);
      room.players.add(name);
      ws.roomId = roomId;
      broadcastPlayers(roomId);
    } else if (msg.type === 'question') {
      const room = getRoom(roomId);
      room.answered = false;
      const title = await fetchFirstVideoTitle();
      broadcast(roomId, { type: 'question', title });
    } else if (msg.type === 'answer') {
      const room = getRoom(roomId);
      if (!room.answered) {
        room.answered = true;
        broadcast(roomId, { type: 'answer', name });
      }
    }
  });

  ws.on('close', () => {
    if (roomId) {
      const room = getRoom(roomId);
      room.players.delete(name);
      broadcastPlayers(roomId);
    }
  });
});

function broadcast(roomId, msg) {
  const data = JSON.stringify(msg);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.roomId === roomId) {
      client.send(data);
    }
  });
}

function broadcastPlayers(roomId) {
  const room = getRoom(roomId);
  const players = Array.from(room.players);
  broadcast(roomId, { type: 'players', players });
}

console.log('WebSocket server running on ws://localhost:3001');
