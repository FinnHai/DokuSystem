import { ReactNode, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import {
  IconChartBar,
  IconClock,
  IconFolder,
  IconXCircle,
} from "../components/icons";
import { useAuthStore } from "../store";
import { STATUS_BADGES, STATUS_LABELS, WorkflowState } from "../types";

interface DashboardData {
  totalGroups: number;
  byStatus: Record<WorkflowState, number>;
  averageCompleteness: number;
  rejectedRate: number;
  overdue: number;
  myTasks: { type: string; serviceGroupId: string; name: string; dueDate: string | null }[];
}

function KpiCard(props: {
  title: string;
  value: ReactNode;
  icon: ReactNode;
  tone: string;
  hint?: string;
}) {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-300 hover:shadow-md transition-shadow">
      <div className="card-body p-5 flex-row items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${props.tone}`}>
          {props.icon}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider opacity-60 font-medium">{props.title}</p>
          <p className="text-2xl font-extrabold leading-tight">{props.value}</p>
          {props.hint && <p className="text-xs opacity-50">{props.hint}</p>}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    api<DashboardData>("/api/dashboard").then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!data)
    return (
      <div className="space-y-4">
        <div className="skeleton h-10 w-64" />
        <div className="grid md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-24 w-full" />
          ))}
        </div>
        <div className="skeleton h-64 w-full" />
      </div>
    );

  const total = data.totalGroups || 1;

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Guten Tag{user ? `, ${user.name.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="opacity-60 text-sm mt-1">
          Hier ist der aktuelle Stand Ihrer BesiDoc-Dokumentationen.
        </p>
      </div>

      {/* KPI-Widgets (D.1) */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Servicegruppen"
          value={data.totalGroups}
          icon={<IconFolder className="w-6 h-6" />}
          tone="bg-primary/10 text-primary"
        />
        <KpiCard
          title="Ø Fortschritt"
          value={`${data.averageCompleteness}%`}
          icon={<IconChartBar className="w-6 h-6" />}
          tone="bg-success/10 text-success"
          hint="Dokumentationsfortschritt"
        />
        <KpiCard
          title="Abgelehnt-Rate"
          value={`${data.rejectedRate}%`}
          icon={<IconXCircle className="w-6 h-6" />}
          tone="bg-error/10 text-error"
        />
        <KpiCard
          title="Überfällig"
          value={data.overdue}
          icon={<IconClock className="w-6 h-6" />}
          tone={data.overdue > 0 ? "bg-warning/15 text-warning" : "bg-base-200 text-base-content/60"}
          hint={data.overdue > 0 ? "Bitte priorisieren" : "Alles im Plan"}
        />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Meine Aufgaben */}
        <div className="card bg-base-100 shadow-sm border border-base-300 lg:col-span-3">
          <div className="card-body">
            <h2 className="card-title text-lg">Meine Aufgaben</h2>
            {data.myTasks.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-4xl mb-2">🎉</p>
                <p className="font-medium">Keine offenen Aufgaben</p>
                <p className="text-sm opacity-60">Sie sind auf dem aktuellen Stand.</p>
              </div>
            ) : (
              <ul className="divide-y divide-base-200">
                {data.myTasks.map((t, i) => {
                  const overdue = t.dueDate && new Date(t.dueDate) < new Date();
                  return (
                    <li key={i}>
                      <Link
                        to={`/service-groups/${t.serviceGroupId}`}
                        className="flex justify-between items-center py-3 px-2 -mx-2 rounded-lg hover:bg-base-200 transition-colors group"
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={`badge ${t.type === "review" ? "badge-info" : "badge-warning"} badge-sm font-medium`}
                          >
                            {t.type === "review" ? "Review" : "Bearbeiten"}
                          </span>
                          <span className="font-medium group-hover:text-primary transition-colors">
                            {t.name}
                          </span>
                        </span>
                        {t.dueDate && (
                          <span className={`text-xs ${overdue ? "text-error font-bold" : "opacity-60"}`}>
                            fällig {new Date(t.dueDate).toLocaleDateString("de-DE")}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Status-Verteilung */}
        <div className="card bg-base-100 shadow-sm border border-base-300 lg:col-span-2">
          <div className="card-body">
            <h2 className="card-title text-lg">Status-Übersicht</h2>
            <ul className="space-y-3 mt-1">
              {Object.entries(data.byStatus).map(([status, count]) => {
                const pct = Math.round((count / total) * 100);
                return (
                  <li key={status}>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="flex items-center gap-2">
                        <span className={`badge badge-xs ${STATUS_BADGES[status as WorkflowState]}`} />
                        {STATUS_LABELS[status as WorkflowState] ?? status}
                      </span>
                      <span className="font-semibold tabular-nums">{count}</span>
                    </div>
                    <progress
                      className="progress progress-primary w-full h-1.5"
                      value={pct}
                      max={100}
                    />
                  </li>
                );
              })}
            </ul>
            <Link to="/service-groups" className="btn btn-ghost btn-sm mt-2 self-end">
              Alle Servicegruppen →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
