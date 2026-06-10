/**
 * Word-Export (.docx) einer kompletten Servicegruppe (Spez. E.2):
 * gleiche Struktur wie der PDF-Export, aber als editierbares Dokument
 * mit funktionsfähigen Überschriften-Ebenen und Fußzeile.
 */
import {
  AlignmentType,
  Document,
  Footer,
  HeadingLevel,
  PageNumber,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { ModuleInstance, ServiceGroup, User } from "../db";
import { MODULE_DEFS } from "../modules";
import { FieldDef, ModuleData, ModuleDef } from "../modules/types";
import { isEmpty } from "../core/validation";
import { formatScalar } from "./exportUtils";

function fieldTable(field: FieldDef, rows: ModuleData[]): Table {
  const columns = field.columns ?? [];
  const header = new TableRow({
    tableHeader: true,
    children: columns.map(
      (c) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: c.label, bold: true, size: 16 })],
            }),
          ],
        })
    ),
  });
  const body = rows.map(
    (row) =>
      new TableRow({
        children: columns.map(
          (c) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: formatScalar(c, row?.[c.key]), size: 16 })],
                }),
              ],
            })
        ),
      })
  );
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [header, ...body],
  });
}

function moduleChildren(def: ModuleDef, data: ModuleData): (Paragraph | Table)[] {
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      pageBreakBefore: true,
      children: [new TextRun(`B.${def.index} ${def.title}`)],
    }),
    new Paragraph({
      children: [new TextRun({ text: def.purpose, italics: true, color: "666666" })],
      spacing: { after: 200 },
    }),
  ];

  for (const field of def.fields) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun(field.label)],
        spacing: { before: 200, after: 80 },
      })
    );
    const value = data[field.key];
    if (field.type === "table") {
      if (isEmpty(value)) {
        children.push(new Paragraph({ children: [new TextRun({ text: "—", color: "888888" })] }));
      } else {
        children.push(fieldTable(field, value as ModuleData[]));
      }
    } else {
      children.push(new Paragraph({ children: [new TextRun(formatScalar(field, value))] }));
    }
  }
  return children;
}

export async function generateServiceGroupDocx(
  group: ServiceGroup,
  modules: ModuleInstance[],
  createdBy: User | null,
  options: { excludeModules?: string[] } = {}
): Promise<Buffer> {
  const byKey = new Map(modules.map((m) => [m.moduleKey, m]));
  const included = MODULE_DEFS.filter((d) => !(options.excludeModules ?? []).includes(d.key));

  const cover: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun("BesiDoc — Beschreibung von IT-Systemen")],
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "BaFin-Dokumentation", color: "0066A1", bold: true })],
      spacing: { after: 400 },
    }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun(group.name)],
      spacing: { after: 240 },
    }),
    ...[
      ["Status", group.status],
      ["Version", String(group.version)],
      ["Geschäftsbereich", group.department ?? "—"],
      ["Erstellt von", createdBy?.name ?? "—"],
      ["Exportdatum", new Date().toLocaleDateString("de-DE")],
    ].map(
      ([label, value]) =>
        new Paragraph({
          children: [new TextRun({ text: `${label}: `, bold: true }), new TextRun(value)],
          spacing: { after: 60 },
        })
    ),
  ];

  const toc: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      pageBreakBefore: true,
      children: [new TextRun("Inhaltsverzeichnis")],
      spacing: { after: 200 },
    }),
    ...included.map(
      (def) =>
        new Paragraph({
          children: [new TextRun(`B.${def.index}  ${def.title}`)],
          spacing: { after: 60 },
        })
    ),
  ];

  const doc = new Document({
    creator: "BesiDoc",
    title: `BesiDoc – ${group.name}`,
    description: "BaFin BesiDoc-Dokumentation",
    sections: [
      {
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `BaFin-Dokumentation · ${group.name} · Version ${group.version} · `,
                    size: 14,
                    color: "888888",
                  }),
                  new TextRun({ children: ["Seite ", PageNumber.CURRENT], size: 14, color: "888888" }),
                ],
              }),
            ],
          }),
        },
        children: [...cover, ...toc, ...included.flatMap((def) => moduleChildren(def, byKey.get(def.key)?.data ?? {}))],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
