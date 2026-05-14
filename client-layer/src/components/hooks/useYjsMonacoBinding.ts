import { useEffect, useRef } from 'react';
import { editor } from 'monaco-editor';
import { MonacoBinding } from 'y-monaco';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useYjsMonacoBinding = (editorInstance: editor.IStandaloneCodeEditor | null, localDoc: any, provider: any, safeActiveFile: string) => {
  const bindingRef = useRef<MonacoBinding | null>(null);

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
};