import { FieldDef, ValidationIssue } from "../types";
import RichTextEditor from "./RichTextEditor";

type Data = Record<string, unknown>;

function FieldErrors({ issues }: { issues: ValidationIssue[] }) {
  if (issues.length === 0) return null;
  return (
    <div className="mt-1 space-y-0.5">
      {issues.map((i, idx) => (
        <p key={idx} className={`text-xs ${i.severity === "error" ? "text-error" : "text-warning"}`}>
          {i.severity === "error" ? "✗" : "⚠"} {i.message}
        </p>
      ))}
    </div>
  );
}

function ScalarInput(props: {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
  disabled: boolean;
  compact?: boolean;
}) {
  const { field, value, onChange, disabled, compact } = props;
  const cls = `input input-bordered ${compact ? "input-sm" : ""} w-full`;

  switch (field.type) {
    case "richtext":
      return (
        <RichTextEditor
          value={String(value ?? "")}
          onChange={onChange}
          maxLength={field.maxLength}
          disabled={disabled}
        />
      );
    case "boolean":
      return (
        <input
          type="checkbox"
          className="toggle toggle-primary"
          checked={Boolean(value)}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
      );
    case "number":
      return (
        <label className={`${compact ? "" : "max-w-xs"} flex items-center gap-2`}>
          <input
            type="number"
            className={cls}
            value={value === undefined || value === null ? "" : String(value)}
            min={field.min}
            max={field.max}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          />
          {field.unit && <span className="text-sm opacity-60">{field.unit}</span>}
        </label>
      );
    case "date":
      return (
        <input
          type="date"
          className={`${cls} ${compact ? "" : "max-w-xs"}`}
          value={String(value ?? "")}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "daterange": {
      const r = (value ?? {}) as { from?: string; to?: string };
      return (
        <div className="flex gap-2 items-center flex-wrap">
          <input
            type="date"
            className="input input-bordered"
            value={r.from ?? ""}
            disabled={disabled}
            onChange={(e) => onChange({ ...r, from: e.target.value })}
          />
          <span>bis</span>
          <input
            type="date"
            className="input input-bordered"
            value={r.to ?? ""}
            disabled={disabled}
            onChange={(e) => onChange({ ...r, to: e.target.value })}
          />
        </div>
      );
    }
    case "enum":
      return (
        <select
          className={`select select-bordered ${compact ? "select-sm" : ""} w-full ${compact ? "" : "max-w-xs"}`}
          value={String(value ?? "")}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value || undefined)}
        >
          <option value="">– bitte wählen –</option>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    case "multienum": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="flex flex-wrap gap-2">
          {(field.options ?? []).map((o) => (
            <label key={o} className="label cursor-pointer gap-1 border rounded-lg px-2 py-1">
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-primary"
                checked={selected.includes(o)}
                disabled={disabled}
                onChange={(e) =>
                  onChange(e.target.checked ? [...selected, o] : selected.filter((s) => s !== o))
                }
              />
              <span className="label-text text-sm">{o}</span>
            </label>
          ))}
        </div>
      );
    }
    default:
      // text, email, phone, url
      return (
        <input
          type={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
          className={cls}
          value={String(value ?? "")}
          maxLength={field.maxLength}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

function TableEditor(props: {
  field: FieldDef;
  rows: Data[];
  onChange: (rows: Data[]) => void;
  disabled: boolean;
  issues: ValidationIssue[];
}) {
  const { field, rows, onChange, disabled } = props;
  const columns = field.columns ?? [];

  return (
    <div className="overflow-x-auto border rounded-lg bg-base-100">
      <table className="table table-sm">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="whitespace-nowrap">
                {c.label}
                {c.required && <span className="text-error"> *</span>}
              </th>
            ))}
            {!disabled && <th className="w-12" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={props.issues.some((i) => i.row === ri) ? "bg-error/5" : ""}>
              {columns.map((c) => (
                <td key={c.key} className="min-w-32 align-top">
                  <ScalarInput
                    field={c}
                    value={row[c.key]}
                    disabled={disabled}
                    compact
                    onChange={(v) => {
                      const next = rows.slice();
                      next[ri] = { ...row, [c.key]: v };
                      onChange(next);
                    }}
                  />
                </td>
              ))}
              {!disabled && (
                <td>
                  <button
                    type="button"
                    className="btn btn-xs btn-ghost text-error"
                    aria-label="Zeile löschen"
                    onClick={() => onChange(rows.filter((_, i) => i !== ri))}
                  >
                    ✕
                  </button>
                </td>
              )}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length + 1} className="text-center opacity-50 py-3">
                Keine Einträge
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {!disabled && (
        <button type="button" className="btn btn-sm btn-ghost m-2" onClick={() => onChange([...rows, {}])}>
          + Zeile hinzufügen
        </button>
      )}
    </div>
  );
}

/**
 * Dynamischer Formular-Renderer (D.2): rendert ein komplettes Modul-Formular
 * aus der deklarativen Felddefinition des Backends – ein Renderer für alle 19 Module.
 */
export default function DynamicForm(props: {
  fields: FieldDef[];
  data: Data;
  onChange: (data: Data) => void;
  disabled: boolean;
  issues: ValidationIssue[];
}) {
  const { fields, data, onChange, disabled, issues } = props;

  return (
    <div className="space-y-5">
      {fields.map((field) => {
        const fieldIssues = issues.filter((i) => i.fieldKey === field.key);
        const hasError = fieldIssues.some((i) => i.severity === "error");
        const value = data[field.key];
        const filled =
          value !== undefined && value !== null && value !== "" &&
          !(Array.isArray(value) && value.length === 0);

        return (
          <div key={field.key} className="form-control">
            <label className="label py-1">
              <span className={`label-text font-medium ${hasError ? "text-error" : ""}`} title={field.helpText}>
                {field.label}
                {field.required && <span className="text-error"> *</span>}
                {filled && !hasError && <span className="text-success ml-1">✓</span>}
              </span>
            </label>
            {field.helpText && <p className="text-xs opacity-60 mb-1">{field.helpText}</p>}
            {field.type === "table" ? (
              <TableEditor
                field={field}
                rows={Array.isArray(value) ? (value as Data[]) : []}
                onChange={(rows) => onChange({ ...data, [field.key]: rows })}
                disabled={disabled}
                issues={fieldIssues}
              />
            ) : (
              <ScalarInput
                field={field}
                value={value}
                disabled={disabled}
                onChange={(v) => onChange({ ...data, [field.key]: v })}
              />
            )}
            <FieldErrors issues={fieldIssues} />
          </div>
        );
      })}
    </div>
  );
}
