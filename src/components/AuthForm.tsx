"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Mode = "login" | "register";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode !== "login" || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("verified") === "1") {
      setNotice("Email verified. You can sign in now.");
    }
  }, [mode]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      if (mode === "register") {
        // Avoid carrying over an existing session when creating a new account.
        await supabase.auth.signOut();

        const emailRedirectTo =
          typeof window !== "undefined"
            ? `${window.location.origin}/login?verified=1`
            : undefined;

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: emailRedirectTo ? { emailRedirectTo } : undefined,
        });
        if (error) {
          setError(error.message);
        } else if (data.session) {
          // Email-confirmation disabled: signed in immediately.
          router.replace("/dashboard");
        } else {
          // Email-confirmation enabled: keep user on auth flow.
          setNotice(
            "Account created. Check your email for verification, then sign in.",
          );
          router.replace("/login");
        }
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else router.replace("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <h1 className="text-xl font-semibold">
        {mode === "login" ? "Sign in" : "Create account"}
      </h1>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-zinc-600">Email</span>
        <input
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-zinc-600">Password</span>
        <input
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete={mode === "register" ? "new-password" : "current-password"}
        />
      </label>

      {error ? (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {notice}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60 hover:bg-zinc-800"
      >
        {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Sign up"}
      </button>

      <div className="pt-1 text-center text-sm text-zinc-600">
        {mode === "login" ? (
          <>
            Don&apos;t have an account?{" "}
            <Link className="font-medium text-black hover:underline" href="/register">
              Create account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link className="font-medium text-black hover:underline" href="/login">
              Sign in
            </Link>
          </>
        )}
      </div>
    </form>
  );
}

