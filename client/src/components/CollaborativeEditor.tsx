import { useEffect, useRef, useState } from 'react';
import { editor, Range } from 'monaco-editor';
import { MonacoBinding } from 'y-monaco';

import Editor, { type OnMount } from '@monaco-editor/react';

import type { CollaborativeEditorProps, ActiveUser, AwarenessState, Contributor } from '../types/interfaces';

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
  const [uniqueBlameUsers, setUniqueBlameUsers] = useState<Record<string, Contributor>>({});

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

    const handleBeforeUnload = () => provider.awareness.setLocalState(null);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      provider.awareness.off('change', updateAwareness);
      provider.awareness.setLocalState(null); 
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
    if (!editorInstance || !localDoc || !activeFile) return;

    const blameMap = localDoc.getMap<Record<string, Contributor>>('blame-tracking-v2');

    const changeDisposable = editorInstance.onDidChangeModelContent((e) => {
      if (editorInstance.hasTextFocus()) {
        e.changes.forEach(change => {
          const lines = change.text.split('\n');
          const startLine = change.range.startLineNumber;

          lines.forEach((lineText, index) => {
            const currentLine = startLine + index;
            
            const addedChars = lineText.length;
            const points = addedChars > 0 ? addedChars : 1; 

            const lineKey = `${activeFile}::${currentLine}`;
            const currentLineData = blameMap.get(lineKey) || {};

            const userContrib = currentLineData[currentUser.username] || {
              name: currentUser.username,
              color: userColorRef.current,
              count: 0,
              lastEdited: Date.now()
            };

            blameMap.set(lineKey, {
              ...currentLineData,
              [currentUser.username]: {
                ...userContrib,
                count: userContrib.count + points,
                lastEdited: Date.now()
              }
            });
          });
        });
      }
    });
    
    const updateDecorations = () => {
      const newDecorations: editor.IModelDeltaDecoration[] = [];
      const currentBlameState = blameMap.toJSON() as Record<string, Record<string, Contributor>>;
      
      const fileUniqueUsers: Record<string, Contributor> = {};

      Object.entries(currentBlameState).forEach(([key, contributors]) => {
        const [file, lineStr] = key.split('::');

        if (file === activeFile) {
          const line = parseInt(lineStr, 10);
          if (isNaN(line)) return;

          const sortedContributors = Object.values(contributors).sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            return b.lastEdited - a.lastEdited;
          });

          if (sortedContributors.length === 0) return;

          const primary = sortedContributors[0];
          const safeClass = primary.name.replace(/[^a-zA-Z0-9]/g, '');

          sortedContributors.forEach(c => {
            if (!fileUniqueUsers[c.name]) fileUniqueUsers[c.name] = c;
          });

          const hoverMarkdown = sortedContributors.map((c, i) => 
            `${i === 0 ? '🏆' : '•'} **${c.name}**: ${c.count} contributions`
          ).join('\n\n');

          newDecorations.push({
            range: new Range(line, 1, line, 1),
            options: {
              isWholeLine: false,
              glyphMarginClassName: `blame-marker-${safeClass}`,
              glyphMarginHoverMessage: { value: `### Line Authors\n\n${hoverMarkdown}` }
            }
          });
        }
      });

      setUniqueBlameUsers(fileUniqueUsers);
      decorationsRef.current?.set(newDecorations);
    };

    blameMap.observe(updateDecorations);
    updateDecorations(); 

    return () => {
      changeDisposable.dispose();
      blameMap.unobserve(updateDecorations);
    };
  }, [editorInstance, localDoc, currentUser, activeFile]);

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

  const dynamicBlameCSS = Object.values(uniqueBlameUsers).map((user) => {
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