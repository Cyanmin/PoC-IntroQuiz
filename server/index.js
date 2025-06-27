const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

io.on('connection', socket => {
  console.log('client connected', socket.id);
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
