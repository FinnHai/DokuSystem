import { useEffect, useState } from "react";
import { api } from "../api";

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  ip: string | null;
  createdAt: string;
  user?: { name: string; email: string };
}

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState("");
  const limit = 50;

  useEffect(() => {
    api<{ total: number; items: AuditEntry[] }>(`/api/audit?limit=${limit}&offset=${offset}`)
      .then((r) => {
        setEntries(r.items);
        setTotal(r.total);
      })
      .catch((e) => setError(e.message));
  }, [offset]);

  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Audit-Log</h1>
      <div className="overflow-x-auto bg-base-100 rounded-lg shadow">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Zeitpunkt</th>
              <th>Benutzer</th>
              <th>Aktion</th>
              <th>Entität</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td className="whitespace-nowrap">{new Date(e.createdAt).toLocaleString("de-DE")}</td>
                <td>{e.user?.name ?? "—"}</td>
                <td>
                  <code className="text-xs">{e.action}</code>
                </td>
                <td>{e.entityType}</td>
                <td className="text-xs opacity-60">{e.ip ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="join">
        <button className="join-item btn btn-sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>
          «
        </button>
        <span className="join-item btn btn-sm btn-disabled">
          {offset + 1}–{Math.min(offset + limit, total)} von {total}
        </span>
        <button className="join-item btn btn-sm" disabled={offset + limit >= total} onClick={() => setOffset(offset + limit)}>
          »
        </button>
      </div>
    </div>
  );
}
