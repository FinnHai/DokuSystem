import { describe, expect, it } from "vitest";
import { completeness, validateModule } from "../src/core/validation";
import { FULL_DEMO_DOC } from "../src/demoData";
import { MODULE_DEFS } from "../src/modules";

describe("Vollständiges Beispiel-Dokument (Demo-Seed)", () => {
  it("enthält Daten für alle 19 Module", () => {
    for (const def of MODULE_DEFS) {
      expect(FULL_DEMO_DOC[def.key], `Daten für Modul ${def.key} fehlen`).toBeDefined();
    }
  });

  it.each(MODULE_DEFS.map((d) => [d.key, d] as const))(
    "Modul %s besteht die strikte Validierung",
    (_key, def) => {
      const result = validateModule(def, FULL_DEMO_DOC[def.key] ?? {}, { strict: true });
      expect(
        result.issues.filter((i) => i.severity === "error"),
        JSON.stringify(result.issues, null, 2)
      ).toHaveLength(0);
    }
  );

  it("hat in jedem Modul einen Füllgrad von 100 %", () => {
    for (const def of MODULE_DEFS) {
      expect(
        completeness(def, FULL_DEMO_DOC[def.key] ?? {}),
        `Modul ${def.key} ist nicht vollständig gefüllt`
      ).toBe(100);
    }
  });
});
