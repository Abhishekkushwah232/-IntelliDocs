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

  const maxBar = Math.max(
    stats?.conversations ?? 0,
    stats?.documents ?? 0,
    stats?.userMessages ?? 0,
    stats?.assistantMessages ?? 0,
    1,
  );

  const topChats = conversations.slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">Activity summary</h1>
        <p className="mt-1 text-sm text-slate-600">
          High-level view of how you&apos;re using IntelliDocs in this workspace.
        </p>
      </div>

      {loading || !stats ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-40 animate-pulse rounded-2xl bg-slate-200/60" />
          <div className="h-40 animate-pulse rounded-2xl bg-slate-200/60" />
        </div>
      ) : (
        <>
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Volume overview</h2>
              <p className="mt-1 text-sm text-slate-500">Relative scale of each metric</p>
              <ul className="mt-6 space-y-4">
                <BarRow label="Conversations" value={stats.conversations} max={maxBar} tone="bg-violet-500" />
                <BarRow label="Your messages" value={stats.userMessages} max={maxBar} tone="bg-sky-500" />
                <BarRow label="AI replies" value={stats.assistantMessages} max={maxBar} tone="bg-emerald-500" />
                <BarRow label="Documents" value={stats.documents} max={maxBar} tone="bg-amber-500" />
              </ul>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/90 to-white p-6 shadow-sm ring-1 ring-indigo-100/60">
              <h2 className="text-lg font-semibold text-slate-900">Narrative</h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-700">{narrative}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link
                  href="/dashboard"
                  className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-indigo-700 shadow-sm ring-1 ring-indigo-200 transition hover:bg-indigo-50"
                >
                  Dashboard
                </Link>
                <Link
                  href="/history"
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
                >
                  Browse history
                </Link>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Recent threads</h2>
            <p className="mt-1 text-sm text-slate-500">Newest conversations by start time</p>
            {topChats.length === 0 ? (
              <p className="mt-6 text-sm text-slate-600">No conversations to show.</p>
            ) : (
              <ol className="mt-4 space-y-3">
                {topChats.map((c, i) => (
                  <li key={c.id}>
                    <Link
                      href={`/chat?conversationId=${encodeURIComponent(c.id)}`}
                      className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-indigo-200 hover:bg-indigo-50/40"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-600">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-slate-900">{c.title}</div>
                        <div className="text-xs text-slate-500">
                          {c.messageCount ?? 0} messages · {new Date(c.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      )}
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
          className={`h-full rounded-full ${tone} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </li>
  );
}
