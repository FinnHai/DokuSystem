import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { Avatar, IconFolder, IconPlus, IconSearch } from "../components/icons";
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
    <div className="space-y-5 max-w-6xl">
      <div className="flex justify-between items-end flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Servicegruppen</h1>
          <p className="opacity-60 text-sm mt-1">
            {groups.length} {groups.length === 1 ? "Eintrag" : "Einträge"} · BesiDoc-Dokumentationen
          </p>
        </div>
        <button className="btn btn-primary shadow-md" onClick={() => setShowCreate(true)}>
          <IconPlus className="w-4 h-4" /> Neue Servicegruppe
        </button>
      </div>

      {/* Filterleiste */}
      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body p-4 flex-row flex-wrap items-center gap-3">
          <label className="input input-bordered input-sm flex items-center gap-2 w-72">
            <IconSearch className="w-4 h-4 opacity-50" />
            <input
              className="grow"
              placeholder="Servicegruppe suchen…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
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
            <input
              type="checkbox"
              className="toggle toggle-sm toggle-primary"
              checked={onlyMine}
              onChange={(e) => setOnlyMine(e.target.checked)}
            />
            <span className="label-text">Nur meine</span>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-16 w-full" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="card bg-base-100 border border-dashed border-base-300">
          <div className="card-body items-center text-center py-16">
            <span className="w-16 h-16 rounded-2xl bg-base-200 flex items-center justify-center mb-2">
              <IconFolder className="w-8 h-8 opacity-40" />
            </span>
            <h3 className="font-bold text-lg">Keine Servicegruppen gefunden</h3>
            <p className="text-sm opacity-60 max-w-sm">
              {search || statusFilter
                ? "Passen Sie Suche oder Filter an, um Ergebnisse zu sehen."
                : "Legen Sie die erste Servicegruppe an, um mit der Dokumentation zu starten."}
            </p>
            {!search && !statusFilter && (
              <button className="btn btn-primary btn-sm mt-3" onClick={() => setShowCreate(true)}>
                <IconPlus className="w-4 h-4" /> Servicegruppe anlegen
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-2xl shadow-sm border border-base-300">
          <table className="table">
            <thead className="bg-base-200/60 text-xs uppercase tracking-wider">
              <tr>
                <th>Name</th>
                <th>Geschäftsbereich</th>
                <th>Status</th>
                <th>Fortschritt</th>
                <th>Ersteller</th>
                <th className="text-right">Version</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.id} className="hover">
                  <td>
                    <Link
                      to={`/service-groups/${g.id}`}
                      className="font-semibold text-primary hover:underline underline-offset-2"
                    >
                      {g.name}
                    </Link>
                    <p className="text-xs opacity-50">
                      Aktualisiert {new Date(g.updatedAt).toLocaleDateString("de-DE")}
                    </p>
                  </td>
                  <td className="text-sm">{g.department ?? <span className="opacity-40">—</span>}</td>
                  <td>
                    <span className={`badge badge-sm ${STATUS_BADGES[g.status as WorkflowState]}`}>
                      {STATUS_LABELS[g.status as WorkflowState]}
                    </span>
                  </td>
                  <td className="w-44">
                    <div className="flex items-center gap-2">
                      <progress
                        className={`progress w-24 h-2 ${
                          g.overallCompleteness === 100 ? "progress-success" : "progress-primary"
                        }`}
                        value={g.overallCompleteness}
                        max={100}
                      />
                      <span className="text-xs font-semibold tabular-nums w-9">
                        {g.overallCompleteness}%
                      </span>
                    </div>
                  </td>
                  <td>
                    {g.createdBy ? (
                      <span className="flex items-center gap-2 text-sm">
                        <Avatar name={g.createdBy.name} size="w-7 h-7" />
                        {g.createdBy.name}
                      </span>
                    ) : (
                      <span className="opacity-40">—</span>
                    )}
                  </td>
                  <td className="text-right">
                    <span className="badge badge-ghost badge-sm font-mono">v{g.version}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <dialog open className="modal modal-open">
          <div className="modal-box rounded-2xl">
            <h3 className="font-bold text-xl">Neue Servicegruppe</h3>
            <p className="text-sm opacity-60 mt-1">
              Es werden automatisch alle 19 BesiDoc-Module angelegt.
            </p>
            <form onSubmit={create} className="space-y-4 mt-4">
              <label className="form-control">
                <span className="label-text font-medium pb-1">Service-Name *</span>
                <input
                  className="input input-bordered w-full focus:input-primary"
                  placeholder="z.B. Zahlungsverkehr-Gateway"
                  required
                  maxLength={255}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <span className="label-text-alt opacity-50 pt-1">Eindeutig pro Mandant</span>
              </label>
              <label className="form-control">
                <span className="label-text font-medium pb-1">Geschäftsbereich</span>
                <input
                  className="input input-bordered w-full focus:input-primary"
                  placeholder="optional"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                />
              </label>
              <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>
                  Abbrechen
                </button>
                <button type="submit" className="btn btn-primary">
                  <IconPlus className="w-4 h-4" /> Erstellen
                </button>
              </div>
            </form>
          </div>
          <button className="modal-backdrop" onClick={() => setShowCreate(false)} aria-label="Schließen" />
        </dialog>
      )}
    </div>
  );
}
