import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

export default function RegisterPage() {
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

        <div className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-2">
          <div className="hidden flex-col gap-6 lg:flex">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
              Create your free workspace.
            </h1>
            <p className="max-w-md text-base text-slate-600">
              Email and password is all it takes. Spin up a private workspace
              for your documents and conversations.
            </p>
            <ul className="space-y-3 text-sm text-slate-600">
              {[
                "Upload .txt or .pdf and chat with the file",
                "Every thread is saved to your account",
                "Simple, private, no credit card required",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="mb-6 text-center lg:hidden">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Create your account
              </h1>
              <p className="mt-1 text-sm text-slate-600">Spin up your workspace</p>
            </div>
            <div className="hidden lg:mb-5 lg:block">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                Create account
              </h2>
              <p className="mt-1 text-sm text-slate-600">Free, no credit card</p>
            </div>
            <AuthForm mode="register" />
          </div>
        </div>
      </div>
    </main>
  );
}
