import { useEffect, useState } from "react";
import { api } from "./api";
import { User, EmailRow, SlackStatus } from "./types";
import { Login } from "./pages/Login";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { EmailTable } from "./components/EmailTable";
import { ComposeModal } from "./components/ComposeModal";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [active, setActive] = useState("Scheduled");
  const [scheduled, setScheduled] = useState<EmailRow[]>([]);
  const [sent, setSent] = useState<EmailRow[]>([]);
  const [slack, setSlack] = useState<SlackStatus>({ connected: false });
  const [compose, setCompose] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  async function load() {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
      const [s, se, sl] = await Promise.all([
        api.get("/emails/scheduled"), api.get("/emails/sent"), api.get("/slack/status")
      ]);
      setScheduled(s.data); setSent(se.data); setSlack(sl.data);
    } catch { setUser(null); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function logout() { await api.post("/auth/logout"); setUser(null); }
  async function doSearch() {
    if (!search.trim()) return setSearchResults([]);
    const { data } = await api.get("/emails/search", { params: { q: search } });
    setSearchResults(data);
  }
  async function disconnectSlack() { await api.delete("/slack/disconnect"); setSlack({ connected: false }); }

  if (loading) return <div className="min-h-screen grid place-items-center text-sm text-gray-400">Loading...</div>;
  if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-[#fbfcfb]">
      <Sidebar active={active} setActive={setActive}/>
      <main className="ml-[235px]">
        <Header user={user} onCompose={() => setCompose(true)} onLogout={logout}/>
        <div className="px-8 py-7 max-w-[1400px]">
          {active === "Slack" ? (
            <section className="max-w-xl">
              <h2 className="text-lg font-semibold">Slack notifications</h2>
              <p className="mt-1 text-sm text-gray-400">Get a real Slack message when a sender reaches its hourly limit.</p>
              <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6">
                <div className="text-sm font-medium">{slack.connected ? `Connected${slack.teamName ? ` to ${slack.teamName}` : ""}` : "Not connected"}</div>
                <div className="mt-4">{slack.connected ? <button onClick={disconnectSlack} className="rounded-md border border-gray-200 px-4 py-2 text-xs">Disconnect Slack</button> : <a href={`${import.meta.env.VITE_API_URL || "http://localhost:4000/api"}/slack/connect`} className="inline-block rounded-md bg-[#16a34a] px-4 py-2 text-xs font-medium text-white">Connect Slack</a>}</div>
              </div>
            </section>
          ) : active === "Search" ? (
            <section>
              <div className="flex items-end justify-between mb-6"><div><h2 className="text-lg font-semibold">Search emails</h2><p className="text-xs text-gray-400 mt-1">Elasticsearch-backed recipient, subject and body search.</p></div></div>
              <div className="flex gap-2 mb-5 max-w-2xl"><input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doSearch()} placeholder="Search recipient or subject..." className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm"/><button onClick={doSearch} className="rounded-md bg-gray-900 px-4 text-xs text-white">Search</button></div>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden"><EmailTable rows={searchResults.map(x=>({id:x.emailId,recipient:x.recipient,subject:x.subject,body:x.body,scheduledAt:x.scheduledAt,sentAt:x.sentAt,status:x.status}))} mode="sent"/></div>
            </section>
          ) : (
            <section>
              <div className="flex items-end justify-between mb-6">
                <div><h2 className="text-lg font-semibold">{active} Emails</h2><p className="text-xs text-gray-400 mt-1">{active === "Scheduled" ? "Emails waiting in the durable scheduler." : "Emails processed by the worker."}</p></div>
                {active === "Scheduled" && <button onClick={() => setCompose(true)} className="text-xs text-green-700 font-medium">+ New campaign</button>}
              </div>
              <EmailTable rows={active === "Scheduled" ? scheduled : sent} mode={active === "Scheduled" ? "scheduled" : "sent"}/>
            </section>
          )}
        </div>
      </main>
      {compose && <ComposeModal onClose={() => setCompose(false)} onScheduled={load}/>}
    </div>
  );
}
