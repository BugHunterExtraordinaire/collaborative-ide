import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { editor } from 'monaco-editor';
import { useEffect, useRef, useState } from 'react';

export function useCollabEngine(currentRoom: string, editorInstance: editor.IStandaloneCodeEditor | null, activeFile: string) {
  const [status, setStatus] = useState<string>('Connecting...');
  
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const docsRef = useRef<{ local: Y.Doc, network: Y.Doc } | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const localDoc = new Y.Doc();
    const networkDoc = new Y.Doc();
    docsRef.current = { local: localDoc, network: networkDoc };

    const backendPort = new URLSearchParams(window.location.search).get('port') || '80';

    const provider = new WebsocketProvider(
      `ws://localhost:${backendPort}`,
      `yjs/${currentRoom}`,
      networkDoc
    );
    providerRef.current = provider;

    provider.on('status', (event: { status: string }) => {
      setStatus(event.status === 'connected' ? 'Connected' : 'Disconnected');
    });

    const outboundBuffer = { current: [] as Uint8Array[] };

    localDoc.on('update', (update: Uint8Array, origin: string) => {
      if (origin !== 'network') {
        outboundBuffer.current.push(update);

        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

        debounceTimerRef.current = setTimeout(() => {
          if (outboundBuffer.current.length > 0) {
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

    return () => {
      provider.disconnect();
      provider.destroy();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [currentRoom]);

  useEffect(() => {
    if (!editorInstance || !docsRef.current || !providerRef.current) return;

    if (bindingRef.current) {
      bindingRef.current.destroy();
    }

    const localText = docsRef.current.local.getText(activeFile);

    bindingRef.current = new MonacoBinding(
      localText, 
      editorInstance.getModel()!, 
      new Set([editorInstance]), 
      providerRef.current.awareness
    );

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
      }
    };
  }, [editorInstance, activeFile]);

  return { status };
}