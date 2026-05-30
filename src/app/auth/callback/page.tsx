"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Phase = "checking" | "error";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let resolved = false;

    function finish() {
      if (resolved) return;
      resolved = true;
      router.replace("/dashboard");
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) finish();
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setErrorMessage(error.message);
        setPhase("error");
        return;
      }
      if (data.session) {
        finish();
        return;
      }
      // Give the SDK time to consume the URL (hash or ?code=) and emit SIGNED_IN.
      setTimeout(() => {
        if (resolved) return;
        setErrorMessage(
          "This sign-in link is invalid or has already been used. Request a new one and try again.",
        );
        setPhase("error");
      }, 2500);
    });

    return () => sub.subscription.unsubscribe();
  }, [router]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-indigo-50/40 to-white">
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-50" />
      <div aria-hidden className="bg-radial-fade pointer-events-none absolute inset-0" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 py-6">
        {phase === "checking" ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200/80 bg-white/95 p-10 shadow-xl shadow-indigo-500/5">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" aria-hidden />
            <p className="text-sm font-medium text-slate-600">Signing you in…</p>
          </div>
        ) : (
          <div className="w-full rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">
            <p className="font-semibold">Couldn&apos;t complete sign-in.</p>
            <p className="mt-2">{errorMessage}</p>
            <Link
              href="/login"
              className="mt-4 inline-flex items-center gap-1 font-semibold text-red-800 underline hover:text-red-900"
            >
              Back to sign in →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
