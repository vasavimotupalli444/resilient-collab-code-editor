import { useState, useEffect, useRef, useCallback } from 'react';
import socket from '../socket/socket';
import { queueOp, getPendingOps, clearPendingOps } from '../socket/offlineQueue';

const TYPING_DEBOUNCE_MS = 300;

/**
 * useCollabEditor
 *
 * Manages:
 *  - Socket connection lifecycle
 *  - Version tracking (local version counter)
 *  - Sending edits with version numbers
 *  - Receiving and applying remote edits
 *  - Offline queuing (IndexedDB)
 *  - Reconnect recovery: fetch latest state + replay pending ops
 *  - User presence (list of connected users)
 *  - Cursor positions
 */
export function useCollabEditor({ roomId, username }) {
  const [code, setCode]             = useState('// Loading...');
  const [version, setVersion]       = useState(0);
  const [users, setUsers]           = useState([]);
  const [myColor, setMyColor]       = useState('#7C3AED');
  const [status, setStatus]         = useState('connecting'); // connecting | online | reconnecting | offline
  const [language, setLanguage]     = useState('javascript');
  const [typingUsers, setTypingUsers] = useState([]);

  // Refs so callbacks always have fresh values without re-subscribing
  const versionRef   = useRef(0);
  const codeRef      = useRef('');
  const isRemoteEdit = useRef(false); // flag to skip emitting self-caused changes
  const typingTimer  = useRef(null);

  const updateVersion = (v) => { versionRef.current = v; setVersion(v); };
  const updateCode    = (c) => { codeRef.current = c; setCode(c); };

  // ── Apply remote edit (skip re-emit) ──────────────────────────────────────
  const applyRemoteEdit = useCallback((content, newVersion) => {
    isRemoteEdit.current = true;
    updateCode(content);
    updateVersion(newVersion);
    // React batches, so reset flag after paint
    setTimeout(() => { isRemoteEdit.current = false; }, 0);
  }, []);

  // ── Reconnect recovery ────────────────────────────────────────────────────
  const recoverSession = useCallback(async (latestContent, latestVersion, missedOps) => {
    // Merge: if we have pending local ops, apply them on top of server state
    const pending = await getPendingOps(roomId);

    if (pending.length === 0) {
      // Nothing local — just fast-forward to server state
      applyRemoteEdit(latestContent, latestVersion);
      return;
    }

    // Simple last-writer-wins merge: apply pending ops on top of latest server content
    // (In production: replace with OT / CRDT — Yjs is a drop-in)
    let merged = latestContent;
    let mergedVersion = latestVersion;

    for (const op of pending) {
      // Re-emit each pending op to the server
      socket.emit('code-change', {
        roomId,
        content: op.content,
        version: mergedVersion,
      });
      mergedVersion++;
    }

    updateCode(merged);
    updateVersion(mergedVersion);
    await clearPendingOps(roomId);
    console.log(`♻️  Replayed ${pending.length} pending ops after reconnect`);
  }, [roomId, applyRemoteEdit]);

  // ── Socket lifecycle ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId) return;

    // Join room (pass lastKnownVersion for reconnect diff)
    function joinRoom() {
      socket.emit('join-room', {
        roomId,
        username,
        lastKnownVersion: versionRef.current,
      });
    }

    // ── Inbound events ─────────────────────────────────────────────────────

   socket.on('room-state', async ({ content, version: v, missedOps, users: u, yourColor }) => {
  setMyColor(yourColor);
  setUsers(u);

  const pending = await getPendingOps(roomId);

  // If offline edits exist, preserve them
  if (pending.length > 0) {
    console.log(`Recovering ${pending.length} offline edits`);

    let latest = pending[pending.length - 1];

    updateCode(latest.content);
    updateVersion(v);

    // Replay edits to server
    for (const op of pending) {
      socket.emit('code-change', {
        roomId,
        content: op.content,
        version: versionRef.current,
      });
    }

    await clearPendingOps(roomId);

  } else if (missedOps && missedOps.length > 0) {

    await recoverSession(content, v, missedOps);

  } else {

    applyRemoteEdit(content, v);
  }

  setStatus('online');
});
    socket.on('receive-code', ({ content, version: v }) => {
      applyRemoteEdit(content, v);
    });

    socket.on('edit-ack', ({ version: v }) => {
      updateVersion(v);
    });

    socket.on('edit-rejected', async ({ latestContent, latestVersion, missedOps }) => {
      console.warn(`⚠️  Edit rejected — recovering from v${latestVersion}`);
      await recoverSession(latestContent, latestVersion, missedOps);
    });

    socket.on('user-joined', ({ users: u }) => setUsers(u));
    socket.on('user-left',   ({ users: u }) => setUsers(u));

    socket.on('language-change', ({ language: lang }) => setLanguage(lang));

    socket.on('user-typing', ({ username: u, color }) => {
      setTypingUsers((prev) => {
        if (prev.find((x) => x.username === u)) return prev;
        return [...prev, { username: u, color }];
      });
      setTimeout(() => {
        setTypingUsers((prev) => prev.filter((x) => x.username !== u));
      }, 2000);
    });

    // ── Connection state ────────────────────────────────────────────────────

    socket.on('connect', () => {
      setStatus('online');
      joinRoom();
    });

    socket.on('disconnect', async () => {
      setStatus('offline');
      console.log('🔴  Disconnected — queuing future edits to IndexedDB');
    });

    socket.on('reconnect_attempt', () => setStatus('reconnecting'));

    socket.on('reconnect', () => {
      setStatus('online');
      joinRoom();
    });

    // ── Connect ─────────────────────────────────────────────────────────────
    if (!socket.connected) {
      socket.connect();
    } else {
      joinRoom();
      setStatus('online');
    }

    return () => {
      socket.off('room-state');
      socket.off('receive-code');
      socket.off('edit-ack');
      socket.off('edit-rejected');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('language-change');
      socket.off('user-typing');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('reconnect_attempt');
      socket.off('reconnect');
    };
  }, [roomId, username, applyRemoteEdit, recoverSession]);

  // ── Outbound: handle local editor change ─────────────────────────────────
  const handleCodeChange = useCallback(async (newCode) => {
    if (isRemoteEdit.current) return; // ignore changes we applied ourselves

    codeRef.current = newCode;
    setCode(newCode);

    // Debounced typing indicator
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      if (socket.connected) socket.emit('typing', { roomId });
    }, TYPING_DEBOUNCE_MS);

    if (socket.connected) {
      socket.emit('code-change', {
        roomId,
        content: newCode,
        version: versionRef.current,
      });
    } else {
      // Offline: queue to IndexedDB
      await queueOp(roomId, { content: newCode, version: versionRef.current });
      console.log(`📦  Queued offline edit (v${versionRef.current})`);
    }
  }, [roomId]);

  const handleLanguageChange = useCallback((lang) => {
    setLanguage(lang);
    socket.emit('language-change', { roomId, language: lang });
  }, [roomId]);

  return {
    code,
    version,
    users,
    myColor,
    status,
    language,
    typingUsers,
    handleCodeChange,
    handleLanguageChange,
  };
}
