import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-indigo-50/40 to-white">
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
      <div aria-hidden className="bg-radial-fade pointer-events-none absolute inset-0" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/30">
            ID
          </div>
          <div className="text-base font-semibold tracking-tight text-slate-900">
            IntelliDocs
          </div>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-slate-600 md:flex">
          <a href="#features" className="hover:text-slate-900">Features</a>
          <a href="#how" className="hover:text-slate-900">How it works</a>
          <a href="#stack" className="hover:text-slate-900">Stack</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
          >
            Get started
            <span aria-hidden>→</span>
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-6 pb-16 pt-10 text-center md:pt-20">
        <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/70 px-3 py-1 text-xs font-medium text-indigo-700 shadow-sm backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600" />
          </span>
          New · Document-grounded answers powered by Gemini
        </div>

        <h1 className="animate-fade-up mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
          Chat with your documents.
          <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
            Cite the source. Save the thread.
          </span>
        </h1>

        <p className="animate-fade-up mt-5 max-w-2xl text-base text-slate-600 sm:text-lg">
          Upload a PDF or text file and ask anything. IntelliDocs grounds answers in
          your file, keeps every conversation private to your account, and saves
          your full history for later.
        </p>

        <div className="animate-fade-up mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-xl hover:shadow-indigo-500/40 sm:w-auto"
          >
            Create your free workspace
            <span aria-hidden>→</span>
          </Link>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:bg-white sm:w-auto"
          >
            I already have an account
          </Link>
        </div>

        <div className="animate-fade-up mt-4 text-xs text-slate-500">
          No credit card required · Email/password auth · Your data stays in your workspace
        </div>

        <div className="animate-fade-up relative mt-14 w-full max-w-4xl">
          <div className="absolute -inset-6 -z-10 rounded-[40px] bg-gradient-to-br from-indigo-200/60 via-violet-200/40 to-fuchsia-200/40 blur-3xl" />
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-indigo-500/10">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
              <span className="h-3 w-3 rounded-full bg-rose-300" />
              <span className="h-3 w-3 rounded-full bg-amber-300" />
              <span className="h-3 w-3 rounded-full bg-emerald-300" />
              <div className="ml-3 truncate text-xs text-slate-500">
                intellidocs.app/chat
              </div>
            </div>
            <div className="grid gap-0 md:grid-cols-[200px_1fr]">
              <div className="hidden border-r border-slate-100 bg-slate-50/60 p-3 text-left text-xs md:block">
                <div className="rounded-lg bg-white px-3 py-2 font-medium text-indigo-700 shadow-sm ring-1 ring-indigo-100">
                  + New chat
                </div>
                <div className="mt-3 space-y-1 text-slate-500">
                  <div className="truncate rounded-md px-3 py-2 hover:bg-white">Q3 financial report</div>
                  <div className="truncate rounded-md bg-white px-3 py-2 text-slate-800 ring-1 ring-slate-100">Onboarding handbook</div>
                  <div className="truncate rounded-md px-3 py-2 hover:bg-white">Research draft v2</div>
                </div>
              </div>
              <div className="space-y-3 p-5 text-left text-sm">
                <div className="ml-auto inline-block max-w-md rounded-2xl bg-indigo-600 px-4 py-3 text-white shadow-sm">
                  Summarize section 2 of the handbook in 5 bullets.
                </div>
                <div className="mr-auto max-w-md rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-slate-800">
                  <div className="mb-1 text-xs font-medium text-slate-500">Assistant · grounded in handbook.pdf</div>
                  <ul className="list-inside list-disc space-y-1">
                    <li>Onboarding starts on day one with workspace setup.</li>
                    <li>New hires meet their manager within 24 hours.</li>
                    <li>Week-one goal is to ship one small change.</li>
                    <li>Buddy system pairs you with a peer for 30 days.</li>
                    <li>Feedback loops are weekly, not quarterly.</li>
                  </ul>
                </div>
                <div className="mr-auto inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
                  Thinking…
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-20">
        <div className="grid gap-5 md:grid-cols-3">
          <FeatureCard
            title="File-grounded answers"
            body="Attach a PDF or .txt and the assistant answers from the file. Switch context per question."
            accent="from-indigo-500 to-violet-500"
            icon={IconFile}
          />
          <FeatureCard
            title="Threads that remember"
            body="Every Q&A is saved per user. Resume from history and the assistant keeps full context."
            accent="from-violet-500 to-fuchsia-500"
            icon={IconHistory}
          />
          <FeatureCard
            title="Private by design"
            body="Supabase Auth + Postgres row scoping. Your uploads and chats are scoped to your account."
            accent="from-emerald-500 to-teal-500"
            icon={IconShield}
          />
        </div>
      </section>

      <section id="how" className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-24">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-12">
          <div className="mb-8 max-w-2xl">
            <div className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              How it works
            </div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              From upload to grounded answer in three steps.
            </h2>
          </div>
          <ol className="grid gap-6 md:grid-cols-3">
            <Step n={1} title="Sign in" body="Email + password via Supabase. Free, no credit card." />
            <Step n={2} title="Upload a file" body=".txt or .pdf. Text is extracted and stored privately for your workspace." />
            <Step n={3} title="Ask anything" body="Pick the document and chat. Switch context, resume from history, repeat." />
          </ol>
        </div>
      </section>

      <section id="stack" className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-24">
        <div className="grid gap-6 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 to-indigo-950 p-8 text-white shadow-xl md:grid-cols-2 md:p-12">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
              Built on
            </div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              A modern, no-magic stack.
            </h2>
            <p className="mt-3 max-w-md text-sm text-indigo-100/90">
              Next.js App Router, React 19, TypeScript end-to-end, Drizzle ORM
              against Postgres, Supabase Auth, and Gemini for generation.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-3 self-center text-sm">
            {[
              "Next.js 16",
              "React 19",
              "TypeScript",
              "Tailwind CSS 4",
              "Supabase Auth",
              "Drizzle ORM",
              "Postgres",
              "Gemini",
            ].map((label) => (
              <li
                key={label}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center font-medium backdrop-blur"
              >
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="relative z-10 border-t border-slate-200/70 bg-white/60 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-slate-500 sm:flex-row">
          <div>© {new Date().getFullYear()} IntelliDocs · A focused demo workspace.</div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-slate-700">Sign in</Link>
            <Link href="/register" className="hover:text-slate-700">Create account</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  title,
  body,
  accent,
  icon: Icon,
}: {
  title: string;
  body: string;
  accent: string;
  icon: React.FC<{ className?: string }>;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-sm`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="relative rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white shadow-sm">
        {n}
      </div>
      <div className="text-base font-semibold text-slate-900">{title}</div>
      <p className="mt-1.5 text-sm text-slate-600">{body}</p>
    </li>
  );
}

function IconFile({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

function IconHistory({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 4.97-3.582 9-8.5 9.5C7.6 21 4 17.5 4 13V6.5L12 3l8 3.5V12Z" />
    </svg>
  );
}
