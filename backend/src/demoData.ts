/**
 * Vollständig ausgefülltes Beispiel-Dokument für den Demo-Seed:
 * realistische Daten für alle 19 BesiDoc-Module eines fiktiven
 * Kernbanken-Services ("Online-Banking-Plattform").
 */
import { ModuleData } from "./modules/types";

export const FULL_DEMO_DOC: Record<string, ModuleData> = {
  kurzbeschreibung: {
    serviceName: "Online-Banking-Plattform",
    klassifizierung: "kritisch",
    geschaeftlicheFunktion:
      "<p>Zentrale Online-Banking-Plattform für Privat- und Firmenkunden: Kontoübersicht, " +
      "SEPA-Überweisungen, Daueraufträge, Depotansicht und postfachbasierte Kundenkommunikation. " +
      "Die Plattform ist der primäre digitale Vertriebs- und Servicekanal der Bank und " +
      "verarbeitet täglich rund 1,2 Mio. Kundeninteraktionen.</p>",
    geschaeftsbereich: "Fachbereich Zahlungsverkehr",
    gueltigkeit: { from: "2026-01-01", to: "2027-12-31" },
    besonderheiten:
      "Unterliegt BAIT/DORA; Instant-Payment-Anbindung seit Q3/2025; PSD2-Schnittstellen für Drittanbieter (XS2A).",
  },

  architektur: {
    systemkomponenten: [
      { name: "Web-Frontend", funktion: "Kunden-UI (Browser)", techStack: "React 18, TypeScript", version: "4.2.1" },
      { name: "Mobile-Gateway", funktion: "API für native Apps", techStack: "Kotlin, Spring Boot 3", version: "2.8.0" },
      { name: "Banking-Core-API", funktion: "Fachliche Geschäftslogik", techStack: "Java 21, Spring Boot 3", version: "7.1.3" },
      { name: "Auth-Service", funktion: "Authentifizierung/2FA", techStack: "Keycloak 24", version: "24.0.2" },
      { name: "Payment-Engine", funktion: "SEPA/Instant-Zahlungen", techStack: "Java 21, Kafka", version: "3.5.0" },
    ],
    blockdiagramm:
      "<p>Drei-Zonen-Architektur: Kunde → DMZ (WAF, Load Balancer) → Anwendungszone " +
      "(Frontend-Server, API-Gateway, Fachservices) → Hochsicherheitszone (Kernbankanbindung, HSM). " +
      "Alle Zonenübergänge sind durch dedizierte Firewall-Paare abgesichert.</p>",
    blockdiagrammUrl: "https://wiki.demo-finanzit.de/diagramme/obp-blockdiagramm",
    datenfluss:
      "<p>Kundenrequest → WAF → API-Gateway (AuthN/AuthZ via Auth-Service) → Banking-Core-API → " +
      "Kernbanksystem (MQ) bzw. Payment-Engine (Kafka). Antworten werden im Response-Cache (Redis, TTL 30 s) " +
      "zwischengespeichert. Auditrelevante Events fließen asynchron ins SIEM.</p>",
    schichtenmodell: [
      { schicht: "Präsentation", beschreibung: "React-SPA und native Apps, ausgeliefert über CDN" },
      { schicht: "Geschäftslogik", beschreibung: "Spring-Boot-Microservices hinter API-Gateway" },
      { schicht: "Datenpersistenz", beschreibung: "PostgreSQL-Cluster (Patroni), Redis-Cache, S3-Objektspeicher" },
      { schicht: "Integration", beschreibung: "Kafka-Eventbus, IBM MQ zur Kernbank, PSD2/XS2A-Schnittstellen" },
      { schicht: "Infrastruktur", beschreibung: "Kubernetes (3 Cluster), HashiCorp Vault, Prometheus/Grafana" },
    ],
    clusterbeschreibung:
      "<p>3 Kubernetes-Cluster (Prod A/B aktiv-aktiv über zwei Rechenzentren, ein Staging-Cluster). " +
      "Pro Cluster 12 Worker-Nodes; Deployments mit PodDisruptionBudgets und Anti-Affinity über Zonen.</p>",
    hardwareAnforderungen: [
      { komponente: "K8s Worker-Node (Prod)", cpu: 16, ramGb: 64, storageGb: 500 },
      { komponente: "PostgreSQL-Node", cpu: 32, ramGb: 256, storageGb: 4000 },
      { komponente: "Kafka-Broker", cpu: 8, ramGb: 32, storageGb: 2000 },
    ],
  },

  netzwerk: {
    netzwerksegmente: [
      { segmentName: "DMZ-Web", ipRange: "10.10.10.0/24", vlanId: 110, sicherheitszone: "DMZ" },
      { segmentName: "App-Zone", ipRange: "10.10.20.0/23", vlanId: 120, sicherheitszone: "Intern" },
      { segmentName: "DB-Zone", ipRange: "10.10.30.0/24", vlanId: 130, sicherheitszone: "Hochsicherheit" },
      { segmentName: "Mgmt", ipRange: "10.10.99.0/24", vlanId: 199, sicherheitszone: "Management" },
    ],
    firewallRegeln: [
      { richtung: "Inbound", protokoll: "TCP", port: 443, ziel: "DMZ-Web (WAF-VIP)", begruendung: "Kundenzugriff HTTPS" },
      { richtung: "Inbound", protokoll: "TCP", port: 8443, ziel: "App-Zone API-Gateway", begruendung: "PSD2/XS2A-Drittanbieter" },
      { richtung: "Outbound", protokoll: "TCP", port: 1414, ziel: "Kernbank MQ-Gateway", begruendung: "Buchungsaufträge an Kernbank" },
      { richtung: "Outbound", protokoll: "TCP", port: 9093, ziel: "Kafka-Cluster", begruendung: "Event-Streaming (TLS)" },
    ],
    vpnVerbindungen: [
      { partner: "Rechenzentrum B (Geo-Redundanz)", protokoll: "IPsec IKEv2", zertifikatInfo: "interne PKI, RSA-4096, Ablauf 2027-03" },
      { partner: "SWIFT Alliance Gateway", protokoll: "TLS 1.3 mTLS", zertifikatInfo: "SWIFT-PKI, Erneuerung jährlich" },
    ],
    dnsKonfiguration:
      "<p>Interne Resolver (BIND, anycast 10.10.99.53) mit Split-Horizon: Zone banking.demo-finanzit.de " +
      "extern über Anycast-DNS des Providers, intern autoritativ. DNSSEC signiert, Rotation der ZSK halbjährlich.</p>",
    externeSchnittstellen: [
      { endpunkt: "https://xs2a.demo-finanzit.de/v2", art: "API", beschreibung: "PSD2-Schnittstelle für Drittanbieter" },
      { endpunkt: "SWIFT FIN/ISO20022", art: "Partner-System", beschreibung: "Auslandszahlungsverkehr" },
      { endpunkt: "Schufa-Auskunft B2B", art: "Datenquelle", beschreibung: "Bonitätsprüfung bei Dispoerhöhung" },
    ],
    loadBalancer:
      "<p>F5 BIG-IP-Paar (aktiv/passiv) je RZ; Health-Checks alle 5 s auf /health, " +
      "Failover-Threshold 3 aufeinanderfolgende Fehlversuche, automatisches RZ-Failover via GSLB.</p>",
    netzwerkDiagrammUrl: "https://wiki.demo-finanzit.de/diagramme/obp-netzwerk",
  },

  abhaengigkeiten: {
    softwarebibliotheken: [
      { name: "Spring Boot", version: "3.3.2", lizenz: "Apache-2.0", supportStatus: "aktiv", cveGeprueft: true },
      { name: "React", version: "18.3.1", lizenz: "MIT", supportStatus: "aktiv", cveGeprueft: true },
      { name: "Keycloak", version: "24.0.2", lizenz: "Apache-2.0", supportStatus: "aktiv", cveGeprueft: true },
      { name: "Log4j", version: "2.23.1", lizenz: "Apache-2.0", supportStatus: "aktiv", cveGeprueft: true },
    ],
    betriebssystem: "RHEL 9.4 (Nodes), Container-Basisimages: UBI9-minimal",
    datenbanken: [
      { typ: "PostgreSQL", version: "16.3", clusterSetup: "Patroni, 1 Primary + 2 Replicas je RZ" },
      { typ: "Redis", version: "7.2", clusterSetup: "Sentinel, 3 Knoten" },
    ],
    externeServices: [
      { name: "Schufa B2B-API", art: "API", anbieter: "SCHUFA Holding AG" },
      { name: "S3-Objektspeicher", art: "Cloud-Service", anbieter: "interner MinIO-Dienst" },
      { name: "Push-Notification-Gateway", art: "Cloud-Service", anbieter: "Firebase/APNs" },
    ],
    andereServicegruppen: [
      { servicegruppe: "Kernbanksystem CoreBank24", dependencyType: "hard" },
      { servicegruppe: "Zahlungsverkehr-Gateway", dependencyType: "hard" },
      { servicegruppe: "Kunden-Stammdaten-Service", dependencyType: "soft" },
    ],
    openSourceLizenzen:
      "<p>Compliance-Matrix in SBOM-Repository gepflegt (CycloneDX). Keine Copyleft-Lizenzen (GPL) " +
      "in ausgelieferten Artefakten; LGPL-Komponenten nur dynamisch gelinkt. Review quartalsweise.</p>",
    supportVertraege: [
      { vendor: "Red Hat (RHEL/OpenShift)", laufzeitBis: "2027-06-30", sla: "24/7, Reaktionszeit 1 h (Sev1)" },
      { vendor: "F5 Networks", laufzeitBis: "2026-12-31", sla: "NBD-Hardwaretausch, 24/7-Hotline" },
    ],
  },

  ansprechpartner: {
    kontakte: [
      { rolle: "Servicemanager", name: "Sabine Hoffmann", email: "s.hoffmann@demo-finanzit.de", telefon: "+49 69 1234-100", verfuegbarkeit: "Mo–Fr 8–18 Uhr", notfallHotline: true, zeitzone: "Europe/Berlin", einheit: "IT-Servicemanagement", gueltigBis: "2027-12-31", stellvertreter: "Jonas Weber" },
      { rolle: "TechnischerLeiter", name: "Jonas Weber", email: "j.weber@demo-finanzit.de", telefon: "+49 69 1234-110", verfuegbarkeit: "Mo–Fr 9–17 Uhr", notfallHotline: true, zeitzone: "Europe/Berlin", einheit: "Plattform-Engineering", gueltigBis: "2027-12-31", stellvertreter: "Sabine Hoffmann" },
      { rolle: "Sicherheit", name: "Dr. Lena Krüger", email: "l.krueger@demo-finanzit.de", telefon: "+49 69 1234-120", verfuegbarkeit: "Mo–Fr 8–16 Uhr", notfallHotline: true, zeitzone: "Europe/Berlin", einheit: "Informationssicherheit", gueltigBis: "2026-12-31", stellvertreter: "Tom Brandt" },
      { rolle: "Datenschutz", name: "Murat Aydin", email: "m.aydin@demo-finanzit.de", telefon: "+49 69 1234-130", verfuegbarkeit: "Mo–Do 9–15 Uhr", notfallHotline: false, zeitzone: "Europe/Berlin", einheit: "Datenschutz & Recht", gueltigBis: "2027-06-30", stellvertreter: "" },
      { rolle: "Betrieb", name: "Tom Brandt", email: "t.brandt@demo-finanzit.de", telefon: "+49 69 1234-140", verfuegbarkeit: "Schichtdienst 24/7", notfallHotline: true, zeitzone: "Europe/Berlin", einheit: "IT-Operations", gueltigBis: "2027-12-31", stellvertreter: "" },
    ],
  },

  schutzbedarf: {
    vertraulichkeit: "sehr hoch",
    vertraulichkeitBegruendung:
      "<p>Verarbeitung von Bankgeheimnis-relevanten Konto- und Transaktionsdaten sowie " +
      "personenbezogenen Daten besonderer Sensibilität. Offenlegung hätte gravierende rechtliche " +
      "und reputative Folgen (§ 25a KWG, DSGVO).</p>",
    integritaet: "sehr hoch",
    integritaetBegruendung:
      "<p>Manipulierte Buchungen oder Limits führen unmittelbar zu finanziellen Schäden. " +
      "Vier-Augen-Prinzip und HSM-gestützte Signaturen für Zahlungsfreigaben erforderlich.</p>",
    verfuegbarkeit: "hoch",
    verfuegbarkeitBegruendung:
      "<p>Primärer Kundenkanal; Ausfall > 2 h erzeugt erhebliche Supportlast und Reputationsschaden. " +
      "Kurze Wartungsfenster nachts tolerierbar, daher 'hoch' statt 'sehr hoch'.</p>",
    einstufungsbegruendung:
      "<p>Gesamtschutzbedarf nach Maximumprinzip: <strong>sehr hoch</strong>. " +
      "Einstufung im Sicherheitsboard am 12.01.2026 bestätigt; nächste Überprüfung in 12 Monaten.</p>",
    gueltigkeitsdatum: "2026-01-12",
    beteiligte: ["Servicemanager", "TechnischerLeiter", "Sicherheit", "Datenschutz", "Geschäftsleitung"],
  },

  datensicherung: {
    backupStrategie: "Incremental",
    backupHaeufigkeit: "täglich",
    aufbewahrungsdauerTage: 90,
    backupZiele: [
      { speichertyp: "Disk-to-Disk (Ceph)", ort: "RZ A, Brandabschnitt 2", zugriffsberechtigung: "Backup-Operatoren (Rolle BCK-OP)", verschluesselt: true },
      { speichertyp: "Tape (LTO-9)", ort: "Auslagerung RZ B + Bankschließfach", zugriffsberechtigung: "nur Backup-Administratoren, Vier-Augen", verschluesselt: true },
    ],
    rtoMinuten: 120,
    rpoMinuten: 15,
    testFrequenz: "quartalsweise",
    letzteSicherung: "2026-06-09",
    sicherungsverantwortlicher: "Tom Brandt (IT-Operations)",
  },

  datenmanagement: {
    datenbestaende: [
      { name: "Transaktionshistorie", art: "strukturiert (PostgreSQL)", umfang: "8,5 TB / 1,4 Mrd. Datensätze", klassifizierung: "streng vertraulich" },
      { name: "Kundenpostfach-Dokumente", art: "unstrukturiert (S3)", umfang: "22 TB", klassifizierung: "vertraulich" },
      { name: "Session-/Telemetriedaten", art: "semi-strukturiert (Kafka/ELK)", umfang: "1,2 TB rollierend", klassifizierung: "intern" },
    ],
    datenquellen: "<p>Kernbanksystem (Buchungen), Kunden-Stammdaten-Service, Kundeneingaben über Web/App, PSD2-Drittanbieter.</p>",
    datenziele: "<p>Kernbanksystem (Zahlungsaufträge), Data-Warehouse (anonymisierte Nutzungsstatistiken), Archivsystem (revisionssichere Ablage).</p>",
    datenflussBeschreibung:
      "<p>Schreibender Datenfluss ausschließlich über die Banking-Core-API mit Schema-Validierung; " +
      "lesende Replikate für Reporting. Export ins DWH täglich 02:00 Uhr, pseudonymisiert.</p>",
    aufbewahrungsfristen: [
      { datensatzTyp: "Buchungs-/Transaktionsdaten", frist: "10 Jahre", begruendung: "§ 257 HGB, § 147 AO" },
      { datensatzTyp: "Kommunikation Kundenpostfach", frist: "7 Jahre", begruendung: "WpHG-Dokumentationspflichten" },
      { datensatzTyp: "Web-Session-Logs", frist: "90 Tage", begruendung: "Sicherheitsanalyse, danach Löschung (DSGVO Art. 5)" },
    ],
    datenloeschung:
      "<p>Automatisierter Löschjob (monatlich) auf Basis der Fristentabelle; Löschprotokolle revisionssicher. " +
      "Verifizierung durch Stichproben des Datenschutzbeauftragten halbjährlich.</p>",
    dsgvoCompliance:
      "<p>Verarbeitungsverzeichnis VV-2024-017; Rechtsgrundlagen Art. 6 Abs. 1 lit. b DSGVO (Vertrag) und " +
      "lit. c (gesetzliche Pflichten). Auskunfts- und Löschprozesse über zentrales DSGVO-Portal angebunden.</p>",
    archivierung: "<p>Revisionssichere Archivierung (WORM) im DMS; Zugriff nur Compliance & Revision; Auslagerung nach 2 Jahren.</p>",
    datenqualitaet: "<p>Schema-Validierung (JSON Schema) an allen Eingängen, Plausibilitätsregeln (IBAN-Prüfziffer, Limite), monatliches DQ-Dashboard.</p>",
  },

  berechtigungskonzept: {
    rollen: [
      { rollenname: "OBP-USER-SUPPORT", funktion: "1st-Level-Kundensupport", berechtigungen: "Kundenstammdaten lesen, Sessions einsehen" },
      { rollenname: "OBP-OPS", funktion: "Plattformbetrieb", berechtigungen: "Deployments, Logs, kein Zugriff auf Kundendaten" },
      { rollenname: "OBP-ADMIN", funktion: "Fachadministration", berechtigungen: "Limitverwaltung, Feature-Flags (Vier-Augen)" },
    ],
    berechtigungsmatrix: [
      { subjekt: "OBP-USER-SUPPORT", ressource: "Kundenprofil", action: "read" },
      { subjekt: "OBP-OPS", ressource: "K8s-Namespace obp-prod", action: "write" },
      { subjekt: "OBP-ADMIN", ressource: "Transaktionslimits", action: "write" },
      { subjekt: "Batch-Service dwh-export", ressource: "Replika-DB", action: "read" },
    ],
    authMechanismus: "OIDC",
    ssoIntegration: true,
    ssoProtokoll: "OIDC/OAuth2 über Konzern-IdP (Entra ID), Mitarbeiter mit FIDO2",
    passwortPolicy: "<p>Kunden: min. 10 Zeichen + 2FA (photoTAN/App). Mitarbeiter: passwortlos (FIDO2), Fallback 14 Zeichen, 90-Tage-Rotation nur bei Fallback.</p>",
    accessReview: "<p>Quartalsweise Rezertifizierung aller privilegierten Rollen durch Fachvorgesetzte im IAM-Tool; Eskalation an CISO bei Überfälligkeit > 14 Tage.</p>",
    privilegeEscalation: "<p>Break-Glass-Konten im Vault, Nutzung nur mit Incident-Ticket + Freigabe Servicemanager; automatische Session-Aufzeichnung.</p>",
    auditLoggingZugriffe: true,
    auditLogAufbewahrung: "2 Jahre (SIEM), revisionssicher",
    segregationOfDuties: "<p>Getrennte Funktionspaare: Deployment ↔ Freigabe, Limitänderung ↔ Limitfreigabe, Backup-Administration ↔ Restore-Freigabe. SoD-Matrix im IAM hinterlegt, Konfliktprüfung automatisiert.</p>",
  },

  betriebsprozesse: {
    betriebsmodell: "24/7",
    schichtModell: "<p>3-Schicht-Modell (Früh/Spät/Nacht) mit je 2 Operatoren; Übergabe per standardisiertem Shift-Handover-Protokoll im Ops-Wiki.</p>",
    monitoring: "<p>Prometheus + Grafana (Infrastruktur), Instana (APM), Blackbox-Synthetics alle 60 s aus 4 Regionen. Alerting via Alertmanager → OpsGenie.</p>",
    logging: "<p>Zentrales ELK (Elastic 8); App-Logs strukturiert (JSON), Retention 90 Tage hot / 1 Jahr warm; sicherheitsrelevante Events zusätzlich ins SIEM.</p>",
    kpis: [
      { metrik: "Verfügbarkeit (monatlich)", schwellwert: ">= 99,9 %", messmethode: "Synthetics, 60-s-Intervall" },
      { metrik: "API-P95-Latenz", schwellwert: "< 400 ms", messmethode: "APM (Instana)" },
      { metrik: "Fehlerrate 5xx", schwellwert: "< 0,1 %", messmethode: "Gateway-Metriken" },
    ],
    changeManagement: "<p>Changes über ITSM (ServiceNow): Standard-Changes vorab genehmigt, Normal-Changes mit CAB-Freigabe (Di/Do), Emergency-Changes mit nachgelagerter Genehmigung.</p>",
    konfigurationsmanagement: "<p>GitOps (ArgoCD): sämtliche K8s-Manifeste, Helm-Values und Infrastruktur (Terraform) versioniert; Drift-Detection täglich.</p>",
    runbooksUrl: "https://wiki.demo-finanzit.de/obp/runbooks",
    wartungsfenster: "<p>Geplant: Mittwoch 02:00–04:00 Uhr (rollierend, unterbrechungsfrei angestrebt); kundenwirksame Wartung max. 4×/Jahr mit 7 Tagen Vorankündigung.</p>",
    performanceBaseline: "<p>Normallast: 350 req/s, P95 280 ms, CPU-Auslastung Cluster 35 %; Spitzenlast (Monatsanfang): 900 req/s.</p>",
  },

  sicherheitsprozesse: {
    threatModelingDurchgefuehrt: true,
    threatModelingDatum: "2026-02-20",
    threatModelingMethode: "STRIDE",
    schwachstellenManagement: "<p>Tägliche Scans (Trivy/Container, Nessus/Infrastruktur), SLA: kritisch 72 h, hoch 14 Tage, mittel 90 Tage. Tracking in Jira-Security-Board.</p>",
    pentests: true,
    pentestFrequenz: "jährlich",
    pentestLetzte: "2025-11-15",
    pentestErgebnisse: "<p>Letzter Test (extern, 3 Wochen): 0 kritische, 2 hohe Findings (Session-Fixation im Altportal, Header-Härtung) – beide geschlossen, Nachtest 2026-01 bestanden.</p>",
    codeReview: "<p>Vier-Augen-Review verpflichtend (PR-Gate), SAST (SonarQube + Semgrep) in CI, Security-Champion-Review bei kritischen Modulen (Zahlungsfreigabe, Auth).</p>",
    secureCoding: true,
    secureCodingStandards: "OWASP ASVS L2, interner Secure-Coding-Standard SCS-3.1",
    kryptographie: "<p>TLS 1.3 extern, mTLS intern; Datenbank-Verschlüsselung AES-256-GCM; Zahlungssignaturen über HSM (Thales Luna); Schlüsselrotation jährlich, Krypto-Inventar gepflegt.</p>",
    zertifikatManagement: "<p>Interne PKI (EJBCA) + öffentliche Zertifikate via ACME; automatisches Renewal 30 Tage vor Ablauf, Ablauf-Monitoring im Dashboard mit Alarm bei < 21 Tagen.</p>",
    secretsManagement: "<p>HashiCorp Vault (HA): dynamische DB-Credentials (TTL 24 h), App-Secrets via CSI-Driver; Rotation statischer Secrets quartalsweise; keine Secrets in Git (Pre-Commit-Hook + Scanner).</p>",
    sicherheitsTraining: "<p>Verpflichtendes Security-Awareness-Training jährlich (alle MA), Secure-Coding-Workshops halbjährlich für Entwickler, Phishing-Simulationen quartalsweise.</p>",
    incidentResponsePlan: "<p>IR-Plan v4.2 (Wiki): Erkennen → Eindämmen → Beseitigen → Wiederherstellen → Lessons Learned. Eskalation: SOC → CSIRT → CISO → Vorstand; Meldewege BaFin/BSI (DORA Art. 19) hinterlegt.</p>",
  },

  sicherheitsueberwachung: {
    siemIntegration: "<p>Splunk ES; angebunden: WAF, API-Gateway, Auth-Service (Login-Events), K8s-Audit-Log, Datenbank-Audit, Vault. Log-Typ: CEF/JSON, near-realtime (< 60 s).</p>",
    idsIpsDeployed: true,
    idsIpsKonfiguration: "<p>Suricata an Zonenübergängen (DMZ↔App, App↔DB), Signaturen täglich aktualisiert; Inline-IPS nur am DMZ-Übergang.</p>",
    wafDeployed: true,
    wafKonfiguration: "<p>F5 Advanced WAF: OWASP-CRS + Custom-Rules (Bot-Abwehr, Credential-Stuffing-Schutz, Geo-Blocking für Verwaltungspfade), Blocking-Mode.</p>",
    dlpDeployed: false,
    dlpKriterien: "<p>DLP auf Plattformebene nicht im Scope; Exfiltrationserkennung über SIEM-Use-Cases (Volumen-Anomalien an Egress-Punkten).</p>",
    anomalyDetection: "ML-basiert",
    incidentResponseTools: "<p>SOAR: Splunk SOAR mit Playbooks (Account-Sperrung, IP-Blocking, Ticket-Anlage); Ticketing: ServiceNow SecOps.</p>",
    alertSchwellwerte: [
      { alertTyp: "Fehlgeschlagene Logins", condition: "> 50/min pro IP oder > 5 pro Konto", action: "Auto-Block (15 min) + SOC-Alarm" },
      { alertTyp: "Transaktions-Anomalie", condition: "ML-Score > 0,9", action: "Transaktion anhalten, Fraud-Team-Review" },
      { alertTyp: "Privilegierter Zugriff außerhalb Wartungsfenster", condition: "jede Nutzung", action: "Sofortige SOC-Benachrichtigung" },
    ],
    falsePositiveRate: 4,
    eskalationskette: "<p>SOC-Analyst (24/7) → SOC-Lead (15 min) → CSIRT-Bereitschaft (30 min) → CISO (Sev1 sofort) → Krisenstab.</p>",
    alertResponseSla: "<p>Sev1: Reaktion 15 min / Eindämmung 1 h · Sev2: 30 min / 4 h · Sev3: 4 h / 2 AT · Sev4: 1 AT / Best Effort.</p>",
  },

  fehlernachtest: {
    rcaDurchgefuehrt: true,
    rcaDokumentation:
      "<p><strong>Problem:</strong> 38-minütiger Teilausfall Login (2026-03-04). " +
      "<strong>Ursache:</strong> Memory-Leak im Auth-Service nach Keycloak-Patch in Kombination mit zu engem Pod-Memory-Limit. " +
      "<strong>Maßnahmen:</strong> Limits angepasst, Heap-Monitoring-Alarm ergänzt, Patch-Smoke-Test erweitert.</p>",
    lessonsLearned: "<p>Lasttests müssen Patch-Releases der Auth-Komponente einschließen; Canary-Deployment auch für Sicherheits-Patches verpflichtend.</p>",
    followUpActions: [
      { massnahme: "Canary-Pflicht für Auth-Patches in CD-Pipeline", owner: "Jonas Weber", faelligkeit: "2026-04-15", status: "erledigt" },
      { massnahme: "Heap-Dashboards für alle Java-Services", owner: "Tom Brandt", faelligkeit: "2026-05-31", status: "erledigt" },
      { massnahme: "Lasttest-Suite um Login-Szenario erweitern", owner: "QA-Team", faelligkeit: "2026-07-31", status: "in Arbeit" },
    ],
    haeufigkeit: "Nach jedem Sev1/Sev2-Incident verpflichtend; zusätzlich quartalsweise Review aller Sev3-Sammelmeldungen.",
    historischeFehlerUrl: "https://wiki.demo-finanzit.de/obp/postmortems",
    verbesserungen: "<p>Seit Q1/2026: MTTR von 95 auf 41 Minuten gesenkt; wiederkehrende Incident-Klasse 'Zertifikatsablauf' durch Auto-Renewal vollständig eliminiert.</p>",
    beteiligte: ["TechnischerLeiter", "Betrieb", "Entwicklung", "Sicherheit"],
  },

  regelbetrieb: {
    typischeLast: "<p>Werktags: Ø 350 req/s (API), 1,2 Mio. Kundeninteraktionen/Tag; Peak morgens 8–10 Uhr und zum Monatswechsel (bis 900 req/s). Nachtfenster: < 40 req/s.</p>",
    saisonalitaet: "<p>Spitzen: Monatsanfang (Gehaltseingänge), Quartalsende, Black-Friday-Woche (+60 % Kartenumsatz-Abfragen), Steuertermine.</p>",
    ressourcenBaseline: [
      { ressource: "CPU", auslastungProzent: 35 },
      { ressource: "Memory", auslastungProzent: 55 },
      { ressource: "Disk", auslastungProzent: 48 },
      { ressource: "Network", auslastungProzent: 22 },
    ],
    typischeAblaeufe: [
      { useCase: "Login mit 2FA", dauer: "8 s (inkl. Kundeninteraktion)" },
      { useCase: "SEPA-Überweisung erfassen + freigeben", dauer: "45 s" },
      { useCase: "Kontoumsätze laden (90 Tage)", dauer: "350 ms" },
    ],
    benutzeraufkommen: "<p>2,1 Mio. registrierte Nutzer, davon ~480.000 täglich aktiv; 70 % App, 30 % Web; gleichzeitige Sessions Peak: 85.000.</p>",
    datenvolumenInGb: 25,
    datenvolumenOutGb: 18,
    abhaengigeSysteme: "<p>Data-Warehouse (Tagesexport), Fraud-Detection-Plattform (Event-Stream), Kundenkommunikations-Hub (Postfach-Trigger).</p>",
    wartungszyklen: "<p>Rolling Deployments 2–3×/Woche (unterbrechungsfrei); Infrastruktur-Patching monatlich im Wartungsfenster; K8s-Upgrades quartalsweise Cluster-rollierend.</p>",
    kostenmodell: "<p>Interne Verrechnung: 0,9 Cent/Transaktion; Lizenzkosten (WAF, APM, SIEM-Anteil) ~ 1,1 Mio. €/Jahr; Showback-Report monatlich an Fachbereich.</p>",
  },

  stoerungsbehandlung: {
    klassifizierung: "<p>Sev1: Kernfunktion (Login/Zahlung) für > 10 % der Nutzer gestört · Sev2: wesentliche Funktion beeinträchtigt, Workaround vorhanden · Sev3: Einzelfunktion/einzelne Kunden · Sev4: kosmetisch.</p>",
    eskalationspfade: [
      { severity: "1", eskalationAn: "Ops-Bereitschaft + Servicemanager + CISO-on-call, Krisenstab nach 60 min", responseTimeMinuten: 15 },
      { severity: "2", eskalationAn: "Ops-Bereitschaft + Teamlead Plattform", responseTimeMinuten: 30 },
      { severity: "3", eskalationAn: "Plattform-Team (Bürozeiten)", responseTimeMinuten: 240 },
      { severity: "4", eskalationAn: "Backlog-Triage wöchentlich", responseTimeMinuten: 2880 },
    ],
    kommunikation: "<p>Sev1/2: Statusseite + Push-Info im Banking, Management-Info nach 30 min, BaFin-Meldung gemäß DORA-Schwellwerten; Sev3: Support-Wissensdatenbank.</p>",
    workarounds: "<p>Häufig: photoTAN-Sync-Fehler → Geräte-Rebind; Postfach-Anhänge laden nicht → CDN-Cache-Purge; App-Login-Schleife → Token-Reset per Support-Tool.</p>",
    bekannteProbleme: [
      { problem: "Depot-Chart langsam bei > 5 Jahren Historie", workaround: "Zeitraum einschränken", status: "in Arbeit", zielfix: "Release 4.3 (Q3/2026)" },
      { problem: "Sporadischer Timeout Schufa-Anbindung", workaround: "automatischer Retry", status: "offen", zielfix: "Lieferantenticket SCH-4711" },
    ],
    hotfixChangeControl: true,
    postIncidentTrigger: "<p>Verpflichtend bei: jedem Sev1, Sev2 > 2 h, Datenschutzrelevanz, wiederholtem Auftreten (≥ 3× in 30 Tagen) oder Medienaufmerksamkeit.</p>",
    issueTrackingUrl: "https://jira.demo-finanzit.de/projects/OBP",
  },

  sicherheitsanalysen: {
    assessmentDurchgefuehrt: true,
    assessmentDatum: "2026-04-10",
    assessmentVon: "Konzernrevision + externer Auditor (TÜV Informationstechnik)",
    framework: "BAIT",
    ergebnis: "<p>92 von 96 geprüften Controls wirksam; Konformitätslevel 'weitgehend erfüllt'. Keine wesentlichen Feststellungen, 4 geringfügige Abweichungen mit Maßnahmenplan.</p>",
    kritischeBefunde: [
      { befund: "Rezertifizierung technischer Konten unvollständig dokumentiert", risiko: "mittel", remediationPlan: "Ausweitung IAM-Rezertifizierung auf Servicekonten", deadline: "2026-08-31" },
      { befund: "Notfallhandbuch-Version im DR-Standort veraltet", risiko: "niedrig", remediationPlan: "Automatische Verteilung aus Dokumenten-Repository", deadline: "2026-07-15" },
    ],
    complianceStatus: "<p>BAIT/MaRisk: konform mit Maßnahmenplan; DORA: Gap-Analyse abgeschlossen, IKT-Risikomanagement-Anpassungen bis Q4/2026 in Umsetzung.</p>",
    riskRegister: "<p>5 offene operative Risiken im Konzern-Risikoregister (max. Einstufung 'mittel'); quartalsweises Review im IT-Risk-Komitee.</p>",
    mitigationStrategies: "<p>Akzeptiertes Restrisiko 'Abhängigkeit Einzellieferant WAF' mit Exit-Strategie (CRS-kompatible Alternative evaluiert, Migrationsplan dokumentiert).</p>",
    naechsteBewertung: "2027-04-30",
    externeAudits: "<p>ISO-27001-Überwachungsaudit 2025 bestanden (Zertifikat bis 2027-09); jährliche § 44 KWG-Prüfungsbegleitung.</p>",
  },

  notfallbewaeltigung: {
    bcpVorhanden: true,
    szenarien: [
      { szenario: "Komplettausfall RZ A", wahrscheinlichkeit: 2, impact: "Failover auf RZ B via GSLB; Kapazität 100 %, RTO 30 min" },
      { szenario: "Ransomware auf Plattform-Infrastruktur", wahrscheinlichkeit: 5, impact: "Isolierung, Wiederaufbau aus immutable Backups; RTO 24 h" },
      { szenario: "Ausfall Kernbank-Anbindung", wahrscheinlichkeit: 8, impact: "Read-Only-Betrieb (Kontoansicht ohne Buchung), Kundeninfo-Banner" },
      { szenario: "DDoS > 100 Gbit/s", wahrscheinlichkeit: 15, impact: "Scrubbing-Center des Providers, Geo-Fencing; Beeinträchtigung < 15 min" },
    ],
    eskalationskette: "<p>Erkennende Stelle → Ops-Bereitschaft → Notfallmanager (15 min) → Krisenstab (Servicemanager, CISO, Kommunikation, Vorstand) bei Szenario-Einstufung ≥ 'erheblich'.</p>",
    koordinationszentrum: "<p>Krisenraum Hauptverwaltung (Geb. C, R 4.012) mit autarker Kommunikation; virtueller Fallback: dedizierte Conference-Bridge + Krisen-Chat.</p>",
    kommunikationsplan: "<p>Intern: Krisen-Chat, Mitarbeiter-Hotline. Extern: Statusseite, Pressestelle (freigegebene Templates), BaFin-/BSI-Meldewege, Kundeninfo über App-Push.</p>",
    datenschutzNotfall: "<p>DSB ist Mitglied des Krisenstabs; 72-h-Meldepflicht (Art. 33 DSGVO) im IR-Playbook verankert; Notfallzugriffe werden protokolliert und nachträglich rezertifiziert.</p>",
    recoveryProcedures: "<p>Checklisten je Szenario im Notfallhandbuch (Kap. 7): Priorität 1 Auth + Kontoübersicht, Priorität 2 Zahlungsverkehr, Priorität 3 Komfortfunktionen. Wiederanlauf kernbankseitig abgestimmt.</p>",
    testplan: "halbjährlich",
    alternativeStandorte: "<p>RZ B (aktiv-aktiv, 18 km Entfernung); Arbeitsplatz-Notbetrieb über VDI aus Ausweichstandort Eschborn.</p>",
    notfallplanUrl: "https://wiki.demo-finanzit.de/obp/notfallhandbuch",
  },

  sicherheitsgovernance: {
    ciso: "Dr. Lena Krüger (CISO-Office, l.krueger@demo-finanzit.de)",
    steeringCommittee: "<p>IT-Security-Board: CISO (Vorsitz), CIO, Leiter Plattform, DSB, Compliance; monatliche Sitzung, Ad-hoc bei Sev1-Sicherheitsvorfällen.</p>",
    policyDokumente: "<p>Konzern-IS-Leitlinie v6, Richtlinie Kryptographie KR-2.4, Cloud-Richtlinie CL-1.9, Richtlinie Identitäten & Zugriffe IAM-3.2 – alle im Policy-Portal.</p>",
    riskFramework: "<p>Konzern-Risikomethodik nach MaRisk: Risiko = Eintrittswahrscheinlichkeit × Schaden (5×5-Matrix); IT-Risiken quartalsweise an ORM gemeldet.</p>",
    thirdPartyRisk: "<p>Lieferantenbewertung vor Onboarding (Fragebogen + Evidenzen), kritische Dienstleister jährlich auditiert; Auslagerungsregister gemäß EBA-Guidelines/DORA gepflegt.</p>",
    datenschutzbeauftragter: "Murat Aydin (m.aydin@demo-finanzit.de)",
    complianceOfficer: "Petra Sommer (Compliance, p.sommer@demo-finanzit.de)",
    auditPlaene: [
      { audit: "Interne Revision: Berechtigungsmanagement OBP", geplant: "2026-09-15", verantwortlich: "Konzernrevision" },
      { audit: "ISO-27001-Überwachungsaudit", geplant: "2026-10-20", verantwortlich: "TÜV Informationstechnik" },
      { audit: "DORA-Readiness-Review", geplant: "2026-11-30", verantwortlich: "CISO-Office" },
    ],
    regelwerke: ["BAIT", "MaRisk", "DORA", "DSGVO", "KWG", "ISO 27001"],
  },

  ci_liste: {
    hardware: [
      { typ: "Load Balancer", modell: "F5 BIG-IP i5800", seriennummer: "F5-2023-08842", standort: "RZ A, Rack 12", owner: "Netzwerk-Team", supportVertrag: "F5 Premium bis 2026-12" },
      { typ: "HSM", modell: "Thales Luna S790", seriennummer: "TL-790-00231", standort: "RZ A, Sicherheitsraum", owner: "CISO-Office", supportVertrag: "Thales Gold bis 2027-05" },
      { typ: "Server", modell: "Dell PowerEdge R760", seriennummer: "DPE-2024-1107", standort: "RZ B, Rack 4", owner: "Plattform-Engineering", supportVertrag: "ProSupport 4 h bis 2028-01" },
    ],
    softwareLizenzen: [
      { produkt: "Instana APM", lizenzKey: "INST-****-7741", gueltigBis: "2027-03-31", anzahl: 250 },
      { produkt: "Splunk Enterprise Security", lizenzKey: "SPLK-****-0193", gueltigBis: "2026-12-31", anzahl: 1 },
      { produkt: "F5 Advanced WAF", lizenzKey: "F5AW-****-5520", gueltigBis: "2026-12-31", anzahl: 4 },
    ],
    netzwerkDevices: [
      { geraetetyp: "Firewall", modell: "Palo Alto PA-5430", ip: "10.10.99.1", konfigStatus: "aktuell" },
      { geraetetyp: "Switch", modell: "Cisco Nexus 9336", ip: "10.10.99.10", konfigStatus: "aktuell" },
      { geraetetyp: "Load Balancer", modell: "F5 BIG-IP i5800", ip: "10.10.10.5", konfigStatus: "aktuell" },
    ],
    vmsContainer: [
      { name: "obp-api-prod (Deployment, 24 Pods)", vcpu: 4, ramGb: 8, storageGb: 20, os: "UBI9-minimal", patchLevel: "2026-06 (Base-Image)" },
      { name: "obp-frontend-prod (12 Pods)", vcpu: 2, ramGb: 4, storageGb: 10, os: "UBI9-minimal", patchLevel: "2026-06" },
      { name: "pg-primary-a (VM)", vcpu: 32, ramGb: 256, storageGb: 4000, os: "RHEL 9.4", patchLevel: "2026-05" },
    ],
    datenbanken: [
      { typ: "PostgreSQL (OBP-Core)", version: "16.3", groesseGb: 8500, backupStatus: "aktiv" },
      { typ: "Redis (Session-Cache)", version: "7.2", groesseGb: 64, backupStatus: "aktiv" },
    ],
    zertifikate: [
      { aussteller: "DigiCert", ablaufdatum: "2026-11-02", verwendungszweck: "banking.demo-finanzit.de (extern)" },
      { aussteller: "Interne PKI (EJBCA)", ablaufdatum: "2026-09-18", verwendungszweck: "mTLS Service-Mesh" },
      { aussteller: "SWIFT-PKI", ablaufdatum: "2027-01-25", verwendungszweck: "SWIFT Alliance Gateway" },
    ],
    konfigRepo: "git@git.demo-finanzit.de:obp/platform-config.git (Branch: main, GitOps via ArgoCD)",
    changeTracking: "<p>Letzte Änderung: 2026-06-08, J. Weber – Erhöhung HPA-Limits Payment-Engine (Change CHG0042811).</p>",
    complianceStatus: "<p>Alle Assets im unterstützten Versionsstand; keine EOL-Komponenten. Nächste EOL-Prüfung: Redis 7.2 (EOL 2027) – Upgrade auf 8 in Planung.</p>",
  },
};
