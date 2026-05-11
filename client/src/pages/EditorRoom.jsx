import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useCollabEditor } from '../hooks/useCollabEditor.js';
import CollabEditor from '../components/CollabEditor.jsx';
import Toolbar from '../components/Toolbar.jsx';
import UserList from '../components/UserList.jsx';
import StatusBar from '../components/StatusBar.jsx';

export default function EditorRoom() {
  const { roomId }                     = useParams();
  const { state }                      = useLocation();
  const navigate                       = useNavigate();
  const username                       = state?.username || 'Anonymous';

  const {
    code, version, users, myColor,
    status, language, typingUsers,
    handleCodeChange, handleLanguageChange,
  } = useCollabEditor({ roomId, username });

  return (
    <div className="h-screen flex flex-col bg-gray-950 overflow-hidden">
      {/* Top toolbar */}
      <Toolbar
        roomId={roomId}
        language={language}
        onLanguageChange={handleLanguageChange}
        onLeave={() => navigate('/')}
      />

      {/* Main: editor + sidebar */}
      <div className="flex flex-1 min-h-0">
        {/* Editor */}
        <div className="flex-1 min-w-0">
          <CollabEditor
            code={code}
            language={language}
            onChange={handleCodeChange}
          />
        </div>

        {/* Sidebar */}
        <div className="w-56 border-l border-gray-800 bg-gray-900 flex flex-col shrink-0">
          <UserList users={users} myColor={myColor} username={username} />
          {typingUsers.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-800">
              {typingUsers.map((u) => (
                <p key={u.username} className="text-xs text-gray-500">
                  <span style={{ color: u.color }}>●</span>{' '}
                  {u.username} is typing…
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom status bar */}
      <StatusBar status={status} version={version} roomId={roomId} />
    </div>
  );
}
