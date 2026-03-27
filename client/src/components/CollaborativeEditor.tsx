import { useRef, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { editor } from 'monaco-editor';
import { MonacoBinding } from 'y-monaco';

export default function CollaborativeEditor() {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [status, setStatus] = useState<string>('Connecting...');

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;

    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('monaco');

    const provider = new WebsocketProvider(
      'ws://localhost:4000/yjs',
      sessionId,
      ydoc
    );

    provider.on('status', (event: { status: string }) => {
      setStatus(event.status === 'connected' ? 'Connected (Synced)' : 'Disconnected');
    });

    const editorModel = editorRef.current.getModel();
    if (editorModel) {
      new MonacoBinding(ytext, editorModel, new Set([editorRef.current]), provider.awareness);
    }

    editor.onDidChangeModelContent(() => {
      onCodeChange(editor.getValue());
    });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px', backgroundColor: '#1e1e1e', color: '#4caf50', fontSize: '12px', fontFamily: 'monospace' }}>
        Status: {status}
      </div>
      <Editor
        height="100%"
        theme="vs-dark"
        language={language}
        options={{ minimap: { enabled: false }, fontSize: 14 }}
        onMount={handleEditorDidMount}
      />
    </div>
  );
}