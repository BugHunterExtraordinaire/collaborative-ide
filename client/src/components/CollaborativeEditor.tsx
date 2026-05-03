import { useEffect, useRef, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { MonacoBinding } from 'y-monaco';
import { type CollaborativeEditorProps } from '../types/interfaces';

export default function CollaborativeEditor({
  language,
  currentUser,
  activeFile,
  localDoc,
  provider
}: CollaborativeEditorProps) {
  const [editorInstance, setEditorInstance] = useState<editor.IStandaloneCodeEditor | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  const isAdmin = currentUser.role === 'System Administrator';

  const handleEditorDidMount: OnMount = (editor) => {
    setEditorInstance(editor);
  };

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

  return (
    <div className="h-full w-full">
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