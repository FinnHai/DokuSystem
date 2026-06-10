/**
 * PDF-Export einer kompletten Servicegruppe (Spez. E.1):
 * Deckblatt mit Metadaten, Inhaltsverzeichnis, Module sequenziell,
 * Fußzeile mit "BaFin-Dokumentation", Datum und Version.
 */
import PDFDocument from "pdfkit";
import { ModuleInstance, ServiceGroup, User } from "../db";
import { FieldDef, ModuleData, ModuleDef } from "../modules/types";
import { MODULE_DEFS } from "../modules";
import { isEmpty } from "../core/validation";

const COLORS = { primary: "#1a3a5c", accent: "#0066a1", text: "#222222", muted: "#666666" };

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function formatScalar(field: FieldDef, value: unknown): string {
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

function renderTable(doc: PDFKit.PDFDocument, field: FieldDef, rows: ModuleData[]): void {
  const columns = field.columns ?? [];
  if (columns.length === 0 || rows.length === 0) return;
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colWidth = pageWidth / columns.length;

  const drawRow = (cells: string[], bold: boolean) => {
    if (doc.y > doc.page.height - doc.page.margins.bottom - 40) doc.addPage();
    const y = doc.y;
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(8).fillColor(COLORS.text);
    let maxHeight = 0;
    cells.forEach((cell, i) => {
      const x = doc.page.margins.left + i * colWidth;
      doc.text(cell, x + 2, y + 2, { width: colWidth - 4 });
      maxHeight = Math.max(maxHeight, doc.heightOfString(cell, { width: colWidth - 4 }));
    });
    doc
      .moveTo(doc.page.margins.left, y + maxHeight + 4)
      .lineTo(doc.page.margins.left + pageWidth, y + maxHeight + 4)
      .strokeColor("#dddddd")
      .stroke();
    doc.y = y + maxHeight + 6;
  };

  drawRow(columns.map((c) => c.label), true);
  for (const row of rows) {
    drawRow(columns.map((c) => formatScalar(c, row?.[c.key])), false);
  }
  doc.moveDown(0.5);
}

function renderModule(doc: PDFKit.PDFDocument, def: ModuleDef, data: ModuleData): void {
  doc.addPage();
  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor(COLORS.primary)
    .text(`B.${def.index} ${def.title}`, doc.page.margins.left, doc.y);
  doc.font("Helvetica-Oblique").fontSize(9).fillColor(COLORS.muted).text(def.purpose);
  doc.moveDown();

  for (const field of def.fields) {
    if (doc.y > doc.page.height - doc.page.margins.bottom - 60) doc.addPage();
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(COLORS.accent)
      .text(field.label, doc.page.margins.left, doc.y);
    const value = data[field.key];
    if (field.type === "table") {
      if (isEmpty(value)) {
        doc.font("Helvetica").fontSize(9).fillColor(COLORS.muted).text("—");
      } else {
        renderTable(doc, field, value as ModuleData[]);
      }
    } else {
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(COLORS.text)
        .text(formatScalar(field, value), { width: 480 });
    }
    doc.moveDown(0.6);
  }
}

export async function generateServiceGroupPdf(
  group: ServiceGroup,
  modules: ModuleInstance[],
  createdBy: User | null,
  options: { excludeModules?: string[] } = {}
): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margins: { top: 60, bottom: 60, left: 50, right: 50 }, bufferPages: true });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  const byKey = new Map(modules.map((m) => [m.moduleKey, m]));
  const included = MODULE_DEFS.filter((d) => !(options.excludeModules ?? []).includes(d.key));

  // ----- Deckblatt
  doc.rect(0, 0, doc.page.width, 160).fill(COLORS.primary);
  doc
    .font("Helvetica-Bold")
    .fontSize(24)
    .fillColor("#ffffff")
    .text("BesiDoc — Beschreibung von IT-Systemen", 50, 60, { width: 495 });
  doc.fontSize(12).text("BaFin-Dokumentation", 50, 120);

  doc.fillColor(COLORS.text).font("Helvetica-Bold").fontSize(20).text(group.name, 50, 220);
  doc.moveDown();
  doc.font("Helvetica").fontSize(11);
  const meta: [string, string][] = [
    ["Status", group.status],
    ["Version", String(group.version)],
    ["Geschäftsbereich", group.department ?? "—"],
    ["Erstellt von", createdBy?.name ?? "—"],
    ["Exportdatum", new Date().toLocaleDateString("de-DE")],
  ];
  for (const [label, value] of meta) {
    doc.font("Helvetica-Bold").text(`${label}: `, { continued: true }).font("Helvetica").text(value);
  }

  // ----- Inhaltsverzeichnis
  doc.addPage();
  doc.font("Helvetica-Bold").fontSize(16).fillColor(COLORS.primary).text("Inhaltsverzeichnis");
  doc.moveDown();
  doc.font("Helvetica").fontSize(11).fillColor(COLORS.text);
  included.forEach((def) => {
    doc.text(`B.${def.index}  ${def.title}`);
  });

  // ----- Module
  for (const def of included) {
    renderModule(doc, def, byKey.get(def.key)?.data ?? {});
  }

  // ----- Fußzeilen mit Seitennummerierung
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(
        `BaFin-Dokumentation · ${group.name} · Version ${group.version} · ${new Date().toLocaleDateString("de-DE")} · Seite ${i + 1} von ${range.count}`,
        50,
        doc.page.height - 40,
        { width: doc.page.width - 100, align: "center" }
      );
  }

  doc.end();
  return done;
}
