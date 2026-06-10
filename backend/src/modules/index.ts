import { ModuleDef } from "./types";
import * as d1 from "./definitions-1";
import * as d2 from "./definitions-2";
import * as d3 from "./definitions-3";

/** Alle 19 BesiDoc-Module in Reihenfolge B.1 … B.19 */
export const MODULE_DEFS: ModuleDef[] = [
  d1.kurzbeschreibung,
  d1.architektur,
  d1.netzwerk,
  d1.abhaengigkeiten,
  d1.ansprechpartner,
  d1.schutzbedarf,
  d1.datensicherung,
  d2.datenmanagement,
  d2.berechtigungskonzept,
  d2.betriebsprozesse,
  d2.sicherheitsprozesse,
  d2.sicherheitsueberwachung,
  d2.fehlernachtest,
  d3.regelbetrieb,
  d3.stoerungsbehandlung,
  d3.sicherheitsanalysen,
  d3.notfallbewaeltigung,
  d3.sicherheitsgovernance,
  d3.ciListe,
].sort((a, b) => a.index - b.index);

export const MODULE_KEYS = MODULE_DEFS.map((m) => m.key);

export function getModuleDef(key: string): ModuleDef | undefined {
  return MODULE_DEFS.find((m) => m.key === key);
}

export * from "./types";
