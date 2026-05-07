import type { JoinSessionFormProps } from "../../../types/interfaces";

export default function JoinSessionForm({ handleJoin, joinId, setJoinId, joinBtnText }: JoinSessionFormProps) {
  return (
    <form onSubmit={handleJoin} className="flex flex-col gap-3">
      <input
        type="text" placeholder="8-character Room ID" value={joinId} onChange={(e) => setJoinId(e.target.value)} required
        className="w-full p-3 bg-zinc-800 text-white border-none rounded focus:ring-2 focus:ring-orange-500 outline-none uppercase font-mono"
      />
      <button type="submit" className="w-full py-3 bg-orange-500 hover:bg-orange-600 transition-colors text-white font-bold rounded shadow-lg">{joinBtnText}</button>
    </form>
  );
}