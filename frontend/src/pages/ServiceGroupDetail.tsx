import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import DynamicForm from "../components/DynamicForm";
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
  const dataRef = useRef(moduleData);
  dataRef.current = moduleData;

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

  const exportPdf = async () => {
    if (!id || !detail) return;
    try {
      const isDraft = detail.status !== "GENEHMIGT" && detail.status !== "ARCHIVIERT";
      const blob = await api<Blob>(`/api/export/${id}/pdf${isDraft ? "?draft=true" : ""}`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `besidoc-${detail.name}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Export fehlgeschlagen");
    }
  };

  if (!detail || defs.length === 0) return <div className="skeleton h-96 w-full" />;

  const activeDef = defs.find((d) => d.key === activeKey);
  const isReviewer =
    user?.role === "FACHLICHER_PRUEFER" || user?.role === "REDAKTIONELLER_PRUEFER" || user?.role === "ADMIN";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <div className="breadcrumbs text-sm">
            <ul>
              <li><a href="/service-groups">Servicegruppen</a></li>
              <li>{detail.name}</li>
            </ul>
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            {detail.name}
            <span className={`badge ${STATUS_BADGES[detail.status]}`}>{STATUS_LABELS[detail.status]}</span>
            <span className="badge badge-outline">v{detail.version}</span>
            {dirty && <span className="badge badge-warning badge-sm">Ungespeicherte Änderungen</span>}
          </h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          {detail.actions.includes("submit") && (
            <button className="btn btn-primary btn-sm" onClick={() => workflowAction("submit")}>
              Zur Prüfung einreichen
            </button>
          )}
          {detail.actions.includes("approve") && (
            <button className="btn btn-success btn-sm" onClick={() => workflowAction("approve")}>
              Genehmigen
            </button>
          )}
          {detail.actions.includes("reject") && (
            <button className="btn btn-warning btn-sm" onClick={() => setRejectDialog("reject")}>
              Zurückweisen
            </button>
          )}
          {detail.actions.includes("finalReject") && (
            <button className="btn btn-error btn-sm" onClick={() => setRejectDialog("finalReject")}>
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
          <button className="btn btn-outline btn-sm" onClick={exportPdf}>
            PDF-Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[16rem_1fr_18rem] gap-4">
        {/* Modul-Baum mit Status-Icons (D.2) */}
        <div className="card bg-base-100 shadow h-fit">
          <ul className="menu p-2 w-full">
            {detail.modules.map((m) => (
              <li key={m.moduleKey}>
                <button
                  className={`flex justify-between ${m.moduleKey === activeKey ? "active" : ""}`}
                  onClick={() => setActiveKey(m.moduleKey)}
                >
                  <span className="truncate text-xs">
                    B.{m.index} {m.title}
                  </span>
                  <span>
                    {m.completeness === 100 && m.valid ? "🟢" : m.completeness > 0 ? "🟡" : "🔴"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Formular */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            {activeDef && (
              <>
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <h2 className="card-title">
                      B.{activeDef.index} {activeDef.title}
                    </h2>
                    <p className="text-sm opacity-60">{activeDef.purpose}</p>
                  </div>
                  {detail.editable && (
                    <button className="btn btn-primary btn-sm" onClick={save} disabled={saving || !dirty}>
                      {saving ? <span className="loading loading-spinner loading-xs" /> : "Speichern (Strg+S)"}
                    </button>
                  )}
                </div>
                {!detail.editable && (
                  <div className="alert alert-info text-sm py-2">
                    Bearbeitung im Zustand „{STATUS_LABELS[detail.status]}" gesperrt.
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
        <div className="space-y-4">
          <div className="card bg-base-100 shadow">
            <div className="card-body p-4">
              <h3 className="font-bold text-sm">Validierung</h3>
              {issues.length === 0 ? (
                <p className="text-success text-sm">✓ Keine Probleme</p>
              ) : (
                <ul className="space-y-1 max-h-48 overflow-y-auto">
                  {issues.map((i, idx) => (
                    <li key={idx} className={`text-xs ${i.severity === "error" ? "text-error" : "text-warning"}`}>
                      {i.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="card bg-base-100 shadow">
            <div className="card-body p-4">
              <h3 className="font-bold text-sm">Feedback ({comments.length})</h3>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {comments.map((c) => (
                  <div key={c.id} className="border rounded p-2 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="font-semibold">{c.author?.name}</span>
                      <span className={`badge badge-xs ${c.severity === "KRITISCH" ? "badge-error" : "badge-ghost"}`}>
                        {c.severity}
                      </span>
                    </div>
                    <p>{c.text}</p>
                    <div className="flex justify-between items-center">
                      <span className={`badge badge-xs ${c.status === "ERLEDIGT" ? "badge-success" : c.status === "KORRIGIERT" ? "badge-info" : "badge-warning"}`}>
                        {c.status}
                      </span>
                      <span className="space-x-1">
                        {user?.id === detail.createdById && c.status === "OFFEN" && (
                          <button className="btn btn-xs" onClick={() => setCommentStatus(c.id, "KORRIGIERT")}>
                            Korrigiert
                          </button>
                        )}
                        {isReviewer && c.status === "KORRIGIERT" && (
                          <button className="btn btn-xs btn-success" onClick={() => setCommentStatus(c.id, "ERLEDIGT")}>
                            Bestätigen
                          </button>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <textarea
                className="textarea textarea-bordered textarea-sm w-full"
                placeholder="Kommentar zum Modul…"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <div className="flex gap-2">
                <select
                  className="select select-bordered select-xs"
                  value={commentSeverity}
                  onChange={(e) => setCommentSeverity(e.target.value as "OPTIONAL" | "KRITISCH")}
                >
                  <option value="OPTIONAL">Optional</option>
                  <option value="KRITISCH">Kritisch</option>
                </select>
                <button className="btn btn-xs btn-primary" onClick={addComment}>
                  Senden
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {rejectDialog && (
        <dialog open className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">
              {rejectDialog === "finalReject" ? "Final ablehnen" : "Zurückweisen"}
            </h3>
            <div className="space-y-3 mt-3">
              <select
                className="select select-bordered w-full"
                value={rejectCategory}
                onChange={(e) => setRejectCategory(e.target.value)}
              >
                {["zu unvollständig", "falsch verstanden", "Qualität zu niedrig", "nicht konform"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <textarea
                className="textarea textarea-bordered w-full"
                placeholder="Rückweisungs-Grund (Pflichtfeld)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div className="modal-action">
                <button className="btn" onClick={() => setRejectDialog(null)}>
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
        </dialog>
      )}
    </div>
  );
}
