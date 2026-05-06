import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }

  const db = getDb();

  const owner = await db
    .select({ userId: schema.conversations.userId })
    .from(schema.conversations)
    .where(eq(schema.conversations.id, id))
    .limit(1);

  if (owner.length === 0 || owner[0]!.userId !== auth.user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  await db
    .delete(schema.messages)
    .where(
      and(
        eq(schema.messages.conversationId, id),
        eq(schema.messages.userId, auth.user.id),
      ),
    );

  await db
    .delete(schema.conversations)
    .where(
      and(
        eq(schema.conversations.id, id),
        eq(schema.conversations.userId, auth.user.id),
      ),
    );

  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { title?: string } | null;
  const title = body?.title?.trim();
  if (!id || !title) {
    return NextResponse.json({ error: "Missing id or title." }, { status: 400 });
  }

  const db = getDb();
  const updated = await db
    .update(schema.conversations)
    .set({ title })
    .where(
      and(
        eq(schema.conversations.id, id),
        eq(schema.conversations.userId, auth.user.id),
      ),
    )
    .returning({ id: schema.conversations.id });

  if (updated.length === 0) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
