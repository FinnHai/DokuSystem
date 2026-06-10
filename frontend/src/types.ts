/** Frontend-Typen, gespiegelt aus den Backend-Moduldefinitionen. */

export type FieldType =
  | "text"
  | "richtext"
  | "number"
  | "boolean"
  | "date"
  | "daterange"
  | "enum"
  | "multienum"
  | "email"
  | "phone"
  | "url"
  | "table";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  helpText?: string;
  maxLength?: number;
  options?: string[];
  min?: number;
  max?: number;
  columns?: FieldDef[];
  unit?: string;
}

export interface ModuleDef {
  key: string;
  index: number;
  title: string;
  purpose: string;
  fields: FieldDef[];
}

export interface ValidationIssue {
  fieldKey: string;
  row?: number;
  column?: string;
  severity: "error" | "warning";
  message: string;
}

export type Role = "CREATOR" | "FACHLICHER_PRUEFER" | "REDAKTIONELLER_PRUEFER" | "ADMIN";

export type WorkflowState =
  | "ENTWURF"
  | "FACHLICHE_ABNAHME"
  | "REDAKTIONELLE_ABNAHME"
  | "GENEHMIGT"
  | "ABGELEHNT"
  | "ARCHIVIERT";

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: Role;
}

export interface ServiceGroupSummary {
  id: string;
  name: string;
  department: string | null;
  status: WorkflowState;
  version: number;
  dueDate: string | null;
  createdBy?: { id: string; name: string };
  updatedAt: string;
  overallCompleteness: number;
}

export interface ModuleSummary {
  uniqueId: string;
  moduleKey: string;
  title: string;
  index: number;
  completeness: number;
  version: number;
  valid: boolean;
  errorCount: number;
}

export interface ServiceGroupDetail {
  id: string;
  name: string;
  department: string | null;
  status: WorkflowState;
  version: number;
  dueDate: string | null;
  createdById: string;
  editable: boolean;
  actions: string[];
  modules: ModuleSummary[];
}

export interface ReviewCommentDto {
  id: string;
  moduleKey: string | null;
  fieldKey: string | null;
  text: string;
  severity: "KRITISCH" | "OPTIONAL";
  status: "OFFEN" | "KORRIGIERT" | "ERLEDIGT";
  author?: { id: string; name: string; role: Role };
  createdAt: string;
}

export const STATUS_LABELS: Record<WorkflowState, string> = {
  ENTWURF: "Entwurf",
  FACHLICHE_ABNAHME: "Fachliche Abnahme",
  REDAKTIONELLE_ABNAHME: "Redaktionelle Abnahme",
  GENEHMIGT: "Genehmigt",
  ABGELEHNT: "Abgelehnt",
  ARCHIVIERT: "Archiviert",
};

export const STATUS_BADGES: Record<WorkflowState, string> = {
  ENTWURF: "badge-neutral",
  FACHLICHE_ABNAHME: "badge-warning",
  REDAKTIONELLE_ABNAHME: "badge-info",
  GENEHMIGT: "badge-success",
  ABGELEHNT: "badge-error",
  ARCHIVIERT: "badge-ghost",
};
