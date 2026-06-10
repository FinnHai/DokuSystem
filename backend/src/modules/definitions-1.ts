/** Module B.1 – B.7 */
import { ModuleDef } from "./types";

export const kurzbeschreibung: ModuleDef = {
  key: "kurzbeschreibung",
  index: 1,
  title: "Kurzbeschreibung",
  purpose: "Executive Summary der Servicegruppe",
  fields: [
    { key: "serviceName", label: "Service-Name", type: "text", required: true, maxLength: 255 },
    {
      key: "klassifizierung",
      label: "Service-ID/Klassifizierung",
      type: "enum",
      required: true,
      options: ["kritisch", "hoch", "mittel", "niedrig"],
    },
    {
      key: "geschaeftlicheFunktion",
      label: "Geschäftliche Funktion",
      type: "richtext",
      required: true,
      maxLength: 2000,
    },
    {
      key: "geschaeftsbereich",
      label: "Verantwortlicher Geschäftsbereich",
      type: "enum",
      required: true,
      options: ["IT-Betrieb", "Entwicklung", "Fachbereich Zahlungsverkehr", "Fachbereich Wertpapier", "Risikomanagement", "Compliance", "Sonstiges"],
    },
    { key: "gueltigkeit", label: "Gültigkeit", type: "daterange", required: true },
    { key: "besonderheiten", label: "Besonderheiten", type: "text", maxLength: 2000 },
  ],
};

export const architektur: ModuleDef = {
  key: "architektur",
  index: 2,
  title: "Implementierte Architektur",
  purpose: "Technische Systemarchitektur",
  fields: [
    {
      key: "systemkomponenten",
      label: "Systemkomponenten",
      type: "table",
      required: true,
      columns: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "funktion", label: "Funktion", type: "text", required: true },
        { key: "techStack", label: "Technologie-Stack", type: "text", required: true },
        { key: "version", label: "Version", type: "text", required: true },
      ],
    },
    { key: "blockdiagramm", label: "Blockdiagramm / Architekturzeichnung (Beschreibung)", type: "richtext", required: true },
    { key: "blockdiagrammUrl", label: "Diagramm-URL (Draw.io/Mermaid)", type: "url" },
    { key: "datenfluss", label: "Datenfluss (Beschreibung oder Mermaid)", type: "richtext", required: true },
    {
      key: "schichtenmodell",
      label: "Schichtenmodell",
      type: "table",
      required: true,
      columns: [
        { key: "schicht", label: "Schicht", type: "enum", required: true, options: ["Präsentation", "Geschäftslogik", "Datenpersistenz", "Integration", "Infrastruktur"] },
        { key: "beschreibung", label: "Beschreibung", type: "text", required: true },
      ],
    },
    { key: "clusterbeschreibung", label: "Clusterbeschreibung (Kubernetes/Container)", type: "richtext" },
    {
      key: "hardwareAnforderungen",
      label: "Hardware-Anforderungen",
      type: "table",
      required: true,
      columns: [
        { key: "komponente", label: "Komponente", type: "text", required: true },
        { key: "cpu", label: "CPU (Kerne)", type: "number", required: true, min: 1 },
        { key: "ramGb", label: "RAM (GB)", type: "number", required: true, min: 0 },
        { key: "storageGb", label: "Storage (GB)", type: "number", required: true, min: 0 },
      ],
    },
  ],
};

export const netzwerk: ModuleDef = {
  key: "netzwerk",
  index: 3,
  title: "Netzwerk",
  purpose: "Netzwerktopologie und -konfiguration",
  fields: [
    {
      key: "netzwerksegmente",
      label: "Netzwerksegmente",
      type: "table",
      required: true,
      columns: [
        { key: "segmentName", label: "Segment-Name", type: "text", required: true },
        { key: "ipRange", label: "IP-Range (CIDR)", type: "text", required: true, validators: ["cidr"] },
        { key: "vlanId", label: "VLAN-ID", type: "number", required: true, validators: ["vlanId"] },
        { key: "sicherheitszone", label: "Sicherheitszone", type: "enum", required: true, options: ["DMZ", "Intern", "Management", "Extern", "Hochsicherheit"] },
      ],
    },
    {
      key: "firewallRegeln",
      label: "Firewall-Regeln",
      type: "table",
      required: true,
      columns: [
        { key: "richtung", label: "Richtung", type: "enum", required: true, options: ["Inbound", "Outbound"] },
        { key: "protokoll", label: "Protokoll", type: "enum", required: true, options: ["TCP", "UDP", "ICMP", "Any"] },
        { key: "port", label: "Port", type: "number", required: true, validators: ["port"] },
        { key: "ziel", label: "Ziel", type: "text", required: true },
        { key: "begruendung", label: "Begründung", type: "text", required: true },
      ],
    },
    {
      key: "vpnVerbindungen",
      label: "VPN-/Verschlüsselungsverbindungen",
      type: "table",
      columns: [
        { key: "partner", label: "Verbindungspartner", type: "text", required: true },
        { key: "protokoll", label: "Protokoll", type: "text", required: true },
        { key: "zertifikatInfo", label: "Zertifikat-Info", type: "text" },
      ],
    },
    { key: "dnsKonfiguration", label: "DNS-Konfiguration (Resolver, Zones)", type: "richtext", required: true },
    {
      key: "externeSchnittstellen",
      label: "Externe Schnittstellen",
      type: "table",
      columns: [
        { key: "endpunkt", label: "API-Endpunkt / Partner-System", type: "text", required: true },
        { key: "art", label: "Art", type: "enum", required: true, options: ["API", "Partner-System", "Datenquelle"] },
        { key: "beschreibung", label: "Beschreibung", type: "text" },
      ],
    },
    { key: "loadBalancer", label: "Load Balancer & Failover (Konfiguration, Thresholds)", type: "richtext" },
    { key: "netzwerkDiagrammUrl", label: "Netzwerk-Diagramm (URL: Visio/Draw.io/Mermaid)", type: "url" },
  ],
  crossFieldRules: [
    {
      type: "uniqueTableColumn",
      field: "netzwerksegmente",
      column: "vlanId",
      message: "VLAN-IDs müssen eindeutig sein",
    },
  ],
};

export const abhaengigkeiten: ModuleDef = {
  key: "abhaengigkeiten",
  index: 4,
  title: "Abhängigkeiten",
  purpose: "Technische & organisatorische Abhängigkeiten",
  fields: [
    {
      key: "softwarebibliotheken",
      label: "Softwarebibliotheken",
      type: "table",
      required: true,
      columns: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "version", label: "Version", type: "text", required: true },
        { key: "lizenz", label: "Lizenz", type: "text", required: true },
        { key: "supportStatus", label: "Support-Status", type: "enum", required: true, options: ["aktiv", "wartung", "EOL"] },
        { key: "cveGeprueft", label: "CVE-Prüfung erfolgt", type: "boolean", required: true },
      ],
    },
    { key: "betriebssystem", label: "Betriebssystem & Versionen", type: "text", required: true },
    {
      key: "datenbanken",
      label: "Datenbankabhängigkeiten",
      type: "table",
      required: true,
      columns: [
        { key: "typ", label: "Typ", type: "text", required: true },
        { key: "version", label: "Version", type: "text", required: true },
        { key: "clusterSetup", label: "Cluster-Setup", type: "text" },
      ],
    },
    {
      key: "externeServices",
      label: "Externe Services (APIs, Cloud, Plugins)",
      type: "table",
      columns: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "art", label: "Art", type: "enum", required: true, options: ["API", "Cloud-Service", "Plugin"] },
        { key: "anbieter", label: "Anbieter", type: "text" },
      ],
    },
    {
      key: "andereServicegruppen",
      label: "Abhängigkeiten zu anderen Servicegruppen",
      type: "table",
      columns: [
        { key: "servicegruppe", label: "Servicegruppe", type: "text", required: true },
        { key: "dependencyType", label: "Dependency-Typ", type: "enum", required: true, options: ["hard", "soft"] },
      ],
    },
    { key: "openSourceLizenzen", label: "Open-Source-Lizenzen (Compliance-Matrix)", type: "richtext" },
    {
      key: "supportVertraege",
      label: "Support-Verträge",
      type: "table",
      columns: [
        { key: "vendor", label: "Vendor", type: "text", required: true },
        { key: "laufzeitBis", label: "Laufzeit bis", type: "date", required: true },
        { key: "sla", label: "SLA", type: "text" },
      ],
    },
  ],
};

export const ansprechpartner: ModuleDef = {
  key: "ansprechpartner",
  index: 5,
  title: "Ansprechpartner",
  purpose: "Kontakt- und Verantwortlichkeitskatalog",
  fields: [
    {
      key: "kontakte",
      label: "Ansprechpartner",
      type: "table",
      required: true,
      columns: [
        {
          key: "rolle",
          label: "Rolle",
          type: "enum",
          required: true,
          options: ["Servicemanager", "TechnischerLeiter", "Sicherheit", "Datenschutz", "Compliance", "Betrieb", "Support"],
        },
        { key: "name", label: "Name", type: "text", required: true },
        { key: "email", label: "E-Mail", type: "email", required: true },
        { key: "telefon", label: "Telefon", type: "phone" },
        { key: "verfuegbarkeit", label: "Verfügbarkeit (Arbeitszeit)", type: "text" },
        { key: "notfallHotline", label: "Notfall-Hotline", type: "boolean" },
        {
          key: "zeitzone",
          label: "Zeitzone",
          type: "enum",
          options: ["Europe/Berlin", "Europe/London", "UTC", "America/New_York", "Asia/Singapore"],
        },
        { key: "einheit", label: "Unternehmenseinheit", type: "text" },
        { key: "gueltigBis", label: "Zuständig bis", type: "date" },
        { key: "stellvertreter", label: "Stellvertreter", type: "text" },
      ],
    },
  ],
  crossFieldRules: [
    {
      type: "uniqueTableColumn",
      field: "kontakte",
      column: "email",
      message: "Duplikat-Warnung: dieselbe Person (E-Mail) ist mehrfach eingetragen",
    },
  ],
};

export const schutzbedarf: ModuleDef = {
  key: "schutzbedarf",
  index: 6,
  title: "Schutzbedarf",
  purpose: "Sicherheitsklassifizierung nach BSI/IT-Grundschutz",
  fields: [
    { key: "vertraulichkeit", label: "Schutzbedarf Vertraulichkeit", type: "enum", required: true, options: ["normal", "hoch", "sehr hoch"] },
    { key: "vertraulichkeitBegruendung", label: "Begründung Vertraulichkeit", type: "richtext", required: true },
    { key: "integritaet", label: "Schutzbedarf Integrität", type: "enum", required: true, options: ["normal", "hoch", "sehr hoch"] },
    { key: "integritaetBegruendung", label: "Begründung Integrität", type: "richtext", required: true },
    { key: "verfuegbarkeit", label: "Schutzbedarf Verfügbarkeit", type: "enum", required: true, options: ["normal", "hoch", "sehr hoch"] },
    { key: "verfuegbarkeitBegruendung", label: "Begründung Verfügbarkeit", type: "richtext", required: true },
    { key: "einstufungsbegruendung", label: "Gesamteinstufungsbegründung", type: "richtext", required: true },
    { key: "gueltigkeitsdatum", label: "Gültigkeitsdatum der Einstufung", type: "date", required: true },
    {
      key: "beteiligte",
      label: "Beteiligte bei Einstufung (Rollen)",
      type: "multienum",
      required: true,
      options: ["Servicemanager", "TechnischerLeiter", "Sicherheit", "Datenschutz", "Compliance", "Geschäftsleitung"],
    },
  ],
};

export const datensicherung: ModuleDef = {
  key: "datensicherung",
  index: 7,
  title: "Datensicherung",
  purpose: "Backup- und Recovery-Strategie",
  fields: [
    { key: "backupStrategie", label: "Backup-Strategie", type: "enum", required: true, options: ["Full", "Incremental", "Differential"] },
    {
      key: "backupHaeufigkeit",
      label: "Backup-Häufigkeit",
      type: "enum",
      required: true,
      options: ["stündlich", "täglich", "wöchentlich", "monatlich", "custom"],
    },
    { key: "aufbewahrungsdauerTage", label: "Aufbewahrungsdauer (Tage)", type: "number", required: true, min: 1, unit: "Tage" },
    {
      key: "backupZiele",
      label: "Backup-Ziele",
      type: "table",
      required: true,
      columns: [
        { key: "speichertyp", label: "Speichertyp", type: "text", required: true },
        { key: "ort", label: "Ort", type: "text", required: true },
        { key: "zugriffsberechtigung", label: "Zugriffsberechtigung", type: "text", required: true },
        { key: "verschluesselt", label: "Verschlüsselung", type: "boolean", required: true },
      ],
    },
    { key: "rtoMinuten", label: "Recovery Time Objective (RTO)", type: "number", required: true, min: 0, unit: "Minuten" },
    { key: "rpoMinuten", label: "Recovery Point Objective (RPO)", type: "number", required: true, min: 0, unit: "Minuten" },
    { key: "testFrequenz", label: "Test-Frequenz Recovery-Tests", type: "enum", required: true, options: ["monatlich", "quartalsweise", "halbjährlich", "jährlich"] },
    { key: "letzteSicherung", label: "Letzte erfolgreiche Sicherung", type: "date" },
    { key: "sicherungsverantwortlicher", label: "Sicherungsverantwortlicher (Ansprechpartner)", type: "text", required: true },
  ],
  crossFieldRules: [
    {
      type: "compareNumbers",
      a: "rtoMinuten",
      b: "rpoMinuten",
      op: ">=",
      message: "RTO sollte größer oder gleich RPO sein",
    },
  ],
};
