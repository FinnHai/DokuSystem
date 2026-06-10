import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useToastStore } from "../store";
import { ServiceGroupSummary, STATUS_BADGES, STATUS_LABELS, WorkflowState } from "../types";

export default function ServiceGroups() {
  const [groups, setGroups] = useState<ServiceGroupSummary[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDept, setNewDept] = useState("");
  const [loading, setLoading] = useState(true);
  const toast = useToastStore((s) => s.push);

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (onlyMine) params.set("owner", "me");
    api<ServiceGroupSummary[]>(`/api/service-groups?${params}`)
      .then(setGroups)
      .catch((e) => toast("error", e.message))
      .finally(() => setLoading(false));
  }, [search, statusFilter, onlyMine, toast]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api("/api/service-groups", {
        method: "POST",
        body: JSON.stringify({ name: newName, department: newDept || undefined }),
      });
      toast("success", "Servicegruppe erstellt");
      setShowCreate(false);
      setNewName("");
      setNewDept("");
      load();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Fehler beim Erstellen");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Servicegruppen</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Neue Servicegruppe
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <input
          className="input input-bordered input-sm w-64"
          placeholder="Suchen…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="select select-bordered select-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Alle Status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <label className="label cursor-pointer gap-2">
          <input type="checkbox" className="checkbox checkbox-sm" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />
          <span className="label-text">Nur meine</span>
        </label>
      </div>

      {loading ? (
        <div className="skeleton h-48 w-full" />
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-lg shadow">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Geschäftsbereich</th>
                <th>Status</th>
                <th>Fortschritt</th>
                <th>Ersteller</th>
                <th>Version</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.id} className="hover">
                  <td>
                    <Link to={`/service-groups/${g.id}`} className="link link-primary font-medium">
                      {g.name}
                    </Link>
                  </td>
                  <td>{g.department ?? "—"}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGES[g.status as WorkflowState]}`}>
                      {STATUS_LABELS[g.status as WorkflowState]}
                    </span>
                  </td>
                  <td className="w-40">
                    <div className="flex items-center gap-2">
                      <progress className="progress progress-primary w-24" value={g.overallCompleteness} max={100} />
                      <span className="text-xs">{g.overallCompleteness}%</span>
                    </div>
                  </td>
                  <td>{g.createdBy?.name ?? "—"}</td>
                  <td>v{g.version}</td>
                </tr>
              ))}
              {groups.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center opacity-60 py-6">
                    Keine Servicegruppen gefunden
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <dialog open className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Neue Servicegruppe</h3>
            <form onSubmit={create} className="space-y-3 mt-3">
              <input
                className="input input-bordered w-full"
                placeholder="Service-Name (eindeutig pro Mandant)"
                required
                maxLength={255}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <input
                className="input input-bordered w-full"
                placeholder="Geschäftsbereich (optional)"
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
              />
              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setShowCreate(false)}>
                  Abbrechen
                </button>
                <button type="submit" className="btn btn-primary">
                  Erstellen
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}
    </div>
  );
}
