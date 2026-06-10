/**
 * Typsystem für die 19 BesiDoc-Module.
 *
 * Jedes Modul wird deklarativ als ModuleDef beschrieben. Backend (Validierung,
 * Vollständigkeitsgrad, PDF-Export) und Frontend (dynamischer Formular-Renderer)
 * arbeiten beide gegen diese Definitionen, sodass neue Module/Felder nur an
 * einer Stelle gepflegt werden müssen.
 */

export type FieldType =
  | "text"
  | "richtext"
  | "number"
  | "boolean"
  | "date"
  | "daterange"
  | "enum"
  | "multienum"
  | "email"
  | "phone"
  | "url"
  | "table";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  helpText?: string;
  maxLength?: number;
  /** Optionen für enum/multienum */
  options?: string[];
  min?: number;
  max?: number;
  /** Regex-Validierung (als String, damit JSON-serialisierbar) */
  pattern?: string;
  patternHint?: string;
  /** Spaltendefinitionen für type === "table" */
  columns?: FieldDef[];
  /** Namen registrierter Custom-Validatoren, z.B. "cidr", "port" */
  validators?: string[];
  /** Einheit für Zahlenfelder (GB, Minuten, %) – nur Anzeige */
  unit?: string;
}

/** Modulübergreifende Regeln (Feld-zu-Feld-Beziehungen). */
export type CrossFieldRule =
  | {
      type: "dateOrder";
      startField: string;
      endField: string;
      message: string;
    }
  | {
      /** a op b muss gelten, z.B. RTO >= RPO */
      type: "compareNumbers";
      a: string;
      b: string;
      op: ">=" | "<=" | ">" | "<";
      message: string;
    }
  | {
      /** Werte einer Tabellenspalte müssen eindeutig sein (z.B. VLAN-IDs) */
      type: "uniqueTableColumn";
      field: string;
      column: string;
      message: string;
    };

export interface ModuleDef {
  /** Stabiler Schlüssel, Teil der Unique ID `servicegroup-{module_key}` */
  key: string;
  /** B.1 … B.19 */
  index: number;
  title: string;
  purpose: string;
  fields: FieldDef[];
  crossFieldRules?: CrossFieldRule[];
}

export interface ValidationIssue {
  fieldKey: string;
  /** Bei Tabellenfeldern: Zeilenindex und Spaltenschlüssel */
  row?: number;
  column?: string;
  severity: "error" | "warning";
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export type ModuleData = Record<string, unknown>;
