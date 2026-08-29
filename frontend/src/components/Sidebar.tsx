
import { CalendarClock, Inbox, LayoutDashboard, Search, Settings, Send, Slack } from "lucide-react";
import { Logo } from "./Logo";

export function Sidebar({
  active,
  setActive,
}: {
  active: string;
  setActive: (v: string) => void;
}) {
  const items = [
    ["Scheduled", CalendarClock],
    ["Sent", Send],
    ["Search", Search],
  ] as const;

  return (
    <aside className="fixed left-0 top-0 h-screen w-[235px] border-r border-[#e8ebe8] bg-white flex flex-col">
      <Logo />

      <div className="px-3 pt-5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        Workspace
      </div>

      <nav className="px-3 mt-2 space-y-1">
        {items.map(([label, Icon]) => (
          <button
            key={label}
            onClick={() => setActive(label)}
            className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
              active === label
                ? "bg-[#edf8f0] text-[#138a3c] font-medium"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Icon size={17} />
            {label} Emails
          </button>
        ))}
      </nav>

      <div className="px-3 pt-7 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        Integrations
      </div>

      <nav className="px-3 mt-2">
        <a
          href="https://reachinbox-email-scheduler-backend-hmyn.onrender.com/admin/queues"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          <LayoutDashboard size={17} />
          Queue Monitor
        </a>

        <button
          onClick={() => setActive("Slack")}
          className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
            active === "Slack"
              ? "bg-[#edf8f0] text-[#138a3c]"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Slack size={17} />
          Slack
        </button>
      </nav>

      <div className="mt-auto px-3 pb-5">
        <div className="border-t border-gray-100 pt-3 text-xs text-gray-400 flex items-center gap-2 px-2">
          <Settings size={15} />
          Scheduler settings live in environment config
        </div>
      </div>
    </aside>
  );
}

