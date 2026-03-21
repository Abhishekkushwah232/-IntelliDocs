import "dotenv/config";
import type { Config } from "drizzle-kit";

// Drizzle migrations for the demo.
// Use DIRECT_URL for migrations: Supabase *transaction* pooler (6543 + pgbouncer=true) often cannot run DDL.
// App runtime can keep using DATABASE_URL (pooler). If DIRECT_URL is unset, falls back to DATABASE_URL.
const migrationUrl =
  process.env.DIRECT_URL?.trim() ||
  process.env.DATABASE_URL?.trim() ||
  "";

const config: Config = {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: migrationUrl,
  },
};

export default config;

