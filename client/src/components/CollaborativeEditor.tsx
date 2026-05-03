import { useEffect, useRef, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { editor, Range } from 'monaco-editor';
import { MonacoBinding } from 'y-monaco';
import type { CollaborativeEditorProps, BlameRecord, ActiveUser, AwarenessState } from '../types/interfaces';

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
  const decorationsRef = useRef<editor.IEditorDecorationsCollection | null>(null);
  const userColorRef = useRef<string>('');

  const [awarenessUsers, setAwarenessUsers] = useState<ActiveUser[]>([]);
  const [blameData, setBlameData] = useState<Record<string, BlameRecord>>({});

  const isAdmin = currentUser.role === 'System Administrator';

  const handleEditorDidMount: OnMount = (editor) => {
    setEditorInstance(editor);
    decorationsRef.current = editor.createDecorationsCollection([]);
  };

  useEffect(() => {
    if (!provider) return;

    const userColor = CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)];
    userColorRef.current = userColor;

    provider.awareness.setLocalStateField('user', {
      name: currentUser.username,
      color: userColor
    });

    const updateAwareness = () => {
      const rawStates = Array.from(provider.awareness.getStates().entries());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedUsers: ActiveUser[] = rawStates.map((entry: any) => ({
        clientId: entry[0],
        state: entry[1] as AwarenessState
      }));
      setAwarenessUsers(mappedUsers);
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

  useEffect(() => {
    if (!editorInstance || !localDoc) return;

    const blameMap = localDoc.getMap<BlameRecord>('blame-tracking');

    const changeDisposable = editorInstance.onDidChangeModelContent(() => {
      if (editorInstance.hasTextFocus()) {
        const pos = editorInstance.getPosition();
        if (pos) {
          blameMap.set(pos.lineNumber.toString(), {
            name: currentUser.username,
            color: userColorRef.current
          });
        }
      }
    });
    
    const updateDecorations = () => {
      const newDecorations: editor.IModelDeltaDecoration[] = [];
      const currentBlameState = blameMap.toJSON() as Record<string, BlameRecord>;
      
      setBlameData(currentBlameState);

      Object.entries(currentBlameState).forEach(([lineStr, userData]) => {
        const line = parseInt(lineStr, 10);
        if (isNaN(line)) return;

        const safeClass = userData.name.replace(/[^a-zA-Z0-9]/g, '');

        newDecorations.push({
          range: new Range(line, 1, line, 1),
          options: {
            isWholeLine: false,
            glyphMarginClassName: `blame-marker-${safeClass}`,
            glyphMarginHoverMessage: { value: `**${userData.name}** wrote/edited this line.` }
          }
        });
      });

      decorationsRef.current?.set(newDecorations);
    };

    blameMap.observe(updateDecorations);
    updateDecorations(); 

    return () => {
      changeDisposable.dispose();
      blameMap.unobserve(updateDecorations);
    };
  }, [editorInstance, localDoc, currentUser]);

  const dynamicCursorCSS = awarenessUsers.map(({ clientId, state }) => {
    if (!state || !state.user || !state.user.color) return '';
    const { color, name } = state.user;
    return `
      .yRemoteSelection-${clientId} { background-color: ${color}40 !important; }
      .yRemoteSelectionHead-${clientId} {
        border-left: 2px solid ${color} !important;
        position: absolute;
        box-sizing: border-box;
        height: 100%;
        pointer-events: auto !important;
      }
      .yRemoteSelectionHead-${clientId}::after {
        position: absolute; content: ' ';
        border: 5px solid ${color}; border-radius: 4px;
        left: -6px; top: -5px;
      }
      .yRemoteSelectionHead-${clientId}::before {
        position: absolute; content: '${name}';
        top: -24px; left: -2px;
        background-color: ${color}; color: white;
        font-size: 11px; font-weight: bold;
        padding: 2px 6px; border-radius: 4px;
        white-space: nowrap; z-index: 50;
        opacity: 0; transition: opacity 0.15s ease-in-out;
      }
      .yRemoteSelectionHead-${clientId}:hover::before { opacity: 1; }
    `;
  }).join('\n');

  const dynamicBlameCSS = Object.values(blameData).map((user) => {
    const initials = user.name.substring(0, 2).toUpperCase();
    const safeClass = user.name.replace(/[^a-zA-Z0-9]/g, '');
    return `
      .blame-marker-${safeClass} {
        background-color: ${user.color} !important;
        color: #ffffff !important;
        font-size: 10px;
        font-weight: 900;
        display: flex !important;
        align-items: center;
        justify-content: center;
        border-radius: 3px;
        margin-left: 4px;
        width: 18px !important;
        opacity: 0.85;
      }
      .blame-marker-${safeClass}::after {
        content: '${initials}';
      }
    `;
  }).join('\n');

  return (
    <div className="h-full w-full relative">
      <style dangerouslySetInnerHTML={{ __html: dynamicCursorCSS + '\n' + dynamicBlameCSS }} />
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
          readOnly: isAdmin,
          glyphMargin: true,
        }}
      />
    </div>
  );
}