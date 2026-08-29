import { Mail } from "lucide-react";
import { EmailRow } from "../types";

function fmt(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

export function EmailTable({
  rows,
  mode
}: {
  rows: EmailRow[];
  mode: "scheduled" | "sent";
}) {
  if (!rows.length) {
    return (
      <div className="border border-dashed border-gray-200 rounded-xl bg-white py-20 text-center">
        <div className="mx-auto h-10 w-10 rounded-full bg-gray-50 grid place-items-center text-gray-400">
          <Mail size={18} />
        </div>

        <p className="mt-3 text-sm font-medium text-gray-700">
          No {mode} emails
        </p>

        <p className="mt-1 text-xs text-gray-400">
          Your {mode} emails will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#e7eae7] bg-white">
      <table className="w-full text-left">
        <thead className="bg-[#fafbfa] text-[11px] uppercase tracking-wider text-gray-400">
          <tr>
            <th className="px-5 py-3 font-semibold">Email</th>

            <th className="px-5 py-3 font-semibold">
              Subject
            </th>

            <th className="px-5 py-3 font-semibold">
              {mode === "scheduled" ? "Scheduled time" : "Sent time"}
            </th>

            <th className="px-5 py-3 font-semibold">
              Status
            </th>

            {mode === "sent" && (
              <th className="px-5 py-3 font-semibold">
                Preview
              </th>
            )}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {rows.map(row => (
            <tr
              key={row.id}
              className="hover:bg-[#fcfdfc]"
            >
              <td className="px-5 py-4 text-sm font-medium text-gray-800">
                {row.recipient}
              </td>

              <td className="px-5 py-4 text-sm text-gray-600 max-w-[330px] truncate">
                {row.subject}
              </td>

              <td className="px-5 py-4 text-xs text-gray-500">
                {fmt(
                  mode === "scheduled"
                    ? row.scheduledAt
                    : row.sentAt
                )}
              </td>

              <td className="px-5 py-4">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    row.status === "SENT"
                      ? "bg-green-50 text-green-700"
                      : row.status === "FAILED"
                      ? "bg-red-50 text-red-600"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {row.status.toLowerCase()}
                </span>
              </td>

              {mode === "sent" && (
                <td className="px-5 py-4">
                  {row.previewUrl ? (
                    <a
                      href={row.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      View
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">
                      —
                    </span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}