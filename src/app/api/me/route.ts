import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id, email } = auth.user;
  const db = getDb();

  // Mirror Supabase user info into app tables.
  // Prefer upsert, but gracefully handle drifted DBs missing a unique/PK on user_id.
  try {
    await db
      .insert(schema.profiles)
      .values({
        userId: id,
        email,
        displayName: email ? email.split("@")[0] : null,
      })
      .onConflictDoUpdate({
        target: schema.profiles.userId,
        set: {
          email,
        },
      });
  } catch {
    const existing = await db
      .select({ userId: schema.profiles.userId })
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, id))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(schema.profiles)
        .set({ email })
        .where(eq(schema.profiles.userId, id));
    } else {
      // Keep auth flow alive even when DB schema is drifted (e.g. unexpected NOT NULL columns).
      try {
        await db.insert(schema.profiles).values({
          userId: id,
          email,
          displayName: email ? email.split("@")[0] : null,
        });
      } catch {
        // Non-fatal: profile mirror is best-effort for this demo.
      }
    }
  }

  return NextResponse.json({ user: { id, email } });
}

