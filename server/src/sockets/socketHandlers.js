const {
  getRoomState,
  processEdit,
  getOpsAfterVersion,
  addUser,
  removeUser,
  getRoomUsers,
} = require('../services/syncService');

module.exports = function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`🔌  Socket connected: ${socket.id}`);

    // ── JOIN ROOM ──────────────────────────────────────────────────────────────
    // Payload: { roomId, username, lastKnownVersion }
    socket.on('join-room', async ({ roomId, username, lastKnownVersion = 0 }) => {
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.username = username || `User-${socket.id.slice(0, 4)}`;

      const color = addUser(roomId, socket.id, socket.data.username);
      socket.data.color = color;

      // Fetch latest state from Redis
      const state = await getRoomState(roomId);

      // If client reconnected with a known version, send missed ops
      let missedOps = [];
      if (lastKnownVersion > 0 && lastKnownVersion < state.version) {
        missedOps = await getOpsAfterVersion(roomId, lastKnownVersion);
      }

      // Send current state + any missed ops back to the joining client
      socket.emit('room-state', {
        roomId,
        content: state.content,
        version: state.version,
        missedOps,
        users: getRoomUsers(roomId),
        yourColor: color,
      });

      // Tell everyone else in the room about the new user
      socket.to(roomId).emit('user-joined', {
        socketId: socket.id,
        username: socket.data.username,
        color,
        users: getRoomUsers(roomId),
      });

      console.log(`👤  ${socket.data.username} joined room ${roomId} (v${state.version})`);
    });

    // ── CODE CHANGE ───────────────────────────────────────────────────────────
    // Payload: { roomId, content, version }
    socket.on('code-change', async ({ roomId, content, version }) => {
      const result = await processEdit(roomId, {
        version,
        content,
        socketId: socket.id,
      });

      if (result.accepted) {
        // Broadcast to everyone else in the room
        socket.to(roomId).emit('receive-code', {
          content: result.state.content,
          version: result.state.version,
          fromSocket: socket.id,
        });

        // Acknowledge to sender with the accepted version
        socket.emit('edit-ack', { version: result.state.version });
      } else {
        // Client is stale — send recovery payload
        socket.emit('edit-rejected', {
          latestContent: result.state.content,
          latestVersion: result.state.version,
          missedOps: result.missedOps,
        });
        console.log(`⚠️   Stale edit from ${socket.id} — sent recovery payload`);
      }
    });

    // ── LANGUAGE CHANGE ───────────────────────────────────────────────────────
    socket.on('language-change', ({ roomId, language }) => {
      socket.to(roomId).emit('language-change', { language });
    });

    // ── CURSOR PRESENCE ───────────────────────────────────────────────────────
    socket.on('cursor-move', ({ roomId, position }) => {
      socket.to(roomId).emit('cursor-update', {
        socketId: socket.id,
        username: socket.data.username,
        color: socket.data.color,
        position,
      });
    });

    // ── TYPING INDICATOR ─────────────────────────────────────────────────────
    socket.on('typing', ({ roomId }) => {
      socket.to(roomId).emit('user-typing', {
        socketId: socket.id,
        username: socket.data.username,
        color: socket.data.color,
      });
    });

    // ── DISCONNECT ────────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const { roomId, username } = socket.data;
      if (roomId) {
        removeUser(roomId, socket.id);
        socket.to(roomId).emit('user-left', {
          socketId: socket.id,
          username,
          users: getRoomUsers(roomId),
        });
        console.log(`🔴  ${username} disconnected from ${roomId}`);
      }
    });
  });
};
