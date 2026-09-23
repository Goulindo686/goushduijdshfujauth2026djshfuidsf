import { db, pool } from "../src/lib/db";
import { admins } from "../src/lib/db/schema";
import { hashPassword } from "../src/lib/security/crypto";
import * as dotenv from "dotenv";

dotenv.config();

async function seed() {
  console.log("[GouAuth Seed] Verificando se o administrador existe...");

  try {
    const existingAdmins = await db.select().from(admins).limit(1);

    if (existingAdmins.length > 0) {
      console.log(`[GouAuth Seed] Administrador já configurado: ${existingAdmins[0].email}`);
      process.exit(0);
    }

    const adminEmail = process.env.ADMIN_EMAIL || "admin@gouauth.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "GouAuth#2026";

    console.log(`[GouAuth Seed] Criando conta de administrador inicial: ${adminEmail}...`);
    const passwordHash = await hashPassword(adminPassword);

    await db.insert(admins).values({
      id: crypto.randomUUID(),
      email: adminEmail,
      passwordHash,
      totpEnabled: false,
      recoveryCodes: [],
    });

    console.log("=================================================");
    console.log(" ADMINISTRADOR CRIADO COM SUCESSO!");
    console.log(` Email: ${adminEmail}`);
    console.log(` Senha: ${adminPassword}`);
    console.log(" (Recomendamos alterar a senha no primeiro login)");
    console.log("=================================================");

    process.exit(0);
  } catch (error) {
    console.error("[GouAuth Seed] Erro ao criar administrador:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
