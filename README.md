# BesiDoc – BaFin-Dokumentationsverwaltungssystem

Webbasiertes Enterprise-Tool zur Erstellung und Verwaltung von BaFin
BesiDoc-Dokumentationen („Beschreibung von IT-Systemen") für
FinanzIT-Unternehmen. Bildet den vollständigen Dokumentlebenszyklus von
Erstellung bis Genehmigung ab – mit 19 Fachmodulen, mehrstufigem
Genehmigungsworkflow, Versionierung, Audit-Log und PDF-Export.

## Schnellstart

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend-API: http://localhost:4000 (Healthcheck: `/health`)

Der Seed legt zwei Beispiel-Servicegruppen an: einen teilweise gefüllten
Entwurf („Zahlungsverkehr-Gateway") zum Weiterarbeiten und ein **vollständig
ausgefülltes, genehmigtes Beispiel-Dokument** („Online-Banking-Plattform")
mit allen 19 Modulen, Workflow-Historie und Review-Feedback — sofort als
PDF/Word/Excel exportierbar.

Demo-Zugänge (Passwort jeweils `BesiDoc2026!`):

| Rolle                  | E-Mail                        |
| ---------------------- | ----------------------------- |
| Creator                | creator@demo.besidoc.de       |
| Fachlicher Prüfer      | fachpruefer@demo.besidoc.de   |
| Redaktioneller Prüfer  | redaktion@demo.besidoc.de     |
| Admin                  | admin@demo.besidoc.de         |

## Lokale Entwicklung

```bash
# PostgreSQL starten
docker compose up -d db

# Backend (Port 4000)
cd backend && npm install && SEED_DEMO_DATA=true npm run dev

# Frontend (Port 5173, proxied /api → 4000)
cd frontend && npm install && npm run dev
```

Tests (30 Unit-Tests für Validierungs-Engine & Workflow-Zustandsmaschine):

```bash
cd backend && npm test
```

## Architektur

```
backend/   Node.js + Express + TypeScript + Sequelize (PostgreSQL)
  src/modules/        deklarative Definitionen aller 19 BesiDoc-Module (B.1–B.19)
  src/core/           Validierungs-Engine + Workflow-Zustandsmaschine (pure logic, unit-getestet)
  src/routes/         REST-API (Auth, Servicegruppen, Module, Workflow, Kommentare, Export, …)
  src/services/       PDF-Export (pdfkit), Audit-Log, Benachrichtigungen
frontend/  React 18 + TypeScript + Vite + Zustand + Tailwind/DaisyUI
  src/components/DynamicForm.tsx   ein generischer Formular-Renderer für alle 19 Module
```

**Schlüsselprinzip:** Die 19 Module sind als deklarative Schemata definiert
(`backend/src/modules/`). Backend-Validierung, Füllgrad-Berechnung,
PDF-Export und das Frontend-Formular werden alle aus derselben Definition
gespeist – neue Module oder Felder erfordern nur eine Änderung an einer Stelle.

### Die 19 Module

B.1 Kurzbeschreibung · B.2 Implementierte Architektur · B.3 Netzwerk ·
B.4 Abhängigkeiten · B.5 Ansprechpartner · B.6 Schutzbedarf ·
B.7 Datensicherung · B.8 Datenmanagement · B.9 Berechtigungskonzept ·
B.10 Betriebsprozesse · B.11 Sicherheitsprozesse · B.12 Sicherheitsüberwachung ·
B.13 Fehlernachtest · B.14 Regelbetrieb · B.15 Störungsbehandlung ·
B.16 Sicherheitsanalysen · B.17 Notfallbewältigung ·
B.18 IT-Sicherheits-Governance (lt. Spezifikation als Alternative zur Dublette gewählt) ·
B.19 CI-Liste

Fachliche Validierungen u.a.: CIDR-Format, Port-Bereiche (1–65535),
eindeutige VLAN-IDs, E-Mail/Telefon-Format, Datumslogik, RTO ≥ RPO,
Duplikat-Warnung bei Ansprechpartnern, Eindeutigkeit des Service-Namens
pro Mandant.

### Workflow (C.1)

```
ENTWURF ──submit──▶ FACHLICHE_ABNAHME ──approve──▶ REDAKTIONELLE_ABNAHME ──approve──▶ GENEHMIGT
   ▲                      │ reject (Grund Pflicht)        │ reject (→ fachlich ODER Entwurf)      │ archive (Admin)
   └──────────────────────┴───────────◀──────────────────┘                                        ▼
   ▲   reopen                                                                                ARCHIVIERT
ABGELEHNT ◀── finalReject (aus beiden Prüfphasen)
```

- Im **Entwurf** kann ohne strikte Validierung gespeichert werden (WIP);
  fehlende Pflichtfelder werden als Warnung angezeigt.
- **Einreichen** erfordert, dass alle 19 Module die Pflichtfeld-Validierung bestehen.
- In Prüfphasen ist der Creator gesperrt; Prüfer geben Feedback
  (KRITISCH/OPTIONAL) je Modul, der Creator markiert „Korrigiert",
  der Prüfer bestätigt („Erledigt").
- Entwürfe sind für andere Rollen unsichtbar; jede Statusänderung wird
  im Workflow- und Audit-Log festgehalten und löst In-App-Benachrichtigungen aus.

### Sicherheit

- JWT (15 min) + rotierende Refresh-Tokens, bcrypt-Hashing (Cost 12)
- Rollenbasierte Zugriffskontrolle auf Routen- und Workflow-Ebene
- Multi-Tenant-Datentrennung (alle Queries tenant-gebunden)
- Audit-Log mit User, Aktion, Old/New-Value, IP-Adresse
- Helmet (Security-Header), Upload-Validierung (Typ + 10-MB-Limit),
  DSGVO-konforme Nutzeranonymisierung statt Löschung

## API-Dokumentation

Siehe [docs/API.md](docs/API.md).

## Roadmap / bewusste Abgrenzung des aktuellen Stands

Umgesetzt ist die Phase-1/2/3-Kernfunktionalität der Spezifikation (alle 19
Module, Workflow, Review-System, Versionierung mit Diff & Wiederherstellen,
Audit, PDF-/Word-/Excel-Export, Auto-Save, Dashboard, Reports-Heatmap,
Benachrichtigungen, Admin). Noch offen für Folgephasen:

- Report-Builder mit Scheduling
- OIDC/SSO-Anbindung, 2FA, E-Mail-Versand (SMTP-Integration vorbereitet)
- CVE-/License-Compliance-Integrationen, Abhängigkeitsgraph-Visualisierung
- Offline-Modus mit Sync
- E2E-Tests (Playwright) und Lasttests
