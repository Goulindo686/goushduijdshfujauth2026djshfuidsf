interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

// Limpeza periódica a cada 5 minutos para economizar memória
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    memoryStore.forEach((record, key) => {
      if (now > record.resetAt) {
        memoryStore.delete(key);
      }
    });
  }, 5 * 60 * 1000).unref();
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const RATE_LIMITS = {
  ADMIN_LOGIN: { maxRequests: 5, windowMs: 15 * 60 * 1000 },      // 5 tentativas em 15 min
  LICENSE_AUTH: { maxRequests: 60, windowMs: 60 * 1000 },         // 60 auths por min por IP
  USER_AUTH: { maxRequests: 20, windowMs: 60 * 1000 },            // 20 por min
  REGISTER: { maxRequests: 10, windowMs: 60 * 1000 },             // 10 por min
  ADMIN_API: { maxRequests: 150, windowMs: 60 * 1000 },           // 150 por min
  PUBLIC_INFO: { maxRequests: 100, windowMs: 60 * 1000 },         // 100 por min
};

export function checkRateLimit(
  identifier: string,
  scope: keyof typeof RATE_LIMITS
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const config = RATE_LIMITS[scope];
  const key = `${scope}:${identifier}`;
  const now = Date.now();

  const record = memoryStore.get(key);

  if (!record || now > record.resetAt) {
    // Nova janela
    memoryStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetInSeconds: Math.ceil(config.windowMs / 1000),
    };
  }

  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetInSeconds: Math.ceil((record.resetAt - now) / 1000),
  };
}

export function extractClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  return "127.0.0.1";
}
