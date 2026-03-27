import { useRef, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { editor } from 'monaco-editor';
import { MonacoBinding } from 'y-monaco';

export default function CollaborativeEditor() {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [status, setStatus] = useState<string>('Connecting...');

  
}