import { describe, expect, it } from "vitest";
import {
  Role,
  WorkflowState,
  availableActions,
  canEdit,
  canView,
  transition,
} from "../src/core/workflow";

describe("Workflow-Zustandsmaschine", () => {
  it("Happy Path: Entwurf → Fachlich → Redaktionell → Genehmigt", () => {
    const s1 = transition({ action: "submit", from: WorkflowState.ENTWURF, role: Role.CREATOR });
    expect(s1).toEqual({ ok: true, to: WorkflowState.FACHLICHE_ABNAHME });

    const s2 = transition({
      action: "approve",
      from: WorkflowState.FACHLICHE_ABNAHME,
      role: Role.FACHLICHER_PRUEFER,
    });
    expect(s2).toEqual({ ok: true, to: WorkflowState.REDAKTIONELLE_ABNAHME });

    const s3 = transition({
      action: "approve",
      from: WorkflowState.REDAKTIONELLE_ABNAHME,
      role: Role.REDAKTIONELLER_PRUEFER,
    });
    expect(s3).toEqual({ ok: true, to: WorkflowState.GENEHMIGT });
  });

  it("Rückweisung aus fachlicher Abnahme erfordert Begründung", () => {
    const noReason = transition({
      action: "reject",
      from: WorkflowState.FACHLICHE_ABNAHME,
      role: Role.FACHLICHER_PRUEFER,
    });
    expect(noReason.ok).toBe(false);
    expect(noReason.error).toContain("Pflichtfeld");

    const withReason = transition({
      action: "reject",
      from: WorkflowState.FACHLICHE_ABNAHME,
      role: Role.FACHLICHER_PRUEFER,
      reason: "Unvollständig",
      category: "zu unvollständig",
    });
    expect(withReason).toEqual({ ok: true, to: WorkflowState.ENTWURF });
  });

  it("redaktionelle Rückweisung kann an Fachprüfung ODER Entwurf gehen", () => {
    const toFachlich = transition({
      action: "reject",
      from: WorkflowState.REDAKTIONELLE_ABNAHME,
      role: Role.REDAKTIONELLER_PRUEFER,
      reason: "Formulierungen",
    });
    expect(toFachlich.to).toBe(WorkflowState.FACHLICHE_ABNAHME);

    const toEntwurf = transition({
      action: "reject",
      from: WorkflowState.REDAKTIONELLE_ABNAHME,
      role: Role.REDAKTIONELLER_PRUEFER,
      reason: "Grundlegend falsch",
      rejectTarget: WorkflowState.ENTWURF,
    });
    expect(toEntwurf.to).toBe(WorkflowState.ENTWURF);
  });

  it("erzwingt Rollen-Guards", () => {
    // Creator darf nicht selbst fachlich abnehmen
    expect(
      transition({
        action: "approve",
        from: WorkflowState.FACHLICHE_ABNAHME,
        role: Role.CREATOR,
      }).ok
    ).toBe(false);
    // Fachprüfer darf nicht redaktionell abnehmen
    expect(
      transition({
        action: "approve",
        from: WorkflowState.REDAKTIONELLE_ABNAHME,
        role: Role.FACHLICHER_PRUEFER,
      }).ok
    ).toBe(false);
    // Admin darf alles
    expect(
      transition({
        action: "approve",
        from: WorkflowState.REDAKTIONELLE_ABNAHME,
        role: Role.ADMIN,
      }).ok
    ).toBe(true);
  });

  it("verhindert ungültige Übergänge", () => {
    expect(
      transition({ action: "submit", from: WorkflowState.GENEHMIGT, role: Role.CREATOR }).ok
    ).toBe(false);
    expect(
      transition({ action: "approve", from: WorkflowState.ENTWURF, role: Role.ADMIN }).ok
    ).toBe(false);
  });

  it("finale Ablehnung und Wiedereröffnung", () => {
    const rejected = transition({
      action: "finalReject",
      from: WorkflowState.FACHLICHE_ABNAHME,
      role: Role.FACHLICHER_PRUEFER,
      reason: "Kritische Fehler",
    });
    expect(rejected.to).toBe(WorkflowState.ABGELEHNT);

    const reopened = transition({
      action: "reopen",
      from: WorkflowState.ABGELEHNT,
      role: Role.CREATOR,
    });
    expect(reopened.to).toBe(WorkflowState.ENTWURF);
  });

  it("Archivierung nur durch Admin aus GENEHMIGT", () => {
    expect(
      transition({ action: "archive", from: WorkflowState.GENEHMIGT, role: Role.CREATOR }).ok
    ).toBe(false);
    expect(
      transition({ action: "archive", from: WorkflowState.GENEHMIGT, role: Role.ADMIN }).to
    ).toBe(WorkflowState.ARCHIVIERT);
  });
});

describe("Bearbeitungs- und Sichtbarkeits-Locking", () => {
  it("nur der Creator (Owner) bearbeitet im Entwurf", () => {
    expect(canEdit(WorkflowState.ENTWURF, Role.CREATOR, true)).toBe(true);
    expect(canEdit(WorkflowState.ENTWURF, Role.CREATOR, false)).toBe(false);
    expect(canEdit(WorkflowState.ENTWURF, Role.FACHLICHER_PRUEFER, false)).toBe(false);
  });

  it("in Prüfphasen ist der Creator ausgesperrt", () => {
    expect(canEdit(WorkflowState.FACHLICHE_ABNAHME, Role.CREATOR, true)).toBe(false);
    expect(canEdit(WorkflowState.REDAKTIONELLE_ABNAHME, Role.CREATOR, true)).toBe(false);
  });

  it("GENEHMIGT: alle gesperrt außer Admin", () => {
    expect(canEdit(WorkflowState.GENEHMIGT, Role.CREATOR, true)).toBe(false);
    expect(canEdit(WorkflowState.GENEHMIGT, Role.ADMIN, false)).toBe(true);
  });

  it("Entwürfe sind für andere nicht sichtbar, für Admin schon", () => {
    expect(canView(WorkflowState.ENTWURF, Role.CREATOR, true)).toBe(true);
    expect(canView(WorkflowState.ENTWURF, Role.FACHLICHER_PRUEFER, false)).toBe(false);
    expect(canView(WorkflowState.ENTWURF, Role.ADMIN, false)).toBe(true);
    expect(canView(WorkflowState.FACHLICHE_ABNAHME, Role.FACHLICHER_PRUEFER, false)).toBe(true);
  });

  it("availableActions liefert rollenspezifische Aktionen", () => {
    expect(availableActions(WorkflowState.ENTWURF, Role.CREATOR)).toEqual(["submit"]);
    expect(availableActions(WorkflowState.FACHLICHE_ABNAHME, Role.FACHLICHER_PRUEFER)).toEqual(
      expect.arrayContaining(["approve", "reject", "finalReject"])
    );
    expect(availableActions(WorkflowState.FACHLICHE_ABNAHME, Role.CREATOR)).toEqual([]);
  });
});
