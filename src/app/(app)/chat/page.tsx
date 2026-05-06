"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type ChatMessage = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};
type DocumentRow = { id: string; filename: string; mimeType?: string | null; createdAt?: string | null };
type Conversation = { id: string; title: string; createdAt: string; messageCount?: number };

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatSkeleton />}>
      <ChatPageInner />
    </Suspense>
  );
}

function ChatPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialConversationId = searchParams.get("conversationId");
  const initialDocumentId = searchParams.get("documentId");

  const [conversationId, setConversationId] = useState<string | null>(initialConversationId);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(initialDocumentId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [threadDrawerOpen, setThreadDrawerOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setConversationId(initialConversationId);
  }, [initialConversationId]);

  useEffect(() => {
    setSelectedDocumentId(initialDocumentId);
  }, [initialDocumentId]);

  const refreshConversations = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    const res = await fetch("/api/conversations", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const json = await res.json();
    setConversations(json.conversations ?? []);
  }, []);

  const refreshDocuments = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    const res = await fetch("/api/documents", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const json = await res.json();
    setDocuments(json.documents ?? []);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await Promise.all([refreshConversations(), refreshDocuments()]);
      if (mounted) setBootstrapping(false);
    })();
    return () => {
      mounted = false;
    };
  }, [refreshConversations, refreshDocuments]);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;

        const res = await fetch(
          `/api/conversations/messages?conversationId=${encodeURIComponent(conversationId)}`,
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
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const selectedDocument = useMemo(
    () => documents.find((d) => d.id === selectedDocumentId) ?? null,
    [documents, selectedDocumentId],
  );

  function startNewChat() {
    setConversationId(null);
    setMessages([]);
    router.replace("/chat");
    inputRef.current?.focus();
  }

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

    setMessages((prev) => [...prev, { role: "user", content: question }]);

    let res: Response;
    try {
      res = await fetch("/api/chat", {
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
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Network error. Please try again." },
      ]);
      setLoading(false);
      return;
    }

    if (!res.ok) {
      let detail = "I couldn't generate a reply right now.";
      try {
        const json = await res.json();
        if (json?.error) detail = json.error;
      } catch {
        /* ignore */
      }
      setMessages((prev) => [...prev, { role: "assistant", content: detail }]);
      setLoading(false);
      return;
    }

    const json = await res.json();
    const newCid = json.conversationId as string;
    setMessages((prev) => [...prev, { role: "assistant", content: json.message }]);
    setConversationId(newCid);

    if (newCid && newCid !== initialConversationId) {
      router.replace(`/chat?conversationId=${encodeURIComponent(newCid)}`);
    }

    void refreshConversations();
    setLoading(false);
  }

  async function uploadAndAttach(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;

      const formData = new FormData();
      formData.append("file", file);

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
      await refreshDocuments();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function deleteConversation(id: string) {
    const ok = window.confirm("Delete this conversation? This cannot be undone.");
    if (!ok) return;
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    const res = await fetch(`/api/conversations/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    if (id === conversationId) {
      startNewChat();
    }
    await refreshConversations();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuestion().catch(() => null);
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen">
      <ConversationsRail
        conversations={conversations}
        activeId={conversationId}
        onSelect={(id) => {
          setConversationId(id);
          setThreadDrawerOpen(false);
          router.replace(`/chat?conversationId=${encodeURIComponent(id)}`);
        }}
        onNew={() => {
          startNewChat();
          setThreadDrawerOpen(false);
        }}
        onDelete={deleteConversation}
        loading={bootstrapping}
        drawerOpen={threadDrawerOpen}
        onCloseDrawer={() => setThreadDrawerOpen(false)}
      />

      <section
        className="relative flex min-w-0 flex-1 flex-col"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={async (e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) await uploadAndAttach(file);
        }}
      >
        {dragOver ? (
          <div className="pointer-events-none absolute inset-3 z-30 flex items-center justify-center rounded-3xl border-2 border-dashed border-indigo-400 bg-indigo-50/80 backdrop-blur">
            <div className="text-center">
              <div className="text-base font-semibold text-indigo-700">Drop to attach</div>
              <div className="mt-1 text-sm text-indigo-700/80">.txt or .pdf — max 80,000 chars</div>
            </div>
          </div>
        ) : null}

        <header className="flex items-center gap-3 border-b border-slate-200/70 bg-white/80 px-4 py-3 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setThreadDrawerOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 lg:hidden"
            aria-label="Show conversation list"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h10.5" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
                {conversations.find((c) => c.id === conversationId)?.title ?? "New chat"}
              </h1>
              {selectedDocument ? (
                <span className="hidden items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 sm:inline-flex">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  {selectedDocument.filename}
                </span>
              ) : null}
            </div>
            <div className="mt-0.5 truncate text-xs text-slate-500">
              {selectedDocument
                ? "Answers will be grounded in this file."
                : "Open Q&A. Attach a file to ground answers."}
            </div>
          </div>
          <button
            type="button"
            onClick={startNewChat}
            className="hidden items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-slate-800 sm:inline-flex"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New chat
          </button>
        </header>

        <div className="border-b border-slate-200/70 bg-white/60 px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Context
              </label>
              <select
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm transition focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={selectedDocumentId ?? ""}
                onChange={(e) => setSelectedDocumentId(e.target.value || null)}
              >
                <option value="">No file — general chat</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.filename}
                  </option>
                ))}
              </select>
              {selectedDocumentId ? (
                <button
                  type="button"
                  onClick={() => setSelectedDocumentId(null)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Clear
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/40">
                <input
                  type="file"
                  accept=".txt,.pdf"
                  className="sr-only"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) await uploadAndAttach(file);
                    e.currentTarget.value = "";
                  }}
                />
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M3 17.25V6.75A2.25 2.25 0 0 1 5.25 4.5h13.5A2.25 2.25 0 0 1 21 6.75v10.5A2.25 2.25 0 0 1 18.75 19.5H5.25A2.25 2.25 0 0 1 3 17.25Z" />
                </svg>
                {uploading ? "Uploading…" : "Upload .txt / .pdf"}
              </label>
            </div>
          </div>

          {uploadError ? (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800">
              <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008Zm9.75-1.5a9.75 9.75 0 1 1-19.5 0 9.75 9.75 0 0 1 19.5 0Z" />
              </svg>
              <span className="whitespace-pre-line">{uploadError}</span>
            </div>
          ) : null}
        </div>

        <div className="scrollbar-soft flex-1 overflow-y-auto bg-gradient-to-b from-white to-slate-50/40 px-4 py-6 sm:px-6">
          <div className="mx-auto w-full max-w-3xl space-y-4">
            {messages.length === 0 && !loading ? (
              <EmptyState
                onSuggestion={(s) => {
                  setInput(s);
                  inputRef.current?.focus();
                }}
                hasDocument={!!selectedDocument}
                docName={selectedDocument?.filename ?? null}
              />
            ) : null}

            {messages.map((m, idx) => (
              <MessageBubble key={m.id ?? `${m.role}-${idx}`} message={m} />
            ))}

            {loading ? <TypingBubble /> : null}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendQuestion().catch(() => null);
          }}
          className="border-t border-slate-200/70 bg-white/95 px-4 py-3 backdrop-blur sm:px-6"
        >
          <div className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/20">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={
                selectedDocument
                  ? `Ask about ${selectedDocument.filename}…`
                  : "Ask anything. Shift+Enter for newline."
              }
              rows={1}
              className="max-h-40 min-h-[36px] flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-relaxed outline-none placeholder:text-slate-400"
              style={{ fieldSizing: "content" } as React.CSSProperties}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm transition hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.4} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
            </button>
          </div>
          <div className="mx-auto mt-2 flex w-full max-w-3xl items-center justify-between text-[11px] text-slate-400">
            <div>
              {selectedDocument ? (
                <span>Grounded in <span className="font-medium text-slate-600">{selectedDocument.filename}</span></span>
              ) : (
                <span>No file attached · responses are general</span>
              )}
            </div>
            <div className="hidden sm:block">Press <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">Enter</kbd> to send</div>
          </div>
        </form>
      </section>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={"flex w-full gap-3 " + (isUser ? "justify-end" : "justify-start")}>
      {!isUser ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold text-white shadow-sm">
          AI
        </div>
      ) : null}
      <div
        className={
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm sm:max-w-[75%] " +
          (isUser
            ? "rounded-tr-md bg-gradient-to-br from-indigo-600 to-violet-600 text-white"
            : "rounded-tl-md border border-slate-100 bg-white text-slate-800")
        }
      >
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
        {message.createdAt ? (
          <div className={"mt-1.5 text-[10px] " + (isUser ? "text-indigo-100/80" : "text-slate-400")}>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        ) : null}
      </div>
      {isUser ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
          You
        </div>
      ) : null}
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex w-full justify-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold text-white shadow-sm">
        AI
      </div>
      <div className="max-w-[75%] rounded-2xl rounded-tl-md border border-slate-100 bg-white px-4 py-3 text-sm shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500" />
          <span className="ml-2 text-xs text-slate-500">Thinking…</span>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  onSuggestion,
  hasDocument,
  docName,
}: {
  onSuggestion: (s: string) => void;
  hasDocument: boolean;
  docName: string | null;
}) {
  const suggestions = hasDocument
    ? [
        `Summarize ${docName ?? "this document"} in 5 bullets.`,
        "What are the most important points?",
        "List any action items or next steps.",
        "What is missing or unclear in this document?",
      ]
    : [
        "Explain Retrieval-Augmented Generation simply.",
        "Help me draft a short product update.",
        "What's a good way to organize a knowledge base?",
        "Summarize the steps to deploy a Next.js app.",
      ];

  return (
    <div className="animate-fade-up flex flex-col items-center gap-6 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 0 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          {hasDocument ? "Ask anything about your file" : "Start a conversation"}
        </h2>
        <p className="mt-1 max-w-md text-sm text-slate-600">
          {hasDocument
            ? `Answers will be grounded in ${docName ?? "your document"}. Try a starter prompt below.`
            : "Type a question, drop a file to attach, or pick one of these starters."}
        </p>
      </div>
      <div className="grid w-full max-w-2xl gap-2 sm:grid-cols-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSuggestion(s)}
            className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/50"
          >
            <span className="truncate">{s}</span>
            <span className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500">
              →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ConversationsRail({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  loading,
  drawerOpen,
  onCloseDrawer,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  loading: boolean;
  drawerOpen: boolean;
  onCloseDrawer: () => void;
}) {
  const railClass =
    "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200/70 bg-white/95 shadow-lg backdrop-blur transition-transform duration-200 lg:static lg:w-80 lg:translate-x-0 lg:shadow-none " +
    (drawerOpen ? "translate-x-0" : "-translate-x-full");

  return (
    <>
      {drawerOpen ? (
        <button
          type="button"
          aria-label="Close threads"
          onClick={onCloseDrawer}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-[2px] lg:hidden"
        />
      ) : null}
      <aside className={railClass}>
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <div className="text-sm font-semibold tracking-tight text-slate-900">Threads</div>
          <button
            type="button"
            onClick={onNew}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-indigo-700 hover:to-violet-700"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.4} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New
          </button>
        </div>

        <div className="scrollbar-soft flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-slate-500">
              No conversations yet. Start by asking a question or uploading a file.
            </div>
          ) : (
            <ul className="space-y-1">
              {conversations.map((c) => {
                const active = c.id === activeId;
                return (
                  <li key={c.id} className="group">
                    <div
                      className={
                        "flex items-start gap-2 rounded-lg p-2 transition " +
                        (active
                          ? "bg-indigo-50 ring-1 ring-indigo-100"
                          : "hover:bg-slate-50")
                      }
                    >
                      <button
                        type="button"
                        onClick={() => onSelect(c.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className={"truncate text-sm font-medium " + (active ? "text-indigo-800" : "text-slate-800")}>
                          {c.title}
                        </div>
                        <div className="mt-0.5 truncate text-[11px] text-slate-500">
                          {new Date(c.createdAt).toLocaleDateString()} · {c.messageCount ?? 0} messages
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(c.id)}
                        className="opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                        aria-label="Delete conversation"
                      >
                        <svg className="h-4 w-4 text-slate-400 hover:text-rose-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-slate-100 p-3">
          <Link
            href="/documents"
            className="block rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Manage documents
          </Link>
        </div>
      </aside>
    </>
  );
}

function ChatSkeleton() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen">
      <div className="hidden w-80 flex-col border-r border-slate-200/70 bg-white p-3 lg:flex">
        <div className="mb-3 h-8 w-32 animate-pulse rounded bg-slate-100" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
