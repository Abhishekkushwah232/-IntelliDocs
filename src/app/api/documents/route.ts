import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const db = getDb();

  const documents = await db
    .select({
      id: schema.documents.id,
      filename: schema.documents.filename,
      mimeType: schema.documents.mimeType,
      createdAt: schema.documents.createdAt,
    })
    .from(schema.documents)
    .where(eq(schema.documents.userId, auth.user.id))
    .orderBy(desc(schema.documents.createdAt));

  return NextResponse.json({ documents });
}

