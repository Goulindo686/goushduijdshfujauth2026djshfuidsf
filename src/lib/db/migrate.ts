import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./index";
import * as path from "path";

async function runMigrations() {
  console.log("[GouAuth DB] Iniciando execução de migrations...");
  try {
    const migrationsFolder = path.resolve(process.cwd(), "migrations");
    await migrate(db, { migrationsFolder });
    console.log("[GouAuth DB] Migrations executadas com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("[GouAuth DB] Erro ao executar migrations:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
