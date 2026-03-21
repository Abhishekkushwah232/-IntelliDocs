/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Runs before drizzle-kit migrate: validates env + connection string, quick ping.
 * Helps when migrate "stops" after "Using 'postgres' driver" (often a long hang or silent failure).
 */
require("dotenv").config();

const url =
  process.env.DIRECT_URL?.trim() ||
  process.env.DATABASE_URL?.trim() ||
  "";

if (!url) {
  console.error(
    "[db:migrate] Missing DIRECT_URL or DATABASE_URL in .env (DIRECT_URL is preferred for migrations).",
  );
  process.exit(1);
}

let parsed;
try {
  parsed = new URL(url);
} catch (e) {
  console.error(
    "[db:migrate] Connection URL is not valid. Fix encoding in the password (e.g. * → %2A, # → %23).",
  );
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}

const safe =
  `${parsed.protocol}//${parsed.username ? "****" : ""}@${parsed.host}${parsed.pathname}${parsed.search}`;
console.log("[db:migrate] Using:", safe);

const postgres = require("postgres");

(async () => {
  const sql = postgres(url, {
    ssl: "require",
    max: 1,
    connect_timeout: 20,
  });
  try {
    const rows = await sql`select 1 as ok`;
    console.log("[db:migrate] Database reachable, ok =", rows[0]?.ok);
  } catch (err) {
    console.error("[db:migrate] Cannot connect to Postgres:");
    console.error(err instanceof Error ? err.message : err);
    if (
      String(err).includes("CONNECT_TIMEOUT") ||
      String(err).includes("ETIMEDOUT")
    ) {
      console.error(
        "\n[db:migrate] If you are using db.<project>.supabase.co:5432 and it times out, your network may block it.",
      );
      console.error(
        "Use Supabase Session pooler for DIRECT_URL (same region host as transaction pooler, port 5432, user postgres.<project_ref>):",
      );
      console.error(
        "  postgresql://postgres.YOUR_REF:PASSWORD@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require",
      );
      console.error(
        "(Do not use :6543 or pgbouncer=true for migrations — that is transaction pooler.)\n",
      );
    }
    process.exit(1);
  } finally {
    await sql.end({ timeout: 5 });
  }
})();
