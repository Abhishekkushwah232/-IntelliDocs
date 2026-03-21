import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const db = getDb();

  const url = new URL(req.url);
  const conversationId = url.searchParams.get("conversationId");
  if (!conversationId) {
    return NextResponse.json({ error: "Missing conversationId." }, { status: 400 });
  }

  const conversation = await db
    .select({ userId: schema.conversations.userId })
    .from(schema.conversations)
    .where(eq(schema.conversations.id, conversationId))
    .limit(1);

  if (conversation.length === 0) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  if (conversation[0]!.userId !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const messages = await db
    .select({
      id: schema.messages.id,
      role: schema.messages.role,
      content: schema.messages.content,
      createdAt: schema.messages.createdAt,
    })
    .from(schema.messages)
    .where(eq(schema.messages.conversationId, conversationId))
    .orderBy(asc(schema.messages.createdAt));

  return NextResponse.json({ messages });
}

