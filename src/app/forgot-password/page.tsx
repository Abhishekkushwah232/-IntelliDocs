"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/reset-password`
        : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setNotice(
      "If an account exists for that email, a reset link has been sent. Check your inbox.",
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-indigo-50/40 to-white">
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-50" />
      <div aria-hidden className="bg-radial-fade pointer-events-none absolute inset-0" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6">
        <Link href="/" className="inline-flex w-fit items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/30">
            ID
          </div>
          <div className="text-base font-semibold tracking-tight text-slate-900">
            IntelliDocs
          </div>
        </Link>

        <div className="grid flex-1 items-center gap-12 py-10">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Reset your password
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            <form
              onSubmit={onSubmit}
              className="flex w-full flex-col gap-5 rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-indigo-500/5 backdrop-blur sm:p-7"
            >
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Email
                </span>
                <input
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                />
              </label>

              {error ? (
                <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008Zm9.75-1.5a9.75 9.75 0 1 1-19.5 0 9.75 9.75 0 0 1 19.5 0Z" />
                  </svg>
                  <span>{error}</span>
                </div>
              ) : null}

              {notice ? (
                <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
                  <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <span>{notice}</span>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="group relative mt-1 inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-xl hover:shadow-indigo-500/40 disabled:cursor-wait disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Sending…
                  </>
                ) : (
                  <>
                    Send reset link
                    <span className="transition group-hover:translate-x-0.5" aria-hidden>→</span>
                  </>
                )}
              </button>

              <div className="text-center text-sm text-slate-600">
                Remembered it?{" "}
                <Link className="font-semibold text-indigo-600 hover:text-indigo-700" href="/login">
                  Back to sign in
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
