import { useEffect, useRef, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { MonacoBinding } from 'y-monaco';
import type { CollaborativeEditorProps, AwarenessState} from '../types/interfaces';

const CURSOR_COLORS = [
  '#f59e0b', '#3b82f6', '#10b981', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
];

export default function CollaborativeEditor({
  language,
  currentUser,
  activeFile,
  localDoc,
  provider
}: CollaborativeEditorProps) {
  const [editorInstance, setEditorInstance] = useState<editor.IStandaloneCodeEditor | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  const [awarenessUsers, setAwarenessUsers] = useState<[number, AwarenessState][]>([]);

  const isAdmin = currentUser.role === 'System Administrator';

  const handleEditorDidMount: OnMount = (editor) => {
    setEditorInstance(editor);
  };

  useEffect(() => {
    if (!provider) return;

    const userColor = CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)];

    provider.awareness.setLocalStateField('user', {
      name: currentUser.username,
      color: userColor
    });

    const updateAwareness = () => {
      setAwarenessUsers(Array.from(provider.awareness.getStates().entries()));
    };

    provider.awareness.on('change', updateAwareness);
    updateAwareness();

    return () => {
      provider.awareness.off('change', updateAwareness);
    };
  }, [provider, currentUser]);

  useEffect(() => {
    if (!editorInstance || !localDoc || !provider || !activeFile) return;

    if (bindingRef.current) {
      bindingRef.current.destroy();
    }

    const localText = localDoc.getText(activeFile);

    bindingRef.current = new MonacoBinding(
      localText,
      editorInstance.getModel()!,
      new Set([editorInstance]),
      provider.awareness
    );

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
      }
    };
  }, [editorInstance, activeFile, localDoc, provider]);

  const dynamicCursorCSS = awarenessUsers.map(([clientId, state]) => {
    if (!state || !state.user || !state.user.color) return '';
    const color = state.user.color;
    const name = state.user.name;
    return `
      .yRemoteSelection-${clientId} {
        background-color: ${color}40 !important;
      }
      .yRemoteSelectionHead-${clientId} {
        border-left: 2px solid ${color} !important;
        position: absolute;
        box-sizing: border-box;
        height: 100%;
        pointer-events: auto !important; /* Allows mouse hover */
      }
      .yRemoteSelectionHead-${clientId}::after {
        position: absolute;
        content: ' ';
        border: 5px solid ${color};
        border-radius: 4px;
        left: -6px;
        top: -5px;
      }
      .yRemoteSelectionHead-${clientId}::before {
        position: absolute;
        content: '${name}';
        top: -24px;
        left: -2px;
        background-color: ${color};
        color: white;
        font-size: 11px;
        font-weight: bold;
        padding: 2px 6px;
        border-radius: 4px;
        white-space: nowrap;
        z-index: 50;
        opacity: 0;
        transition: opacity 0.15s ease-in-out;
      }
      .yRemoteSelectionHead-${clientId}:hover::before {
        opacity: 1;
      }
    `;
  }).join('\n');

  return (
    <div className="h-full w-full relative">
      <style dangerouslySetInnerHTML={{ __html: dynamicCursorCSS }} />
      <Editor
        height="100%"
        theme="vs-dark"
        language={language.toLowerCase()}
        path={activeFile}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: 'on',
          padding: { top: 16 },
          readOnly: isAdmin
        }}
      />
    </div>
  );
}