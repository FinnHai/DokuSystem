import { Notification, User } from "../db";
import { Role } from "../core/workflow";
import { logger } from "../logger";

/**
 * In-App-Benachrichtigungen (C.4). E-Mail-Versand ist als Hook vorgesehen:
 * in Produktion wird hier zusätzlich ein Mail-Provider (SMTP/SES) angebunden.
 */
export async function notifyUser(
  userId: string,
  type: string,
  message: string,
  link?: string
): Promise<void> {
  await Notification.create({ userId, type, message, link: link ?? null });
  logger.info({ userId, type }, "Benachrichtigung erstellt");
}

/** Benachrichtigt alle aktiven Nutzer einer Rolle innerhalb des Mandanten. */
export async function notifyRole(
  tenantId: string,
  role: Role,
  type: string,
  message: string,
  link?: string
): Promise<void> {
  const users = await User.findAll({ where: { tenantId, role, active: true } });
  await Promise.all(users.map((u) => notifyUser(u.id, type, message, link)));
}
