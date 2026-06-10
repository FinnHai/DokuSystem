/** Module B.14 – B.19 */
import { ModuleDef } from "./types";

export const regelbetrieb: ModuleDef = {
  key: "regelbetrieb",
  index: 14,
  title: "Regelbetrieb",
  purpose: "Normal-Betriebsbeschreibung",
  fields: [
    { key: "typischeLast", label: "Typische Last (Transactions/sec, API Requests/day, Zeitabhängigkeit)", type: "richtext", required: true },
    { key: "saisonalitaet", label: "Saisonalität (Spitzenlast-Zeiten)", type: "richtext", required: true },
    {
      key: "ressourcenBaseline",
      label: "Ressourcennutzung Baseline",
      type: "table",
      required: true,
      columns: [
        { key: "ressource", label: "Ressource", type: "enum", required: true, options: ["CPU", "Memory", "Disk", "Network"] },
        { key: "auslastungProzent", label: "Auslastung (%)", type: "number", required: true, min: 0, max: 100 },
      ],
    },
    {
      key: "typischeAblaeufe",
      label: "Typische Abläufe (Use Cases)",
      type: "table",
      columns: [
        { key: "useCase", label: "Use Case", type: "text", required: true },
        { key: "dauer", label: "Durchschnittliche Dauer", type: "text", required: true },
      ],
    },
    { key: "benutzeraufkommen", label: "Benutzeraufkommen (aktive User, Zugriffsmuster)", type: "richtext", required: true },
    { key: "datenvolumenInGb", label: "Datenvolumen Input pro Tag", type: "number", min: 0, unit: "GB" },
    { key: "datenvolumenOutGb", label: "Datenvolumen Output pro Tag", type: "number", min: 0, unit: "GB" },
    { key: "abhaengigeSysteme", label: "Abhängige Systeme (die auf unsere Ausgabe warten)", type: "richtext" },
    { key: "wartungszyklen", label: "Wartungszyklen (geplante Neustarts, Re-Deployments)", type: "richtext", required: true },
    { key: "kostenmodell", label: "Kostenmodell (Kosten pro Transaktion, Lizenzgebühren)", type: "richtext" },
  ],
};

export const stoerungsbehandlung: ModuleDef = {
  key: "stoerungsbehandlung",
  index: 15,
  title: "Störungsbehandlung",
  purpose: "Incident Management Prozess",
  fields: [
    { key: "klassifizierung", label: "Störungs-Klassifizierung (Severity 1-4, Impact-Level)", type: "richtext", required: true },
    {
      key: "eskalationspfade",
      label: "Eskalationspfade",
      type: "table",
      required: true,
      columns: [
        { key: "severity", label: "Severity", type: "enum", required: true, options: ["1", "2", "3", "4"] },
        { key: "eskalationAn", label: "Eskalation an", type: "text", required: true },
        { key: "responseTimeMinuten", label: "Response Time SLA (Min.)", type: "number", required: true, min: 0 },
      ],
    },
    { key: "kommunikation", label: "Störungs-Kommunikation (wer wird informiert?)", type: "richtext", required: true },
    { key: "workarounds", label: "Workaround-Dokumentation (häufige Issues & schnelle Fixes)", type: "richtext" },
    {
      key: "bekannteProbleme",
      label: "Bekannte Probleme",
      type: "table",
      columns: [
        { key: "problem", label: "Problem", type: "text", required: true },
        { key: "workaround", label: "Workaround", type: "text" },
        { key: "status", label: "Status", type: "enum", required: true, options: ["offen", "in Arbeit", "geplant", "behoben"] },
        { key: "zielfix", label: "Zielfix", type: "text" },
      ],
    },
    { key: "hotfixChangeControl", label: "Change Control für Hotfixes (Genehmigung nötig?)", type: "boolean", required: true },
    { key: "postIncidentTrigger", label: "Post-Incident Review Trigger (Bedingungen)", type: "richtext", required: true },
    { key: "issueTrackingUrl", label: "Known Issues Tracking (Tool/Link)", type: "url" },
  ],
};

export const sicherheitsanalysen: ModuleDef = {
  key: "sicherheitsanalysen",
  index: 16,
  title: "Sicherheitsanalysen",
  purpose: "Proaktive Sicherheitsbewertung",
  fields: [
    { key: "assessmentDurchgefuehrt", label: "Sicherheits-Assessment durchgeführt", type: "boolean", required: true },
    { key: "assessmentDatum", label: "Assessment-Datum", type: "date" },
    { key: "assessmentVon", label: "Durchgeführt von", type: "text" },
    { key: "framework", label: "Framework", type: "enum", required: true, options: ["BSI C5", "ISO 27001", "NIST CSF", "BAIT", "Sonstiges"] },
    { key: "ergebnis", label: "Ergebnis (bestandene Controls, Konformitätslevel)", type: "richtext", required: true },
    {
      key: "kritischeBefunde",
      label: "Kritische Befunde",
      type: "table",
      columns: [
        { key: "befund", label: "Befund", type: "text", required: true },
        { key: "risiko", label: "Risiko", type: "enum", required: true, options: ["niedrig", "mittel", "hoch", "kritisch"] },
        { key: "remediationPlan", label: "Remediation-Plan", type: "text", required: true },
        { key: "deadline", label: "Deadline", type: "date", required: true },
      ],
    },
    { key: "complianceStatus", label: "Compliance-Status (Abweichungen von regulatorischen Anforderungen)", type: "richtext", required: true },
    { key: "riskRegister", label: "Risk Register (operatives Risiko-Tracking)", type: "richtext" },
    { key: "mitigationStrategies", label: "Mitigation Strategies (für akzeptierte Risiken)", type: "richtext" },
    { key: "naechsteBewertung", label: "Nächste Bewertung (geplantes Datum)", type: "date", required: true },
    { key: "externeAudits", label: "Externe Audits (Partner, Ergebnisse, Zertifikate)", type: "richtext" },
  ],
};

export const notfallbewaeltigung: ModuleDef = {
  key: "notfallbewaeltigung",
  index: 17,
  title: "Notfallbewältigung",
  purpose: "Business Continuity & Disaster Recovery Plan",
  fields: [
    { key: "bcpVorhanden", label: "Business Continuity Plan vorhanden", type: "boolean", required: true },
    {
      key: "szenarien",
      label: "Notfall-Szenarien",
      type: "table",
      required: true,
      columns: [
        { key: "szenario", label: "Szenario", type: "text", required: true },
        { key: "wahrscheinlichkeit", label: "Eintrittswahrscheinlichkeit (%)", type: "number", required: true, min: 0, max: 100 },
        { key: "impact", label: "Impact-Beschreibung", type: "text", required: true },
      ],
    },
    { key: "eskalationskette", label: "Eskalationskette (wer wird zuerst informiert?)", type: "richtext", required: true },
    { key: "koordinationszentrum", label: "Koordinationszentrum (Standort, Kontakt, Equipment)", type: "richtext", required: true },
    { key: "kommunikationsplan", label: "Kommunikationsplan (intern & extern)", type: "richtext", required: true },
    { key: "datenschutzNotfall", label: "Datenschutz im Notfall (personenbezogene Daten)", type: "richtext", required: true },
    { key: "recoveryProcedures", label: "Recovery Procedures (Checklisten pro Szenario)", type: "richtext", required: true },
    { key: "testplan", label: "Notfall-Testplan (wie oft wird geübt?)", type: "enum", required: true, options: ["monatlich", "quartalsweise", "halbjährlich", "jährlich"] },
    { key: "alternativeStandorte", label: "Alternative Standorte (Failover-Optionen)", type: "richtext" },
    { key: "notfallplanUrl", label: "Dokumentation Notfall-Pläne (Verweis)", type: "url" },
  ],
};

/**
 * B.18: Die Spezifikation markiert "Sicherheitsanalysen" als mögliche Dublette
 * zu B.16 und nennt als Alternative "IT-Sicherheits-Governance" – diese
 * Alternative wird hier umgesetzt (eindeutiges Naming).
 */
export const sicherheitsgovernance: ModuleDef = {
  key: "sicherheitsgovernance",
  index: 18,
  title: "IT-Sicherheits-Governance",
  purpose: "Organisatorische Sicherheitsstruktur",
  fields: [
    { key: "ciso", label: "CISO/Sicherheitsverantwortlicher (Ansprechpartner)", type: "text", required: true },
    { key: "steeringCommittee", label: "Security Steering Committee (Gremium, Frequenz)", type: "richtext", required: true },
    { key: "policyDokumente", label: "Sicherheits-Policy-Dokumente (Links)", type: "richtext", required: true },
    { key: "riskFramework", label: "Risk Management Framework (Risikoklassifizierung)", type: "richtext", required: true },
    { key: "thirdPartyRisk", label: "Third-Party Risk Management (Lieferantenbewertung)", type: "richtext", required: true },
    { key: "datenschutzbeauftragter", label: "Datenschutz-Beauftragter (Ansprechpartner)", type: "text", required: true },
    { key: "complianceOfficer", label: "Compliance-Officer (Ansprechpartner)", type: "text", required: true },
    {
      key: "auditPlaene",
      label: "Audit-Pläne (jährlich geplante Audits)",
      type: "table",
      columns: [
        { key: "audit", label: "Audit", type: "text", required: true },
        { key: "geplant", label: "Geplant für", type: "date", required: true },
        { key: "verantwortlich", label: "Verantwortlich", type: "text" },
      ],
    },
    {
      key: "regelwerke",
      label: "Wesentliche Regelwerke (betreffende Regulierung)",
      type: "multienum",
      required: true,
      options: ["BAIT", "MaRisk", "DORA", "DSGVO", "KWG", "ISO 27001", "BSI IT-Grundschutz"],
    },
  ],
};

export const ciListe: ModuleDef = {
  key: "ci_liste",
  index: 19,
  title: "CI-Liste",
  purpose: "Asset & Configuration Management (Konfigurations-Item-Liste)",
  fields: [
    {
      key: "hardware",
      label: "Hardware",
      type: "table",
      columns: [
        { key: "typ", label: "Typ", type: "text", required: true },
        { key: "modell", label: "Modell", type: "text", required: true },
        { key: "seriennummer", label: "Seriennummer", type: "text", required: true },
        { key: "standort", label: "Standort", type: "text", required: true },
        { key: "owner", label: "Owner", type: "text", required: true },
        { key: "supportVertrag", label: "Support-Vertrag", type: "text" },
      ],
    },
    {
      key: "softwareLizenzen",
      label: "Software-Lizenzen",
      type: "table",
      columns: [
        { key: "produkt", label: "Produkt", type: "text", required: true },
        { key: "lizenzKey", label: "Lizenz-Key", type: "text" },
        { key: "gueltigBis", label: "Gültig bis", type: "date", required: true },
        { key: "anzahl", label: "# Lizenzen", type: "number", required: true, min: 1 },
      ],
    },
    {
      key: "netzwerkDevices",
      label: "Netzwerk-Devices",
      type: "table",
      columns: [
        { key: "geraetetyp", label: "Gerätetyp", type: "enum", required: true, options: ["Router", "Switch", "Firewall", "Load Balancer", "Sonstiges"] },
        { key: "modell", label: "Modell", type: "text", required: true },
        { key: "ip", label: "IP", type: "text", required: true },
        { key: "konfigStatus", label: "Konfiguration-Status", type: "enum", required: true, options: ["aktuell", "veraltet", "in Prüfung"] },
      ],
    },
    {
      key: "vmsContainer",
      label: "Virtuelle Maschinen / Container",
      type: "table",
      columns: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "vcpu", label: "vCPU", type: "number", required: true, min: 1 },
        { key: "ramGb", label: "RAM (GB)", type: "number", required: true, min: 0 },
        { key: "storageGb", label: "Storage (GB)", type: "number", required: true, min: 0 },
        { key: "os", label: "OS", type: "text", required: true },
        { key: "patchLevel", label: "Patch-Level", type: "text", required: true },
      ],
    },
    {
      key: "datenbanken",
      label: "Datenbanken",
      type: "table",
      columns: [
        { key: "typ", label: "Typ", type: "text", required: true },
        { key: "version", label: "Version", type: "text", required: true },
        { key: "groesseGb", label: "Größe (GB)", type: "number", required: true, min: 0 },
        { key: "backupStatus", label: "Backup-Status", type: "enum", required: true, options: ["aktiv", "inaktiv", "fehlerhaft"] },
      ],
    },
    {
      key: "zertifikate",
      label: "Certificates / Keys",
      type: "table",
      columns: [
        { key: "aussteller", label: "Aussteller", type: "text", required: true },
        { key: "ablaufdatum", label: "Ablaufdatum", type: "date", required: true },
        { key: "verwendungszweck", label: "Verwendungszweck", type: "text", required: true },
      ],
    },
    { key: "konfigRepo", label: "Konfigurations-Kontrollversion (Git-Repo, Branch)", type: "text", required: true },
    { key: "changeTracking", label: "Change Tracking (letzte Änderung, durch wen, wann)", type: "richtext" },
    { key: "complianceStatus", label: "Compliance-Status (Assets aktuell/unterstützt?)", type: "richtext", required: true },
  ],
};
