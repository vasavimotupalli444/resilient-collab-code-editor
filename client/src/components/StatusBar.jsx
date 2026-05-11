const STATUS_CONFIG = {
  connecting:    { dot: 'bg-yellow-500', label: 'Connecting…',    bar: 'bg-yellow-500/10' },
  online:        { dot: 'bg-green-500',  label: 'Connected',      bar: 'bg-transparent' },
  reconnecting:  { dot: 'bg-yellow-500', label: 'Reconnecting…', bar: 'bg-yellow-500/10' },
  offline:       { dot: 'bg-red-500',    label: 'Offline — edits queued locally', bar: 'bg-red-500/10' },
};

export default function StatusBar({ status, version, roomId }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.connecting;

  return (
    <div className={`h-7 ${cfg.bar} border-t border-gray-800 flex items-center px-4 gap-4 shrink-0 transition-colors`}>
      {/* Connection */}
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        <span className="text-xs text-gray-500">{cfg.label}</span>
      </div>

      <span className="text-gray-700 text-xs">|</span>

      {/* Version */}
      <span className="text-xs text-gray-600">
        v{version}
      </span>

      <span className="text-gray-700 text-xs">|</span>

      {/* Room */}
      <span className="text-xs text-gray-600 font-mono">
        {roomId}
      </span>

      {status === 'offline' && (
        <>
          <span className="text-gray-700 text-xs">|</span>
          <span className="text-xs text-red-400">
            ⚠ Offline — changes saved locally, will sync on reconnect
          </span>
        </>
      )}
    </div>
  );
}
