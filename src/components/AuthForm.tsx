"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Mode = "login" | "register";

function toFriendlyAuthError(message: string, mode: Mode) {
  const m = message.toLowerCase();

  if (mode === "register") {
    if (
      m.includes("already registered")
      || m.includes("already exists")
      || m.includes("user already")
    ) {
      return "This email is already registered. Please sign in instead.";
    }
    if (m.includes("password should be at least")) {
      return "Password is too short. Use at least 6 characters.";
    }
  }

  if (mode === "login") {
    if (m.includes("invalid login credentials")) {
      const verificationHint =
        typeof window !== "undefined" && window.sessionStorage.getItem("pending_email_verification") === "1";
      if (verificationHint) {
        return "Invalid login credentials. If you just signed up, verify your email first, then sign in.";
      }
      return "Invalid login credentials. Please check your email and password.";
    }
    if (m.includes("email not confirmed")) {
      return "Please verify your email first, then sign in.";
    }
  }

  return message;
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode !== "login" || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("verified") === "1") {
      window.sessionStorage.removeItem("pending_email_verification");
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
          setError(toFriendlyAuthError(error.message, mode));
        } else if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          setError("This email is already registered. Please sign in instead.");
        } else if (data.session) {
          if (typeof window !== "undefined") {
            window.sessionStorage.removeItem("pending_email_verification");
          }
          router.replace("/dashboard");
        } else {
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem("pending_email_verification", "1");
          }
          setNotice(
            "Account created. Check your email for the verification link, then return to sign in.",
          );
          router.replace("/login");
        }
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(toFriendlyAuthError(error.message, mode));
      else router.replace("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const ctaLabel = mode === "login" ? "Sign in" : "Create account";

  return (
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

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Password
        </span>
        <div className="relative">
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-20 text-sm transition focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "register" ? "At least 6 characters" : "Your password"}
            required
            minLength={mode === "register" ? 6 : undefined}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
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
            Please wait…
          </>
        ) : (
          <>
            {ctaLabel}
            <span className="transition group-hover:translate-x-0.5" aria-hidden>→</span>
          </>
        )}
      </button>

      <div className="text-center text-sm text-slate-600">
        {mode === "login" ? (
          <>
            Don&apos;t have an account?{" "}
            <Link className="font-semibold text-indigo-600 hover:text-indigo-700" href="/register">
              Create one
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link className="font-semibold text-indigo-600 hover:text-indigo-700" href="/login">
              Sign in
            </Link>
          </>
        )}
      </div>
    </form>
  );
}
