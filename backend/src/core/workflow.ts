/**
 * Workflow-Engine: Zustandsmaschine für den Dokumentlebenszyklus (Spez. C).
 *
 * ENTWURF → FACHLICHE_ABNAHME → REDAKTIONELLE_ABNAHME → GENEHMIGT
 * Rückweisungen führen zurück, finale Ablehnung nach ABGELEHNT,
 * genehmigte Altversionen nach ARCHIVIERT.
 */

export enum WorkflowState {
  ENTWURF = "ENTWURF",
  FACHLICHE_ABNAHME = "FACHLICHE_ABNAHME",
  REDAKTIONELLE_ABNAHME = "REDAKTIONELLE_ABNAHME",
  GENEHMIGT = "GENEHMIGT",
  ABGELEHNT = "ABGELEHNT",
  ARCHIVIERT = "ARCHIVIERT",
}

export enum Role {
  CREATOR = "CREATOR",
  FACHLICHER_PRUEFER = "FACHLICHER_PRUEFER",
  REDAKTIONELLER_PRUEFER = "REDAKTIONELLER_PRUEFER",
  ADMIN = "ADMIN",
}

export type WorkflowAction =
  | "submit" // Entwurf einreichen
  | "approve" // aktuelle Prüfphase bestätigen
  | "reject" // Rückweisung in vorherige Phase
  | "finalReject" // finale Ablehnung
  | "reopen" // abgelehnte/genehmigte Doku wieder öffnen
  | "archive"; // genehmigte Version archivieren

export const REJECTION_CATEGORIES = [
  "zu unvollständig",
  "falsch verstanden",
  "Qualität zu niedrig",
  "nicht konform",
] as const;
export type RejectionCategory = (typeof REJECTION_CATEGORIES)[number];

export interface TransitionRequest {
  action: WorkflowAction;
  from: WorkflowState;
  role: Role;
  /** Pflicht bei reject/finalReject */
  reason?: string;
  category?: RejectionCategory;
  /** Bei redaktioneller Rückweisung wählbar: FACHLICHE_ABNAHME oder ENTWURF */
  rejectTarget?: WorkflowState;
}

export interface TransitionResult {
  ok: boolean;
  to?: WorkflowState;
  error?: string;
}

interface TransitionRule {
  action: WorkflowAction;
  from: WorkflowState;
  allowedRoles: Role[];
  to: WorkflowState | ((req: TransitionRequest) => WorkflowState);
  requiresReason?: boolean;
}

const RULES: TransitionRule[] = [
  {
    action: "submit",
    from: WorkflowState.ENTWURF,
    allowedRoles: [Role.CREATOR, Role.ADMIN],
    to: WorkflowState.FACHLICHE_ABNAHME,
  },
  {
    action: "approve",
    from: WorkflowState.FACHLICHE_ABNAHME,
    allowedRoles: [Role.FACHLICHER_PRUEFER, Role.ADMIN],
    to: WorkflowState.REDAKTIONELLE_ABNAHME,
  },
  {
    action: "reject",
    from: WorkflowState.FACHLICHE_ABNAHME,
    allowedRoles: [Role.FACHLICHER_PRUEFER, Role.ADMIN],
    to: WorkflowState.ENTWURF,
    requiresReason: true,
  },
  {
    action: "approve",
    from: WorkflowState.REDAKTIONELLE_ABNAHME,
    allowedRoles: [Role.REDAKTIONELLER_PRUEFER, Role.ADMIN],
    to: WorkflowState.GENEHMIGT,
  },
  {
    action: "reject",
    from: WorkflowState.REDAKTIONELLE_ABNAHME,
    allowedRoles: [Role.REDAKTIONELLER_PRUEFER, Role.ADMIN],
    // Redaktionelle Rückweisung wahlweise an fachliche Abnahme oder Entwurf (C.1)
    to: (req) =>
      req.rejectTarget === WorkflowState.ENTWURF
        ? WorkflowState.ENTWURF
        : WorkflowState.FACHLICHE_ABNAHME,
    requiresReason: true,
  },
  {
    action: "finalReject",
    from: WorkflowState.FACHLICHE_ABNAHME,
    allowedRoles: [Role.FACHLICHER_PRUEFER, Role.ADMIN],
    to: WorkflowState.ABGELEHNT,
    requiresReason: true,
  },
  {
    action: "finalReject",
    from: WorkflowState.REDAKTIONELLE_ABNAHME,
    allowedRoles: [Role.REDAKTIONELLER_PRUEFER, Role.ADMIN],
    to: WorkflowState.ABGELEHNT,
    requiresReason: true,
  },
  {
    action: "reopen",
    from: WorkflowState.ABGELEHNT,
    allowedRoles: [Role.CREATOR, Role.ADMIN],
    to: WorkflowState.ENTWURF,
  },
  {
    action: "reopen",
    from: WorkflowState.GENEHMIGT,
    allowedRoles: [Role.ADMIN],
    to: WorkflowState.ENTWURF,
  },
  {
    action: "archive",
    from: WorkflowState.GENEHMIGT,
    allowedRoles: [Role.ADMIN],
    to: WorkflowState.ARCHIVIERT,
  },
];

export function transition(req: TransitionRequest): TransitionResult {
  const rule = RULES.find((r) => r.action === req.action && r.from === req.from);
  if (!rule) {
    return {
      ok: false,
      error: `Aktion "${req.action}" ist im Zustand ${req.from} nicht möglich`,
    };
  }
  if (!rule.allowedRoles.includes(req.role)) {
    return {
      ok: false,
      error: `Rolle ${req.role} darf die Aktion "${req.action}" nicht ausführen`,
    };
  }
  if (rule.requiresReason && !req.reason?.trim()) {
    return { ok: false, error: "Rückweisungs-Grund ist ein Pflichtfeld" };
  }
  const to = typeof rule.to === "function" ? rule.to(req) : rule.to;
  return { ok: true, to };
}

/** Darf die Rolle in diesem Zustand Moduldaten bearbeiten? (Locking, C.1) */
export function canEdit(state: WorkflowState, role: Role, isOwner: boolean): boolean {
  switch (state) {
    case WorkflowState.ENTWURF:
      return role === Role.ADMIN || (role === Role.CREATOR && isOwner);
    case WorkflowState.GENEHMIGT:
      // "Alle locked (außer Admin für Korrektur)"
      return role === Role.ADMIN;
    default:
      // In Prüfphasen sowie ABGELEHNT/ARCHIVIERT ist die Bearbeitung gesperrt
      return false;
  }
}

/** Darf die Rolle die Servicegruppe in diesem Zustand sehen? */
export function canView(state: WorkflowState, role: Role, isOwner: boolean): boolean {
  if (role === Role.ADMIN) return true;
  // Entwürfe sind nur für den Creator sichtbar (C.1: "Keine Sichtbarkeit für andere Rollen")
  if (state === WorkflowState.ENTWURF) return isOwner || role === Role.CREATOR ? isOwner : false;
  return true;
}

/** Welche Aktionen stehen einer Rolle im aktuellen Zustand offen? */
export function availableActions(state: WorkflowState, role: Role): WorkflowAction[] {
  return RULES.filter((r) => r.from === state && r.allowedRoles.includes(role)).map(
    (r) => r.action
  );
}
