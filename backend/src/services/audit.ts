import { Request } from "express";
import { AuditLog } from "../db";

/** Audit-Log: Wer, Was, Wann, Warum (+ Old/New-Value und IP, F.2). */
export async function audit(
  req: Request,
  params: {
    action: string;
    entityType: string;
    entityId?: string;
    oldValue?: unknown;
    newValue?: unknown;
  }
): Promise<void> {
  if (!req.user) return;
  await AuditLog.create({
    tenantId: req.user.tenantId,
    userId: req.user.id,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId ?? null,
    oldValue: params.oldValue ?? null,
    newValue: params.newValue ?? null,
    ip: req.ip ?? null,
  });
}
