import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

let cachedDb:
  | ReturnType<typeof drizzle>
  | null = null;

export function getDb() {
  if (cachedDb) return cachedDb;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL (point at your Supabase Postgres).");
  }

  const isPgbouncer =
    connectionString.includes("pooler.supabase.com") ||
    connectionString.includes("pgbouncer=true");

  const client = postgres(connectionString, {
    ssl: "require",
    // Transaction pooler does not support prepared statements the same way.
    prepare: !isPgbouncer,
  });

  cachedDb = drizzle(client, { schema });
  return cachedDb;
}

