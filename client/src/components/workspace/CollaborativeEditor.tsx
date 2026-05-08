import { useContext, useEffect, useRef, useState } from 'react';
import { editor, Range } from 'monaco-editor';
import { MonacoBinding } from 'y-monaco';

import Editor, { type OnMount } from '@monaco-editor/react';

import type { ActiveUser, AwarenessState, Contributor, WorkspaceProps } from '../../types/interfaces';

import { WorkspaceContext } from '../../contexts/WorkspaceContext';

const CURSOR_COLORS = [
  '#f59e0b', '#3b82f6', '#10b981', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
];

export default function CollaborativeEditor() {

  const { user, provider, localDoc, safeActiveFile, language } = useContext(WorkspaceContext) as WorkspaceProps;

  const [editorInstance, setEditorInstance] = useState<editor.IStandaloneCodeEditor | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const decorationsRef = useRef<editor.IEditorDecorationsCollection | null>(null);
  const userColorRef = useRef<string>('');

  const [awarenessUsers, setAwarenessUsers] = useState<Array<ActiveUser>>([]);
  const [uniqueBlameUsers, setUniqueBlameUsers] = useState<Record<string, Contributor>>({});

  const isAdmin = user.role === 'System Administrator';

  const handleEditorDidMount: OnMount = (editor) => {
    setEditorInstance(editor);
    decorationsRef.current = editor.createDecorationsCollection([]);
  };

  useEffect(() => {
    if (!provider) return;

    const userColor = CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)];
    userColorRef.current = userColor;

    provider.awareness.setLocalStateField('user', {
      name: user.username,
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
  }, [provider, user]);

  useEffect(() => {
    if (!editorInstance || !localDoc || !provider || !safeActiveFile) return;

    if (bindingRef.current) {
      bindingRef.current.destroy();
    }

    const localText = localDoc.getText(safeActiveFile);

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
  }, [editorInstance, safeActiveFile, localDoc, provider]);

  useEffect(() => {
    if (!editorInstance || !localDoc || !safeActiveFile) return;

    const blameMap = localDoc.getMap<Contributor>('blame-tracking-v3');

    const changeDisposable = editorInstance.onDidChangeModelContent((e) => {
      if (editorInstance.hasTextFocus()) {
        e.changes.forEach(change => {
          const lines = change.text.split('\n');
          const startLine = change.range.startLineNumber;

          lines.forEach((lineText, index) => {
            const currentLine = startLine + index;
            
            const addedChars = lineText.length;
            const points = addedChars > 0 ? addedChars : 1; 

            const lineKey = `${safeActiveFile}::${currentLine}::${user.username}`;
            const existingContrib = blameMap.get(lineKey);

            blameMap.set(lineKey, {
              name: user.username,
              color: userColorRef.current,
              count: (existingContrib ? existingContrib.count : 0) + points,
              lastEdited: Date.now()
            });
          });
        });
      }
    });
    
    const updateDecorations = () => {
      const newDecorations: editor.IModelDeltaDecoration[] = [];
      const currentBlameState = blameMap.toJSON() as Record<string, Contributor>;
      
      const fileUniqueUsers: Record<string, Contributor> = {};
      const aggregatedByLine: Record<string, Contributor[]> = {};

      Object.entries(currentBlameState).forEach(([key, contributor]) => {
        const parts = key.split('::');
        if (parts.length < 3) return;
        const file = parts[0];
        const lineStr = parts[1];

        if (file === safeActiveFile) {
          if (!aggregatedByLine[lineStr]) {
            aggregatedByLine[lineStr] = [];
          }
          aggregatedByLine[lineStr].push(contributor);
        }
      });

      Object.entries(aggregatedByLine).forEach(([lineStr, contributors]) => {
        const line = parseInt(lineStr, 10);
        if (isNaN(line)) return;

        const sortedContributors = contributors.sort((a, b) => {
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
  }, [editorInstance, localDoc, user, safeActiveFile]);

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

  const dynamicBlameCSS = Object.values(uniqueBlameUsers).map((blameUser) => {
    const initials = blameUser.name.substring(0, 2).toUpperCase();
    const safeClass = blameUser.name.replace(/[^a-zA-Z0-9]/g, '');
    
    const activeMatch = awarenessUsers.find(a => a.state.user && a.state.user.name === blameUser.name);
    const liveColor = activeMatch?.state.user?.color || blameUser.color;

    return `
      .blame-marker-${safeClass} {
        background-color: ${liveColor} !important;
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
        path={safeActiveFile}
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