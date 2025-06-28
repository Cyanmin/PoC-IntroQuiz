import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { registerSocketHandlers } from "./socket/handlers";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

registerSocketHandlers(io);

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`サーバーがポート ${PORT} で起動しました`);
});
