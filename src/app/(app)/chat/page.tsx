"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type ChatMessage = { id?: string; role: "user" | "assistant"; content: string; createdAt?: string };
type DocumentRow = { id: string; filename: string; mimeType?: string; createdAt?: string };

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialConversationId = searchParams.get("conversationId");
  const initialDocumentId = searchParams.get("documentId");

  const [conversationId, setConversationId] = useState<string | null>(initialConversationId);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(initialDocumentId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    if (!initialConversationId) return;
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;

        const res = await fetch(
          `/api/conversations/messages?conversationId=${encodeURIComponent(initialConversationId)}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (!res.ok) return;
        const json = await res.json();

        if (!mounted) return;
        setMessages(json.messages ?? []);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      mounted = false;
    };
  }, [initialConversationId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;

        const res = await fetch("/api/documents", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        if (!mounted) return;
        setDocuments(json.documents ?? []);
      } catch {
        /* ignore */
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function sendQuestion() {
    const question = input.trim();
    if (!question || loading) return;

    setLoading(true);
    setInput("");

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setLoading(false);
      return;
    }

    const optimisticUserMessage: ChatMessage = {
      role: "user",
      content: question,
    };
    setMessages((prev) => [...prev, optimisticUserMessage]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversationId: conversationId ?? undefined,
        question,
        documentId: selectedDocumentId ?? undefined,
      }),
    });

    if (!res.ok) {
      setLoading(false);
      return;
    }

    const json = await res.json();
    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: json.message,
    };
    const newCid = json.conversationId as string;
    setConversationId(newCid);
    setMessages((prev) => [...prev, assistantMessage]);

    if (newCid && newCid !== initialConversationId) {
      router.replace(`/chat?conversationId=${encodeURIComponent(newCid)}`);
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Chat</h1>
          <p className="text-sm text-slate-600">
            {selectedDocumentId ? (
              <>
                Using file context —{" "}
                <Link href="/documents" className="font-medium text-indigo-600 hover:underline">
                  manage documents
                </Link>
              </>
            ) : (
              "Ask freely, or attach a document for file-grounded answers."
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedDocumentId ? (
            <button
              type="button"
              onClick={() => setSelectedDocumentId(null)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Clear file context
            </button>
          ) : null}
          <Link
            href="/history"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Past chats
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Document context</span>
            <select
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={selectedDocumentId ?? ""}
              onChange={(e) => setSelectedDocumentId(e.target.value || null)}
            >
              <option value="">None — general Q&amp;A</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.filename}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Upload (.txt / .pdf)</span>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <label className="flex flex-1 cursor-pointer items-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50/30">
                <input
                  type="file"
                  accept=".txt,.pdf"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setUploadError(null);
                    setUploadFile(f);
                  }}
                />
                <span className="truncate">{uploadFile ? uploadFile.name : "Choose file or drag here (via picker)"}</span>
              </label>
              <button
                type="button"
                disabled={!uploadFile || uploading}
                onClick={async () => {
                  if (!uploadFile) return;
                  setUploading(true);
                  setUploadError(null);
                  try {
                    const { data } = await supabase.auth.getSession();
                    const token = data.session?.access_token;
                    if (!token) return;

                    const formData = new FormData();
                    formData.append("file", uploadFile);

                    const res = await fetch("/api/documents/upload", {
                      method: "POST",
                      headers: { Authorization: `Bearer ${token}` },
                      body: formData,
                    });

                    if (!res.ok) {
                      const json = await res.json().catch(() => null);
                      const base = json?.error || "Upload failed.";
                      const hint = json?.hint ? `\n\n${json.hint}` : "";
                      throw new Error(base + hint);
                    }

                    const json = await res.json();
                    setSelectedDocumentId(json.documentId ?? null);

                    const listRes = await fetch("/api/documents", {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    if (listRes.ok) {
                      const listJson = await listRes.json();
                      setDocuments(listJson.documents ?? []);
                    }
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : "Upload failed.";
                    setUploadError(msg);
                  } finally {
                    setUploading(false);
                  }
                }}
                className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? "Uploading…" : "Upload & use"}
              </button>
            </div>
          </div>
        </div>

        {uploadError ? (
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
            {uploadError}
          </div>
        ) : null}
      </div>

      <div className="flex min-h-[320px] flex-1 flex-col rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-medium text-slate-700">Conversation</h2>
        </div>
        <div className="flex flex-1 flex-col overflow-hidden p-4">
          {messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
              <p className="text-sm font-medium text-slate-700">Start the thread</p>
              <p className="max-w-md text-sm text-slate-500">
                Type a question below. With a document selected, answers prioritize your file content.
              </p>
            </div>
          ) : (
            <div className="flex max-h-[min(52vh,520px)] flex-col gap-3 overflow-y-auto pr-1">
              {messages.map((m, idx) => (
                <div
                  key={m.id ?? `${m.role}-${idx}`}
                  className={
                    "max-w-[min(100%,42rem)] rounded-2xl px-4 py-3 text-sm shadow-sm " +
                    (m.role === "user"
                      ? "ml-auto bg-indigo-600 text-white"
                      : "mr-auto border border-slate-100 bg-slate-50 text-slate-800")
                  }
                >
                  <div className={"mb-1 text-xs font-medium " + (m.role === "user" ? "text-indigo-100" : "text-slate-500")}>
                    {m.role === "user" ? "You" : "Assistant"}
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                </div>
              ))}
              {loading ? (
                <div className="mr-auto flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
                  Thinking…
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendQuestion().catch(() => null);
        }}
        className="sticky bottom-0 flex gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-lg shadow-slate-200/50"
      >
        <input
          className="min-h-[48px] flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something…"
          aria-label="Message"
        />
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}
