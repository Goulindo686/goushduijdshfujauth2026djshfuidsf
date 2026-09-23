import { db } from "../db";
import { auditLogs, authLogs } from "../db/schema";

export async function logAuditAction(params: {
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId || null,
      ipAddress: params.ipAddress || null,
      metadata: params.metadata || {},
    });
  } catch (error) {
    console.error("[AuditService] Falha ao registrar log de auditoria:", error);
  }
}

export async function logAuthEvent(params: {
  applicationId: string;
  event: string;
  userIdentifier?: string;
  licenseKeyMasked?: string;
  ipAddress?: string;
  deviceFingerprint?: string;
  status: "SUCCESS" | "FAILED" | "BLOCKED";
  failureReason?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await db.insert(authLogs).values({
      id: crypto.randomUUID(),
      applicationId: params.applicationId,
      event: params.event,
      userIdentifier: params.userIdentifier || null,
      licenseKeyMasked: params.licenseKeyMasked || null,
      ipAddress: params.ipAddress || null,
      deviceFingerprint: params.deviceFingerprint || null,
      status: params.status,
      failureReason: params.failureReason || null,
      metadata: params.metadata || {},
    });
  } catch (error) {
    console.error("[AuthLog] Falha ao registrar log de autenticação:", error);
  }
}
