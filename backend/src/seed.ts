/**
 * Demo-Seed: Mandant + ein Benutzer pro Rolle + zwei Beispiel-Servicegruppen:
 *  1. "Zahlungsverkehr-Gateway" – Entwurf, nur teilweise gefüllt (zum Ausprobieren)
 *  2. "Online-Banking-Plattform" – vollständig ausgefülltes, genehmigtes
 *     Beispiel-Dokument inkl. Workflow-Historie und Review-Feedback
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
  if (await Tenant.findOne({ where: { name: "Demo FinanzIT GmbH" } })) {
    logger.info("Demo-Daten existieren bereits, Seed übersprungen");
    return;
  }
  const tenant = await Tenant.create({ name: "Demo FinanzIT GmbH" });
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const [creator, fachpruefer, redaktion] = await Promise.all(
    DEMO_USERS.map((u) => User.create({ ...u, tenantId: tenant.id, passwordHash }))
  );

  // ---- 1) Teilweise gefüllter Entwurf zum Selbst-Weiterarbeiten
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

  // ---- 2) Vollständiges, genehmigtes Beispiel-Dokument
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
    "Demo-Daten angelegt: 4 Benutzer, Entwurf 'Zahlungsverkehr-Gateway' und " +
      "vollständiges Beispiel-Dokument 'Online-Banking-Plattform' (Passwort: BesiDoc2026!)"
  );
}
