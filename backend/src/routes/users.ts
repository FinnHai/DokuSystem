import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { Role } from "../core/workflow";
import { User } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";
import { HttpError, wrap } from "../middleware/errors";
import { audit } from "../services/audit";

export const userRouter = Router();
userRouter.use(requireAuth, requireRole(Role.ADMIN));

userRouter.get(
  "/",
  wrap(async (req, res) => {
    const users = await User.findAll({
      where: { tenantId: req.user!.tenantId },
      attributes: ["id", "email", "name", "role", "active", "createdAt"],
      order: [["name", "ASC"]],
    });
    res.json(users);
  })
);

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  password: z.string().min(10, "Passwort muss mindestens 10 Zeichen haben"),
  role: z.nativeEnum(Role),
});

userRouter.post(
  "/",
  wrap(async (req, res) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? "Ungültige Eingabe");
    }
    const email = parsed.data.email.toLowerCase();
    if (await User.findOne({ where: { email } })) {
      throw new HttpError(409, "E-Mail bereits vergeben");
    }
    const user = await User.create({
      tenantId: req.user!.tenantId,
      email,
      name: parsed.data.name,
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
      role: parsed.data.role,
    });
    await audit(req, {
      action: "user.created",
      entityType: "User",
      entityId: user.id,
      newValue: { email, role: parsed.data.role },
    });
    res.status(201).json({ id: user.id, email: user.email, name: user.name, role: user.role });
  })
);

const updateUserSchema = z.object({
  role: z.nativeEnum(Role).optional(),
  active: z.boolean().optional(),
  name: z.string().min(1).max(255).optional(),
});

userRouter.patch(
  "/:id",
  wrap(async (req, res) => {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Ungültige Eingabe");
    const user = await User.findOne({
      where: { id: req.params.id, tenantId: req.user!.tenantId },
    });
    if (!user) throw new HttpError(404, "Benutzer nicht gefunden");
    const old = { role: user.role, active: user.active, name: user.name };
    await user.update(parsed.data);
    await audit(req, {
      action: "user.updated",
      entityType: "User",
      entityId: user.id,
      oldValue: old,
      newValue: parsed.data,
    });
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role, active: user.active });
  })
);

/** DSGVO: Nutzer löschen → Anonymisierung statt Hard-Delete (F.2) */
userRouter.delete(
  "/:id",
  wrap(async (req, res) => {
    const user = await User.findOne({
      where: { id: req.params.id, tenantId: req.user!.tenantId },
    });
    if (!user) throw new HttpError(404, "Benutzer nicht gefunden");
    await user.update({
      email: `anonymisiert-${user.id}@deleted.local`,
      name: "Gelöschter Benutzer",
      active: false,
      passwordHash: "!",
    });
    await audit(req, {
      action: "user.anonymized",
      entityType: "User",
      entityId: user.id,
    });
    res.json({ ok: true });
  })
);
