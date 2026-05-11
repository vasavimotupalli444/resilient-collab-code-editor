const redis = require('./redis');

const ROOM_TTL = 60 * 60 * 24; // 24 hours
const OP_BUFFER_SIZE = 50;      // keep last 50 ops per room for reconnect diffs

// ── Room state ────────────────────────────────────────────────────────────────

async function getRoomState(roomId) {
  const raw = await redis.get(`room:${roomId}`);
  if (raw) return JSON.parse(raw);
  return { roomId, content: '', version: 0 };
}

async function setRoomState(roomId, content, version) {
  const state = { roomId, content, version, updatedAt: Date.now() };
  await redis.set(`room:${roomId}`, JSON.stringify(state));
  await redis.expire(`room:${roomId}`, ROOM_TTL);
  return state;
}

// ── Operation buffer (for reconnect diffs) ────────────────────────────────────

async function appendOp(roomId, op) {
  const key = `ops:${roomId}`;
  await redis.rpush(key, JSON.stringify(op));
  await redis.ltrim(key, -OP_BUFFER_SIZE, -1); // keep last N ops
  await redis.expire(key, ROOM_TTL);
}

async function getOpsAfterVersion(roomId, fromVersion) {
  const key = `ops:${roomId}`;
  const raw = await redis.lrange(key, 0, -1);
  return raw
    .map((r) => JSON.parse(r))
    .filter((op) => op.version > fromVersion);
}

// ── Core sync: accept or reject an incoming edit ──────────────────────────────

/**
 * Returns { accepted, state, missedOps }
 *  - accepted:   true if the edit was applied
 *  - state:      latest room state
 *  - missedOps:  ops the client missed (for reconnect replay)
 */
async function processEdit(roomId, { version, content, socketId }) {
  const current = await getRoomState(roomId);

  // Client is current or only 1 behind (normal concurrent edit) → accept
  if (version >= current.version) {
    const nextVersion = current.version + 1;
    const updated = await setRoomState(roomId, content, nextVersion);
    await appendOp(roomId, { version: nextVersion, content, socketId, ts: Date.now() });

    // Persist to MongoDB (fire-and-forget, non-blocking)
    persistToMongo(roomId, content, nextVersion).catch(() => {});

    return { accepted: true, state: updated, missedOps: [] };
  }

  // Client is stale → reject + send back what it missed
  const missedOps = await getOpsAfterVersion(roomId, version);
  return { accepted: false, state: current, missedOps };
}

// ── MongoDB persistence (async, non-critical) ─────────────────────────────────

async function persistToMongo(roomId, content, version) {
  try {
    const Room = require('../models/Room');
    await Room.findOneAndUpdate(
      { roomId },
      { roomId, content, version, updatedAt: new Date() },
      { upsert: true, new: true }
    );
  } catch {
    // Silently ignore — Redis is source of truth during session
  }
}

// ── Active users per room ─────────────────────────────────────────────────────

// Simple in-process map (sufficient for single-server; swap to Redis hash for multi-instance)
const roomUsers = new Map(); // roomId → Map<socketId, { username, color }>

const COLORS = ['#7C3AED','#0891B2','#059669','#D97706','#DC2626','#DB2777','#7C3AED'];

function addUser(roomId, socketId, username) {
  if (!roomUsers.has(roomId)) roomUsers.set(roomId, new Map());
  const color = COLORS[roomUsers.get(roomId).size % COLORS.length];
  roomUsers.get(roomId).set(socketId, { username, color, socketId });
  return color;
}

function removeUser(roomId, socketId) {
  roomUsers.get(roomId)?.delete(socketId);
  if (roomUsers.get(roomId)?.size === 0) roomUsers.delete(roomId);
}

function getRoomUsers(roomId) {
  return Array.from(roomUsers.get(roomId)?.values() || []);
}

module.exports = {
  getRoomState,
  setRoomState,
  processEdit,
  getOpsAfterVersion,
  addUser,
  removeUser,
  getRoomUsers,
};
