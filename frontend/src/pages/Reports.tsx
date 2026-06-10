import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { IconChartBar } from "../components/icons";
import { STATUS_BADGES, STATUS_LABELS, WorkflowState } from "../types";

interface ReportData {
  moduleKeys: { key: string; index: number; title: string }[];
  rows: {
    id: string;
    name: string;
    status: WorkflowState;
    dueDate: string | null;
    createdBy?: { name: string };
    overall: number;
    overdue: boolean;
    modules: Record<string, number>;
  }[];
}

/** Heatmap-Farbe je Füllgrad. */
function cellTone(pct: number): string {
  if (pct === 100) return "bg-success/80 text-success-content";
  if (pct >= 67) return "bg-success/30";
  if (pct >= 34) return "bg-warning/40";
  if (pct > 0) return "bg-warning/70";
  return "bg-error/20";
}

export default function Reports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<ReportData>("/api/reports/completeness").then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!data) return <div className="skeleton h-96 w-full" />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Reports</h1>
        <p className="opacity-60 text-sm mt-1">
          Modul-Vollständigkeit aller Servicegruppen (Heatmap: rot = leer, grün = vollständig)
        </p>
      </div>

      {data.rows.length === 0 ? (
        <div className="card bg-base-100 border border-dashed border-base-300">
          <div className="card-body items-center text-center py-16">
            <span className="w-16 h-16 rounded-2xl bg-base-200 flex items-center justify-center mb-2">
              <IconChartBar className="w-8 h-8 opacity-40" />
            </span>
            <h3 className="font-bold text-lg">Noch keine Daten</h3>
            <p className="text-sm opacity-60">Legen Sie zuerst eine Servicegruppe an.</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-2xl shadow-sm border border-base-300">
          <table className="table table-xs">
            <thead className="bg-base-200/60">
              <tr>
                <th className="sticky left-0 bg-base-200 z-10 min-w-48">Servicegruppe</th>
                <th>Status</th>
                <th className="text-center">Gesamt</th>
                {data.moduleKeys.map((m) => (
                  <th key={m.key} className="text-center" title={m.title}>
                    <span className="font-mono">B.{m.index}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.id} className="hover">
                  <td className="sticky left-0 bg-base-100 z-10">
                    <Link to={`/service-groups/${row.id}`} className="font-semibold text-primary hover:underline">
                      {row.name}
                    </Link>
                    {row.overdue && <span className="badge badge-error badge-xs ml-2">überfällig</span>}
                  </td>
                  <td>
                    <span className={`badge badge-xs ${STATUS_BADGES[row.status]}`}>
                      {STATUS_LABELS[row.status]}
                    </span>
                  </td>
                  <td className="text-center">
                    <span
                      className={`badge badge-sm font-bold tabular-nums ${
                        row.overall === 100 ? "badge-success" : "badge-ghost"
                      }`}
                    >
                      {row.overall}%
                    </span>
                  </td>
                  {data.moduleKeys.map((m) => {
                    const pct = row.modules[m.key] ?? 0;
                    return (
                      <td key={m.key} className="p-1 text-center" title={`${m.title}: ${pct}%`}>
                        <span
                          className={`inline-flex w-9 h-6 items-center justify-center rounded text-[10px] font-semibold tabular-nums ${cellTone(pct)}`}
                        >
                          {pct}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-4 items-center text-xs opacity-70 flex-wrap">
        <span className="font-semibold">Legende:</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-error/20" /> 0 %</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-warning/70" /> 1–33 %</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-warning/40" /> 34–66 %</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-success/30" /> 67–99 %</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-success/80" /> 100 %</span>
      </div>
    </div>
  );
}
