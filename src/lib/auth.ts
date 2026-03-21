import { getSupabaseServerClient } from "./supabaseServer";

function extractBearerToken(authorizationHeader: string | null) {
  if (!authorizationHeader) return null;
  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export async function requireUser(req: Request) {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) {
    return { ok: false as const, status: 401, error: "Missing Bearer token." };
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { ok: false as const, status: 401, error: "Invalid token." };
  }

  return {
    ok: true as const,
    status: 200,
    user: {
      id: data.user.id,
      email: data.user.email ?? "",
    },
  };
}

