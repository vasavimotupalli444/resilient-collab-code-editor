export default function UserList({ users, myColor, username }) {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <p className="text-xs text-gray-500 uppercase tracking-widest font-medium mb-3">
        Active — {users.length}
      </p>
      <ul className="space-y-2">
        {users.map((u) => (
          <li key={u.socketId} className="flex items-center gap-2">
            {/* Avatar */}
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
              style={{
                background: u.color + '22',
                border: `1.5px solid ${u.color}`,
                color: u.color,
              }}
            >
              {u.username.slice(0, 1).toUpperCase()}
            </div>
            <span className="text-sm text-gray-300 truncate">
              {u.username}
              {u.username === username && (
                <span className="text-gray-600 text-xs ml-1">(you)</span>
              )}
            </span>
            {/* Online dot */}
            <span
              className="ml-auto w-1.5 h-1.5 rounded-full shrink-0 status-online"
              style={{ background: u.color }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
