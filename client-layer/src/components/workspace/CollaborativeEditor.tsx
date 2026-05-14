import { useContext, useEffect, useState } from 'react';
import { editor } from 'monaco-editor';
import Editor, { type OnMount } from '@monaco-editor/react';

import type { WorkspaceProps } from '../../types/interfaces';
import { WorkspaceContext } from '../../contexts/WorkspaceContext';

import { useAwareness } from '../hooks/useAwareness';
import { useYjsMonacoBinding } from '../hooks/useYjsMonacoBinding';
import { useBlameTracking } from '../hooks/useBlameTracking';
import DynamicStyles from './DynamicStyles';

export default function CollaborativeEditor() {
  const { user, provider, localDoc, safeActiveFile, language } = useContext(WorkspaceContext) as WorkspaceProps;

  const [editorInstance, setEditorInstance] = useState<editor.IStandaloneCodeEditor | null>(null);

  const isAdmin = user.role === 'System Administrator';
  const isPrivileged = user.role === 'Instructor' || user.role === 'System Administrator';

  const awarenessUsers = useAwareness(provider, user, isAdmin);
  useYjsMonacoBinding(editorInstance, localDoc, provider, safeActiveFile);
  const uniqueBlameUsers = useBlameTracking(editorInstance, localDoc, user, safeActiveFile, isPrivileged);

  const handleEditorDidMount: OnMount = (editor) => {
    setEditorInstance(editor);
  };

  useEffect(() => {
    if (!safeActiveFile) return;
    if (editorInstance) {
      editorInstance.focus();
    }
  }, [safeActiveFile, editorInstance]);

  return (
    <section className="h-full w-full relative" id='editor-selected-file' aria-label={`Code Editor for ${safeActiveFile}`}>
      
      <DynamicStyles 
        awarenessUsers={awarenessUsers} 
        uniqueBlameUsers={uniqueBlameUsers} 
        user={user} 
        isPrivileged={isPrivileged} 
      />

      <Editor
        height="100%"
        theme="vs-dark"
        language={language}
        path={safeActiveFile}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: 'on',
          padding: { top: 16 },
          readOnly: isAdmin,
          accessibilitySupport: 'on',
          glyphMargin: isPrivileged,
          ariaLabel: `Code Editor. Press Control + M to toggle Tab key trapping.`
        }}
      />
    </section>
  );
}