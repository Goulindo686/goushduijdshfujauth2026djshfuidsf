import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    ssl: {
      rejectUnauthorized: true,
      ca: process.env.DATABASE_CA_PATH || "./banco de dados/ca-certificate.crt",
    },
  },
  verbose: true,
  strict: true,
});
