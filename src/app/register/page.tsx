import { AuthForm } from "@/components/AuthForm";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-white p-6">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Create your account</h1>
          <p className="mt-1 text-sm text-zinc-600">
            This demo stores your chat history and uploaded file text in Postgres via Drizzle.
          </p>
        </div>
        <AuthForm mode="register" />
      </div>
    </main>
  );
}

