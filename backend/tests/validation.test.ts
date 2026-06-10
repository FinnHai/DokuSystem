import { describe, expect, it } from "vitest";
import { completeness, isSubmittable, validateModule } from "../src/core/validation";
import { kurzbeschreibung, netzwerk, datensicherung, ansprechpartner } from "../src/modules/definitions-1";
import { MODULE_DEFS } from "../src/modules";

describe("Moduldefinitionen", () => {
  it("enthält genau 19 Module mit eindeutigen Keys und Indizes 1-19", () => {
    expect(MODULE_DEFS).toHaveLength(19);
    expect(new Set(MODULE_DEFS.map((m) => m.key)).size).toBe(19);
    expect(MODULE_DEFS.map((m) => m.index)).toEqual(
      Array.from({ length: 19 }, (_, i) => i + 1)
    );
  });

  it("markiert in jedem Modul mindestens ein Pflichtfeld", () => {
    for (const def of MODULE_DEFS) {
      expect(
        def.fields.some((f) => f.required),
        `Modul ${def.key} hat kein Pflichtfeld`
      ).toBe(true);
    }
  });
});

describe("Pflichtfeld-Validierung (B.1 Kurzbeschreibung)", () => {
  it("meldet fehlende Pflichtfelder als Fehler", () => {
    const result = validateModule(kurzbeschreibung, {});
    expect(result.valid).toBe(false);
    const keys = result.issues.map((i) => i.fieldKey);
    expect(keys).toContain("serviceName");
    expect(keys).toContain("geschaeftlicheFunktion");
  });

  it("stuft Pflichtfeld-Fehler im Entwurfsmodus zu Warnungen herab (WIP-Speichern)", () => {
    const result = validateModule(kurzbeschreibung, {}, { strict: false });
    expect(result.valid).toBe(true);
    expect(result.issues.every((i) => i.severity === "warning")).toBe(true);
  });

  it("akzeptiert vollständige, korrekte Daten", () => {
    const data = {
      serviceName: "Test-Service",
      klassifizierung: "hoch",
      geschaeftlicheFunktion: "Macht etwas Wichtiges.",
      geschaeftsbereich: "IT-Betrieb",
      gueltigkeit: { from: "2026-01-01", to: "2026-12-31" },
    };
    expect(validateModule(kurzbeschreibung, data).valid).toBe(true);
    expect(isSubmittable(kurzbeschreibung, data)).toBe(true);
  });

  it("prüft Datumslogik im Gültigkeitsbereich", () => {
    const result = validateModule(kurzbeschreibung, {
      serviceName: "X",
      klassifizierung: "mittel",
      geschaeftlicheFunktion: "Y",
      geschaeftsbereich: "IT-Betrieb",
      gueltigkeit: { from: "2026-12-31", to: "2026-01-01" },
    });
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes("Von-Datum"))).toBe(true);
  });

  it("prüft maximale Textlänge", () => {
    const result = validateModule(kurzbeschreibung, {
      serviceName: "x".repeat(300),
    }, { strict: false });
    expect(result.issues.some((i) => i.fieldKey === "serviceName" && i.severity === "error")).toBe(
      true
    );
  });

  it("lehnt ungültige Enum-Werte ab", () => {
    const result = validateModule(kurzbeschreibung, { klassifizierung: "extrem" }, { strict: false });
    expect(result.issues.some((i) => i.fieldKey === "klassifizierung")).toBe(true);
  });
});

describe("Netzwerk-Validierungen (B.3)", () => {
  const baseRow = { segmentName: "DMZ-1", ipRange: "10.0.0.0/24", vlanId: 100, sicherheitszone: "DMZ" };

  it("validiert CIDR-Format", () => {
    const result = validateModule(
      netzwerk,
      { netzwerksegmente: [{ ...baseRow, ipRange: "10.0.0.0/99" }] },
      { strict: false }
    );
    expect(result.issues.some((i) => i.message.includes("CIDR"))).toBe(true);
  });

  it("validiert Port-Bereich 1-65535", () => {
    const result = validateModule(
      netzwerk,
      {
        firewallRegeln: [
          { richtung: "Inbound", protokoll: "TCP", port: 70000, ziel: "app", begruendung: "x" },
        ],
      },
      { strict: false }
    );
    expect(result.issues.some((i) => i.message.includes("65535"))).toBe(true);
  });

  it("erkennt doppelte VLAN-IDs", () => {
    const result = validateModule(
      netzwerk,
      { netzwerksegmente: [baseRow, { ...baseRow, segmentName: "DMZ-2", ipRange: "10.0.1.0/24" }] },
      { strict: false }
    );
    expect(result.issues.some((i) => i.message.includes("VLAN-IDs"))).toBe(true);
  });
});

describe("Datensicherung (B.7): RTO/RPO-Regel", () => {
  it("warnt, wenn RTO < RPO", () => {
    const result = validateModule(
      datensicherung,
      { rtoMinuten: 10, rpoMinuten: 60 },
      { strict: false }
    );
    expect(result.issues.some((i) => i.message.includes("RTO"))).toBe(true);
  });

  it("akzeptiert RTO >= RPO", () => {
    const result = validateModule(
      datensicherung,
      { rtoMinuten: 60, rpoMinuten: 10 },
      { strict: false }
    );
    expect(result.issues.some((i) => i.message.includes("RTO"))).toBe(false);
  });
});

describe("Ansprechpartner (B.5)", () => {
  it("validiert E-Mail-Adressen in Tabellenzeilen", () => {
    const result = validateModule(
      ansprechpartner,
      { kontakte: [{ rolle: "Servicemanager", name: "Max", email: "keine-mail" }] },
      { strict: false }
    );
    expect(result.issues.some((i) => i.message.includes("E-Mail"))).toBe(true);
  });

  it("warnt bei doppelten Kontakten (gleiche E-Mail)", () => {
    const row = { rolle: "Servicemanager", name: "Max", email: "max@firma.de" };
    const result = validateModule(
      ansprechpartner,
      { kontakte: [row, { ...row, rolle: "Betrieb" }] },
      { strict: false }
    );
    expect(result.issues.some((i) => i.message.includes("Duplikat"))).toBe(true);
  });
});

describe("Füllgrad (Completeness Indicator)", () => {
  it("ist 0% für leere Module und 100% für volle", () => {
    expect(completeness(kurzbeschreibung, {})).toBe(0);
    expect(
      completeness(kurzbeschreibung, {
        serviceName: "A",
        klassifizierung: "hoch",
        geschaeftlicheFunktion: "B",
        geschaeftsbereich: "IT-Betrieb",
        gueltigkeit: { from: "2026-01-01", to: "2026-12-31" },
        besonderheiten: "C",
      })
    ).toBe(100);
  });

  it("berechnet Zwischenwerte korrekt", () => {
    // 3 von 6 Feldern gefüllt → 50%
    expect(
      completeness(kurzbeschreibung, {
        serviceName: "A",
        klassifizierung: "hoch",
        geschaeftlicheFunktion: "B",
      })
    ).toBe(50);
  });

  it("zählt leere Strings/Arrays/Objekte nicht als gefüllt", () => {
    expect(completeness(kurzbeschreibung, { serviceName: "  ", besonderheiten: "" })).toBe(0);
  });
});
