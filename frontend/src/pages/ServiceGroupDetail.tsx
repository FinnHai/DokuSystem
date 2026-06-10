import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import DynamicForm from "../components/DynamicForm";
import {
  Avatar,
  IconCheckCircle,
  IconChat,
  IconClock,
  IconDownload,
  IconPaperPlane,
  IconWarning,
} from "../components/icons";
import { useAuthStore, useToastStore } from "../store";
import {
  ModuleDef,
  ReviewCommentDto,
  ServiceGroupDetail as Detail,
  STATUS_BADGES,
  STATUS_LABELS,
  ValidationIssue,
} from "../types";

interface ModuleResponse {
  data: Record<string, unknown>;
  completeness: number;
  version: number;
  validation: { valid: boolean; issues: ValidationIssue[] };
  editable: boolean;
}

interface ModuleVersionDto {
  id: string;
  version: number;
  data: Record<string, unknown>;
  comment: string | null;
  createdAt: string;
}

/** Wert eines Feldes für die Diff-Ansicht lesbar formatieren. */
function formatForDiff(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    return value
      .map((row) =>
        typeof row === "object" && row !== null
          ? Object.values(row as Record<string, unknown>).join(" · ")
          : String(row)
      )
      .join("\n");
  }
  if (typeof value === "object") {
    const r = value as { from?: string; to?: string };
    if (r.from || r.to) return `${r.from ?? "?"} bis ${r.to ?? "?"}`;
    return JSON.stringify(value);
  }
  if (typeof value === "boolean") return value ? "Ja" : "Nein";
  return String(value).replace(/<[^>]+>/g, " ").trim();
}

function ModuleStatusDot({ completeness, valid }: { completeness: number; valid: boolean }) {
  const tone =
    completeness === 100 && valid
      ? "text-success"
      : completeness > 0
        ? "text-warning"
        : "text-base-300";
  return (
    <div
      className={`radial-progress ${tone} shrink-0`}
      style={{ "--value": completeness, "--size": "1.9rem", "--thickness": "3px" } as CSSProperties}
      role="progressbar"
      aria-valuenow={completeness}
    >
      <span className="text-[8px] font-bold text-base-content/70">{completeness}</span>
    </div>
  );
}

export default function ServiceGroupDetail() {
  const { id } = useParams<{ id: string }>();
  const toast = useToastStore((s) => s.push);
  const user = useAuthStore((s) => s.user);

  const [detail, setDetail] = useState<Detail | null>(null);
  const [defs, setDefs] = useState<ModuleDef[]>([]);
  const [activeKey, setActiveKey] = useState<string>("kurzbeschreibung");
  const [moduleData, setModuleData] = useState<Record<string, unknown>>({});
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [comments, setComments] = useState<ReviewCommentDto[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rejectDialog, setRejectDialog] = useState<null | "reject" | "finalReject">(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectCategory, setRejectCategory] = useState("zu unvollständig");
  const [newComment, setNewComment] = useState("");
  const [commentSeverity, setCommentSeverity] = useState<"OPTIONAL" | "KRITISCH">("OPTIONAL");
  const [versions, setVersions] = useState<ModuleVersionDto[]>([]);
  const [diffVersion, setDiffVersion] = useState<ModuleVersionDto | null>(null);
  const dataRef = useRef(moduleData);
  dataRef.current = moduleData;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  const loadDetail = useCallback(() => {
    if (!id) return;
    api<Detail>(`/api/service-groups/${id}`).then(setDetail).catch((e) => toast("error", e.message));
  }, [id, toast]);

  const loadModule = useCallback(
    (key: string) => {
      if (!id) return;
      api<ModuleResponse>(`/api/service-groups/${id}/modules/${key}`)
        .then((m) => {
          setModuleData(m.data);
          setIssues(m.validation.issues);
          setDirty(false);
        })
        .catch((e) => toast("error", e.message));
      api<ReviewCommentDto[]>(`/api/service-groups/${id}/comments?moduleKey=${key}`)
        .then(setComments)
        .catch(() => undefined);
      api<ModuleVersionDto[]>(`/api/service-groups/${id}/modules/${key}/versions`)
        .then(setVersions)
        .catch(() => undefined);
    },
    [id, toast]
  );

  useEffect(() => {
    api<ModuleDef[]>("/api/module-definitions").then(setDefs).catch((e) => toast("error", e.message));
    loadDetail();
  }, [loadDetail, toast]);

  useEffect(() => {
    loadModule(activeKey);
  }, [activeKey, loadModule]);

  const save = useCallback(async () => {
    if (!id) return;
    setSaving(true);
    try {
      const res = await api<{ validation: { issues: ValidationIssue[] }; completeness: number }>(
        `/api/service-groups/${id}/modules/${activeKey}`,
        { method: "PUT", body: JSON.stringify({ data: dataRef.current }) }
      );
      setIssues(res.validation.issues);
      setDirty(false);
      toast("success", "Modul gespeichert");
      loadDetail();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  }, [id, activeKey, toast, loadDetail]);

  // Ctrl+S zum Speichern (H.1)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (detail?.editable) void save();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [save, detail?.editable]);

  // Auto-Save alle 30 Sekunden bei ungespeicherten Änderungen (F.3)
  useEffect(() => {
    if (!detail?.editable) return;
    const interval = setInterval(() => {
      if (dirtyRef.current) void save();
    }, 30_000);
    return () => clearInterval(interval);
  }, [detail?.editable, save]);

  const revertTo = async (version: number) => {
    if (!id) return;
    if (!window.confirm(`Version ${version} wiederherstellen? Der aktuelle Stand bleibt als eigene Version erhalten.`)) {
      return;
    }
    try {
      const res = await api<{ data: Record<string, unknown>; validation: { issues: ValidationIssue[] } }>(
        `/api/service-groups/${id}/modules/${activeKey}/revert`,
        { method: "POST", body: JSON.stringify({ version }) }
      );
      setModuleData(res.data);
      setIssues(res.validation.issues);
      setDirty(false);
      setDiffVersion(null);
      toast("success", `Version ${version} wiederhergestellt`);
      loadDetail();
      loadModule(activeKey);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Wiederherstellen fehlgeschlagen");
    }
  };

  const workflowAction = async (action: string, reason?: string, category?: string) => {
    if (!id) return;
    try {
      await api(`/api/service-groups/${id}/workflow`, {
        method: "POST",
        body: JSON.stringify({ action, reason, category }),
      });
      toast("success", "Workflow-Aktion ausgeführt");
      setRejectDialog(null);
      setRejectReason("");
      loadDetail();
      loadModule(activeKey);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Aktion fehlgeschlagen");
    }
  };

  const addComment = async () => {
    if (!id || !newComment.trim()) return;
    try {
      await api(`/api/service-groups/${id}/comments`, {
        method: "POST",
        body: JSON.stringify({ moduleKey: activeKey, text: newComment, severity: commentSeverity }),
      });
      setNewComment("");
      loadModule(activeKey);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Kommentar fehlgeschlagen");
    }
  };

  const setCommentStatus = async (commentId: string, status: string) => {
    if (!id) return;
    try {
      await api(`/api/service-groups/${id}/comments/${commentId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      loadModule(activeKey);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Fehler");
    }
  };

  const exportFile = async (format: "pdf" | "docx" | "xlsx") => {
    if (!id || !detail) return;
    try {
      const isDraft = detail.status !== "GENEHMIGT" && detail.status !== "ARCHIVIERT";
      const res = await fetch(
        `/api/export/${id}/${format}${isDraft ? "?draft=true" : ""}`,
        { headers: { Authorization: `Bearer ${useAuthStore.getState().accessToken}` } }
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Export fehlgeschlagen (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `besidoc-${detail.name}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast("success", `${format.toUpperCase()}-Export heruntergeladen`);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Export fehlgeschlagen");
    }
  };

  if (!detail || defs.length === 0)
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[17rem_1fr_19rem] gap-4">
        <div className="skeleton h-96" />
        <div className="skeleton h-96" />
        <div className="skeleton h-64" />
      </div>
    );

  const activeDef = defs.find((d) => d.key === activeKey);
  const isReviewer =
    user?.role === "FACHLICHER_PRUEFER" || user?.role === "REDAKTIONELLER_PRUEFER" || user?.role === "ADMIN";
  const overall = Math.round(
    detail.modules.reduce((s, m) => s + m.completeness, 0) / (detail.modules.length || 1)
  );
  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warnCount = issues.length - errorCount;

  return (
    <div className="space-y-5">
      {/* Kopfbereich */}
      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body p-5 gap-3">
          <div className="flex justify-between items-start flex-wrap gap-3">
            <div>
              <div className="breadcrumbs text-xs opacity-60 p-0">
                <ul>
                  <li>
                    <Link to="/service-groups">Servicegruppen</Link>
                  </li>
                  <li>{detail.name}</li>
                </ul>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-3 flex-wrap mt-1">
                {detail.name}
                <span className={`badge ${STATUS_BADGES[detail.status]}`}>
                  {STATUS_LABELS[detail.status]}
                </span>
                <span className="badge badge-ghost font-mono badge-sm">v{detail.version}</span>
                {dirty && (
                  <span className="badge badge-warning badge-sm gap-1 animate-pulse">
                    ● ungespeichert
                  </span>
                )}
              </h1>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              {detail.actions.includes("submit") && (
                <button className="btn btn-primary btn-sm shadow" onClick={() => workflowAction("submit")}>
                  <IconPaperPlane className="w-4 h-4" /> Zur Prüfung einreichen
                </button>
              )}
              {detail.actions.includes("approve") && (
                <button className="btn btn-success btn-sm shadow" onClick={() => workflowAction("approve")}>
                  <IconCheckCircle className="w-4 h-4" /> Genehmigen
                </button>
              )}
              {detail.actions.includes("reject") && (
                <button className="btn btn-warning btn-sm" onClick={() => setRejectDialog("reject")}>
                  Zurückweisen
                </button>
              )}
              {detail.actions.includes("finalReject") && (
                <button className="btn btn-error btn-outline btn-sm" onClick={() => setRejectDialog("finalReject")}>
                  Final ablehnen
                </button>
              )}
              {detail.actions.includes("reopen") && (
                <button className="btn btn-sm" onClick={() => workflowAction("reopen")}>
                  Wieder öffnen
                </button>
              )}
              {detail.actions.includes("archive") && (
                <button className="btn btn-sm" onClick={() => workflowAction("archive")}>
                  Archivieren
                </button>
              )}
              <div className="dropdown dropdown-end">
                <button tabIndex={0} className="btn btn-outline btn-sm">
                  <IconDownload className="w-4 h-4" /> Export
                </button>
                <ul
                  tabIndex={0}
                  className="dropdown-content dropdown-animated z-50 menu bg-base-100 rounded-box shadow-2xl border border-base-300 w-48 p-2"
                >
                  <li>
                    <button onClick={() => exportFile("pdf")}>📄 PDF-Dokument</button>
                  </li>
                  <li>
                    <button onClick={() => exportFile("docx")}>📝 Word (.docx)</button>
                  </li>
                  <li>
                    <button onClick={() => exportFile("xlsx")}>📊 Excel (.xlsx)</button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <progress
              className={`progress ${overall === 100 ? "progress-success" : "progress-primary"} w-full h-2`}
              value={overall}
              max={100}
            />
            <span className="text-xs font-bold tabular-nums whitespace-nowrap">{overall}% gesamt</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[17rem_1fr_19rem] gap-5 items-start">
        {/* Modul-Baum mit Status (D.2) */}
        <div className="card bg-base-100 border border-base-300 shadow-sm lg:sticky lg:top-20">
          <div className="px-4 pt-4 pb-1 text-xs font-bold uppercase tracking-wider opacity-50">
            Module (B.1–B.19)
          </div>
          <ul className="menu p-2 w-full max-h-[70vh] overflow-y-auto flex-nowrap">
            {detail.modules.map((m) => (
              <li key={m.moduleKey}>
                <button
                  className={`flex items-center gap-2.5 rounded-lg ${
                    m.moduleKey === activeKey ? "active font-semibold" : ""
                  }`}
                  onClick={() => setActiveKey(m.moduleKey)}
                >
                  <ModuleStatusDot completeness={m.completeness} valid={m.valid} />
                  <span className="truncate text-xs leading-tight">
                    <span className="opacity-50 font-mono">B.{m.index}</span> {m.title}
                  </span>
                  {m.errorCount > 0 && (
                    <span className="badge badge-error badge-xs ml-auto">{m.errorCount}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Formular */}
        <div className="card bg-base-100 border border-base-300 shadow-sm">
          <div className="card-body">
            {activeDef && (
              <>
                <div className="flex justify-between items-start flex-wrap gap-2 border-b border-base-200 pb-4">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <span className="badge badge-primary badge-outline font-mono">B.{activeDef.index}</span>
                      {activeDef.title}
                    </h2>
                    <p className="text-sm opacity-60 mt-1">{activeDef.purpose}</p>
                  </div>
                  {detail.editable && (
                    <button
                      className="btn btn-primary btn-sm shadow"
                      onClick={save}
                      disabled={saving || !dirty}
                    >
                      {saving ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        "Speichern"
                      )}
                      <kbd className="kbd kbd-xs hidden xl:inline-flex">Strg+S</kbd>
                    </button>
                  )}
                </div>
                {!detail.editable && (
                  <div className="alert alert-info text-sm py-2.5">
                    <IconWarning className="w-4 h-4" />
                    <span>
                      Bearbeitung im Zustand „{STATUS_LABELS[detail.status]}" gesperrt.
                    </span>
                  </div>
                )}
                <DynamicForm
                  fields={activeDef.fields}
                  data={moduleData}
                  disabled={!detail.editable}
                  issues={issues}
                  onChange={(d) => {
                    setModuleData(d);
                    setDirty(true);
                  }}
                />
              </>
            )}
          </div>
        </div>

        {/* Rechte Sidebar: Validierung + Feedback (D.2) */}
        <div className="space-y-5 lg:sticky lg:top-20">
          <div className="card bg-base-100 border border-base-300 shadow-sm">
            <div className="card-body p-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                {issues.length === 0 ? (
                  <IconCheckCircle className="w-4 h-4 text-success" />
                ) : (
                  <IconWarning className="w-4 h-4 text-warning" />
                )}
                Validierung
                {issues.length > 0 && (
                  <span className="ml-auto flex gap-1">
                    {errorCount > 0 && <span className="badge badge-error badge-xs">{errorCount}</span>}
                    {warnCount > 0 && <span className="badge badge-warning badge-xs">{warnCount}</span>}
                  </span>
                )}
              </h3>
              {issues.length === 0 ? (
                <p className="text-success text-sm">Keine Probleme gefunden.</p>
              ) : (
                <ul className="space-y-1.5 max-h-52 overflow-y-auto">
                  {issues.map((i, idx) => (
                    <li
                      key={idx}
                      className={`text-xs p-2 rounded-lg border-l-4 ${
                        i.severity === "error"
                          ? "bg-error/5 border-error text-error"
                          : "bg-warning/5 border-warning text-warning"
                      }`}
                    >
                      {i.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="card bg-base-100 border border-base-300 shadow-sm">
            <div className="card-body p-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <IconChat className="w-4 h-4" /> Feedback
                <span className="badge badge-ghost badge-xs ml-auto">{comments.length}</span>
              </h3>
              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {comments.length === 0 && (
                  <p className="text-xs opacity-50 text-center py-3">
                    Noch kein Feedback zu diesem Modul.
                  </p>
                )}
                {comments.map((c) => (
                  <div key={c.id} className="rounded-xl border border-base-200 bg-base-200/40 p-2.5 text-xs space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Avatar name={c.author?.name ?? "?"} size="w-6 h-6" />
                      <span className="font-semibold">{c.author?.name}</span>
                      <span
                        className={`badge badge-xs ml-auto ${
                          c.severity === "KRITISCH" ? "badge-error" : "badge-ghost"
                        }`}
                      >
                        {c.severity === "KRITISCH" ? "Kritisch" : "Optional"}
                      </span>
                    </div>
                    <p className="leading-relaxed">{c.text}</p>
                    <div className="flex justify-between items-center">
                      <span
                        className={`badge badge-xs ${
                          c.status === "ERLEDIGT"
                            ? "badge-success"
                            : c.status === "KORRIGIERT"
                              ? "badge-info"
                              : "badge-warning"
                        }`}
                      >
                        {c.status}
                      </span>
                      <span className="space-x-1">
                        {user?.id === detail.createdById && c.status === "OFFEN" && (
                          <button className="btn btn-xs" onClick={() => setCommentStatus(c.id, "KORRIGIERT")}>
                            Korrigiert
                          </button>
                        )}
                        {isReviewer && c.status === "KORRIGIERT" && (
                          <button
                            className="btn btn-xs btn-success"
                            onClick={() => setCommentStatus(c.id, "ERLEDIGT")}
                          >
                            Bestätigen
                          </button>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <textarea
                className="textarea textarea-bordered textarea-sm w-full focus:textarea-primary"
                placeholder="Kommentar zum Modul…"
                rows={2}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <div className="flex gap-2 justify-between">
                <select
                  className="select select-bordered select-xs"
                  value={commentSeverity}
                  onChange={(e) => setCommentSeverity(e.target.value as "OPTIONAL" | "KRITISCH")}
                >
                  <option value="OPTIONAL">Optional</option>
                  <option value="KRITISCH">Kritisch</option>
                </select>
                <button
                  className="btn btn-xs btn-primary"
                  onClick={addComment}
                  disabled={!newComment.trim()}
                >
                  <IconPaperPlane className="w-3.5 h-3.5" /> Senden
                </button>
              </div>
            </div>
          </div>
          <div className="card bg-base-100 border border-base-300 shadow-sm">
            <div className="card-body p-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <IconClock className="w-4 h-4" /> Versionen
                <span className="badge badge-ghost badge-xs ml-auto">{versions.length}</span>
              </h3>
              {versions.length === 0 ? (
                <p className="text-xs opacity-50 text-center py-3">Noch keine gespeicherten Versionen.</p>
              ) : (
                <ul className="space-y-1.5 max-h-56 overflow-y-auto">
                  {versions.map((v) => (
                    <li
                      key={v.id}
                      className="flex items-center gap-2 text-xs p-2 rounded-lg border border-base-200 hover:bg-base-200/60 transition-colors"
                    >
                      <span className="badge badge-primary badge-outline badge-xs font-mono shrink-0">
                        v{v.version}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate opacity-70">
                          {new Date(v.createdAt).toLocaleString("de-DE")}
                        </span>
                        {v.comment && <span className="block truncate italic opacity-50">{v.comment}</span>}
                      </span>
                      <button
                        className="btn btn-ghost btn-xs"
                        title="Änderungen ansehen"
                        onClick={() => setDiffVersion(v)}
                      >
                        Diff
                      </button>
                      {detail.editable && (
                        <button
                          className="btn btn-ghost btn-xs text-primary"
                          title="Diese Version wiederherstellen"
                          onClick={() => revertTo(v.version)}
                        >
                          ↺
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {diffVersion && activeDef && (
        <dialog open className="modal modal-open">
          <div className="modal-box rounded-2xl max-w-3xl">
            <h3 className="font-bold text-xl">
              Was hat sich geändert?
              <span className="badge badge-primary badge-outline font-mono ml-2">
                v{diffVersion.version} → aktuell
              </span>
            </h3>
            <p className="text-sm opacity-60 mt-1">
              {new Date(diffVersion.createdAt).toLocaleString("de-DE")}
              {diffVersion.comment ? ` · ${diffVersion.comment}` : ""}
            </p>
            <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {activeDef.fields
                .map((f) => ({
                  field: f,
                  oldVal: formatForDiff(diffVersion.data[f.key]),
                  newVal: formatForDiff(moduleData[f.key]),
                }))
                .filter((d) => d.oldVal !== d.newVal)
                .map((d) => (
                  <div key={d.field.key} className="rounded-xl border border-base-300 overflow-hidden">
                    <p className="text-xs font-bold px-3 py-2 bg-base-200/60">{d.field.label}</p>
                    <div className="grid grid-cols-2 divide-x divide-base-200 text-xs">
                      <div className="p-3 bg-error/5">
                        <p className="font-semibold text-error mb-1">v{diffVersion.version}</p>
                        <p className="whitespace-pre-wrap break-words opacity-80">{d.oldVal}</p>
                      </div>
                      <div className="p-3 bg-success/5">
                        <p className="font-semibold text-success mb-1">aktuell</p>
                        <p className="whitespace-pre-wrap break-words opacity-80">{d.newVal}</p>
                      </div>
                    </div>
                  </div>
                ))}
              {activeDef.fields.every(
                (f) => formatForDiff(diffVersion.data[f.key]) === formatForDiff(moduleData[f.key])
              ) && (
                <p className="text-center text-sm opacity-60 py-6">
                  Keine inhaltlichen Unterschiede zur aktuellen Fassung.
                </p>
              )}
            </div>
            <div className="modal-action">
              {detail.editable && (
                <button className="btn btn-primary btn-sm" onClick={() => revertTo(diffVersion.version)}>
                  ↺ Diese Version wiederherstellen
                </button>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => setDiffVersion(null)}>
                Schließen
              </button>
            </div>
          </div>
          <button className="modal-backdrop" onClick={() => setDiffVersion(null)} aria-label="Schließen" />
        </dialog>
      )}

      {rejectDialog && (
        <dialog open className="modal modal-open">
          <div className="modal-box rounded-2xl">
            <h3 className="font-bold text-xl">
              {rejectDialog === "finalReject" ? "Final ablehnen" : "Zurückweisen"}
            </h3>
            <p className="text-sm opacity-60 mt-1">
              Der Ersteller wird benachrichtigt; Grund und Kategorie werden im Audit-Trail dokumentiert.
            </p>
            <div className="space-y-4 mt-4">
              <label className="form-control">
                <span className="label-text font-medium pb-1">Kategorie</span>
                <select
                  className="select select-bordered w-full"
                  value={rejectCategory}
                  onChange={(e) => setRejectCategory(e.target.value)}
                >
                  {["zu unvollständig", "falsch verstanden", "Qualität zu niedrig", "nicht konform"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="form-control">
                <span className="label-text font-medium pb-1">Rückweisungs-Grund *</span>
                <textarea
                  className="textarea textarea-bordered w-full focus:textarea-primary"
                  rows={3}
                  placeholder="Begründung (Pflichtfeld)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </label>
              <div className="modal-action">
                <button className="btn btn-ghost" onClick={() => setRejectDialog(null)}>
                  Abbrechen
                </button>
                <button
                  className="btn btn-error"
                  disabled={!rejectReason.trim()}
                  onClick={() => workflowAction(rejectDialog, rejectReason, rejectCategory)}
                >
                  Bestätigen
                </button>
              </div>
            </div>
          </div>
          <button className="modal-backdrop" onClick={() => setRejectDialog(null)} aria-label="Schließen" />
        </dialog>
      )}
    </div>
  );
}
