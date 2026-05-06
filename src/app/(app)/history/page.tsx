"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await refresh(mounted, setConversations);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function deleteOne(id: string) {
    const ok = window.confirm("Delete this conversation? This cannot be undone.");
    if (!ok) return;
    setBusyId(id);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      const res = await fetch(`/api/conversations/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
      }
    } finally {
      setBusyId(null);
    }
  }

  const q = filter.trim().toLowerCase();
  const filtered = q
    ? conversations.filter((c) => c.title.toLowerCase().includes(q))
    : conversations;

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  const totalMessages = conversations.reduce((s, c) => s + (c.messageCount ?? 0), 0);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              Chat history
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {loading
                ? "Loading threads…"
                : `${conversations.length} conversation${conversations.length === 1 ? "" : "s"} · ${totalMessages} total messages`}
            </p>
          </div>
          <Link
            href="/chat"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:shadow-lg hover:shadow-indigo-500/30"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New chat
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="relative max-w-md">
            <svg
              className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search conversations…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-9 pr-4 text-sm transition focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-white shadow-sm" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <div className="text-base font-semibold text-slate-800">
              {conversations.length === 0 ? "No history yet" : "No matches"}
            </div>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600">
              {conversations.length === 0 ? (
                <>
                  Start your first thread.{" "}
                  <Link className="font-medium text-indigo-600 hover:underline" href="/chat">
                    Open chat
                  </Link>
                  .
                </>
              ) : (
                "Try a different search query."
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map((bucket) => (
              <section key={bucket.label} className="space-y-2">
                <div className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {bucket.label}
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  <ul className="divide-y divide-slate-100">
                    {bucket.items.map((c) => (
                      <li key={c.id} className="group">
                        <div className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50 sm:px-6">
                          <Link
                            href={`/chat?conversationId=${encodeURIComponent(c.id)}`}
                            className="min-w-0 flex-1"
                          >
                            <div className="truncate font-medium text-slate-900 group-hover:text-indigo-700">
                              {c.title}
                            </div>
                            <div className="mt-0.5 text-xs text-slate-500">
                              Started {new Date(c.createdAt).toLocaleString()}
                            </div>
                          </Link>
                          <span className="hidden shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 sm:inline-flex">
                            {c.messageCount ?? 0} msg{(c.messageCount ?? 0) === 1 ? "" : "s"}
                          </span>
                          <Link
                            href={`/chat?conversationId=${encodeURIComponent(c.id)}`}
                            className="hidden text-sm font-medium text-indigo-600 sm:inline-block"
                          >
                            Continue →
                          </Link>
                          <button
                            type="button"
                            onClick={() => deleteOne(c.id)}
                            disabled={busyId === c.id}
                            aria-label="Delete conversation"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

async function refresh(
  mounted: boolean,
  setConversations: (c: Conversation[]) => void,
) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return;
  const res = await fetch("/api/conversations", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return;
  const json = await res.json();
  if (mounted) setConversations(json.conversations ?? []);
}

function groupByDate(items: Conversation[]) {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOfWeek = startOfToday - 6 * 24 * 60 * 60 * 1000;
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getTime();

  const buckets: Record<string, Conversation[]> = {
    Today: [],
    Yesterday: [],
    "This week": [],
    "This month": [],
    Earlier: [],
  };

  for (const c of items) {
    const t = new Date(c.createdAt).getTime();
    if (t >= startOfToday) buckets.Today.push(c);
    else if (t >= startOfYesterday) buckets.Yesterday.push(c);
    else if (t >= startOfWeek) buckets["This week"].push(c);
    else if (t >= startOfMonth) buckets["This month"].push(c);
    else buckets.Earlier.push(c);
  }

  return Object.entries(buckets)
    .filter(([, arr]) => arr.length > 0)
    .map(([label, arr]) => ({ label, items: arr }));
}
