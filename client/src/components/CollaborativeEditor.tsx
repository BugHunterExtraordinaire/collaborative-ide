import { useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { type CollaborativeEditorProps } from '../types/interfaces';
import { useCollabEngine } from './hooks/useCollabEngine';

export default function CollaborativeEditor({ currentRoom, language, currentUser, onCodeChange }: CollaborativeEditorProps) {
  const [editorInstance, setEditorInstance] = useState<editor.IStandaloneCodeEditor | null>(null);
  
  const { status } = useCollabEngine(currentRoom, editorInstance);

  const isAdmin = currentUser.role === 'System Administrator';

  const handleEditorDidMount: OnMount = (editor) => {
    setEditorInstance(editor);
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onCodeChange(value);
    }
  };

  return (
    <div className="relative h-full w-full flex flex-col">
      <div className="absolute top-2 right-6 z-10 text-xs font-mono px-2 py-1 bg-black/50 rounded border border-zinc-700 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${status === 'Connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
        {status}
      </div>

      <div className="grow">
        <Editor
          height="100%"
          theme="vs-dark"
          language={language}
          onMount={handleEditorDidMount}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on',
            padding: { top: 16 },
            readOnly: isAdmin
          }}
        />
      </div>
    </div>
  );
}