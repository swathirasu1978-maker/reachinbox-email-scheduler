import { ChangeEvent, useMemo, useState } from "react";
import { X, UploadCloud, CheckCircle2 } from "lucide-react";
import { api } from "../api";

export function ComposeModal({ onClose, onScheduled }: { onClose: () => void; onScheduled: () => void }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [startTime, setStartTime] = useState(() => {
    const d = new Date(Date.now() + 60000);
    d.setSeconds(0,0);
    return new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,16);
  });
  const [delayMs, setDelayMs] = useState(2000);
  const [hourlyLimit, setHourlyLimit] = useState(200);
  const [emails, setEmails] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await api.post("/emails/parse-leads", fd);
      setEmails(data.emails);
    } catch {
      setError("Could not parse the file.");
    }
  }

  async function submit() {
    setError("");
    if (!subject || !body || !senderEmail || !emails.length) {
      setError("Subject, body, sender email and at least one lead are required.");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("subject", subject);
      fd.append("body", body);
      fd.append("senderEmail", senderEmail);
      fd.append("startTime", new Date(startTime).toISOString());
      fd.append("delayMs", String(delayMs));
      fd.append("hourlyLimit", String(hourlyLimit));
      fd.append("emails", emails.join("\n"));
      await api.post("/emails/schedule", fd);
      onScheduled();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Scheduling failed.");
    } finally { setLoading(false); }
  }

  const delayLabel = useMemo(() => {
    if (delayMs < 1000) return `${delayMs} ms`;
    return `${delayMs / 1000} sec`;
  }, [delayMs]);

  return (
    <div className="fixed inset-0 z-50 bg-black/25 backdrop-blur-[1px] flex items-start justify-center pt-12">
      <div className="w-[780px] rounded-xl bg-white border border-gray-200 shadow-2xl overflow-hidden">
        <div className="h-14 border-b border-gray-100 flex items-center justify-between px-6">
          <div><h2 className="text-sm font-semibold">Compose New Email</h2><p className="text-[11px] text-gray-400">Create a scheduled email campaign</p></div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-50 rounded"><X size={18}/></button>
        </div>
        <div className="grid grid-cols-[1fr_240px]">
          <div className="p-6 space-y-4 border-r border-gray-100">
            <label className="block"><span className="text-xs font-medium text-gray-600">Sender email</span><input value={senderEmail} onChange={e=>setSenderEmail(e.target.value)} placeholder="sender@yourdomain.com" className="mt-1.5 w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-green-500"/></label>
            <label className="block"><span className="text-xs font-medium text-gray-600">Subject</span><input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Your subject line" className="mt-1.5 w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-green-500"/></label>
            <label className="block"><span className="text-xs font-medium text-gray-600">Email body</span><textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Write your email..." rows={8} className="mt-1.5 w-full resize-none rounded-md border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-green-500"/></label>
            <label className="block">
              <span className="text-xs font-medium text-gray-600">Lead file</span>
              <div className="mt-1.5 border border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-between bg-[#fcfdfc]">
                <div className="flex items-center gap-3"><UploadCloud size={18} className="text-green-600"/><div><div className="text-xs font-medium">{fileName || "Upload CSV or text file"}</div><div className="text-[11px] text-gray-400">Email addresses are detected automatically</div></div></div>
                <input type="file" accept=".csv,.txt,text/csv,text/plain" onChange={fileChange} className="w-[180px] text-xs"/>
              </div>
              {emails.length > 0 && <div className="mt-2 flex items-center gap-2 text-xs text-green-700"><CheckCircle2 size={14}/> {emails.length} email addresses detected</div>}
            </label>
          </div>
          <div className="p-5 bg-[#fcfdfc] space-y-5">
            <div><div className="text-xs font-semibold text-gray-700">Schedule</div><p className="text-[11px] text-gray-400 mt-1">Control when the campaign starts and how quickly it sends.</p></div>
            <label className="block"><span className="text-[11px] font-medium text-gray-500">Start time</span><input type="datetime-local" value={startTime} onChange={e=>setStartTime(e.target.value)} className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2.5 py-2 text-xs"/></label>
            <label className="block"><span className="text-[11px] font-medium text-gray-500">Delay between emails</span><input type="number" min="0" value={delayMs} onChange={e=>setDelayMs(Number(e.target.value))} className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2.5 py-2 text-xs"/><span className="text-[10px] text-gray-400">{delayLabel}</span></label>
            <label className="block"><span className="text-[11px] font-medium text-gray-500">Hourly limit</span><input type="number" min="1" value={hourlyLimit} onChange={e=>setHourlyLimit(Number(e.target.value))} className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2.5 py-2 text-xs"/></label>
            <div className="rounded-lg border border-gray-200 bg-white p-3 text-[11px] text-gray-500 leading-5">Jobs are persisted in BullMQ/Redis. The worker applies Redis-backed rate limiting and idempotency.</div>
          </div>
        </div>
        {error && <div className="mx-6 mb-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>}
        <div className="h-16 border-t border-gray-100 flex justify-end items-center gap-2 px-6">
          <button onClick={onClose} className="rounded-md border border-gray-200 px-4 py-2 text-xs text-gray-600">Cancel</button>
          <button onClick={submit} disabled={loading} className="rounded-md bg-[#16a34a] px-5 py-2 text-xs font-medium text-white disabled:opacity-50">{loading ? "Scheduling..." : "Schedule"}</button>
        </div>
      </div>
    </div>
  );
}
