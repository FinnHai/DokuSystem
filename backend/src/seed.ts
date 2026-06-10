/** Demo-Seed: Mandant + ein Benutzer pro Rolle + Beispiel-Servicegruppe. */
import bcrypt from "bcryptjs";
import { Role } from "./core/workflow";
import { ModuleInstance, ServiceGroup, Tenant, User } from "./db";
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
  const users = await Promise.all(
    DEMO_USERS.map((u) =>
      User.create({ ...u, tenantId: tenant.id, passwordHash })
    )
  );
  const creator = users[0];

  const group = await ServiceGroup.create({
    tenantId: tenant.id,
    name: "Zahlungsverkehr-Gateway",
    department: "Fachbereich Zahlungsverkehr",
    createdById: creator.id,
  });
  await ModuleInstance.bulkCreate(
    MODULE_DEFS.map((def) => ({
      serviceGroupId: group.id,
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
  logger.info("Demo-Daten angelegt (Passwort für alle Demo-User: BesiDoc2026!)");
}
