import { useState } from 'react';

import type { FormProps } from '../../../types/interfaces';

export default function SessionForms({ createTitle, createBtnText, joinTitle, joinBtnText, onCreate, onJoin }: FormProps) {
  const [newRoomName, setNewRoomName] = useState('');
  const [language, setLanguage] = useState('JavaScript');
  const [joinId, setJoinId] = useState('');

  const handleCreate: React.SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    onCreate(newRoomName, language);
    setNewRoomName('');
  };

  const handleJoin: React.SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (joinId.trim()) onJoin(joinId.trim());
    setJoinId('');
  };

  return (
    <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-lg mb-6">
      <h3 className="mt-0 text-lg font-semibold text-blue-500 mb-4">{createTitle}</h3>
      <form onSubmit={handleCreate} className="flex flex-col gap-3 mb-8">
        <input 
          type="text" placeholder="e.g., Session Name" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} required
          className="w-full p-3 bg-zinc-800 text-white border-none rounded focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <select 
          value={language} onChange={(e) => setLanguage(e.target.value)}
          className="w-full p-3 bg-zinc-800 text-white border-none rounded focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
        >
          <option value="JavaScript">JavaScript</option>
          <option value="Python">Python</option>
          <option value="C++">C++</option>
        </select>
        <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 transition-colors text-white font-bold rounded shadow-lg">{createBtnText}</button>
      </form>

      <h3 className="mt-0 text-lg font-semibold text-orange-500 mb-4">{joinTitle}</h3>
      <form onSubmit={handleJoin} className="flex flex-col gap-3">
        <input 
          type="text" placeholder="8-character Room ID" value={joinId} onChange={(e) => setJoinId(e.target.value)} required
          className="w-full p-3 bg-zinc-800 text-white border-none rounded focus:ring-2 focus:ring-orange-500 outline-none uppercase font-mono"
        />
        <button type="submit" className="w-full py-3 bg-orange-500 hover:bg-orange-600 transition-colors text-white font-bold rounded shadow-lg">{joinBtnText}</button>
      </form>
    </div>
  );
}