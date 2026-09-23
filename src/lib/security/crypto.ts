import * as crypto from "crypto";
import { hash as argonHash, verify as argonVerify } from "@node-rs/argon2";

/**
 * Hashing de senhas utilizando Argon2id (recomendação OWASP)
 */
export async function hashPassword(password: string): Promise<string> {
  return await argonHash(password, {
    memoryCost: 65536, // 64 MB
    timeCost: 3,       // 3 iterations
    outputLen: 32,
    parallelism: 1,
  });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argonVerify(hash, password);
  } catch {
    return false;
  }
}

/**
 * Geração de token criptograficamente seguro com CSPRNG
 */
export function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Geração de License Key com CSPRNG e alta entropia
 * Formato padrão: GOU-XXXX-XXXX-XXXX ou prefixo customizado
 */
export function generateLicenseKey(prefix: string = "GOU", blocks: number = 3, blockSize: number = 4): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Sem caracteres ambíguos (0/O, 1/I)
  const randomBytes = crypto.randomBytes(blocks * blockSize);
  
  const parts: string[] = [];
  if (prefix && prefix.trim().length > 0) {
    parts.push(prefix.trim().toUpperCase());
  }

  for (let i = 0; i < blocks; i++) {
    let block = "";
    for (let j = 0; j < blockSize; j++) {
      const byte = randomBytes[i * blockSize + j];
      block += chars[byte % chars.length];
    }
    parts.push(block);
  }

  return parts.join("-");
}

/**
 * Mascaramento seguro de chaves de licença para logs
 * Exemplo: GOU-ABCD-EFGH-1234 -> GOU-****-****-1234
 */
export function maskLicenseKey(key: string): string {
  if (!key) return "";
  const parts = key.split("-");
  if (parts.length <= 2) {
    return key.slice(0, 3) + "****" + key.slice(-3);
  }
  return parts.map((part, index) => {
    if (index === 0) return part; // Mantém o prefixo
    if (index === parts.length - 1) return part; // Mantém o último bloco para identificação
    return "*".repeat(part.length);
  }).join("-");
}

/**
 * Assinatura HMAC-SHA256 para webhooks e integridade de requests
 */
export function generateHmacSignature(payload: string | object, secret: string): string {
  const data = typeof payload === "string" ? payload : JSON.stringify(payload);
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

export function verifyHmacSignature(payload: string | object, secret: string, signature: string): boolean {
  const expected = generateHmacSignature(payload, secret);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

/**
 * SHA-256 hash rápido para identificadores e tokens de sessão
 */
export function sha256(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}
