"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export function SessionGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        if (!data.session) router.replace("/login");
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        router.replace("/login");
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--app-canvas)] p-8">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600"
          aria-hidden
        />
        <p className="text-sm font-medium text-slate-600">Checking your session…</p>
      </div>
    );
  }

  return <>{children}</>;
}

