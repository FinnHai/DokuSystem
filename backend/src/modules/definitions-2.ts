/** Module B.8 – B.13 */
import { ModuleDef } from "./types";

export const datenmanagement: ModuleDef = {
  key: "datenmanagement",
  index: 8,
  title: "Datenmanagement",
  purpose: "Datenverwaltung, -behandlung, -löschung",
  fields: [
    {
      key: "datenbestaende",
      label: "Datenbestände",
      type: "table",
      required: true,
      columns: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "art", label: "Art", type: "text", required: true },
        { key: "umfang", label: "Umfang (GB / Mio. Datensätze)", type: "text", required: true },
        { key: "klassifizierung", label: "Klassifizierung", type: "enum", required: true, options: ["öffentlich", "intern", "vertraulich", "streng vertraulich"] },
      ],
    },
    { key: "datenquellen", label: "Datenquellen", type: "richtext", required: true },
    { key: "datenziele", label: "Datenziele", type: "richtext", required: true },
    { key: "datenflussBeschreibung", label: "Datenfluss-Beschreibung", type: "richtext", required: true },
    {
      key: "aufbewahrungsfristen",
      label: "Aufbewahrungsfristen",
      type: "table",
      required: true,
      columns: [
        { key: "datensatzTyp", label: "Datensatz-Typ", type: "text", required: true },
        { key: "frist", label: "Frist", type: "text", required: true },
        { key: "begruendung", label: "Begründung", type: "text", required: true },
      ],
    },
    { key: "datenloeschung", label: "Datenlöschung (Prozess, Häufigkeit, Verifizierung)", type: "richtext", required: true },
    { key: "dsgvoCompliance", label: "Datenschutz-Compliance (betroffene DSGVO-Kategorien/Artikel)", type: "richtext", required: true },
    { key: "archivierung", label: "Archivierung (Kriterien, Ort, Zugriff)", type: "richtext" },
    { key: "datenqualitaet", label: "Datenqualitätskontrolle (Validierungsmechanismen)", type: "richtext" },
  ],
};

export const berechtigungskonzept: ModuleDef = {
  key: "berechtigungskonzept",
  index: 9,
  title: "Berechtigungskonzept",
  purpose: "Zugriffs- und Autorisierungsmodell",
  fields: [
    {
      key: "rollen",
      label: "Rollen",
      type: "table",
      required: true,
      columns: [
        { key: "rollenname", label: "Rollenname", type: "text", required: true },
        { key: "funktion", label: "Funktion", type: "text", required: true },
        { key: "berechtigungen", label: "Berechtigungen", type: "text", required: true },
      ],
    },
    {
      key: "berechtigungsmatrix",
      label: "Berechtigungsmatrix",
      type: "table",
      required: true,
      columns: [
        { key: "subjekt", label: "User/System", type: "text", required: true },
        { key: "ressource", label: "Ressource", type: "text", required: true },
        { key: "action", label: "Action", type: "enum", required: true, options: ["read", "write", "delete", "admin"] },
      ],
    },
    { key: "authMechanismus", label: "Authentifizierungsmechanismus", type: "enum", required: true, options: ["Password", "MFA", "Zertifikat", "OIDC"] },
    { key: "ssoIntegration", label: "Single Sign-On Integration", type: "boolean", required: true },
    { key: "ssoProtokoll", label: "SSO-Protokoll", type: "text" },
    { key: "passwortPolicy", label: "Passwort-Policy (Länge, Komplexität, Ablauf)", type: "richtext", required: true },
    { key: "accessReview", label: "Access Review Prozess (wie oft, wer, bis wann)", type: "richtext", required: true },
    { key: "privilegeEscalation", label: "Privilege Escalation Rules (Genehmigungsprozess)", type: "richtext" },
    { key: "auditLoggingZugriffe", label: "Audit-Logging von Zugriffen aktiv", type: "boolean", required: true },
    { key: "auditLogAufbewahrung", label: "Aufbewahrung Audit-Logs", type: "text" },
    { key: "segregationOfDuties", label: "Segregation of Duties (kritische Funktionspaare)", type: "richtext", required: true },
  ],
};

export const betriebsprozesse: ModuleDef = {
  key: "betriebsprozesse",
  index: 10,
  title: "Betriebsprozesse",
  purpose: "Alltägliche Betriebsabläufe",
  fields: [
    { key: "betriebsmodell", label: "Betriebsmodell", type: "enum", required: true, options: ["24/7", "5x8", "8x5", "On-Demand"] },
    { key: "schichtModell", label: "Schicht-Modell (Schichten, Besetzung, Übergabe)", type: "richtext" },
    { key: "monitoring", label: "Monitoring (Tools, Metriken, Schwellwerte, Alerting)", type: "richtext", required: true },
    { key: "logging", label: "Logging (Zentrales Log-System, Retention, Analyse)", type: "richtext", required: true },
    {
      key: "kpis",
      label: "Metriken & KPIs",
      type: "table",
      required: true,
      columns: [
        { key: "metrik", label: "Metrik", type: "text", required: true },
        { key: "schwellwert", label: "Schwellwert", type: "text", required: true },
        { key: "messmethode", label: "Messmethode", type: "text", required: true },
      ],
    },
    { key: "changeManagement", label: "Change Management Prozess", type: "richtext", required: true },
    { key: "konfigurationsmanagement", label: "Konfigurationsmanagement (Versionskontrolle)", type: "richtext", required: true },
    { key: "runbooksUrl", label: "Runbooks (Link zum Prozesshandbuch)", type: "url" },
    { key: "wartungsfenster", label: "Wartungsfenster (Wann? Frequenz? Dauer?)", type: "richtext", required: true },
    { key: "performanceBaseline", label: "Performance Baseline (erwartete Werte)", type: "richtext" },
  ],
};

export const sicherheitsprozesse: ModuleDef = {
  key: "sicherheitsprozesse",
  index: 11,
  title: "Sicherheitsprozesse",
  purpose: "Sicherheitsrelevante Prozesse",
  fields: [
    { key: "threatModelingDurchgefuehrt", label: "Threat Modeling durchgeführt", type: "boolean", required: true },
    { key: "threatModelingDatum", label: "Threat Modeling Datum", type: "date" },
    { key: "threatModelingMethode", label: "Threat-Modeling-Methode", type: "enum", options: ["STRIDE", "PASTA", "LINDDUN", "Attack Trees", "Sonstige"] },
    { key: "schwachstellenManagement", label: "Schwachstellen-Management (Erkennung, Priorisierung, Remediation)", type: "richtext", required: true },
    { key: "pentests", label: "Penetrationstests durchgeführt", type: "boolean", required: true },
    { key: "pentestFrequenz", label: "Pentest-Frequenz", type: "enum", options: ["quartalsweise", "halbjährlich", "jährlich", "anlassbezogen"] },
    { key: "pentestLetzte", label: "Letzte Pentest-Durchführung", type: "date" },
    { key: "pentestErgebnisse", label: "Pentest-Ergebnisse (Zusammenfassung)", type: "richtext" },
    { key: "codeReview", label: "Code Review Prozess (statische Analyse, Reviewer, Kritikalität)", type: "richtext", required: true },
    { key: "secureCoding", label: "Secure Coding Guidelines befolgt", type: "boolean", required: true },
    { key: "secureCodingStandards", label: "Standards (z.B. OWASP)", type: "text" },
    { key: "kryptographie", label: "Kryptographie (Algorithmen, Schlüsselverwaltung)", type: "richtext", required: true },
    { key: "zertifikatManagement", label: "Zertifikat-Management (PKI, Aussteller, Ablauf-Tracking)", type: "richtext", required: true },
    { key: "secretsManagement", label: "Geheimnisse-Verwaltung (Tool, Rotation Policy)", type: "richtext", required: true },
    { key: "sicherheitsTraining", label: "Sicherheits-Training (Häufigkeit, Inhalte, Tracking)", type: "richtext" },
    { key: "incidentResponsePlan", label: "Incident Response Plan (Text oder Link, Eskalationspfade)", type: "richtext", required: true },
  ],
};

export const sicherheitsueberwachung: ModuleDef = {
  key: "sicherheitsueberwachung",
  index: 12,
  title: "Sicherheitsüberwachung",
  purpose: "Monitoring von Sicherheitsabweichungen",
  fields: [
    { key: "siemIntegration", label: "SIEM Integration (Tool, Endpunkte, Log-Typ)", type: "richtext", required: true },
    { key: "idsIpsDeployed", label: "IDS/IPS deployed", type: "boolean", required: true },
    { key: "idsIpsKonfiguration", label: "IDS/IPS (wo, Konfiguration)", type: "richtext" },
    { key: "wafDeployed", label: "WAF deployed", type: "boolean", required: true },
    { key: "wafKonfiguration", label: "WAF (Regeln, Policy)", type: "richtext" },
    { key: "dlpDeployed", label: "DLP deployed", type: "boolean", required: true },
    { key: "dlpKriterien", label: "DLP-Überwachungskriterien", type: "richtext" },
    { key: "anomalyDetection", label: "Anomaly Detection", type: "enum", required: true, options: ["keine", "statisch", "ML-basiert"] },
    { key: "incidentResponseTools", label: "Incident Response Tools (SOAR, Ticketing)", type: "richtext" },
    {
      key: "alertSchwellwerte",
      label: "Alert-Schwellwerte",
      type: "table",
      required: true,
      columns: [
        { key: "alertTyp", label: "Alert-Typ", type: "text", required: true },
        { key: "condition", label: "Condition", type: "text", required: true },
        { key: "action", label: "Action", type: "text", required: true },
      ],
    },
    { key: "falsePositiveRate", label: "False-Positive Rate", type: "number", min: 0, max: 100, unit: "%" },
    { key: "eskalationskette", label: "Eskalationskette (wer wird wann benachrichtigt?)", type: "richtext", required: true },
    { key: "alertResponseSla", label: "Richtlinie Alert-Response (SLA pro Severity)", type: "richtext", required: true },
  ],
};

export const fehlernachtest: ModuleDef = {
  key: "fehlernachtest",
  index: 13,
  title: "Fehlernachtest",
  purpose: "Post-Incident Prozess",
  fields: [
    { key: "rcaDurchgefuehrt", label: "RCA (Root Cause Analysis) durchgeführt", type: "boolean", required: true },
    { key: "rcaDokumentation", label: "RCA-Dokumentation (Problem → Ursache → Maßnahmen)", type: "richtext", required: true },
    { key: "lessonsLearned", label: "Lessons Learned", type: "richtext", required: true },
    {
      key: "followUpActions",
      label: "Follow-up Actions",
      type: "table",
      required: true,
      columns: [
        { key: "massnahme", label: "Maßnahme", type: "text", required: true },
        { key: "owner", label: "Owner", type: "text", required: true },
        { key: "faelligkeit", label: "Fälligkeitsdatum", type: "date", required: true },
        { key: "status", label: "Status", type: "enum", required: true, options: ["offen", "in Arbeit", "erledigt"] },
      ],
    },
    { key: "haeufigkeit", label: "Häufigkeit von Fehlernachtests (pro Jahr / nach kritischen Fehlern)", type: "text", required: true },
    { key: "historischeFehlerUrl", label: "Dokumentation historischer Fehler (Link zum Repository)", type: "url" },
    { key: "verbesserungen", label: "Verbesserungen seit letztem Fehler", type: "richtext" },
    {
      key: "beteiligte",
      label: "Beteiligte (Rollen)",
      type: "multienum",
      options: ["Servicemanager", "TechnischerLeiter", "Sicherheit", "Betrieb", "Support", "Entwicklung"],
    },
  ],
};
