# BesiDoc REST-API

Alle Endpunkte (außer Login/Refresh) erfordern `Authorization: Bearer <accessToken>`.
Fehler werden als `{ "error": "Beschreibung" }` mit passendem HTTP-Status geliefert.

## Auth

| Methode | Pfad                | Beschreibung                                   |
| ------- | ------------------- | ---------------------------------------------- |
| POST    | `/api/auth/login`   | `{email, password}` → Access-/Refresh-Token    |
| POST    | `/api/auth/refresh` | `{refreshToken}` → neue Tokens (Rotation)      |
| POST    | `/api/auth/logout`  | `{refreshToken}` → Token invalidieren          |
| GET     | `/api/auth/me`      | Aktueller Benutzer                             |

## Moduldefinitionen

| GET | `/api/module-definitions` | Deklarative Schemata aller 19 Module (treibt das Frontend-Formular) |

## Servicegruppen

| Methode | Pfad                       | Beschreibung                                                    |
| ------- | -------------------------- | --------------------------------------------------------------- |
| GET     | `/api/service-groups`      | Liste; Filter: `?status=…&search=…&owner=me`                     |
| POST    | `/api/service-groups`      | `{name, department?, dueDate?}` – legt alle 19 Modulinstanzen an |
| GET     | `/api/service-groups/:id`  | Detail inkl. Modul-Status, erlaubter Aktionen, Editierbarkeit    |
| DELETE  | `/api/service-groups/:id`  | Nur Admin oder Creator im Entwurf                                |

## Module

| Methode | Pfad                                              | Beschreibung                                               |
| ------- | ------------------------------------------------- | ---------------------------------------------------------- |
| GET     | `/api/service-groups/:id/modules/:key`            | Daten + Validierung + Füllgrad                              |
| PUT     | `/api/service-groups/:id/modules/:key`            | `{data, versionComment?}` – speichert + erzeugt Version    |
| GET     | `/api/service-groups/:id/modules/:key/versions`   | Versionshistorie (max. 50)                                  |

Im Zustand ENTWURF werden fehlende Pflichtfelder beim Speichern als
Warnungen zurückgegeben (WIP-Speichern); fachliche Formatfehler (CIDR,
Ports, E-Mail …) bleiben Fehler.

## Workflow

| Methode | Pfad                                      | Beschreibung                                        |
| ------- | ----------------------------------------- | ---------------------------------------------------- |
| POST    | `/api/service-groups/:id/workflow`        | `{action, reason?, category?, rejectTarget?}`        |
| GET     | `/api/service-groups/:id/workflow/history`| Übergangshistorie                                    |

Aktionen: `submit`, `approve`, `reject` (Grund Pflicht, Kategorien:
„zu unvollständig", „falsch verstanden", „Qualität zu niedrig",
„nicht konform"), `finalReject`, `reopen`, `archive`.
`submit` schlägt mit 422 fehl, solange ein Modul Pflichtfelder verletzt.

## Kommentare (Review-Feedback)

| Methode | Pfad                                           | Beschreibung                                         |
| ------- | ---------------------------------------------- | ----------------------------------------------------- |
| GET     | `/api/service-groups/:id/comments?moduleKey=…` | Kommentare (optional je Modul)                        |
| POST    | `/api/service-groups/:id/comments`             | `{moduleKey?, fieldKey?, text, severity, parentId?}`  |
| PATCH   | `/api/service-groups/:id/comments/:commentId`  | `{status}`: OFFEN → KORRIGIERT (Creator) → ERLEDIGT (Prüfer) |

## Anhänge

| POST | `/api/service-groups/:id/attachments` | multipart (`file`, `moduleKey`, `fieldKey?`, `altText?`); PDF/PNG/JPG/SVG/Excel, max. 10 MB |
| GET  | `/api/service-groups/:id/attachments` | Liste |
| GET  | `/api/service-groups/:id/attachments/:attachmentId/download` | Download |

## Export

| GET | `/api/export/:id/pdf` | PDF der kompletten Servicegruppe. Nur GENEHMIGT/ARCHIVIERT; `?draft=true` für Vorschau, `?exclude=key1,key2` schließt Module aus |

## Administration

| Methode | Pfad             | Beschreibung                                    |
| ------- | ---------------- | ------------------------------------------------ |
| GET     | `/api/users`     | Benutzerliste (Admin)                            |
| POST    | `/api/users`     | Benutzer anlegen (Admin)                         |
| PATCH   | `/api/users/:id` | Rolle/Aktiv/Name ändern (Admin)                  |
| DELETE  | `/api/users/:id` | DSGVO-Anonymisierung (Admin)                     |
| GET     | `/api/audit`     | Audit-Log, paginiert `?limit&offset` (Admin)     |

## Sonstiges

| GET   | `/api/dashboard`               | KPIs + „Meine Aufgaben"                    |
| GET   | `/api/reviews/queue`           | Ausstehende Reviews der eigenen Prüfrolle  |
| GET   | `/api/notifications`           | In-App-Benachrichtigungen + Unread-Count   |
| PATCH | `/api/notifications/:id/read`  | Als gelesen markieren                      |
| POST  | `/api/notifications/read-all`  | Alle als gelesen markieren                 |
| GET   | `/health`                      | Healthcheck (ohne Auth)                    |
