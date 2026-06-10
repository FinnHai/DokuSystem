/**
 * Validierungs-Engine für Moduldaten.
 *
 * Validiert Moduldaten gegen die deklarative ModuleDef:
 *  - Pflichtfelder, Längen, Wertebereiche, Enums, Regex
 *  - Typ-spezifische Formate (E-Mail, Telefon, Datum, URL)
 *  - Tabellen inkl. Spaltenvalidierung pro Zeile
 *  - Custom-Validatoren (CIDR, Port, VLAN-ID …)
 *  - Feldübergreifende Regeln (Datumslogik, RTO >= RPO, Eindeutigkeit)
 */
import {
  CrossFieldRule,
  FieldDef,
  ModuleData,
  ModuleDef,
  ValidationIssue,
  ValidationResult,
} from "../modules/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9 ()\/-]{6,25}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const URL_RE = /^https?:\/\/[^\s]+$/i;
const CIDR_RE =
  /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\/(3[0-2]|[12]?\d)$/;

/** Custom-Validatoren, referenzierbar über FieldDef.validators */
export const customValidators: Record<
  string,
  (value: unknown) => string | null
> = {
  cidr: (v) =>
    typeof v === "string" && CIDR_RE.test(v)
      ? null
      : "Ungültige IP-Range, erwartet CIDR-Notation (z.B. 10.0.0.0/24)",
  port: (v) => {
    const n = Number(v);
    return Number.isInteger(n) && n >= 1 && n <= 65535
      ? null
      : "Port muss zwischen 1 und 65535 liegen";
  },
  vlanId: (v) => {
    const n = Number(v);
    return Number.isInteger(n) && n >= 1 && n <= 4094
      ? null
      : "VLAN-ID muss zwischen 1 und 4094 liegen";
  },
};

export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    return Object.keys(o).length === 0 || Object.values(o).every(isEmpty);
  }
  return false;
}

function validateScalar(
  field: FieldDef,
  value: unknown,
  push: (msg: string) => void
): void {
  switch (field.type) {
    case "text":
    case "richtext": {
      if (typeof value !== "string") {
        push("Textwert erwartet");
        return;
      }
      if (field.maxLength && value.length > field.maxLength) {
        push(`Maximal ${field.maxLength} Zeichen erlaubt (aktuell ${value.length})`);
      }
      if (field.pattern && !new RegExp(field.pattern).test(value)) {
        push(field.patternHint ?? "Wert entspricht nicht dem erwarteten Format");
      }
      break;
    }
    case "number": {
      const n = Number(value);
      if (typeof value === "boolean" || value === "" || Number.isNaN(n)) {
        push("Zahl erwartet");
        return;
      }
      if (field.min !== undefined && n < field.min) {
        push(`Wert muss mindestens ${field.min} sein`);
      }
      if (field.max !== undefined && n > field.max) {
        push(`Wert darf höchstens ${field.max} sein`);
      }
      break;
    }
    case "boolean": {
      if (typeof value !== "boolean") push("Ja/Nein-Wert erwartet");
      break;
    }
    case "date": {
      if (typeof value !== "string" || !DATE_RE.test(value) || Number.isNaN(Date.parse(value))) {
        push("Gültiges Datum im Format JJJJ-MM-TT erwartet");
      }
      break;
    }
    case "daterange": {
      const r = value as { from?: string; to?: string };
      if (typeof r !== "object" || r === null) {
        push("Datumsbereich erwartet");
        return;
      }
      if (r.from && !DATE_RE.test(r.from)) push("Ungültiges Von-Datum");
      if (r.to && !DATE_RE.test(r.to)) push("Ungültiges Bis-Datum");
      if (r.from && r.to && DATE_RE.test(r.from) && DATE_RE.test(r.to) && r.from > r.to) {
        push("Von-Datum muss vor dem Bis-Datum liegen");
      }
      break;
    }
    case "enum": {
      if (typeof value !== "string" || !(field.options ?? []).includes(value)) {
        push(`Ungültiger Wert, erlaubt: ${(field.options ?? []).join(", ")}`);
      }
      break;
    }
    case "multienum": {
      if (!Array.isArray(value) || value.some((v) => !(field.options ?? []).includes(v as string))) {
        push(`Ungültige Auswahl, erlaubt: ${(field.options ?? []).join(", ")}`);
      }
      break;
    }
    case "email": {
      if (typeof value !== "string" || !EMAIL_RE.test(value)) {
        push("Ungültige E-Mail-Adresse");
      }
      break;
    }
    case "phone": {
      if (typeof value !== "string" || !PHONE_RE.test(value)) {
        push("Ungültige Telefonnummer");
      }
      break;
    }
    case "url": {
      if (typeof value !== "string" || !URL_RE.test(value)) {
        push("Ungültige URL (http/https erwartet)");
      }
      break;
    }
  }

  for (const name of field.validators ?? []) {
    const fn = customValidators[name];
    if (fn) {
      const msg = fn(value);
      if (msg) push(msg);
    }
  }
}

function validateField(field: FieldDef, data: ModuleData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const value = data[field.key];

  if (isEmpty(value)) {
    if (field.required) {
      issues.push({
        fieldKey: field.key,
        severity: "error",
        message: `"${field.label}" ist ein Pflichtfeld`,
      });
    }
    return issues;
  }

  if (field.type === "table") {
    if (!Array.isArray(value)) {
      issues.push({ fieldKey: field.key, severity: "error", message: "Tabellendaten erwartet" });
      return issues;
    }
    value.forEach((row, rowIndex) => {
      const rowObj = (row ?? {}) as ModuleData;
      for (const col of field.columns ?? []) {
        const colValue = rowObj[col.key];
        if (isEmpty(colValue)) {
          if (col.required) {
            issues.push({
              fieldKey: field.key,
              row: rowIndex,
              column: col.key,
              severity: "error",
              message: `Zeile ${rowIndex + 1}: "${col.label}" ist ein Pflichtfeld`,
            });
          }
          continue;
        }
        validateScalar(col, colValue, (msg) =>
          issues.push({
            fieldKey: field.key,
            row: rowIndex,
            column: col.key,
            severity: "error",
            message: `Zeile ${rowIndex + 1}, "${col.label}": ${msg}`,
          })
        );
      }
    });
    return issues;
  }

  validateScalar(field, value, (msg) =>
    issues.push({ fieldKey: field.key, severity: "error", message: msg })
  );
  return issues;
}

function applyCrossFieldRule(rule: CrossFieldRule, data: ModuleData): ValidationIssue | null {
  switch (rule.type) {
    case "dateOrder": {
      const start = data[rule.startField];
      const end = data[rule.endField];
      if (typeof start === "string" && typeof end === "string" && start && end && start > end) {
        return { fieldKey: rule.endField, severity: "error", message: rule.message };
      }
      return null;
    }
    case "compareNumbers": {
      const a = Number(data[rule.a]);
      const b = Number(data[rule.b]);
      if (Number.isNaN(a) || Number.isNaN(b)) return null;
      const ok =
        rule.op === ">=" ? a >= b : rule.op === "<=" ? a <= b : rule.op === ">" ? a > b : a < b;
      return ok ? null : { fieldKey: rule.a, severity: "warning", message: rule.message };
    }
    case "uniqueTableColumn": {
      const rows = data[rule.field];
      if (!Array.isArray(rows)) return null;
      const seen = new Set<string>();
      for (const row of rows) {
        const v = String((row as ModuleData)?.[rule.column] ?? "");
        if (!v) continue;
        if (seen.has(v)) {
          return { fieldKey: rule.field, column: rule.column, severity: "error", message: rule.message };
        }
        seen.add(v);
      }
      return null;
    }
  }
}

/**
 * Vollständige Validierung eines Moduls.
 * Im Entwurfsmodus (strict=false) werden fehlende Pflichtfelder zu Warnungen
 * herabgestuft, damit Work-in-Progress gespeichert werden kann (Anforderung C.1).
 */
export function validateModule(
  def: ModuleDef,
  data: ModuleData,
  options: { strict: boolean } = { strict: true }
): ValidationResult {
  let issues: ValidationIssue[] = [];
  for (const field of def.fields) {
    issues = issues.concat(validateField(field, data));
  }
  for (const rule of def.crossFieldRules ?? []) {
    const issue = applyCrossFieldRule(rule, data);
    if (issue) issues.push(issue);
  }

  if (!options.strict) {
    issues = issues.map((i) =>
      i.message.includes("Pflichtfeld") ? { ...i, severity: "warning" as const } : i
    );
  }

  return { valid: !issues.some((i) => i.severity === "error"), issues };
}

/** Füllgrad in Prozent: Anteil nicht-leerer Felder an allen Feldern des Moduls. */
export function completeness(def: ModuleDef, data: ModuleData): number {
  if (def.fields.length === 0) return 100;
  const filled = def.fields.filter((f) => !isEmpty(data[f.key])).length;
  return Math.round((filled / def.fields.length) * 100);
}

/** Sind alle Pflichtfelder gefüllt und fehlerfrei? (Voraussetzung für Submit) */
export function isSubmittable(def: ModuleDef, data: ModuleData): boolean {
  return validateModule(def, data, { strict: true }).valid;
}
