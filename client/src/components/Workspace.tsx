import { useContext } from "react";

import { Editor } from "@monaco-editor/react";

import EditorToolbar from "./workspace/EditorToolbar";
import FileTabs from "./workspace/FileTabs";
import PlaybackScrubber from "./workspace/PlaybackScrubber";
import CollaborativeEditor from "./workspace/CollaborativeEditor";
import TerminalPanel from "./workspace/TerminalPanel";
import Chat from "./workspace/Chat";

import { WorkspaceContext } from "../App";

import type { WorkspaceProps } from "../types/interfaces";

export default function Workspace() {

  const { yjsStatus, isPlaybackMode, language, safeActiveFile, playbackCode } = useContext(WorkspaceContext) as WorkspaceProps;

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      <div className="w-3/5 border-r border-zinc-800 flex flex-col bg-zinc-900">
        <div className="absolute top-10 right-[41%] z-10 text-xs font-mono px-2 py-1 bg-black/50 rounded border border-zinc-700 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${yjsStatus === 'Connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
          {yjsStatus}
        </div>

        <EditorToolbar />

        <FileTabs />

        {isPlaybackMode && <PlaybackScrubber /> }

        <div className="grow relative">
          {isPlaybackMode ? (
            <Editor
              height="100%"
              theme="vs-dark"
              language={language.toLowerCase()}
              path={safeActiveFile}
              value={playbackCode}
              options={{ readOnly: true, minimap: { enabled: false }, fontSize: 14 }}
            />
          ) : ( <CollaborativeEditor /> )}
        </div>
      </div>

      <div className="w-2/5 flex flex-col bg-zinc-900">
        <TerminalPanel />
        <div className="h-1/2 flex flex-col border-t border-zinc-800">
          <Chat />
        </div>
      </div>
    </div>
  );
}