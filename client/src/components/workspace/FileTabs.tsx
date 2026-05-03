import { useState } from 'react';
import { type FileTabsProps } from '../../types/interfaces';

export default function FileTabs({ files, activeFile, onSelectFile, onAddFile, isPlaybackMode }: FileTabsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFileName.trim() && !files.includes(newFileName.trim())) {
      onAddFile(newFileName.trim());
      setNewFileName('');
      setIsAdding(false);
    }
  };

  return (
    <div className="flex items-center bg-zinc-950 border-b border-zinc-800 overflow-x-auto text-sm">
      {files.map(file => (
        <button
          key={file}
          onClick={() => onSelectFile(file)}
          className={`px-4 py-2 border-r border-zinc-800 transition-colors ${
            activeFile === file 
              ? 'bg-zinc-900 text-blue-400 border-t-2 border-t-blue-500' 
              : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-300'
          }`}
        >
          {file}
        </button>
      ))}

      {!isPlaybackMode && (
        isAdding ? (
          <form onSubmit={handleAdd} className="flex items-center px-2">
            <input
              type="text"
              autoFocus
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onBlur={() => setIsAdding(false)}
              className="bg-zinc-800 text-white px-2 py-1 rounded outline-none text-xs w-28 focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. utils.cpp"
            />
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="px-3 py-2 text-zinc-500 hover:text-zinc-300 transition-colors font-bold"
            title="New File"
          >
            +
          </button>
        )
      )}
    </div>
  );
}