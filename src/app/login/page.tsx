import { AuthForm } from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-white p-6">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">IntelliDocs Demo</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Sign in to manage chat history and ask questions from your uploaded files.
          </p>
        </div>
        <AuthForm mode="login" />
      </div>
    </main>
  );
}

