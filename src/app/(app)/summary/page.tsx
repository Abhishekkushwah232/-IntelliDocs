"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Stats = {
  conversations: number;
  documents: number;
  messages: number;
  userMessages: number;
  assistantMessages: number;
};

type Conversation = { id: string; title: string; createdAt: string; messageCount?: number };

export default function SummaryPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;
        const [statsRes, convRes] = await Promise.all([
          fetch("/api/stats", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/conversations", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (!mounted) return;
        if (statsRes.ok) setStats(await statsRes.json());
        if (convRes.ok) {
          const j = await convRes.json();
          setConversations(j.conversations ?? []);
        }
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

  const narrative = useMemo(() => {
    if (!stats) return "";
    const parts: string[] = [];
    parts.push(
      `You have ${stats.documents} document${stats.documents === 1 ? "" : "s"} uploaded and ${stats.conversations} active conversation${stats.conversations === 1 ? "" : "s"}.`,
    );
    parts.push(
      `Across those threads you've sent ${stats.userMessages} message${stats.userMessages === 1 ? "" : "s"} and received ${stats.assistantMessages} assistant response${stats.assistantMessages === 1 ? "" : "s"}.`,
    );
    if (stats.documents === 0) {
      parts.push("Upload a file on the Documents page to unlock file-grounded answers in Chat.");
    } else if (stats.conversations === 0) {
      parts.push("Open Chat to start your first thread.");
    } else {
      parts.push("Use Chat history anytime to resume work on an existing topic.");
    }
    return parts.join(" ");
  }, [stats]);

  const responseRate =
    stats && stats.userMessages > 0
      ? Math.round((stats.assistantMessages / stats.userMessages) * 100)
      : 0;

  const messagesPerConv =
    stats && stats.conversations > 0
      ? Math.round(stats.messages / stats.conversations)
      : 0;

  const topChats = [...conversations]
    .sort((a, b) => (b.messageCount ?? 0) - (a.messageCount ?? 0))
    .slice(0, 5);

  const maxBar = Math.max(
    stats?.conversations ?? 0,
    stats?.documents ?? 0,
    stats?.userMessages ?? 0,
    stats?.assistantMessages ?? 0,
    1,
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            Activity summary
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            High-level view of how you&apos;re using IntelliDocs.
          </p>
        </div>

        {loading || !stats ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-44 animate-pulse rounded-2xl bg-slate-200/60" />
            <div className="h-44 animate-pulse rounded-2xl bg-slate-200/60" />
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-3">
              <KpiCard label="Total messages" value={stats.messages} caption="across all threads" />
              <KpiCard label="Reply rate" value={`${responseRate}%`} caption="assistant per user prompt" />
              <KpiCard label="Avg per thread" value={messagesPerConv} caption="messages per conversation" />
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                      Volume overview
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-500">Relative scale of each metric</p>
                  </div>
                </div>
                <ul className="mt-6 space-y-4">
                  <BarRow label="Conversations" value={stats.conversations} max={maxBar} tone="from-violet-500 to-indigo-500" />
                  <BarRow label="Your messages" value={stats.userMessages} max={maxBar} tone="from-sky-500 to-blue-500" />
                  <BarRow label="AI replies" value={stats.assistantMessages} max={maxBar} tone="from-emerald-500 to-teal-500" />
                  <BarRow label="Documents" value={stats.documents} max={maxBar} tone="from-amber-500 to-orange-500" />
                </ul>
              </div>

              <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-sm">
                <h2 className="text-lg font-semibold">Narrative</h2>
                <p className="mt-3 text-sm leading-relaxed text-indigo-50/95">{narrative}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link
                    href="/dashboard"
                    className="rounded-xl bg-white/10 px-3 py-2 text-sm font-medium text-white ring-1 ring-white/15 backdrop-blur transition hover:bg-white/20"
                  >
                    Open dashboard
                  </Link>
                  <Link
                    href="/history"
                    className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
                  >
                    Browse history →
                  </Link>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                    Most active threads
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">Top 5 by message count</p>
                </div>
                <Link href="/history" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                  All history
                </Link>
              </div>
              {topChats.length === 0 ? (
                <p className="mt-6 text-sm text-slate-600">No conversations to show.</p>
              ) : (
                <ol className="mt-4 space-y-2">
                  {topChats.map((c, i) => (
                    <li key={c.id}>
                      <Link
                        href={`/chat?conversationId=${encodeURIComponent(c.id)}`}
                        className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-indigo-200 hover:bg-indigo-50/40"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-semibold text-white shadow-sm">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium text-slate-900">{c.title}</div>
                          <div className="text-xs text-slate-500">
                            {c.messageCount ?? 0} message{(c.messageCount ?? 0) === 1 ? "" : "s"} · {new Date(c.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <span className="shrink-0 self-center text-slate-400">→</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  caption,
}: {
  label: string;
  value: number | string;
  caption: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{caption}</div>
    </div>
  );
}

function BarRow({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: string;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <li>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="tabular-nums text-slate-500">{value}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${tone} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </li>
  );
}
