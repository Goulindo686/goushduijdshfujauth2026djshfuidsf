import { db, pool } from "../db";
import { licenses, devices, bans, plans, applications } from "../db/schema";
import { eq, and, sql } from "drizzle-orm";
import { generateLicenseKey, maskLicenseKey } from "../security/crypto";
import { logAuditAction, logAuthEvent } from "./audit.service";
import { triggerWebhooksForApp } from "./webhook.service";

export interface BulkGenerateOptions {
  applicationId: string;
  planId?: string | null;
  quantity: number;
  durationDays?: number | null; // null = Lifetime
  prefix?: string;
  deviceLimit?: number;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface LicenseAuthResult {
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  data?: {
    authorized: boolean;
    license: string;
    status: string;
    expiresAt: Date | null;
    timeRemainingSeconds: number | null;
    plan: {
      id?: string;
      name: string;
      level: number;
      permissions: string[];
    } | null;
    device: {
      fingerprint: string;
      currentCount: number;
      limit: number;
    };
  };
}

export class LicenseService {
  /**
   * Geração em massa de licenças com CSPRNG de alta entropia
   */
  static async generateBulk(options: BulkGenerateOptions, ipAddress?: string): Promise<string[]> {
    const { applicationId, planId, quantity, durationDays, prefix = "GOU", deviceLimit = 1, notes, metadata } = options;

    const keys: string[] = [];
    const newRecords = [];

    for (let i = 0; i < quantity; i++) {
      const key = generateLicenseKey(prefix, 3, 4);
      keys.push(key);

      newRecords.push({
        id: crypto.randomUUID(),
        applicationId,
        planId: planId || null,
        key,
        status: "UNUSED",
        durationDays: durationDays !== undefined ? durationDays : null,
        deviceLimit: deviceLimit !== undefined ? deviceLimit : 1,
        notes: notes || null,
        metadata: metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Inserção em lote no banco de dados
    await db.insert(licenses).values(newRecords);

    await logAuditAction({
      action: "GENERATE_LICENSES_BULK",
      resource: "license",
      ipAddress,
      metadata: {
        applicationId,
        quantity,
        planId,
        durationDays,
        deviceLimit,
      },
    });

    return keys;
  }

  /**
   * Validação atômica de licença com row-level lock (SELECT FOR UPDATE)
   * Previne condições de corrida quando múltiplos clientes ativam a mesma licença simultaneamente.
   */
  static async validateAndAuthenticate(params: {
    appId: string; // Slug público da aplicação
    licenseKey: string;
    deviceFingerprint?: string;
    ipAddress?: string;
  }): Promise<LicenseAuthResult> {
    const { appId, licenseKey, deviceFingerprint, ipAddress } = params;
    const cleanKey = licenseKey.trim().toUpperCase();

    // 1. Busca aplicação
    const [app] = await db
      .select()
      .from(applications)
      .where(eq(applications.appId, appId.toLowerCase()))
      .limit(1);

    if (!app) {
      return {
        success: false,
        errorCode: "APPLICATION_NOT_FOUND",
        errorMessage: "Aplicação não encontrada.",
      };
    }

    if (app.status === "DISABLED") {
      return {
        success: false,
        errorCode: "APPLICATION_DISABLED",
        errorMessage: "Esta aplicação está desativada no momento.",
      };
    }

    if (app.status === "MAINTENANCE") {
      return {
        success: false,
        errorCode: "APPLICATION_MAINTENANCE",
        errorMessage: app.maintenanceMessage || "Aplicação em manutenção.",
      };
    }

    // 2. Checa banimento por IP ou HWID
    if (deviceFingerprint) {
      const [bannedHwid] = await db
        .select()
        .from(bans)
        .where(
          and(
            eq(bans.applicationId, app.id),
            eq(bans.type, "DEVICE"),
            eq(bans.targetValue, deviceFingerprint),
            eq(bans.active, true)
          )
        )
        .limit(1);

      if (bannedHwid) {
        await logAuthEvent({
          applicationId: app.id,
          event: "DEVICE_BANNED",
          licenseKeyMasked: maskLicenseKey(cleanKey),
          deviceFingerprint,
          ipAddress,
          status: "BLOCKED",
          failureReason: `Dispositivo banido: ${bannedHwid.reason}`,
        });
        return {
          success: false,
          errorCode: "DEVICE_BANNED",
          errorMessage: `Dispositivo banido: ${bannedHwid.reason}`,
        };
      }
    }

    if (ipAddress) {
      const [bannedIp] = await db
        .select()
        .from(bans)
        .where(
          and(
            eq(bans.applicationId, app.id),
            eq(bans.type, "IP"),
            eq(bans.targetValue, ipAddress),
            eq(bans.active, true)
          )
        )
        .limit(1);

      if (bannedIp) {
        return {
          success: false,
          errorCode: "DEVICE_BANNED",
          errorMessage: "Acesso bloqueado por segurança.",
        };
      }
    }

    // 3. Execução transacional com lock de linha (SELECT FOR UPDATE)
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const licRes = await client.query(
        `SELECT l.*, p.name as plan_name, p.level as plan_level, p.permissions as plan_permissions, p.duration_days as plan_duration
         FROM licenses l
         LEFT JOIN plans p ON l.plan_id = p.id
         WHERE l.application_id = $1 AND l.key = $2
         FOR UPDATE OF l`,
        [app.id, cleanKey]
      );

      if (licRes.rows.length === 0) {
        await client.query("ROLLBACK");
        await logAuthEvent({
          applicationId: app.id,
          event: "LICENSE_INVALID",
          licenseKeyMasked: maskLicenseKey(cleanKey),
          ipAddress,
          deviceFingerprint,
          status: "FAILED",
          failureReason: "Chave inexistente.",
        });
        return {
          success: false,
          errorCode: "INVALID_LICENSE",
          errorMessage: "Licença inválida ou inexistente.",
        };
      }

      const lic = licRes.rows[0];

      // Verificação de ban da licença
      if (lic.status === "BANNED") {
        await client.query("ROLLBACK");
        await logAuthEvent({
          applicationId: app.id,
          event: "LICENSE_BANNED",
          licenseKeyMasked: maskLicenseKey(cleanKey),
          ipAddress,
          deviceFingerprint,
          status: "BLOCKED",
          failureReason: "Licença banida.",
        });
        return {
          success: false,
          errorCode: "LICENSE_BANNED",
          errorMessage: "Esta licença foi banida.",
        };
      }

      if (lic.status === "REVOKED") {
        await client.query("ROLLBACK");
        return {
          success: false,
          errorCode: "LICENSE_REVOKED",
          errorMessage: "Esta licença foi revogada.",
        };
      }

      if (lic.status === "PAUSED") {
        await client.query("ROLLBACK");
        return {
          success: false,
          errorCode: "LICENSE_PAUSED",
          errorMessage: "Esta licença está temporariamente pausada.",
        };
      }

      const now = new Date();
      let activatedAt = lic.activated_at ? new Date(lic.activated_at) : null;
      let expiresAt = lic.expires_at ? new Date(lic.expires_at) : null;
      let newStatus = lic.status;
      let isFirstActivation = false;

      // 4. Se for primeiro uso (UNUSED) -> Ativa agora
      if (lic.status === "UNUSED") {
        isFirstActivation = true;
        activatedAt = now;
        newStatus = "ACTIVE";

        const duration = lic.duration_days ?? lic.plan_duration;
        if (duration !== null && duration !== undefined) {
          expiresAt = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
        } else {
          expiresAt = null; // Lifetime
        }

        await client.query(
          `UPDATE licenses 
           SET status = $1, activated_at = $2, expires_at = $3, updated_at = $4 
           WHERE id = $5`,
          [newStatus, activatedAt, expiresAt, now, lic.id]
        );
      } else if (lic.status === "ACTIVE") {
        // Verifica se expirou
        if (expiresAt && expiresAt.getTime() < now.getTime()) {
          newStatus = "EXPIRED";
          await client.query(
            `UPDATE licenses SET status = $1, updated_at = $2 WHERE id = $3`,
            [newStatus, now, lic.id]
          );
          await client.query("COMMIT");

          await logAuthEvent({
            applicationId: app.id,
            event: "LICENSE_EXPIRED",
            licenseKeyMasked: maskLicenseKey(cleanKey),
            ipAddress,
            deviceFingerprint,
            status: "FAILED",
            failureReason: "Licença expirada.",
          });

          return {
            success: false,
            errorCode: "LICENSE_EXPIRED",
            errorMessage: "Esta licença expirou.",
          };
        }
      } else if (lic.status === "EXPIRED") {
        await client.query("ROLLBACK");
        return {
          success: false,
          errorCode: "LICENSE_EXPIRED",
          errorMessage: "Esta licença expirou.",
        };
      }

      // 5. Controle de HWID / Dispositivos
      let currentDevicesCount = 0;
      if (deviceFingerprint) {
        const devRes = await client.query(
          `SELECT id, status, device_fingerprint FROM devices 
           WHERE application_id = $1 AND license_id = $2`,
          [app.id, lic.id]
        );

        const existingDevices = devRes.rows;
        currentDevicesCount = existingDevices.length;
        const matchingDevice = existingDevices.find(d => d.device_fingerprint === deviceFingerprint);

        if (matchingDevice) {
          // Atualiza last_seen
          await client.query(
            `UPDATE devices SET last_seen = $1 WHERE id = $2`,
            [now, matchingDevice.id]
          );
        } else {
          // Novo dispositivo tentando vincular
          if (lic.device_limit > 0 && currentDevicesCount >= lic.device_limit) {
            await client.query("ROLLBACK");
            await logAuthEvent({
              applicationId: app.id,
              event: "DEVICE_LIMIT_REACHED",
              licenseKeyMasked: maskLicenseKey(cleanKey),
              ipAddress,
              deviceFingerprint,
              status: "BLOCKED",
              failureReason: `Limite de dispositivos excedido (${currentDevicesCount}/${lic.device_limit}).`,
            });
            return {
              success: false,
              errorCode: "DEVICE_LIMIT_REACHED",
              errorMessage: `Limite de dispositivos atingido para esta licença (${currentDevicesCount}/${lic.device_limit}).`,
            };
          }

          // Registra novo dispositivo
          await client.query(
            `INSERT INTO devices (id, application_id, license_id, device_fingerprint, first_seen, last_seen, status, metadata)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [crypto.randomUUID(), app.id, lic.id, deviceFingerprint, now, now, "ACTIVE", JSON.stringify({})]
          );
          currentDevicesCount += 1;
        }
      }

      await client.query("COMMIT");

      // Log de sucesso
      await logAuthEvent({
        applicationId: app.id,
        event: isFirstActivation ? "LICENSE_ACTIVATED" : "LICENSE_SUCCESS",
        licenseKeyMasked: maskLicenseKey(cleanKey),
        ipAddress,
        deviceFingerprint,
        status: "SUCCESS",
      });

      // Dispara webhooks assíncronos
      if (isFirstActivation) {
        triggerWebhooksForApp(app.id, "license.activated", {
          license: cleanKey,
          activatedAt,
          expiresAt,
          device: deviceFingerprint,
        }).catch(err => console.error("Webhook trigger error:", err));
      }

      const timeRemaining = expiresAt ? Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000)) : null;

      return {
        success: true,
        data: {
          authorized: true,
          license: cleanKey,
          status: newStatus,
          expiresAt,
          timeRemainingSeconds: timeRemaining,
          plan: lic.plan_name
            ? {
                id: lic.plan_id,
                name: lic.plan_name,
                level: lic.plan_level || 1,
                permissions: lic.plan_permissions || [],
              }
            : null,
          device: {
            fingerprint: deviceFingerprint || "",
            currentCount: currentDevicesCount,
            limit: lic.device_limit,
          },
        },
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Reseta todos os dispositivos vinculados à licença
   */
  static async resetDevices(licenseId: string, ipAddress?: string): Promise<number> {
    const res = await db.delete(devices).where(eq(devices.licenseId, licenseId));
    await logAuditAction({
      action: "RESET_LICENSE_DEVICE",
      resource: "license",
      resourceId: licenseId,
      ipAddress,
    });
    return 1;
  }

  /**
   * Adiciona ou subtrai dias da expiração de uma licença
   */
  static async adjustTime(licenseId: string, daysDelta: number, ipAddress?: string): Promise<Date | null> {
    const [lic] = await db.select().from(licenses).where(eq(licenses.id, licenseId)).limit(1);
    if (!lic) return null;

    const currentExpiry = lic.expiresAt ? new Date(lic.expiresAt) : new Date();
    const newExpiry = new Date(currentExpiry.getTime() + daysDelta * 24 * 60 * 60 * 1000);
    const now = new Date();

    const newStatus = newExpiry.getTime() > now.getTime() ? "ACTIVE" : "EXPIRED";

    await db
      .update(licenses)
      .set({
        expiresAt: newExpiry,
        status: newStatus,
        updatedAt: now,
      })
      .where(eq(licenses.id, licenseId));

    await logAuditAction({
      action: daysDelta >= 0 ? "ADD_LICENSE_TIME" : "REMOVE_LICENSE_TIME",
      resource: "license",
      resourceId: licenseId,
      ipAddress,
      metadata: { daysDelta, newExpiry },
    });

    return newExpiry;
  }

  /**
   * Pausa licença ativa
   */
  static async pauseLicense(licenseId: string, ipAddress?: string) {
    await db.update(licenses).set({ status: "PAUSED", updatedAt: new Date() }).where(eq(licenses.id, licenseId));
    await logAuditAction({ action: "PAUSE_LICENSE", resource: "license", resourceId: licenseId, ipAddress });
  }

  /**
   * Reativa licença pausada
   */
  static async reactivateLicense(licenseId: string, ipAddress?: string) {
    await db.update(licenses).set({ status: "ACTIVE", updatedAt: new Date() }).where(eq(licenses.id, licenseId));
    await logAuditAction({ action: "REACTIVATE_LICENSE", resource: "license", resourceId: licenseId, ipAddress });
  }

  /**
   * Revoga licença
   */
  static async revokeLicense(licenseId: string, ipAddress?: string) {
    await db.update(licenses).set({ status: "REVOKED", updatedAt: new Date() }).where(eq(licenses.id, licenseId));
    await logAuditAction({ action: "REVOKE_LICENSE", resource: "license", resourceId: licenseId, ipAddress });
  }

  /**
   * Bane licença
   */
  static async banLicense(licenseId: string, reason: string = "Violação de termos", ipAddress?: string) {
    const [lic] = await db.select().from(licenses).where(eq(licenses.id, licenseId)).limit(1);
    if (!lic) return;

    await db.update(licenses).set({ status: "BANNED", updatedAt: new Date() }).where(eq(licenses.id, licenseId));

    await db.insert(bans).values({
      id: crypto.randomUUID(),
      applicationId: lic.applicationId,
      type: "LICENSE",
      targetValue: lic.key,
      reason,
      active: true,
      createdAt: new Date(),
    });

    await logAuditAction({
      action: "BAN_LICENSE",
      resource: "license",
      resourceId: licenseId,
      ipAddress,
      metadata: { reason },
    });
  }
}
