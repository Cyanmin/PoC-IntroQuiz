const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const rooms = new Map();

io.on('connection', socket => {
  console.log('client connected', socket.id);

  socket.on('createRoom', (cb) => {
    const roomId = Math.random().toString(36).slice(2, 8);
    rooms.set(roomId, { host: socket.id, members: [socket.id], players: [] });
    socket.join(roomId);
    cb({ roomId });
  });

  socket.on('joinRoom', ({ roomId, name }, cb) => {
    const room = rooms.get(roomId);
    if (!room) {
      cb && cb({ error: 'room not found' });
      return;
    }
    room.members.push(socket.id);
    room.players.push({ id: socket.id, name });
    socket.join(roomId);
    io.to(roomId).emit('playerJoined', { id: socket.id, name });
    cb && cb({ ok: true });
  });

  socket.on('disconnect', () => {
    console.log('client disconnected', socket.id);
  });
});

app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong' });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
