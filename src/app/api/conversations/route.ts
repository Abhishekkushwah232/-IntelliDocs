import { NextResponse } from "next/server";
import { count, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const db = getDb();

  const conversations = await db
    .select({
      id: schema.conversations.id,
      userId: schema.conversations.userId,
      title: schema.conversations.title,
      createdAt: schema.conversations.createdAt,
      messageCount: count(schema.messages.id),
    })
    .from(schema.conversations)
    .leftJoin(
      schema.messages,
      eq(schema.messages.conversationId, schema.conversations.id),
    )
    .where(eq(schema.conversations.userId, auth.user.id))
    .groupBy(schema.conversations.id)
    .orderBy(desc(schema.conversations.createdAt));

  return NextResponse.json({ conversations });
}

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const db = getDb();

  const body = (await req.json()) as { title?: string };
  const title = body?.title?.trim() || "New chat";

  const inserted = await db
    .insert(schema.conversations)
    .values({
      userId: auth.user.id,
      title,
    })
    .returning({ id: schema.conversations.id });

  return NextResponse.json({ conversationId: inserted[0]?.id });
}

