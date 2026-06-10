import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { STATUS_LABELS, WorkflowState } from "../types";

interface DashboardData {
  totalGroups: number;
  byStatus: Record<WorkflowState, number>;
  averageCompleteness: number;
  rejectedRate: number;
  overdue: number;
  myTasks: { type: string; serviceGroupId: string; name: string; dueDate: string | null }[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<DashboardData>("/api/dashboard").then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!data) return <div className="skeleton h-64 w-full" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="stats shadow w-full stats-vertical md:stats-horizontal">
        <div className="stat">
          <div className="stat-title">Servicegruppen</div>
          <div className="stat-value text-primary">{data.totalGroups}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Ø Dokumentationsfortschritt</div>
          <div className="stat-value">{data.averageCompleteness}%</div>
        </div>
        <div className="stat">
          <div className="stat-title">Abgelehnt-Rate</div>
          <div className="stat-value text-error">{data.rejectedRate}%</div>
        </div>
        <div className="stat">
          <div className="stat-title">Überfällig</div>
          <div className={`stat-value ${data.overdue > 0 ? "text-warning" : ""}`}>{data.overdue}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">Meine Aufgaben</h2>
            {data.myTasks.length === 0 && <p className="opacity-60">Keine offenen Aufgaben 🎉</p>}
            <ul className="space-y-2">
              {data.myTasks.map((t, i) => (
                <li key={i}>
                  <Link to={`/service-groups/${t.serviceGroupId}`} className="flex justify-between items-center p-2 rounded hover:bg-base-200">
                    <span>
                      <span className={`badge badge-sm mr-2 ${t.type === "review" ? "badge-info" : "badge-warning"}`}>
                        {t.type === "review" ? "Review" : "Bearbeiten"}
                      </span>
                      {t.name}
                    </span>
                    {t.dueDate && <span className="text-xs opacity-60">fällig {t.dueDate}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">Status-Übersicht</h2>
            <ul className="space-y-2">
              {Object.entries(data.byStatus).map(([status, count]) => (
                <li key={status} className="flex justify-between items-center">
                  <span>{STATUS_LABELS[status as WorkflowState] ?? status}</span>
                  <span className="badge badge-neutral">{count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
