import { useRef, useState, useEffect } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { editor } from 'monaco-editor';
import { MonacoBinding } from 'y-monaco';
import { type CollaborativeEditorProps } from '../types/interfaces';

export default function CollaborativeEditor({ currentRoom, language, currentUser, onCodeChange }: CollaborativeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const decorationsCollectionRef = useRef<editor.IEditorDecorationsCollection | null>(null);
  const [status, setStatus] = useState<string>('Connecting...');

  useEffect(() => {
    return () => {
      if (bindingRef.current) bindingRef.current.destroy();
      if (providerRef.current) {
        providerRef.current.disconnect();
        providerRef.current.destroy();
      }
      if (debounceTimerRef.current) clearInterval(debounceTimerRef.current);
    };
  }, []);

  const handleEditorDidMount: OnMount = (editorInstance, monaco) => {
    editorRef.current = editorInstance;
    decorationsCollectionRef.current = editorInstance.createDecorationsCollection([]);

    const localDoc = new Y.Doc();
    const localText = localDoc.getText('monaco');

    const networkDoc = new Y.Doc();

    const backendPort = new URLSearchParams(window.location.search).get('port') || '4000';

    const provider = new WebsocketProvider(
      `ws://localhost:${backendPort}/yjs`, 
      currentRoom, 
      networkDoc 
    );
    providerRef.current = provider;

    provider.on('status', (event: { status: string }) => {
      setStatus(event.status === 'connected' ? 'Connected (Synced)' : 'Disconnected');
      if (event.status === 'connected') {
        provider.awareness.setLocalStateField('user', {
          name: currentUser.username,
          color: currentUser.role === 'Instructor' ? '#ffeb3b' : '#007acc'
        });
      }
    });

    provider.awareness.setLocalStateField('user', {
      name: currentUser.username,
      color: currentUser.role === 'Instructor' ? '#ffeb3b' : '#007acc'
    });

    const editorModel = editorInstance.getModel();
    if (editorModel) {
      bindingRef.current = new MonacoBinding(localText, editorModel, new Set([editorInstance]));
    }

    const outboundBuffer = { current: [] as Uint8Array[] };

    localDoc.on('update', (update: Uint8Array, origin: string) => {
      if (origin !== 'network') {
        outboundBuffer.current.push(update);

        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

        debounceTimerRef.current = setTimeout(() => {
          if (outboundBuffer.current.length > 0) {
            console.log(`[True Debounce] Silence detected. Compressing ${outboundBuffer.current.length} keystrokes.`);
            
            const mergedUpdate = Y.mergeUpdates(outboundBuffer.current);
            outboundBuffer.current = []; 
            Y.applyUpdate(networkDoc, mergedUpdate, 'local');
          }
        }, 200);
      }
    });

    networkDoc.on('update', (update: Uint8Array, origin: string) => {
      if (origin !== 'local') {
        Y.applyUpdate(localDoc, update, 'network');
      }
    });

    debounceTimerRef.current = setInterval(() => {
      if (outboundBuffer.current.length > 0) {
        console.log(`[Debounce Engine] Compressing ${outboundBuffer.current.length} keystrokes into 1 payload.`);
        
        const mergedUpdate = Y.mergeUpdates(outboundBuffer.current);
        outboundBuffer.current = [];
        
        Y.applyUpdate(networkDoc, mergedUpdate, 'local');
      }
    }, 200);

    const updateDecorations = () => {
      if (!editorModel || !decorationsCollectionRef.current) return;

      const deltas = localText.toDelta();
      const newDecorations: editor.IModelDeltaDecoration[] = [];
      let currentOffset = 0;

      for (const op of deltas) {
        const length = op.insert ? String(op.insert).length : 0;

        if (op.attributes && op.attributes.author) {
          const startPos = editorModel.getPositionAt(currentOffset);
          const endPos = editorModel.getPositionAt(currentOffset + length);

          newDecorations.push({
            range: new monaco.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column),
            options: {
              hoverMessage: { value: `📝 Written by: **${op.attributes.author}**` },
            }
          });
        }
        currentOffset += length;
      }
      decorationsCollectionRef.current.set(newDecorations);
    };

    provider.on('sync', (isSynced: boolean) => {
      if (isSynced) updateDecorations();
    });

    localText.observe((event, transaction) => {
      updateDecorations();

      if (transaction.local && transaction.origin !== 'authorship-formatting') {
        let currentPos = 0;
        const formatsToApply: { index: number, length: number }[] = [];

        for (const op of event.delta) {
          if (op.retain) {
            currentPos += op.retain;
          } else if (op.insert) {
            const len = String(op.insert).length;
            formatsToApply.push({ index: currentPos, length: len });
            currentPos += len;
          }
        }

        if (formatsToApply.length > 0) {
          setTimeout(() => {
            localDoc.transact(() => {
              for (const fmt of formatsToApply) {
                localText.format(fmt.index, fmt.length, { author: currentUser.username });
              }
            }, 'authorship-formatting');
          }, 0);
        }
      }
    });

    editorInstance.onDidChangeModelContent(() => {
      onCodeChange(editorInstance.getValue());
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      <div className="p-1.5 px-3 bg-[#1e1e1e] flex justify-between items-center text-xs font-mono border-b border-zinc-800">
        <span className={status.includes('Connected') ? 'text-green-500' : 'text-orange-500'}>
          ● {status}
        </span>
        <span className="text-zinc-400">Role: <span className="text-zinc-200">{currentUser.role}</span></span>
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