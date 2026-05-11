import { useState } from 'react';

const LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'cpp',
  'rust', 'go', 'html', 'css', 'json', 'markdown',
];

export default function Toolbar({ roomId, language, onLanguageChange, onLeave }) {
  const [copied, setCopied] = useState(false);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="h-12 bg-gray-900 border-b border-gray-800 flex items-center px-4 gap-4 shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-2 mr-2">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <rect x="0.5" y="0.5" width="4" height="3" rx="0.5" fill="white" opacity="0.9"/>
            <rect x="5.5" y="0.5" width="4" height="3" rx="0.5" fill="white" opacity="0.6"/>
            <rect x="0.5" y="5" width="9" height="1.5" rx="0.5" fill="white" opacity="0.4"/>
          </svg>
        </div>
        <span className="text-white font-medium text-sm">CollabCode</span>
      </div>

      {/* Room ID badge */}
      <button
        onClick={copyRoomId}
        className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700
                   border border-gray-700 rounded-md px-3 py-1.5
                   text-xs font-mono text-gray-300 hover:text-white transition"
        title="Click to copy Room ID"
      >
        <span className="text-gray-500">Room</span>
        <span>{roomId}</span>
        <span className="text-gray-500">{copied ? '✓' : '⎘'}</span>
      </button>

      {/* Language selector */}
      <select
        value={language}
        onChange={(e) => onLanguageChange(e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1.5
                   text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-violet-500"
      >
        {LANGUAGES.map((l) => (
          <option key={l} value={l}>{l}</option>
        ))}
      </select>

      <div className="flex-1" />

      {/* Leave */}
      <button
        onClick={onLeave}
        className="text-xs text-gray-500 hover:text-red-400 transition px-2 py-1"
      >
        Leave
      </button>
    </div>
  );
}
