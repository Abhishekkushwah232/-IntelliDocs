import { NextResponse } from "next/server";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { requireUser } from "@/lib/auth";

type ExtractOk = { ok: true; text: string; mimeType: string };
type ExtractErr = { ok: false; status: number; error: string; hint?: string };

function pdfParseHint(raw: string): string | undefined {
  const m = raw.toLowerCase();
  if (
    m.includes("xref") ||
    m.includes("formaterror") ||
    m.includes("invalid pdf") ||
    m.includes("password")
  ) {
    return (
      "This PDF’s structure is not supported by the demo parser (common with some scanned or government PDFs). " +
      "Try: open the PDF in Chrome/Edge → Print → Save as PDF, or copy text into a .txt file and upload that."
    );
  }
  return undefined;
}

async function extractTextFromFile(file: File): Promise<ExtractOk | ExtractErr> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const mimeType = file.type || "";
  const filename = file.name || "";

  const lowerName = filename.toLowerCase();
  if (mimeType.includes("text") || lowerName.endsWith(".txt")) {
    return { ok: true, text: buffer.toString("utf8"), mimeType: mimeType || "text/plain" };
  }

  if (mimeType.includes("pdf") || lowerName.endsWith(".pdf")) {
    try {
      const mod = await import("pdf-parse");
      const pdfParse = (mod as unknown as { default?: ((data: Buffer) => Promise<{ text?: string }>) }).default
        ?? (mod as unknown as ((data: Buffer) => Promise<{ text?: string }>));
      if (typeof pdfParse !== "function") {
        return {
          ok: false,
          status: 500,
          error: "PDF parser is not available on the server.",
        };
      }
      const parsed = await pdfParse(buffer);
      return { ok: true, text: parsed.text ?? "", mimeType: "application/pdf" };
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown pdf parsing error";
      return {
        ok: false,
        status: 422,
        error: `Could not extract text from this PDF: ${message}`,
        hint: pdfParseHint(message),
      };
    }
  }

  return {
    ok: false,
    status: 400,
    error: "Unsupported file type. Please upload a .txt or .pdf file.",
  };
}

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }

  const extracted = await extractTextFromFile(file);
  if (!extracted.ok) {
    return NextResponse.json(
      { error: extracted.error, ...(extracted.hint ? { hint: extracted.hint } : {}) },
      { status: extracted.status },
    );
  }

  const { text, mimeType } = extracted;
  const trimmed = text.trim();
  if (!trimmed) {
    return NextResponse.json({ error: "File had no readable text." }, { status: 400 });
  }

  // Keep the demo bounded. For real RAG you'd chunk + embed.
  const content = trimmed.slice(0, 80_000);
  const filename = file.name ?? "uploaded-file";

  const db = getDb();
  const inserted = await db
    .insert(schema.documents)
    .values({
      userId: auth.user.id,
      filename,
      mimeType,
      content,
    })
    .returning({ id: schema.documents.id });

  return NextResponse.json({
    documentId: inserted[0]!.id,
    filename,
  });
}

