import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function generateRoomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function Home() {
  const [roomId, setRoomId]     = useState('');
  const [username, setUsername] = useState('');
  const navigate                = useNavigate();

  const join = (e) => {
    e.preventDefault();
    const room = roomId.trim() || generateRoomId();
    const user = username.trim() || `User-${Math.random().toString(36).slice(2, 5)}`;
    // Pass username via location state
    navigate(`/room/${room}`, { state: { username: user } });
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="6" height="4" rx="1" fill="white" opacity="0.9"/>
                <rect x="9" y="1" width="6" height="4" rx="1" fill="white" opacity="0.6"/>
                <rect x="1" y="7" width="14" height="2" rx="1" fill="white" opacity="0.4"/>
                <rect x="1" y="11" width="9" height="2" rx="1" fill="white" opacity="0.6"/>
                <rect x="12" y="11" width="3" height="3" rx="1" fill="white" opacity="0.9"/>
              </svg>
            </div>
            <span className="text-white font-semibold text-xl tracking-tight">CollabCode</span>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            Real-time collaborative editor with<br />
            offline sync &amp; reconnect recovery
          </p>
        </div>

        {/* Form card */}
        <form
          onSubmit={join}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-5"
        >
          <div className="space-y-2">
            <label className="text-xs text-gray-400 uppercase tracking-widest font-medium">
              Your name
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Arjun"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3
                         text-white placeholder-gray-600 text-sm
                         focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                         transition"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-gray-400 uppercase tracking-widest font-medium">
              Room ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="Leave blank to create new"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3
                           text-white placeholder-gray-600 text-sm font-mono
                           focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                           transition"
              />
              <button
                type="button"
                onClick={() => setRoomId(generateRoomId())}
                className="px-3 py-3 bg-gray-800 border border-gray-700 rounded-lg
                           text-gray-400 hover:text-white hover:border-gray-600 transition text-xs"
                title="Generate room ID"
              >
                ⟳
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-violet-600 hover:bg-violet-500 active:bg-violet-700
                       text-white font-medium py-3 rounded-lg transition-all text-sm"
          >
            {roomId.trim() ? 'Join Room →' : 'Create Room →'}
          </button>
        </form>

        <p className="text-center text-gray-600 text-xs mt-6">
          Share the Room ID with collaborators to edit together
        </p>
      </div>
    </div>
  );
}
