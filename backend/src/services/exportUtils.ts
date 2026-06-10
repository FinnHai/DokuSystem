/** Gemeinsame Formatierungs-Helfer für PDF-/Word-/Excel-Export. */
import { FieldDef } from "../modules/types";
import { isEmpty } from "../core/validation";

export function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Formatiert einen Skalarwert eines Feldes als lesbaren String. */
export function formatScalar(field: FieldDef, value: unknown): string {
  if (isEmpty(value)) return "—";
  switch (field.type) {
    case "boolean":
      return value ? "Ja" : "Nein";
    case "daterange": {
      const r = value as { from?: string; to?: string };
      return `${r.from ?? "?"} bis ${r.to ?? "?"}`;
    }
    case "multienum":
      return Array.isArray(value) ? value.join(", ") : String(value);
    case "richtext":
      return stripHtml(String(value));
    case "number":
      return `${value}${field.unit ? ` ${field.unit}` : ""}`;
    default:
      return String(value);
  }
}

/** Dateiname-sicherer Slug für Export-Downloads. */
export function fileSlug(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]/g, "_");
}
