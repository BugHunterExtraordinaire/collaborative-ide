import type { CreateSessionFormProps } from "../../../types/interfaces";

export default function CreateSessionForm({ handleCreate, newRoomName, setNewRoomName, language, setLanguage, createBtnText }: CreateSessionFormProps) {
  return (
    <form onSubmit={handleCreate} className="flex flex-col gap-3 mb-8">

      <label htmlFor="session-name" className="sr-only">Enter Session Name:</label>
      <input
        type="text" placeholder="e.g., Session Name" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} required
        className="w-full p-3 bg-zinc-800 text-white border-none rounded focus:ring-2 focus:ring-blue-500 outline-none"
        id="session-name"
      />

      <label htmlFor="session-language" className="sr-only">Select a session language</label>
      <select
        value={language} onChange={(e) => setLanguage(e.target.value)}
        className="w-full p-3 bg-zinc-800 text-white border-none rounded focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
        id="session-language"
      >
        <option value="JavaScript">JavaScript</option>
        <option value="Python">Python</option>
        <option value="C++">C++</option>
      </select>
      <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 transition-colors text-white font-bold rounded shadow-lg">{createBtnText}</button>
    </form>
  );
}