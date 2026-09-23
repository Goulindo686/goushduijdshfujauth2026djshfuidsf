import {
  generateLicenseKey,
  hashPassword,
  verifyPassword,
  generateHmacSignature,
  verifyHmacSignature,
  maskLicenseKey
} from "../src/lib/security/crypto";
import { checkRateLimit } from "../src/lib/security/rate-limiter";
import { LicenseService } from "../src/lib/services/license.service";
import { db, pool } from "../src/lib/db";
import { applications, licenses, devices, bans } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ [FAIL] ${testName}`);
    failedTests++;
  }
}

async function runTestSuite() {
  console.log("\n=======================================================");
  console.log(" EXECUTANDO TESTES DE SEGURANÇA E FLUXOS CRÍTICOS — GOUAUTH");
  console.log("=======================================================\n");

  // 1. Teste de Criptografia Argon2id
  console.log("1. TESTES DE CRIPTOGRAFIA & CSPRNG:");
  const testPassword = "GouAuthSuperSecurePassword2026!";
  const hash = await hashPassword(testPassword);
  assert(hash.startsWith("$argon2id$"), "Argon2id gera hash no formato padrão");
  const isValid = await verifyPassword(testPassword, hash);
  assert(isValid === true, "Argon2id valida senha correta");
  const isInvalid = await verifyPassword("WrongPassword!", hash);
  assert(isInvalid === false, "Argon2id rejeita senha incorreta");

  // 2. CSPRNG License Key Generation
  const key1 = generateLicenseKey("TEST", 3, 4);
  const key2 = generateLicenseKey("TEST", 3, 4);
  assert(key1.startsWith("TEST-"), "License key possui prefixo configurado");
  assert(key1 !== key2, "Chaves geradas sequencialmente possuem entropia diferente");
  assert(key1.split("-").length === 4, "Formato da chave possui blocos corretos");

  // 3. Mascaramento de Chaves para Logs
  const masked = maskLicenseKey("TEST-ABCD-EFGH-1234");
  assert(masked.includes("****"), "Mascaramento protege os blocos internos da chave");
  assert(masked.endsWith("-1234"), "Mascaramento preserva o último bloco para identificação");

  // 4. Assinatura de Webhooks HMAC-SHA256
  console.log("\n2. TESTES DE ASSINATURA DE WEBHOOKS (HMAC-SHA256):");
  const payload = { event: "license.activated", key: "TEST-KEY" };
  const secret = "my_super_secret_webhook_key_123";
  const signature = generateHmacSignature(payload, secret);
  assert(typeof signature === "string" && signature.length === 64, "Gera assinatura hexadecimal SHA-256 válida");
  const isSigValid = verifyHmacSignature(payload, secret, signature);
  assert(isSigValid === true, "Verificação de assinatura HMAC é bem-sucedida");
  const isSigTampered = verifyHmacSignature(payload, "wrong_secret", signature);
  assert(isSigTampered === false, "Rejeita assinatura com chave adulterada");

  // 5. Testes de Rate Limiting
  console.log("\n3. TESTES DE RATE LIMITING:");
  const testIp = "192.168.1.99";
  const limit1 = checkRateLimit(testIp, "ADMIN_LOGIN");
  assert(limit1.allowed === true, "Primeira tentativa permitida pelo rate limiter");
  // Excede limite propositalmente
  for (let i = 0; i < 6; i++) {
    checkRateLimit(testIp, "ADMIN_LOGIN");
  }
  const limitExceeded = checkRateLimit(testIp, "ADMIN_LOGIN");
  assert(limitExceeded.allowed === false, "Rate limiter bloqueia após exceder maxRequests (429)");

  // 6. Testes de Banco de Dados e Transações Atômicas de Licença
  console.log("\n4. TESTES DE INTEGRAÇÃO COM BANCO DA SQUARE CLOUD:");
  const testAppId = `test-app-${Date.now()}`;
  let createdAppRecordId = "";

  try {
    // Cria aplicação temporária de teste
    const newApp = {
      id: crypto.randomUUID(),
      appId: testAppId,
      name: "App de Teste Unitário",
      status: "ACTIVE",
      apiSecret: "test_secret_123",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.insert(applications).values(newApp);
    createdAppRecordId = newApp.id;
    assert(true, "Aplicação de teste inserida no banco da Square Cloud");

    // Gera 1 licença de 30 dias com limite de 1 dispositivo
    const [testKey] = await LicenseService.generateBulk({
      applicationId: newApp.id,
      quantity: 1,
      durationDays: 30,
      prefix: "UNIT",
      deviceLimit: 1,
    });
    assert(!!testKey, "Licença gerada no banco via LicenseService.generateBulk");

    // Primeira validação / ativação (UNUSED -> ACTIVE)
    const firstAuth = await LicenseService.validateAndAuthenticate({
      appId: testAppId,
      licenseKey: testKey,
      deviceFingerprint: "HWID-DEVICE-ALPHA",
    });
    assert(firstAuth.success === true, "Primeira ativação autorizada");
    assert(firstAuth.data?.status === "ACTIVE", "Status alterado de UNUSED para ACTIVE");
    assert(firstAuth.data?.device.currentCount === 1, "Dispositivo HWID registrado com sucesso");

    // Segunda validação com o MESMO dispositivo (deve permitir)
    const sameDeviceAuth = await LicenseService.validateAndAuthenticate({
      appId: testAppId,
      licenseKey: testKey,
      deviceFingerprint: "HWID-DEVICE-ALPHA",
    });
    assert(sameDeviceAuth.success === true, "Mesmo dispositivo autorizado novamente");

    // Terceira validação com um SEGUNDO dispositivo (deve rejeitar por DEVICE_LIMIT_REACHED)
    const secondDeviceAuth = await LicenseService.validateAndAuthenticate({
      appId: testAppId,
      licenseKey: testKey,
      deviceFingerprint: "HWID-DEVICE-BETA-INTRUDER",
    });
    assert(secondDeviceAuth.success === false, "Segundo dispositivo bloqueado");
    assert(secondDeviceAuth.errorCode === "DEVICE_LIMIT_REACHED", "Erro DEVICE_LIMIT_REACHED retornado");

    // Teste de Reset de Dispositivo
    const [licRecord] = await db.select().from(licenses).where(eq(licenses.key, testKey)).limit(1);
    await LicenseService.resetDevices(licRecord.id);
    const afterResetAuth = await LicenseService.validateAndAuthenticate({
      appId: testAppId,
      licenseKey: testKey,
      deviceFingerprint: "HWID-DEVICE-BETA-INTRUDER",
    });
    assert(afterResetAuth.success === true, "Após reset, novo dispositivo pode vincular");

    // Teste de Banimento de Licença
    await LicenseService.banLicense(licRecord.id, "Teste de violação");
    const bannedAuth = await LicenseService.validateAndAuthenticate({
      appId: testAppId,
      licenseKey: testKey,
      deviceFingerprint: "HWID-DEVICE-BETA-INTRUDER",
    });
    assert(bannedAuth.success === false, "Licença banida bloqueada");
    assert(bannedAuth.errorCode === "LICENSE_BANNED", "Código LICENSE_BANNED retornado");

  } finally {
    // Cleanup da aplicação de teste
    if (createdAppRecordId) {
      await db.delete(applications).where(eq(applications.id, createdAppRecordId));
    }
    await pool.end();
  }

  console.log("\n=======================================================");
  console.log(` RESULTADO FINAL: ${passedTests} PASSOU | ${failedTests} FALHOU`);
  console.log("=======================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite();
