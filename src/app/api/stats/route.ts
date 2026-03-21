import { NextResponse } from "next/server";
import { and, count, eq } from "drizzle-orm";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const db = getDb();
  const userId = auth.user.id;

  const [
    [conversationRow],
    [documentRow],
    [messageRow],
    [userMessageRow],
    [assistantRow],
  ] = await Promise.all([
    db
      .select({ n: count() })
      .from(schema.conversations)
      .where(eq(schema.conversations.userId, userId)),
    db
      .select({ n: count() })
      .from(schema.documents)
      .where(eq(schema.documents.userId, userId)),
    db
      .select({ n: count() })
      .from(schema.messages)
      .where(eq(schema.messages.userId, userId)),
    db
      .select({ n: count() })
      .from(schema.messages)
      .where(
        and(eq(schema.messages.userId, userId), eq(schema.messages.role, "user")),
      ),
    db
      .select({ n: count() })
      .from(schema.messages)
      .where(
        and(eq(schema.messages.userId, userId), eq(schema.messages.role, "assistant")),
      ),
  ]);

  return NextResponse.json({
    conversations: Number(conversationRow?.n ?? 0),
    documents: Number(documentRow?.n ?? 0),
    messages: Number(messageRow?.n ?? 0),
    userMessages: Number(userMessageRow?.n ?? 0),
    assistantMessages: Number(assistantRow?.n ?? 0),
  });
}
