import { Request, Router } from "express";
import { WorkflowState } from "../core/workflow";
import { ModuleInstance, ServiceGroup, User } from "../db";
import { requireAuth } from "../middleware/auth";
import { HttpError, wrap } from "../middleware/errors";
import { audit } from "../services/audit";
import { generateServiceGroupDocx } from "../services/docxExport";
import { fileSlug } from "../services/exportUtils";
import { generateServiceGroupPdf } from "../services/pdfExport";
import { generateServiceGroupXlsx } from "../services/xlsxExport";

export const exportRouter = Router();
exportRouter.use(requireAuth);

/**
 * Lädt Servicegruppe + Module und erzwingt die Export-Regel (E.1):
 * Vollexport nur für GENEHMIGT/ARCHIVIERT, Vorschau über ?draft=true.
 */
async function loadForExport(req: Request) {
  const group = await ServiceGroup.findOne({
    where: { id: req.params.id, tenantId: req.user!.tenantId },
  });
  if (!group) throw new HttpError(404, "Servicegruppe nicht gefunden");

  const allowDraft = req.query.draft === "true";
  const approved =
    group.status === WorkflowState.GENEHMIGT || group.status === WorkflowState.ARCHIVIERT;
  if (!approved && !allowDraft) {
    throw new HttpError(
      422,
      "Export nur für genehmigte Servicegruppen möglich (oder ?draft=true für eine Vorschau)"
    );
  }

  const exclude = typeof req.query.exclude === "string" ? req.query.exclude.split(",") : [];
  const modules = await ModuleInstance.findAll({ where: { serviceGroupId: group.id } });
  const createdBy = await User.findByPk(group.createdById);
  return { group, modules, createdBy, exclude, draft: allowDraft };
}

exportRouter.get(
  "/:id/pdf",
  wrap(async (req, res) => {
    const { group, modules, createdBy, exclude, draft } = await loadForExport(req);
    const pdf = await generateServiceGroupPdf(group, modules, createdBy, {
      excludeModules: exclude,
    });
    await audit(req, {
      action: "export.pdf",
      entityType: "ServiceGroup",
      entityId: group.id,
      newValue: { excluded: exclude, draft },
    });
    res
      .setHeader("Content-Type", "application/pdf")
      .setHeader(
        "Content-Disposition",
        `attachment; filename="besidoc-${fileSlug(group.name)}-v${group.version}.pdf"`
      )
      .send(pdf);
  })
);

exportRouter.get(
  "/:id/docx",
  wrap(async (req, res) => {
    const { group, modules, createdBy, exclude, draft } = await loadForExport(req);
    const docx = await generateServiceGroupDocx(group, modules, createdBy, {
      excludeModules: exclude,
    });
    await audit(req, {
      action: "export.docx",
      entityType: "ServiceGroup",
      entityId: group.id,
      newValue: { excluded: exclude, draft },
    });
    res
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )
      .setHeader(
        "Content-Disposition",
        `attachment; filename="besidoc-${fileSlug(group.name)}-v${group.version}.docx"`
      )
      .send(docx);
  })
);

exportRouter.get(
  "/:id/xlsx",
  wrap(async (req, res) => {
    const { group, modules, exclude, draft } = await loadForExport(req);
    const xlsx = await generateServiceGroupXlsx(group, modules, { excludeModules: exclude });
    await audit(req, {
      action: "export.xlsx",
      entityType: "ServiceGroup",
      entityId: group.id,
      newValue: { excluded: exclude, draft },
    });
    res
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      )
      .setHeader(
        "Content-Disposition",
        `attachment; filename="besidoc-${fileSlug(group.name)}-v${group.version}.xlsx"`
      )
      .send(xlsx);
  })
);
