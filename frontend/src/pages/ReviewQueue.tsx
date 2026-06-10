import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { Avatar, IconCheckCircle, IconClipboardCheck, IconClock } from "../components/icons";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<QueueItem[]>("/api/reviews/queue")
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;

  const overdueCount = items.filter((g) => g.dueDate && new Date(g.dueDate) < new Date()).length;

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex justify-between items-end flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Review-Queue</h1>
          <p className="opacity-60 text-sm mt-1">
            {items.length} ausstehende {items.length === 1 ? "Prüfung" : "Prüfungen"}
            {overdueCount > 0 && (
              <span className="text-error font-semibold"> · {overdueCount} überfällig</span>
            )}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-20 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card bg-base-100 border border-dashed border-base-300">
          <div className="card-body items-center text-center py-16">
            <span className="w-16 h-16 rounded-2xl bg-success/10 text-success flex items-center justify-center mb-2">
              <IconCheckCircle className="w-8 h-8" />
            </span>
            <h3 className="font-bold text-lg">Alles geprüft!</h3>
            <p className="text-sm opacity-60">Aktuell warten keine Servicegruppen auf Ihre Abnahme.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((g) => {
            const overdue = g.dueDate && new Date(g.dueDate) < new Date();
            return (
              <div
                key={g.id}
                className={`card bg-base-100 border shadow-sm hover:shadow-md transition-shadow ${
                  overdue ? "border-error/40" : "border-base-300"
                }`}
              >
                <div className="card-body p-4 flex-row items-center gap-4 flex-wrap">
                  <span className="w-11 h-11 rounded-xl bg-info/10 text-info flex items-center justify-center shrink-0">
                    <IconClipboardCheck className="w-6 h-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold truncate">{g.name}</p>
                    <p className="text-xs opacity-60 flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`badge badge-xs ${STATUS_BADGES[g.status]}`}>
                        {STATUS_LABELS[g.status]}
                      </span>
                      {g.createdBy && (
                        <span className="flex items-center gap-1">
                          <Avatar name={g.createdBy.name} size="w-4 h-4" /> {g.createdBy.name}
                        </span>
                      )}
                      <span>· eingereicht {new Date(g.updatedAt).toLocaleDateString("de-DE")}</span>
                    </p>
                  </div>
                  {g.dueDate && (
                    <span
                      className={`flex items-center gap-1.5 text-xs ${
                        overdue ? "text-error font-bold" : "opacity-60"
                      }`}
                    >
                      <IconClock className="w-4 h-4" />
                      fällig {new Date(g.dueDate).toLocaleDateString("de-DE")}
                    </span>
                  )}
                  <Link to={`/service-groups/${g.id}`} className="btn btn-primary btn-sm shadow">
                    Jetzt prüfen →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
