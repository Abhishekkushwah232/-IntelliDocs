import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { requireUser } from "@/lib/auth";

type ChatRequestBody = {
  conversationId?: string;
  question: string;
  documentId?: string;
};

type AssistantResult = {
  text: string;
  meta: Record<string, unknown>;
  /** Only in development when Gemini HTTP fails — surfaced in JSON for debugging. */
  devGemini?: { status: number; model: string; body: string };
};

function collectGeminiKeys(): string[] {
  // Supported env shapes (any combination):
  //   GEMINI_API_KEYS=key1,key2,key3   (comma-separated, primary)
  //   GEMINI_API_KEY_1 / _2 / _3       (numbered slots)
  //   GEMINI_API_KEY                   (legacy single)
  const raw: string[] = [];
  const list = process.env.GEMINI_API_KEYS;
  if (list) raw.push(...list.split(","));
  for (const suffix of ["_1", "_2", "_3"]) {
    const v = process.env[`GEMINI_API_KEY${suffix}`];
    if (v) raw.push(v);
  }
  if (process.env.GEMINI_API_KEY) raw.push(process.env.GEMINI_API_KEY);

  const seen = new Set<string>();
  const out: string[] = [];
  for (const k of raw) {
    const trimmed = k.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      out.push(trimmed);
    }
  }
  return out;
}

async function generateAssistantReply(params: {
  question: string;
  history: { role: "user" | "assistant"; content: string }[];
  contextText?: string | null;
  contextFilename?: string | null;
}): Promise<AssistantResult> {
  const keys = collectGeminiKeys();
  // Default to a 2.5 model — 2.0-flash and 1.5-flash are retired or quota-zero on many keys.
  const preferredModel = (process.env.GEMINI_MODEL ?? "gemini-2.5-flash").trim();

  if (keys.length === 0) {
    return {
      text: (() => {
        const base = `Demo mode: I received your question: "${params.question}".\n\n`;
        if (!params.contextText || !params.contextFilename) {
          return (
            base +
            `In the full version, this is where Gemini/RAG would answer. Upload a file and try again for file-based answers.`
          );
        }

        return (
          base +
          `I also received context from "${params.contextFilename}". (Demo fallback has no real model calls yet.)\n\n` +
          `Context preview:\n${params.contextText.slice(0, 500)}`
        );
      })(),
      meta: { mode: "demo_fallback", model: null, hasContext: !!params.contextText },
    };
  }

  const questionWithContext =
    params.contextText && params.contextFilename
      ? `Question:\n${params.question}\n\nCONTEXT FROM FILE (${params.contextFilename}):\n${params.contextText}`
      : params.question;

  const contents = params.history
    .slice(-20)
    .map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }))
    // Gemini expects the last message to be the user's prompt.
    .concat([
      {
        role: "user" as const,
        parts: [{ text: questionWithContext }],
      },
    ]);

  const systemInstruction =
    "Answer helpfully and concisely using only the provided context when it exists. If you are unsure, say so.";

  const payload = JSON.stringify({
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents,
    generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
  });

  const tryModels = [preferredModel, "gemini-2.5-flash", "gemini-2.5-flash-lite"].filter(
    (m, i, a) => m.length > 0 && a.indexOf(m) === i,
  );

  let res: Response | null = null;
  let modelUsed = preferredModel;
  let keyIndexUsed = 0;
  // 429 = quota exhausted for the key, 403 = key disabled / quota policy.
  // Rotate to the next key on either. 404 = retired model id, rotate model instead.
  const isQuotaError = (status: number) => status === 429 || status === 403;

  outer: for (const model of tryModels) {
    let lastQuotaResponse: Response | null = null;
    for (let i = 0; i < keys.length; i++) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model,
      )}:generateContent?key=${encodeURIComponent(keys[i]!)}`;
      const attempt = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });

      if (attempt.ok) {
        res = attempt;
        modelUsed = model;
        keyIndexUsed = i;
        break outer;
      }

      res = attempt;
      modelUsed = model;
      keyIndexUsed = i;

      if (isQuotaError(attempt.status)) {
        // Save and try the next key with the same model.
        lastQuotaResponse = attempt;
        if (process.env.NODE_ENV === "development") {
          console.warn(
            `[api/chat] Gemini key #${i + 1} hit ${attempt.status} on ${model}, rotating.`,
          );
        }
        continue;
      }

      // Non-quota error: rotating the key won't help. Try next model.
      if (attempt.status === 404) break;
      // Other errors (5xx, 400, etc.) — give up for this model.
      break;
    }

    // If every key failed with a quota error on this model, preserve that response
    // for the eventual error path so we report the most accurate failure.
    if (lastQuotaResponse && (!res || !isQuotaError(res.status))) {
      res = lastQuotaResponse;
    }
  }

  if (!res!.ok) {
    const errorBody = await res!.text();
    const preview = errorBody.slice(0, 500);
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[api/chat] Gemini error:",
        res!.status,
        modelUsed,
        `key#${keyIndexUsed + 1}`,
        preview,
      );
    }
    return {
      text: `Demo mode: I couldn't reach the model right now. Your question was: "${params.question}".`,
      meta: {
        mode: "demo_fallback",
        geminiStatus: res!.status,
        modelTried: modelUsed,
        keyIndexTried: keyIndexUsed + 1,
        keysAvailable: keys.length,
      },
      devGemini:
        process.env.NODE_ENV === "development"
          ? { status: res!.status, model: modelUsed, body: preview }
          : undefined,
    };
  }

  const data = await res!.json();
  const text =
    (data?.candidates?.[0]?.content?.parts ?? [])
      .map((p: unknown) => {
        if (!p || typeof p !== "object") return "";
        const maybeText = (p as { text?: unknown }).text;
        return typeof maybeText === "string" ? maybeText : "";
      })
      .join("") ?? null;

  if (!text) {
    return {
      text: `Demo mode: I couldn't generate an answer for: "${params.question}".`,
      meta: { mode: "demo_fallback", missingText: true },
    };
  }

  return {
    text,
    meta: { mode: "gemini" as const, model: modelUsed, keyIndex: keyIndexUsed + 1 },
  };
}

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const db = getDb();

  const body = (await req.json()) as ChatRequestBody;
  const question = body?.question?.trim();
  if (!question) {
    return NextResponse.json({ error: "Missing question." }, { status: 400 });
  }

  const userId = auth.user.id;

  const documentId = body.documentId?.trim() || null;
  const documentContext = await (async () => {
    if (!documentId) return null;

    const ownedDoc = await db
      .select({
        filename: schema.documents.filename,
        content: schema.documents.content,
      })
      .from(schema.documents)
      .where(
        and(eq(schema.documents.id, documentId), eq(schema.documents.userId, userId)),
      )
      .limit(1);

    if (ownedDoc.length === 0) return null;

    return {
      filename: ownedDoc[0]!.filename,
      content: ownedDoc[0]!.content,
    };
  })();

  const conversationId =
    body.conversationId && body.conversationId.length > 0
      ? body.conversationId
      : null;

  const resolvedConversationId = await (async () => {
    if (conversationId) {
      // For demo simplicity we rely on this check to avoid cross-user access.
      const existing = await db
        .select({ id: schema.conversations.id })
        .from(schema.conversations)
        .where(and(eq(schema.conversations.id, conversationId), eq(schema.conversations.userId, userId)))
        .limit(1);
      if (existing.length > 0) return existing[0]!.id;
    }

    const title = question.length > 60 ? `${question.slice(0, 60)}...` : question;
    const inserted = await db
      .insert(schema.conversations)
      .values({ userId, title: title || "New chat" })
      .returning({ id: schema.conversations.id });
    return inserted[0]!.id;
  })();

  // Persist the user's message first.
  await db.insert(schema.messages).values({
    conversationId: resolvedConversationId,
    userId,
    role: "user",
    content: question,
  });

  const history = await db
    .select({ role: schema.messages.role, content: schema.messages.content })
    .from(schema.messages)
    .where(eq(schema.messages.conversationId, resolvedConversationId))
    .orderBy(desc(schema.messages.createdAt))
    .limit(20);

  const normalizedHistory = history
    .reverse()
    .map((m) => ({ role: m.role, content: m.content }));

  // Generate the assistant reply (Gemini if configured, demo fallback otherwise).
  const assistant = await generateAssistantReply({
    question,
    history: normalizedHistory,
    contextText: documentContext?.content ?? null,
    contextFilename: documentContext?.filename ?? null,
  });

  await db.insert(schema.messages).values({
    conversationId: resolvedConversationId,
    userId,
    role: "assistant",
    content: assistant.text,
    meta: assistant.meta,
  });

  return NextResponse.json({
    conversationId: resolvedConversationId,
    message: assistant.text,
    ...(assistant.devGemini ? { geminiDebug: assistant.devGemini } : {}),
  });
}

