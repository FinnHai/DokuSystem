import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Router } from "express";
import { z } from "zod";
import { config } from "../config";
import { RefreshToken, User } from "../db";
import { AuthUser, requireAuth, signAccessToken } from "../middleware/auth";
import { wrap } from "../middleware/errors";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    tenantId: user.tenantId,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

async function issueRefreshToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + config.refreshTokenTtlDays * 86400_000);
  await RefreshToken.create({ userId, token, expiresAt });
  return token;
}

authRouter.post(
  "/login",
  wrap(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "E-Mail und Passwort erforderlich" });
    }
    const user = await User.findOne({ where: { email: parsed.data.email.toLowerCase() } });
    if (!user || !user.active || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      return res.status(401).json({ error: "Anmeldedaten ungültig" });
    }
    const authUser = toAuthUser(user);
    res.json({
      accessToken: signAccessToken(authUser),
      refreshToken: await issueRefreshToken(user.id),
      user: authUser,
    });
  })
);

authRouter.post(
  "/refresh",
  wrap(async (req, res) => {
    const token = String(req.body?.refreshToken ?? "");
    const stored = await RefreshToken.findOne({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: "Refresh-Token ungültig oder abgelaufen" });
    }
    const user = await User.findByPk(stored.userId);
    if (!user || !user.active) {
      return res.status(401).json({ error: "Benutzer nicht aktiv" });
    }
    // Rotation: alter Token wird ungültig
    await stored.destroy();
    const authUser = toAuthUser(user);
    res.json({
      accessToken: signAccessToken(authUser),
      refreshToken: await issueRefreshToken(user.id),
      user: authUser,
    });
  })
);

authRouter.post(
  "/logout",
  wrap(async (req, res) => {
    const token = String(req.body?.refreshToken ?? "");
    if (token) await RefreshToken.destroy({ where: { token } });
    res.json({ ok: true });
  })
);

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
