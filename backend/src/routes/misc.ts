import { Router } from "express";
import { Op } from "sequelize";
import { Role, WorkflowState } from "../core/workflow";
import { AuditLog, ModuleInstance, Notification, ServiceGroup, User } from "../db";
import { MODULE_DEFS } from "../modules";
import { requireAuth, requireRole } from "../middleware/auth";
import { wrap } from "../middleware/errors";

// ------------------------------------------------------ Moduldefinitionen
export const moduleDefRouter = Router();
moduleDefRouter.get("/", requireAuth, (_req, res) => {
  res.json(MODULE_DEFS);
});

// --------------------------------------------------------------- Audit-Log
export const auditRouter = Router();
auditRouter.get(
  "/",
  requireAuth,
  requireRole(Role.ADMIN),
  wrap(async (req, res) => {
    const limit = Math.min(Number(req.query.limit ?? 100), 500);
    const offset = Number(req.query.offset ?? 0);
    const logs = await AuditLog.findAndCountAll({
      where: { tenantId: req.user!.tenantId },
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      include: [{ model: User, attributes: ["id", "name", "email"] }],
    });
    res.json({ total: logs.count, items: logs.rows });
  })
);

// ----------------------------------------------------------- Notifications
export const notificationRouter = Router();
notificationRouter.use(requireAuth);

notificationRouter.get(
  "/",
  wrap(async (req, res) => {
    const items = await Notification.findAll({
      where: { userId: req.user!.id },
      order: [["createdAt", "DESC"]],
      limit: 50,
    });
    const unread = await Notification.count({
      where: { userId: req.user!.id, read: false },
    });
    res.json({ unread, items });
  })
);

notificationRouter.patch(
  "/:id/read",
  wrap(async (req, res) => {
    await Notification.update(
      { read: true },
      { where: { id: req.params.id, userId: req.user!.id } }
    );
    res.json({ ok: true });
  })
);

notificationRouter.post(
  "/read-all",
  wrap(async (req, res) => {
    await Notification.update({ read: true }, { where: { userId: req.user!.id } });
    res.json({ ok: true });
  })
);

// -------------------------------------------------------------- Dashboard
export const dashboardRouter = Router();
dashboardRouter.get(
  "/",
  requireAuth,
  wrap(async (req, res) => {
    const tenantId = req.user!.tenantId;
    const groups = await ServiceGroup.findAll({
      where: { tenantId },
      include: [{ model: ModuleInstance, as: "modules", attributes: ["completeness"] }],
    });

    const byStatus: Record<string, number> = {};
    for (const s of Object.values(WorkflowState)) byStatus[s] = 0;
    let completenessSum = 0;
    for (const g of groups) {
      byStatus[g.status] = (byStatus[g.status] ?? 0) + 1;
      const mods = (g.get("modules") as ModuleInstance[]) ?? [];
      completenessSum += mods.length
        ? mods.reduce((s, m) => s + m.completeness, 0) / mods.length
        : 0;
    }

    // Meine Aufgaben (D.1): Reviews für Prüfer, Korrekturen für Creator
    const myTasks: { type: string; serviceGroupId: string; name: string; dueDate: string | null }[] = [];
    const reviewState =
      req.user!.role === Role.FACHLICHER_PRUEFER
        ? WorkflowState.FACHLICHE_ABNAHME
        : req.user!.role === Role.REDAKTIONELLER_PRUEFER
          ? WorkflowState.REDAKTIONELLE_ABNAHME
          : null;
    for (const g of groups) {
      if (reviewState && g.status === reviewState) {
        myTasks.push({ type: "review", serviceGroupId: g.id, name: g.name, dueDate: g.dueDate });
      }
      if (
        g.createdById === req.user!.id &&
        (g.status === WorkflowState.ENTWURF || g.status === WorkflowState.ABGELEHNT)
      ) {
        myTasks.push({ type: "edit", serviceGroupId: g.id, name: g.name, dueDate: g.dueDate });
      }
    }

    const overdue = groups.filter(
      (g) =>
        g.dueDate &&
        new Date(g.dueDate) < new Date() &&
        g.status !== WorkflowState.GENEHMIGT &&
        g.status !== WorkflowState.ARCHIVIERT
    ).length;

    res.json({
      totalGroups: groups.length,
      byStatus,
      averageCompleteness: groups.length ? Math.round(completenessSum / groups.length) : 0,
      rejectedRate: groups.length
        ? Math.round(((byStatus[WorkflowState.ABGELEHNT] ?? 0) / groups.length) * 100)
        : 0,
      overdue,
      myTasks: myTasks.sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999")),
    });
  })
);

// ----------------------------------------------------------- Review-Queue
export const reviewRouter = Router();
reviewRouter.get(
  "/queue",
  requireAuth,
  requireRole(Role.FACHLICHER_PRUEFER, Role.REDAKTIONELLER_PRUEFER, Role.ADMIN),
  wrap(async (req, res) => {
    const states =
      req.user!.role === Role.FACHLICHER_PRUEFER
        ? [WorkflowState.FACHLICHE_ABNAHME]
        : req.user!.role === Role.REDAKTIONELLER_PRUEFER
          ? [WorkflowState.REDAKTIONELLE_ABNAHME]
          : [WorkflowState.FACHLICHE_ABNAHME, WorkflowState.REDAKTIONELLE_ABNAHME];
    const groups = await ServiceGroup.findAll({
      where: { tenantId: req.user!.tenantId, status: { [Op.in]: states } },
      order: [
        ["dueDate", "ASC"],
        ["updatedAt", "ASC"],
      ],
      include: [{ model: User, as: "createdBy", attributes: ["id", "name"] }],
    });
    res.json(groups);
  })
);
