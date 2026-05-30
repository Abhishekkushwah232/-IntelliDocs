"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Phase = "checking" | "ready" | "invalid" | "done";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let resolved = false;

    // PASSWORD_RECOVERY fires after the SDK consumes the recovery hash on this page.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        resolved = true;
        setPhase("ready");
      }
    });

    // Some flows already have the session by the time we mount — check directly too.
    supabase.auth.getSession().then(({ data }) => {
      if (resolved) return;
      if (data.session) {
        setPhase("ready");
      } else {
        // Give the SDK a brief moment to parse the URL hash, then conclude.
        setTimeout(() => {
          if (!resolved) setPhase("invalid");
        }, 800);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setPhase("done");
    await supabase.auth.signOut();
    setTimeout(() => router.replace("/login?reset=1"), 1200);
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
                Choose a new password
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Set the new password for your account.
              </p>
            </div>

            {phase === "checking" ? (
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200/80 bg-white/95 p-8 shadow-xl shadow-indigo-500/5">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" aria-hidden />
                <p className="text-sm font-medium text-slate-600">Verifying reset link…</p>
              </div>
            ) : null}

            {phase === "invalid" ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">
                <p className="font-semibold">This reset link is invalid or has expired.</p>
                <p className="mt-2">
                  Request a new one from the{" "}
                  <Link className="font-semibold text-red-800 underline hover:text-red-900" href="/forgot-password">
                    forgot password
                  </Link>{" "}
                  page.
                </p>
              </div>
            ) : null}

            {phase === "done" ? (
              <div className="flex items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-sm text-emerald-800">
                <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <span>Password updated. Redirecting you to sign in…</span>
              </div>
            ) : null}

            {phase === "ready" ? (
              <form
                onSubmit={onSubmit}
                className="flex w-full flex-col gap-5 rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-indigo-500/5 backdrop-blur sm:p-7"
              >
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    New password
                  </span>
                  <div className="relative">
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-20 text-sm transition focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-2 my-auto h-7 rounded-md px-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Confirm password
                  </span>
                  <input
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    type={showPassword ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter your new password"
                    required
                    minLength={6}
                    autoComplete="new-password"
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

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative mt-1 inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-xl hover:shadow-indigo-500/40 disabled:cursor-wait disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Updating…
                    </>
                  ) : (
                    <>
                      Update password
                      <span className="transition group-hover:translate-x-0.5" aria-hidden>→</span>
                    </>
                  )}
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
