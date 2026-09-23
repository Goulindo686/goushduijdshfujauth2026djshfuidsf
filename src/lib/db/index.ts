import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import * as schema from "./schema";
import * as dotenv from "dotenv";

dotenv.config();

const basePath = process.env.DATABASE_CERTS_DIR
  ? path.resolve(process.cwd(), process.env.DATABASE_CERTS_DIR)
  : path.join(process.cwd(), "banco de dados");

let caCert: string | undefined;
let clientCert: string | undefined;
let clientKey: string | undefined;

try {
  const caFile = path.join(basePath, "ca-certificate.crt");
  const certFile = path.join(basePath, "certificate.pem");
  const keyFile = path.join(basePath, "private-key.key");

  if (fs.existsSync(caFile)) caCert = fs.readFileSync(caFile, "utf-8");
  if (fs.existsSync(certFile)) clientCert = fs.readFileSync(certFile, "utf-8");
  if (fs.existsSync(keyFile)) clientKey = fs.readFileSync(keyFile, "utf-8");
} catch (err) {
  console.warn("[GouAuth DB] Aviso ao ler certificados SSL:", err);
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: caCert
    ? {
        rejectUnauthorized: true,
        ca: caCert,
        cert: clientCert,
        key: clientKey,
      }
    : process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : undefined,
  max: 15,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export const db = drizzle(pool, { schema });
