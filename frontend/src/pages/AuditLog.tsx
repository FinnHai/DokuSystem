import { useEffect, useState } from "react";
import { api } from "../api";
import { Avatar, IconScroll } from "../components/icons";

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  ip: string | null;
  createdAt: string;
  user?: { name: string; email: string };
}

const ACTION_TONES: [RegExp, string][] = [
  [/created|uploaded/, "badge-success badge-outline"],
  [/deleted|anonymized|reject/, "badge-error badge-outline"],
  [/updated|changed/, "badge-info badge-outline"],
  [/workflow/, "badge-warning badge-outline"],
];

function actionBadge(action: string): string {
  for (const [re, cls] of ACTION_TONES) {
    if (re.test(action)) return cls;
  }
  return "badge-ghost";
}

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const limit = 50;

  useEffect(() => {
    setLoading(true);
    api<{ total: number; items: AuditEntry[] }>(`/api/audit?limit=${limit}&offset=${offset}`)
      .then((r) => {
        setEntries(r.items);
        setTotal(r.total);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [offset]);

  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Audit-Log</h1>
        <p className="opacity-60 text-sm mt-1">
          {total} Einträge · Wer hat was wann geändert (revisionssicher)
        </p>
      </div>

      {loading ? (
        <div className="skeleton h-96 w-full" />
      ) : entries.length === 0 ? (
        <div className="card bg-base-100 border border-dashed border-base-300">
          <div className="card-body items-center text-center py-16">
            <span className="w-16 h-16 rounded-2xl bg-base-200 flex items-center justify-center mb-2">
              <IconScroll className="w-8 h-8 opacity-40" />
            </span>
            <h3 className="font-bold text-lg">Noch keine Audit-Einträge</h3>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-2xl shadow-sm border border-base-300">
          <table className="table table-sm">
            <thead className="bg-base-200/60 text-xs uppercase tracking-wider">
              <tr>
                <th>Zeitpunkt</th>
                <th>Benutzer</th>
                <th>Aktion</th>
                <th>Entität</th>
                <th className="text-right">IP</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="hover">
                  <td className="whitespace-nowrap text-xs tabular-nums opacity-70">
                    {new Date(e.createdAt).toLocaleString("de-DE")}
                  </td>
                  <td>
                    {e.user ? (
                      <span className="flex items-center gap-2 text-sm">
                        <Avatar name={e.user.name} size="w-6 h-6" />
                        {e.user.name}
                      </span>
                    ) : (
                      <span className="opacity-40">System</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-sm font-mono ${actionBadge(e.action)}`}>
                      {e.action}
                    </span>
                  </td>
                  <td className="text-sm">{e.entityType}</td>
                  <td className="text-right text-xs opacity-50 font-mono">{e.ip ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-center">
        <div className="join shadow-sm">
          <button
            className="join-item btn btn-sm"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            « Zurück
          </button>
          <span className="join-item btn btn-sm btn-disabled bg-base-100">
            {total === 0 ? 0 : offset + 1}–{Math.min(offset + limit, total)} von {total}
          </span>
          <button
            className="join-item btn btn-sm"
            disabled={offset + limit >= total}
            onClick={() => setOffset(offset + limit)}
          >
            Weiter »
          </button>
        </div>
      </div>
    </div>
  );
}
