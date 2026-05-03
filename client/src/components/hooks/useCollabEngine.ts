import * as Y from 'yjs';

import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { editor } from 'monaco-editor';
import { useEffect, useRef, useState } from 'react';

export function useCollabEngine(currentRoom: string, editorInstance: editor.IStandaloneCodeEditor | null) {
  const [status, setStatus] = useState<string>('Connecting...');
  
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!editorInstance) return;

    const localDoc = new Y.Doc();
    const localText = localDoc.getText('monaco');
    const networkDoc = new Y.Doc();

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

    bindingRef.current = new MonacoBinding(
      localText, 
      editorInstance.getModel()!, 
      new Set([editorInstance]), 
      provider.awareness
    );

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
      if (bindingRef.current) bindingRef.current.destroy();
      if (providerRef.current) {
        providerRef.current.disconnect();
        providerRef.current.destroy();
      }
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [editorInstance, currentRoom]);

  return { status };
}