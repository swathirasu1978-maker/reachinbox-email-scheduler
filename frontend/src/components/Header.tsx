import { LogOut, Plus, Search } from "lucide-react";
import { User } from "../types";

export function Header({ user, onCompose, onLogout }: { user: User; onCompose: () => void; onLogout: () => void }) {
  return (
    <header className="h-[70px] border-b border-[#e8ebe8] bg-white flex items-center justify-between px-8">
      <div>
        <h1 className="text-[17px] font-semibold">Email campaigns</h1>
        <p className="text-xs text-gray-400 mt-0.5">Schedule and monitor your outreach</p>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={onCompose} className="flex items-center gap-2 rounded-md bg-[#16a34a] px-4 py-2 text-sm font-medium text-white hover:bg-[#12823b]">
          <Plus size={16}/> Compose New Email
        </button>
        <div className="h-9 w-px bg-gray-200 mx-1"/>
        {user.avatarUrl ? <img src={user.avatarUrl} className="h-8 w-8 rounded-full" /> : <div className="h-8 w-8 rounded-full bg-green-100 grid place-items-center text-xs font-bold text-green-700">{user.name[0]}</div>}
        <div className="text-right leading-tight">
          <div className="text-xs font-semibold">{user.name}</div>
          <div className="text-[11px] text-gray-400">{user.email}</div>
        </div>
        <button onClick={onLogout} title="Logout" className="p-2 rounded hover:bg-gray-50 text-gray-500"><LogOut size={17}/></button>
      </div>
    </header>
  );
}
