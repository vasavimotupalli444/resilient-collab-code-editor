import Editor from '@monaco-editor/react';

const EDITOR_OPTIONS = {
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  fontLigatures: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  padding: { top: 16, bottom: 16 },
  lineNumbers: 'on',
  renderLineHighlight: 'line',
  cursorBlinking: 'smooth',
  smoothScrolling: true,
  tabSize: 2,
  wordWrap: 'on',
  automaticLayout: true,
};

export default function CollabEditor({ code, language, onChange }) {
  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        theme="vs-dark"
        language={language}
        value={code}
        onChange={(value) => onChange(value ?? '')}
        options={EDITOR_OPTIONS}
        loading={
          <div className="h-full flex items-center justify-center text-gray-600 text-sm">
            Loading editor…
          </div>
        }
      />
    </div>
  );
}
