import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { STATUS_BADGES, STATUS_LABELS, WorkflowState } from "../types";

interface QueueItem {
  id: string;
  name: string;
  status: WorkflowState;
  dueDate: string | null;
  updatedAt: string;
  createdBy?: { name: string };
}

export default function ReviewQueue() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api<QueueItem[]>("/api/reviews/queue").then(setItems).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Review-Queue</h1>
      <div className="overflow-x-auto bg-base-100 rounded-lg shadow">
        <table className="table">
          <thead>
            <tr>
              <th>Servicegruppe</th>
              <th>Phase</th>
              <th>Ersteller</th>
              <th>Fällig</th>
              <th>Eingereicht</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((g) => {
              const overdue = g.dueDate && new Date(g.dueDate) < new Date();
              return (
                <tr key={g.id} className="hover">
                  <td className="font-medium">{g.name}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGES[g.status]}`}>{STATUS_LABELS[g.status]}</span>
                  </td>
                  <td>{g.createdBy?.name ?? "—"}</td>
                  <td className={overdue ? "text-error font-bold" : ""}>
                    {g.dueDate ?? "—"} {overdue && "⚠"}
                  </td>
                  <td>{new Date(g.updatedAt).toLocaleDateString("de-DE")}</td>
                  <td>
                    <Link to={`/service-groups/${g.id}`} className="btn btn-sm btn-primary">
                      Prüfen
                    </Link>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center opacity-60 py-6">
                  Keine ausstehenden Reviews
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
