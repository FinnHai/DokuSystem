import { Router } from "express";
import { Op } from "sequelize";
import { z } from "zod";
import {
  completeness,
  isSubmittable,
  validateModule,
} from "../core/validation";
import {
  Role,
  WorkflowState,
  availableActions,
  canEdit,
  canView,
  transition,
  WorkflowAction,
  REJECTION_CATEGORIES,
} from "../core/workflow";
import {
  ModuleInstance,
  ModuleVersion,
  ReviewComment,
  ServiceGroup,
  User,
  WorkflowEvent,
} from "../db";
import { MODULE_DEFS, getModuleDef } from "../modules";
import { requireAuth } from "../middleware/auth";
import { HttpError, wrap } from "../middleware/errors";
import { audit } from "../services/audit";
import { notifyRole, notifyUser } from "../services/notifications";

export const serviceGroupRouter = Router();
serviceGroupRouter.use(requireAuth);

async function loadGroup(req: { params: { id: string }; user?: { tenantId: string } }) {
  const group = await ServiceGroup.findOne({
    where: { id: req.params.id, tenantId: req.user!.tenantId },
  });
  if (!group) throw new HttpError(404, "Servicegruppe nicht gefunden");
  return group;
}

function assertViewable(group: ServiceGroup, user: { id: string; role: Role }) {
  if (!canView(group.status, user.role, group.createdById === user.id)) {
    throw new HttpError(403, "Entwürfe sind nur für den Ersteller sichtbar");
  }
}

// ------------------------------------------------------------------ Liste
serviceGroupRouter.get(
  "/",
  wrap(async (req, res) => {
    const { status, search, owner } = req.query as Record<string, string | undefined>;
    const where: Record<string, unknown> = { tenantId: req.user!.tenantId };
    if (status) where.status = status;
    if (owner === "me") where.createdById = req.user!.id;
    if (search) where.name = { [Op.iLike]: `%${search}%` };

    const groups = await ServiceGroup.findAll({
      where,
      order: [["updatedAt", "DESC"]],
      include: [
        { model: ModuleInstance, as: "modules", attributes: ["moduleKey", "completeness"] },
        { model: User, as: "createdBy", attributes: ["id", "name"] },
      ],
    });

    const visible = groups.filter((g) =>
      canView(g.status, req.user!.role, g.createdById === req.user!.id)
    );

    res.json(
      visible.map((g) => {
        const modules = (g.get("modules") as ModuleInstance[]) ?? [];
        const total = modules.reduce((s, m) => s + m.completeness, 0);
        return {
          id: g.id,
          name: g.name,
          department: g.department,
          status: g.status,
          version: g.version,
          dueDate: g.dueDate,
          createdBy: g.get("createdBy"),
          updatedAt: g.get("updatedAt"),
          overallCompleteness: modules.length ? Math.round(total / modules.length) : 0,
        };
      })
    );
  })
);

// ----------------------------------------------------------------- Create
const createSchema = z.object({
  name: z.string().min(1).max(255),
  department: z.string().max(255).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

serviceGroupRouter.post(
  "/",
  wrap(async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, "Ungültige Eingabe: Name (max. 255 Zeichen) ist erforderlich");
    }
    const exists = await ServiceGroup.findOne({
      where: { tenantId: req.user!.tenantId, name: parsed.data.name },
    });
    if (exists) {
      throw new HttpError(409, "Service-Name existiert bereits in diesem Mandanten");
    }
    const group = await ServiceGroup.create({
      tenantId: req.user!.tenantId,
      name: parsed.data.name,
      department: parsed.data.department ?? null,
      dueDate: parsed.data.dueDate ?? null,
      createdById: req.user!.id,
    });
    // Alle 19 Module als leere Instanzen anlegen (Unique ID: servicegroup-{module_key})
    await ModuleInstance.bulkCreate(
      MODULE_DEFS.map((def) => ({ serviceGroupId: group.id, moduleKey: def.key }))
    );
    await audit(req, {
      action: "service_group.created",
      entityType: "ServiceGroup",
      entityId: group.id,
      newValue: { name: group.name },
    });
    res.status(201).json(group);
  })
);

// ------------------------------------------------------------------ Detail
serviceGroupRouter.get(
  "/:id",
  wrap(async (req, res) => {
    const group = await loadGroup(req as never);
    assertViewable(group, req.user!);
    const modules = await ModuleInstance.findAll({
      where: { serviceGroupId: group.id },
    });
    const byKey = new Map(modules.map((m) => [m.moduleKey, m]));
    const isOwner = group.createdById === req.user!.id;
    res.json({
      id: group.id,
      name: group.name,
      department: group.department,
      status: group.status,
      version: group.version,
      dueDate: group.dueDate,
      createdById: group.createdById,
      editable: canEdit(group.status, req.user!.role, isOwner),
      actions: availableActions(group.status, req.user!.role),
      modules: MODULE_DEFS.map((def) => {
        const inst = byKey.get(def.key);
        const data = inst?.data ?? {};
        const validation = validateModule(def, data, { strict: true });
        return {
          uniqueId: `${group.id}-${def.key}`,
          moduleKey: def.key,
          title: def.title,
          index: def.index,
          completeness: inst?.completeness ?? 0,
          version: inst?.version ?? 0,
          valid: validation.valid,
          errorCount: validation.issues.filter((i) => i.severity === "error").length,
        };
      }),
    });
  })
);

serviceGroupRouter.delete(
  "/:id",
  wrap(async (req, res) => {
    const group = await loadGroup(req as never);
    const isOwner = group.createdById === req.user!.id;
    if (req.user!.role !== Role.ADMIN && !(isOwner && group.status === WorkflowState.ENTWURF)) {
      throw new HttpError(403, "Nur Admins oder Ersteller von Entwürfen dürfen löschen");
    }
    await ModuleInstance.destroy({ where: { serviceGroupId: group.id } });
    await audit(req, {
      action: "service_group.deleted",
      entityType: "ServiceGroup",
      entityId: group.id,
      oldValue: { name: group.name },
    });
    await group.destroy();
    res.json({ ok: true });
  })
);

// ------------------------------------------------------------ Modul lesen
serviceGroupRouter.get(
  "/:id/modules/:moduleKey",
  wrap(async (req, res) => {
    const group = await loadGroup(req as never);
    assertViewable(group, req.user!);
    const def = getModuleDef(req.params.moduleKey);
    if (!def) throw new HttpError(404, "Unbekanntes Modul");
    const inst = await ModuleInstance.findOne({
      where: { serviceGroupId: group.id, moduleKey: def.key },
    });
    const data = inst?.data ?? {};
    res.json({
      uniqueId: `${group.id}-${def.key}`,
      moduleKey: def.key,
      data,
      completeness: inst?.completeness ?? 0,
      version: inst?.version ?? 0,
      validation: validateModule(def, data, {
        strict: group.status !== WorkflowState.ENTWURF,
      }),
      editable: canEdit(group.status, req.user!.role, group.createdById === req.user!.id),
    });
  })
);

// ---------------------------------------------------------- Modul speichern
serviceGroupRouter.put(
  "/:id/modules/:moduleKey",
  wrap(async (req, res) => {
    const group = await loadGroup(req as never);
    const def = getModuleDef(req.params.moduleKey);
    if (!def) throw new HttpError(404, "Unbekanntes Modul");
    const isOwner = group.createdById === req.user!.id;
    if (!canEdit(group.status, req.user!.role, isOwner)) {
      throw new HttpError(403, `Bearbeitung im Zustand ${group.status} nicht erlaubt`);
    }
    const data = (req.body?.data ?? {}) as Record<string, unknown>;
    if (typeof data !== "object" || Array.isArray(data)) {
      throw new HttpError(400, "Moduldaten müssen ein Objekt sein");
    }

    // Im Entwurf ist Speichern ohne strikte Validierung möglich (WIP, C.1)
    const validation = validateModule(def, data, { strict: false });

    const inst = await ModuleInstance.findOne({
      where: { serviceGroupId: group.id, moduleKey: def.key },
    });
    if (!inst) throw new HttpError(404, "Modulinstanz nicht gefunden");

    const oldData = inst.data;
    const newVersion = inst.version + 1;
    await inst.update({
      data,
      completeness: completeness(def, data),
      version: newVersion,
      updatedById: req.user!.id,
    });
    await ModuleVersion.create({
      moduleInstanceId: inst.id,
      version: newVersion,
      data,
      createdById: req.user!.id,
      comment: typeof req.body?.versionComment === "string" ? req.body.versionComment : null,
    });
    await audit(req, {
      action: "module.updated",
      entityType: "ModuleInstance",
      entityId: inst.id,
      oldValue: oldData,
      newValue: data,
    });

    res.json({
      ok: true,
      version: newVersion,
      completeness: inst.completeness,
      validation,
    });
  })
);

// ------------------------------------------------------------- Versionen
serviceGroupRouter.get(
  "/:id/modules/:moduleKey/versions",
  wrap(async (req, res) => {
    const group = await loadGroup(req as never);
    assertViewable(group, req.user!);
    const inst = await ModuleInstance.findOne({
      where: { serviceGroupId: group.id, moduleKey: req.params.moduleKey },
    });
    if (!inst) throw new HttpError(404, "Modul nicht gefunden");
    const versions = await ModuleVersion.findAll({
      where: { moduleInstanceId: inst.id },
      order: [["version", "DESC"]],
      limit: 50,
    });
    res.json(versions);
  })
);

// ------------------------------------------------- Version wiederherstellen
serviceGroupRouter.post(
  "/:id/modules/:moduleKey/revert",
  wrap(async (req, res) => {
    const group = await loadGroup(req as never);
    const def = getModuleDef(req.params.moduleKey);
    if (!def) throw new HttpError(404, "Unbekanntes Modul");
    const isOwner = group.createdById === req.user!.id;
    if (!canEdit(group.status, req.user!.role, isOwner)) {
      throw new HttpError(403, `Wiederherstellen im Zustand ${group.status} nicht erlaubt`);
    }
    const targetVersion = Number(req.body?.version);
    if (!Number.isInteger(targetVersion) || targetVersion < 1) {
      throw new HttpError(400, "Gültige Versionsnummer erforderlich");
    }
    const inst = await ModuleInstance.findOne({
      where: { serviceGroupId: group.id, moduleKey: def.key },
    });
    if (!inst) throw new HttpError(404, "Modulinstanz nicht gefunden");
    const target = await ModuleVersion.findOne({
      where: { moduleInstanceId: inst.id, version: targetVersion },
    });
    if (!target) throw new HttpError(404, `Version ${targetVersion} nicht gefunden`);

    const oldData = inst.data;
    const newVersion = inst.version + 1;
    await inst.update({
      data: target.data,
      completeness: completeness(def, target.data),
      version: newVersion,
      updatedById: req.user!.id,
    });
    await ModuleVersion.create({
      moduleInstanceId: inst.id,
      version: newVersion,
      data: target.data,
      createdById: req.user!.id,
      comment: `Wiederhergestellt von Version ${targetVersion}`,
    });
    await audit(req, {
      action: "module.reverted",
      entityType: "ModuleInstance",
      entityId: inst.id,
      oldValue: oldData,
      newValue: { revertedTo: targetVersion },
    });
    res.json({
      ok: true,
      version: newVersion,
      data: target.data,
      completeness: inst.completeness,
      validation: validateModule(def, target.data, {
        strict: group.status !== WorkflowState.ENTWURF,
      }),
    });
  })
);

// ------------------------------------------------------ Workflow-Aktionen
const workflowSchema = z.object({
  action: z.enum(["submit", "approve", "reject", "finalReject", "reopen", "archive"]),
  reason: z.string().optional(),
  category: z.enum(REJECTION_CATEGORIES).optional(),
  rejectTarget: z.enum([WorkflowState.ENTWURF, WorkflowState.FACHLICHE_ABNAHME]).optional(),
});

serviceGroupRouter.post(
  "/:id/workflow",
  wrap(async (req, res) => {
    const group = await loadGroup(req as never);
    const parsed = workflowSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Ungültige Workflow-Anfrage");
    const { action, reason, category, rejectTarget } = parsed.data;

    // Submit nur, wenn alle Module die Pflichtfeld-Validierung bestehen
    if (action === "submit") {
      const modules = await ModuleInstance.findAll({ where: { serviceGroupId: group.id } });
      const invalid = modules.filter((m) => {
        const def = getModuleDef(m.moduleKey);
        return def ? !isSubmittable(def, m.data) : false;
      });
      if (invalid.length > 0) {
        throw new HttpError(
          422,
          `Einreichen nicht möglich, ${invalid.length} Modul(e) unvollständig/fehlerhaft: ` +
            invalid.map((m) => getModuleDef(m.moduleKey)?.title ?? m.moduleKey).join(", ")
        );
      }
    }

    const result = transition({
      action: action as WorkflowAction,
      from: group.status,
      role: req.user!.role,
      reason,
      category,
      rejectTarget,
    });
    if (!result.ok || !result.to) throw new HttpError(422, result.error ?? "Übergang ungültig");

    const fromState = group.status;
    await group.update({
      status: result.to,
      // Wiedereröffnung einer genehmigten Doku erzeugt eine neue Hauptversion
      version: action === "reopen" && fromState === WorkflowState.GENEHMIGT
        ? group.version + 1
        : group.version,
    });
    await WorkflowEvent.create({
      serviceGroupId: group.id,
      fromState,
      toState: result.to,
      action,
      reason: reason ?? null,
      category: category ?? null,
      userId: req.user!.id,
    });
    await audit(req, {
      action: `workflow.${action}`,
      entityType: "ServiceGroup",
      entityId: group.id,
      oldValue: { status: fromState },
      newValue: { status: result.to, reason, category },
    });

    // Benachrichtigungen (C.4)
    const link = `/service-groups/${group.id}`;
    if (action === "submit") {
      await notifyRole(
        req.user!.tenantId,
        Role.FACHLICHER_PRUEFER,
        "review_requested",
        `Servicegruppe "${group.name}" wartet auf fachliche Abnahme`,
        link
      );
    } else if (action === "approve" && result.to === WorkflowState.REDAKTIONELLE_ABNAHME) {
      await notifyRole(
        req.user!.tenantId,
        Role.REDAKTIONELLER_PRUEFER,
        "review_requested",
        `Servicegruppe "${group.name}" wartet auf redaktionelle Abnahme`,
        link
      );
    } else if (action === "approve" && result.to === WorkflowState.GENEHMIGT) {
      await notifyUser(group.createdById, "approved", `"${group.name}" wurde genehmigt`, link);
    } else if (action === "reject" || action === "finalReject") {
      await notifyUser(
        group.createdById,
        "rejected",
        `"${group.name}" wurde zurückgewiesen: ${reason ?? ""}`,
        link
      );
    }

    res.json({ ok: true, status: result.to });
  })
);

// ------------------------------------------------------- Workflow-Historie
serviceGroupRouter.get(
  "/:id/workflow/history",
  wrap(async (req, res) => {
    const group = await loadGroup(req as never);
    assertViewable(group, req.user!);
    const events = await WorkflowEvent.findAll({
      where: { serviceGroupId: group.id },
      order: [["createdAt", "DESC"]],
      include: [{ model: User, attributes: ["id", "name"] }],
    });
    res.json(events);
  })
);

// ---------------------------------------------------------------- Comments
const commentSchema = z.object({
  moduleKey: z.string().optional(),
  fieldKey: z.string().optional(),
  text: z.string().min(1),
  severity: z.enum(["KRITISCH", "OPTIONAL"]).default("OPTIONAL"),
  parentId: z.string().uuid().optional(),
});

serviceGroupRouter.get(
  "/:id/comments",
  wrap(async (req, res) => {
    const group = await loadGroup(req as never);
    assertViewable(group, req.user!);
    const where: Record<string, unknown> = { serviceGroupId: group.id };
    if (req.query.moduleKey) where.moduleKey = String(req.query.moduleKey);
    const comments = await ReviewComment.findAll({
      where,
      order: [["createdAt", "ASC"]],
      include: [{ model: User, as: "author", attributes: ["id", "name", "role"] }],
    });
    res.json(comments);
  })
);

serviceGroupRouter.post(
  "/:id/comments",
  wrap(async (req, res) => {
    const group = await loadGroup(req as never);
    assertViewable(group, req.user!);
    const parsed = commentSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Kommentartext erforderlich");
    const comment = await ReviewComment.create({
      serviceGroupId: group.id,
      moduleKey: parsed.data.moduleKey ?? null,
      fieldKey: parsed.data.fieldKey ?? null,
      authorId: req.user!.id,
      text: parsed.data.text,
      severity: parsed.data.severity,
      parentId: parsed.data.parentId ?? null,
    });
    await audit(req, {
      action: "comment.created",
      entityType: "ReviewComment",
      entityId: comment.id,
      newValue: { text: parsed.data.text, severity: parsed.data.severity },
    });
    // Feedback durch Prüfer → Creator benachrichtigen (C.2)
    if (req.user!.id !== group.createdById) {
      await notifyUser(
        group.createdById,
        "feedback",
        `Neues Feedback zu "${group.name}"`,
        `/service-groups/${group.id}`
      );
    }
    res.status(201).json(comment);
  })
);

const commentStatusSchema = z.object({
  status: z.enum(["OFFEN", "KORRIGIERT", "ERLEDIGT"]),
});

serviceGroupRouter.patch(
  "/:id/comments/:commentId",
  wrap(async (req, res) => {
    const group = await loadGroup(req as never);
    const parsed = commentStatusSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Ungültiger Status");
    const comment = await ReviewComment.findOne({
      where: { id: req.params.commentId, serviceGroupId: group.id },
    });
    if (!comment) throw new HttpError(404, "Kommentar nicht gefunden");

    const isCreator = group.createdById === req.user!.id;
    const isReviewer = [Role.FACHLICHER_PRUEFER, Role.REDAKTIONELLER_PRUEFER, Role.ADMIN].includes(
      req.user!.role
    );
    // Creator markiert "KORRIGIERT", Prüfer bestätigt mit "ERLEDIGT" (C.2)
    if (parsed.data.status === "KORRIGIERT" && !isCreator && req.user!.role !== Role.ADMIN) {
      throw new HttpError(403, "Nur der Ersteller kann Korrekturen markieren");
    }
    if (parsed.data.status === "ERLEDIGT" && !isReviewer) {
      throw new HttpError(403, "Nur Prüfer können Korrekturen bestätigen");
    }
    const oldStatus = comment.status;
    await comment.update({ status: parsed.data.status });
    await audit(req, {
      action: "comment.status_changed",
      entityType: "ReviewComment",
      entityId: comment.id,
      oldValue: { status: oldStatus },
      newValue: { status: parsed.data.status },
    });
    res.json(comment);
  })
);
