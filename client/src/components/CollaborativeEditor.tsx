import { useRef, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { editor } from 'monaco-editor';
import { MonacoBinding } from 'y-monaco';
import { type CollaborativeEditorProps } from '../types/interfaces';

export default function CollaborativeEditor({ currentRoom, language, currentUser, onCodeChange }: CollaborativeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  
  const decorationsCollectionRef = useRef<editor.IEditorDecorationsCollection | null>(null);
  const [status, setStatus] = useState<string>('Connecting...');

  const handleEditorDidMount: OnMount = (editorInstance, monaco) => {
    editorRef.current = editorInstance;
    decorationsCollectionRef.current = editorInstance.createDecorationsCollection([]);

    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('monaco');
    const yAuthorship = ydoc.getMap<string>('authorship');

    const backendPort = new URLSearchParams(window.location.search).get('port') || '4000';

    const provider = new WebsocketProvider(
      `ws://localhost:${backendPort}/yjs`, 
      currentRoom, 
      ydoc
    );

    provider.on('status', (event: { status: string }) => {
      setStatus(event.status === 'connected' ? 'Connected (Synced)' : 'Disconnected');
    });

    provider.awareness.setLocalStateField('user', {
      name: currentUser.username,
      color: currentUser.role === 'Instructor' ? '#ffeb3b' : '#007acc'
    });

    const editorModel = editorInstance.getModel();
    if (editorModel) {
      new MonacoBinding(ytext, editorModel, new Set([editorInstance]), provider.awareness);
    }

    const updateDecorations = () => {
      if (!editorModel || !decorationsCollectionRef.current) return;
      const newDecorations: editor.IModelDeltaDecoration[] = [];
      
      yAuthorship.forEach((authorName, lineNumberStr) => {
        const lineNum = parseInt(lineNumberStr);
        if (lineNum <= editorModel.getLineCount()) {
          newDecorations.push({
            range: new monaco.Range(lineNum, 1, lineNum, 1),
            options: {
              isWholeLine: true,
              hoverMessage: { value: `📝 Written by: **${authorName}**` }
            }
          });
        }
      });
      decorationsCollectionRef.current.set(newDecorations);
    };

    yAuthorship.observe(() => updateDecorations());
    provider.on('sync', (isSynced: boolean) => {
      if (isSynced) updateDecorations();
    });

    let isRemoteUpdate = false;

    ytext.observe((_, transaction) => {
      if (!transaction.local) {
        isRemoteUpdate = true;
      }
    });

    editorInstance.onDidChangeModelContent((e) => {
      onCodeChange(editorInstance.getValue());

      if (isRemoteUpdate) {
        isRemoteUpdate = false;
        return;
      }

      e.changes.forEach(change => {
        const startLine = change.range.startLineNumber;
        const endLine = change.range.endLineNumber;
        for (let i = startLine; i <= endLine; i++) {
          yAuthorship.set(i.toString(), currentUser.username);
        }
      });
    });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px', backgroundColor: '#1e1e1e', color: '#4caf50', fontSize: '12px', fontFamily: 'monospace' }}>
        Status: {status} | Role: {currentUser.role}
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