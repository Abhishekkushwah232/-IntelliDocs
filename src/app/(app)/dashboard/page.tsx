"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Profile = { id: string; email: string };
type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  messageCount?: number;
};

type Stats = {
  conversations: number;
  documents: number;
  messages: number;
  userMessages: number;
  assistantMessages: number;
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;

        const [meRes, convRes, statsRes] = await Promise.all([
          fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/conversations", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/stats", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (!mounted) return;

        if (meRes.ok) {
          const json = await meRes.json();
          setProfile(json.user);
        }

        if (convRes.ok) {
          const json = await convRes.json();
          setConversations(json.conversations ?? []);
        }

        if (statsRes.ok) {
          const json = await statsRes.json();
          setStats(json);
        }
      } catch {
        /* demo UI */
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const recent = conversations.slice(0, 4);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {profile?.email ?? (loading ? "Loading…" : "Your workspace overview")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/chat"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
          >
            New chat
          </Link>
          <Link
            href="/documents"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50"
          >
            Upload document
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl bg-slate-200/60"
            />
          ))}
        </div>
      ) : stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Conversations"
            value={stats.conversations}
            hint="Distinct chat threads"
            accent="from-violet-500 to-indigo-600"
          />
          <StatCard
            label="Messages sent"
            value={stats.userMessages}
            hint="Your questions & prompts"
            accent="from-sky-500 to-blue-600"
          />
          <StatCard
            label="AI replies"
            value={stats.assistantMessages}
            hint="Assistant responses"
            accent="from-emerald-500 to-teal-600"
          />
          <StatCard
            label="Documents uploaded"
            value={stats.documents}
            hint="Files available for context"
            accent="from-amber-500 to-orange-600"
          />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Recent conversations</h2>
            <Link href="/history" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
              No chats yet. Start a{" "}
              <Link className="font-medium text-indigo-600 hover:underline" href="/chat">
                new conversation
              </Link>{" "}
              or upload a document first.
            </p>
          ) : (
            <ul className="space-y-2">
              {recent.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/chat?conversationId=${encodeURIComponent(c.id)}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-3 transition hover:border-slate-200 hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium text-slate-900 group-hover:text-indigo-700">
                        {c.title}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(c.createdAt).toLocaleString()} · {c.messageCount ?? 0} messages
                      </div>
                    </div>
                    <span className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-600">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-gradient-to-b from-indigo-50/80 to-white p-6 shadow-sm ring-1 ring-indigo-100/50">
          <h2 className="text-lg font-semibold text-slate-900">Quick tips</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li className="flex gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                1
              </span>
              Upload a PDF or TXT under Documents, then attach it in Chat for grounded answers.
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                2
              </span>
              Use History to jump back into any thread with full context preserved.
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                3
              </span>
              Open Summary for a snapshot of your overall activity and totals.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: number;
  hint: string;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div
        className={`pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br opacity-20 ${accent}`}
        aria-hidden
      />
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">{value}</div>
      <p className="mt-2 text-xs text-slate-500">{hint}</p>
    </div>
  );
}
