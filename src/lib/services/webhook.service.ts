import { db } from "../db";
import { webhooks, webhookDeliveries } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { generateHmacSignature } from "../security/crypto";

export async function triggerWebhooksForApp(
  applicationId: string,
  event: string,
  payload: Record<string, unknown>
) {
  try {
    const activeWebhooks = await db
      .select()
      .from(webhooks)
      .where(and(eq(webhooks.applicationId, applicationId), eq(webhooks.status, "ACTIVE")));

    for (const hook of activeWebhooks) {
      const subscribedEvents = hook.events || [];
      if (!subscribedEvents.includes(event) && !subscribedEvents.includes("*")) {
        continue;
      }

      // Dispara em background
      deliverWebhook(hook.id, hook.url, hook.secret, event, payload).catch(err => {
        console.error(`[Webhook] Erro ao enviar para ${hook.url}:`, err);
      });
    }
  } catch (err) {
    console.error("[WebhookService] Falha ao consultar webhooks:", err);
  }
}

async function deliverWebhook(
  webhookId: string,
  url: string,
  secret: string,
  event: string,
  payload: Record<string, unknown>
) {
  const timestamp = Date.now();
  const fullPayload = {
    event,
    timestamp,
    data: payload,
  };

  const payloadString = JSON.stringify(fullPayload);
  const signature = generateHmacSignature(payloadString, secret);

  let responseStatus: number | null = null;
  let responseBody: string | null = null;
  let success = false;
  let attempts = 1;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-GouAuth-Event": event,
        "X-GouAuth-Signature": signature,
        "X-GouAuth-Timestamp": timestamp.toString(),
        "User-Agent": "GouAuth-Webhook/1.0",
      },
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    responseStatus = res.status;
    responseBody = (await res.text()).slice(0, 1000); // Máximo 1000 chars
    success = res.ok;
  } catch (err: unknown) {
    responseStatus = 0;
    responseBody = err instanceof Error ? err.message : "Network/Timeout error";
    success = false;
  }

  // Registra delivery
  try {
    await db.insert(webhookDeliveries).values({
      id: crypto.randomUUID(),
      webhookId,
      event,
      payload: fullPayload,
      responseStatus,
      responseBody,
      success,
      attempts,
      createdAt: new Date(),
    });
  } catch (e) {
    console.error("[WebhookService] Erro ao salvar delivery:", e);
  }
}
