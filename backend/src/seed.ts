/**
 * Demo-Seed: Mandant + ein Benutzer pro Rolle + zwei Beispiel-Servicegruppen:
 *  1. "Zahlungsverkehr-Gateway" – Entwurf, nur teilweise gefüllt (zum Ausprobieren)
 *  2. "Online-Banking-Plattform" – vollständig ausgefülltes, genehmigtes
 *     Beispiel-Dokument inkl. Workflow-Historie und Review-Feedback
 *
 * Idempotent auf Ebene der einzelnen Bausteine: existierende Bestandteile
 * werden übersprungen, fehlende (z.B. das vollständige Beispiel-Dokument
 * in einer älteren Datenbank) werden nachgezogen.
 */
import bcrypt from "bcryptjs";
import { Role, WorkflowState } from "./core/workflow";
import { completeness } from "./core/validation";
import { FULL_DEMO_DOC } from "./demoData";
import {
  ModuleInstance,
  ModuleVersion,
  ReviewComment,
  ServiceGroup,
  Tenant,
  User,
  WorkflowEvent,
} from "./db";
import { MODULE_DEFS } from "./modules";
import { logger } from "./logger";

export const DEMO_USERS = [
  { email: "creator@demo.besidoc.de", name: "Clara Creator", role: Role.CREATOR },
  { email: "fachpruefer@demo.besidoc.de", name: "Frank Fachprüfer", role: Role.FACHLICHER_PRUEFER },
  { email: "redaktion@demo.besidoc.de", name: "Rita Redaktion", role: Role.REDAKTIONELLER_PRUEFER },
  { email: "admin@demo.besidoc.de", name: "Adam Admin", role: Role.ADMIN },
];
export const DEMO_PASSWORD = "BesiDoc2026!";

export async function seedDemoData(): Promise<void> {
  // ---- Mandant + Benutzer (anlegen, falls noch nicht vorhanden)
  let tenant = await Tenant.findOne({ where: { name: "Demo FinanzIT GmbH" } });
  if (!tenant) {
    tenant = await Tenant.create({ name: "Demo FinanzIT GmbH" });
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const users: Record<string, User> = {};
  for (const u of DEMO_USERS) {
    const existing = await User.findOne({ where: { email: u.email } });
    users[u.role] = existing ?? (await User.create({ ...u, tenantId: tenant.id, passwordHash }));
  }
  const creator = users[Role.CREATOR];
  const fachpruefer = users[Role.FACHLICHER_PRUEFER];
  const redaktion = users[Role.REDAKTIONELLER_PRUEFER];

  // ---- 1) Teilweise gefüllter Entwurf zum Selbst-Weiterarbeiten
  const draftExists = await ServiceGroup.findOne({
    where: { tenantId: tenant.id, name: "Zahlungsverkehr-Gateway" },
  });
  if (!draftExists) {
    const draft = await ServiceGroup.create({
      tenantId: tenant.id,
      name: "Zahlungsverkehr-Gateway",
      department: "Fachbereich Zahlungsverkehr",
      createdById: creator.id,
    });
    await ModuleInstance.bulkCreate(
      MODULE_DEFS.map((def) => ({
        serviceGroupId: draft.id,
        moduleKey: def.key,
        data:
          def.key === "kurzbeschreibung"
            ? {
                serviceName: "Zahlungsverkehr-Gateway",
                klassifizierung: "kritisch",
                geschaeftlicheFunktion:
                  "Zentrales Gateway für SEPA- und Instant-Payment-Transaktionen.",
                geschaeftsbereich: "Fachbereich Zahlungsverkehr",
                gueltigkeit: { from: "2026-01-01", to: "2026-12-31" },
              }
            : {},
        completeness: def.key === "kurzbeschreibung" ? 83 : 0,
      }))
    );
    logger.info("Demo-Entwurf 'Zahlungsverkehr-Gateway' angelegt");
  }

  // ---- 2) Vollständiges, genehmigtes Beispiel-Dokument
  const fullExists = await ServiceGroup.findOne({
    where: { tenantId: tenant.id, name: "Online-Banking-Plattform" },
  });
  if (!fullExists) {
    const full = await ServiceGroup.create({
      tenantId: tenant.id,
      name: "Online-Banking-Plattform",
      department: "Fachbereich Zahlungsverkehr",
      status: WorkflowState.GENEHMIGT,
      createdById: creator.id,
    });

    for (const def of MODULE_DEFS) {
      const data = FULL_DEMO_DOC[def.key] ?? {};
      const inst = await ModuleInstance.create({
        serviceGroupId: full.id,
        moduleKey: def.key,
        data,
        completeness: completeness(def, data),
        version: 1,
        updatedById: creator.id,
      });
      await ModuleVersion.create({
        moduleInstanceId: inst.id,
        version: 1,
        data,
        createdById: creator.id,
        comment: "Initiale Erfassung (Demo-Seed)",
      });
    }

    // Workflow-Historie: eingereicht → fachlich → redaktionell genehmigt
    await WorkflowEvent.bulkCreate([
      {
        serviceGroupId: full.id,
        fromState: WorkflowState.ENTWURF,
        toState: WorkflowState.FACHLICHE_ABNAHME,
        action: "submit",
        userId: creator.id,
      },
      {
        serviceGroupId: full.id,
        fromState: WorkflowState.FACHLICHE_ABNAHME,
        toState: WorkflowState.REDAKTIONELLE_ABNAHME,
        action: "approve",
        userId: fachpruefer.id,
      },
      {
        serviceGroupId: full.id,
        fromState: WorkflowState.REDAKTIONELLE_ABNAHME,
        toState: WorkflowState.GENEHMIGT,
        action: "approve",
        userId: redaktion.id,
      },
    ]);

    // Beispiel-Feedback (abgeschlossener Review-Dialog)
    await ReviewComment.bulkCreate([
      {
        serviceGroupId: full.id,
        moduleKey: "datensicherung",
        authorId: fachpruefer.id,
        text: "Bitte das RPO begründen – 15 Minuten erscheinen ambitioniert. Ist die Log-Shipping-Frequenz dafür ausreichend?",
        severity: "KRITISCH",
        status: "ERLEDIGT",
      },
      {
        serviceGroupId: full.id,
        moduleKey: "netzwerk",
        authorId: redaktion.id,
        text: "Begriffe vereinheitlichen: einmal 'RZ A/B', einmal 'Rechenzentrum 1/2'. Bitte durchgängig RZ A/B verwenden.",
        severity: "OPTIONAL",
        status: "ERLEDIGT",
      },
    ]);

    logger.info(
      "Vollständiges Beispiel-Dokument 'Online-Banking-Plattform' angelegt " +
        "(genehmigt, alle 19 Module gefüllt)"
    );
  }

  logger.info("Demo-Seed abgeschlossen (Passwort aller Demo-Benutzer: BesiDoc2026!)");
}
