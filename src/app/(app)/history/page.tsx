"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  messageCount?: number;
};

export default function HistoryPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;
        const res = await fetch("/api/conversations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        if (mounted) setConversations(json.conversations ?? []);
      } catch {
        /* ignore */
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const q = filter.trim().toLowerCase();
  const filtered = q
    ? conversations.filter((c) => c.title.toLowerCase().includes(q))
    : conversations;

  const totalMessages = conversations.reduce((s, c) => s + (c.messageCount ?? 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">Chat history</h1>
          <p className="mt-1 text-sm text-slate-600">
            {loading
              ? "Loading threads…"
              : `${conversations.length} conversation${conversations.length === 1 ? "" : "s"} · ${totalMessages} total messages`}
          </p>
        </div>
        <Link
          href="/chat"
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
        >
          New chat
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <label className="block text-sm font-medium text-slate-700">
          Filter by title
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search conversations…"
            className="mt-2 w-full max-w-md rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </label>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-600">
            {conversations.length === 0 ? (
              <>
                No history yet.{" "}
                <Link className="font-medium text-indigo-600 hover:underline" href="/chat">
                  Start chatting
                </Link>
                .
              </>
            ) : (
              "No matches for your search."
            )}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/chat?conversationId=${encodeURIComponent(c.id)}`}
                  className="group flex flex-col gap-2 px-6 py-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-slate-900 group-hover:text-indigo-700">{c.title}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      Started {new Date(c.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {c.messageCount ?? 0} messages
                    </span>
                    <span className="text-indigo-600 transition group-hover:translate-x-0.5">Continue →</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
