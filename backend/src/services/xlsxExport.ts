/**
 * Excel-Export (Spez. E.3): Servicegruppen-Übersicht als Arbeitsmappe –
 * ein Übersichts-Tab plus ein Tab pro Modul (Tabellenfelder als echte
 * Tabellen, Skalarfelder als Feld/Wert-Paare).
 */
import ExcelJS from "exceljs";
import { ModuleInstance, ServiceGroup } from "../db";
import { MODULE_DEFS } from "../modules";
import { ModuleData, ModuleDef } from "../modules/types";
import { isEmpty } from "../core/validation";
import { formatScalar } from "./exportUtils";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1A3A5C" },
};

function styleHeaderRow(row: ExcelJS.Row): void {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
  });
}

/** Excel-Sheetnamen: max. 31 Zeichen, keine Sonderzeichen, eindeutig. */
function sheetName(def: ModuleDef): string {
  const clean = `B${def.index} ${def.title}`.replace(/[\\/*?:[\]]/g, "");
  return clean.slice(0, 31);
}

function addModuleSheet(wb: ExcelJS.Workbook, def: ModuleDef, data: ModuleData): void {
  const ws = wb.addWorksheet(sheetName(def));
  ws.columns = [{ width: 40 }, { width: 70 }] as Partial<ExcelJS.Column>[];

  const title = ws.addRow([`B.${def.index} ${def.title}`]);
  title.font = { bold: true, size: 14 };
  ws.addRow([def.purpose]).font = { italic: true, color: { argb: "FF666666" } };
  ws.addRow([]);

  for (const field of def.fields) {
    const value = data[field.key];
    if (field.type === "table") {
      ws.addRow([field.label]).font = { bold: true };
      const columns = field.columns ?? [];
      const header = ws.addRow(columns.map((c) => c.label));
      styleHeaderRow(header);
      if (isEmpty(value)) {
        ws.addRow(["—"]);
      } else {
        for (const row of value as ModuleData[]) {
          ws.addRow(columns.map((c) => formatScalar(c, row?.[c.key])));
        }
      }
      ws.addRow([]);
    } else {
      const r = ws.addRow([field.label, formatScalar(field, value)]);
      r.getCell(1).font = { bold: true };
      r.getCell(2).alignment = { wrapText: true, vertical: "top" };
    }
  }
}

export async function generateServiceGroupXlsx(
  group: ServiceGroup,
  modules: ModuleInstance[],
  options: { excludeModules?: string[] } = {}
): Promise<Buffer> {
  const byKey = new Map(modules.map((m) => [m.moduleKey, m]));
  const included = MODULE_DEFS.filter((d) => !(options.excludeModules ?? []).includes(d.key));

  const wb = new ExcelJS.Workbook();
  wb.creator = "BesiDoc";
  wb.created = new Date();

  // Übersichts-Tab
  const overview = wb.addWorksheet("Übersicht");
  overview.columns = [{ width: 34 }, { width: 18 }, { width: 14 }] as Partial<ExcelJS.Column>[];
  const t = overview.addRow([`BesiDoc – ${group.name}`]);
  t.font = { bold: true, size: 16 };
  overview.addRow([`BaFin-Dokumentation · Status: ${group.status} · Version ${group.version}`]);
  overview.addRow([`Exportdatum: ${new Date().toLocaleDateString("de-DE")}`]);
  overview.addRow([]);
  const head = overview.addRow(["Modul", "Füllgrad (%)", "Modulversion"]);
  styleHeaderRow(head);
  for (const def of included) {
    const inst = byKey.get(def.key);
    overview.addRow([`B.${def.index} ${def.title}`, inst?.completeness ?? 0, inst?.version ?? 0]);
  }

  for (const def of included) {
    addModuleSheet(wb, def, byKey.get(def.key)?.data ?? {});
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
