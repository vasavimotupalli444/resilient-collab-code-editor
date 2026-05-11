require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./services/database');
const redisClient = require('./services/redis');
const registerSocketHandlers = require('./sockets/socketHandlers');

const app = express();
const server = http.createServer(app);

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

// ── Socket.IO ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || '*', methods: ['GET', 'POST'] },
  // Reconnection settings exposed to client
  pingTimeout: 10000,
  pingInterval: 5000,
});

// ── REST: health + room snapshot ──────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

app.get('/api/room/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const cached = await redisClient.get(`room:${roomId}`);
    if (cached) return res.json(JSON.parse(cached));

    const Room = require('./models/Room');
    const room = await Room.findOne({ roomId });
    if (!room) return res.json({ roomId, content: '', version: 0 });
    res.json({ roomId, content: room.content, version: room.version });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Sockets ───────────────────────────────────────────────────────────────────
registerSocketHandlers(io);

// ── Boot ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`✅  Server running on port ${PORT}`);
  });
})();
