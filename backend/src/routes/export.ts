import { Router } from "express";
import { WorkflowState } from "../core/workflow";
import { ModuleInstance, ServiceGroup, User } from "../db";
import { requireAuth } from "../middleware/auth";
import { HttpError, wrap } from "../middleware/errors";
import { audit } from "../services/audit";
import { generateServiceGroupPdf } from "../services/pdfExport";

export const exportRouter = Router();
exportRouter.use(requireAuth);

exportRouter.get(
  "/:id/pdf",
  wrap(async (req, res) => {
    const group = await ServiceGroup.findOne({
      where: { id: req.params.id, tenantId: req.user!.tenantId },
    });
    if (!group) throw new HttpError(404, "Servicegruppe nicht gefunden");

    // E.1: Export grundsätzlich nur für genehmigte Dokumentation;
    // Entwurfs-Export ist als Preview über ?draft=true möglich.
    const allowDraft = req.query.draft === "true";
    if (group.status !== WorkflowState.GENEHMIGT && group.status !== WorkflowState.ARCHIVIERT && !allowDraft) {
      throw new HttpError(
        422,
        "Export nur für genehmigte Servicegruppen möglich (oder ?draft=true für eine Vorschau)"
      );
    }

    const exclude = typeof req.query.exclude === "string" ? req.query.exclude.split(",") : [];
    const modules = await ModuleInstance.findAll({ where: { serviceGroupId: group.id } });
    const createdBy = await User.findByPk(group.createdById);
    const pdf = await generateServiceGroupPdf(group, modules, createdBy, {
      excludeModules: exclude,
    });

    await audit(req, {
      action: "export.pdf",
      entityType: "ServiceGroup",
      entityId: group.id,
      newValue: { excluded: exclude, draft: allowDraft },
    });

    res
      .status(200)
      .setHeader("Content-Type", "application/pdf")
      .setHeader(
        "Content-Disposition",
        `attachment; filename="besidoc-${group.name.replace(/[^a-zA-Z0-9-_]/g, "_")}-v${group.version}.pdf"`
      )
      .send(pdf);
  })
);
