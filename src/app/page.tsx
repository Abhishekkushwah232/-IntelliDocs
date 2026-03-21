import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
      <div className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6">
        <h1 className="text-2xl font-semibold">IntelliDocs Demo</h1>
        <p className="text-sm text-zinc-600">
          Supabase Auth + Drizzle-managed Postgres tables in one Next.js project.
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/login"
            className="rounded-lg bg-black px-4 py-2 text-center text-sm font-medium text-white"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-center text-sm font-medium"
          >
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
