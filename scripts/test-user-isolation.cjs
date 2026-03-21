/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const userA = {
  email: process.env.TEST_USER_A_EMAIL,
  password: process.env.TEST_USER_A_PASSWORD,
};
const userB = {
  email: process.env.TEST_USER_B_EMAIL,
  password: process.env.TEST_USER_B_PASSWORD,
};

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

function requireEnv(name, value) {
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
}

async function login(email, password) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session?.access_token) {
    throw new Error(`Login failed for ${email}: ${error?.message || "no session token"}`);
  }
  return data.session.access_token;
}

async function apiFetch(path, token, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return { response, body };
}

async function createConversation(token, title) {
  const { response, body } = await apiFetch("/api/conversations", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!response.ok || !body?.conversationId) {
    throw new Error(`Create conversation failed: ${response.status} ${JSON.stringify(body)}`);
  }
  return body.conversationId;
}

async function sendChat(token, payload) {
  const { response, body } = await apiFetch("/api/chat", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Chat failed: ${response.status} ${JSON.stringify(body)}`);
  }
  return body;
}

async function uploadTxtDocument(token, filename, content) {
  const formData = new FormData();
  const blob = new Blob([content], { type: "text/plain" });
  formData.append("file", blob, filename);

  const { response, body } = await apiFetch("/api/documents/upload", token, {
    method: "POST",
    body: formData,
  });
  if (!response.ok || !body?.documentId) {
    throw new Error(`Upload failed: ${response.status} ${JSON.stringify(body)}`);
  }
  return body.documentId;
}

async function listConversationIds(token) {
  const { response, body } = await apiFetch("/api/conversations", token);
  if (!response.ok) throw new Error(`List conversations failed: ${response.status}`);
  return new Set((body?.conversations || []).map((c) => c.id));
}

async function listDocumentIds(token) {
  const { response, body } = await apiFetch("/api/documents", token);
  if (!response.ok) throw new Error(`List documents failed: ${response.status}`);
  return new Set((body?.documents || []).map((d) => d.id));
}

async function canReadConversationMessages(token, conversationId) {
  const { response } = await apiFetch(
    `/api/conversations/messages?conversationId=${encodeURIComponent(conversationId)}`,
    token,
  );
  return response.status;
}

async function main() {
  requireEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl);
  requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", supabaseAnonKey);
  requireEnv("TEST_USER_A_EMAIL", userA.email);
  requireEnv("TEST_USER_A_PASSWORD", userA.password);
  requireEnv("TEST_USER_B_EMAIL", userB.email);
  requireEnv("TEST_USER_B_PASSWORD", userB.password);

  console.log(`Running isolation test against ${baseUrl}`);
  console.log("Logging in users...");
  const tokenA = await login(userA.email, userA.password);
  const tokenB = await login(userB.email, userB.password);
  pass("Both test users authenticated");

  const stamp = Date.now();

  const aConversationId = await createConversation(tokenA, `A isolation ${stamp}`);
  await sendChat(tokenA, {
    conversationId: aConversationId,
    question: `Hello from A ${stamp}`,
  });
  const aDocumentId = await uploadTxtDocument(
    tokenA,
    `a-isolation-${stamp}.txt`,
    `secret-from-a-${stamp}`,
  );
  pass("User A created conversation and document");

  const bConversationIdsAfterA = await listConversationIds(tokenB);
  const bDocumentIdsAfterA = await listDocumentIds(tokenB);
  if (bConversationIdsAfterA.has(aConversationId)) {
    fail("User B can see User A conversation");
  } else {
    pass("User B cannot see User A conversation in list");
  }
  if (bDocumentIdsAfterA.has(aDocumentId)) {
    fail("User B can see User A document");
  } else {
    pass("User B cannot see User A document in list");
  }

  const bReadAStatus = await canReadConversationMessages(tokenB, aConversationId);
  if (bReadAStatus === 403 || bReadAStatus === 404) {
    pass("User B blocked from reading User A messages");
  } else {
    fail(`User B unexpected status reading User A messages: ${bReadAStatus}`);
  }

  const bChatUsingAConversation = await sendChat(tokenB, {
    conversationId: aConversationId,
    question: `B attempting cross-conversation ${stamp}`,
  });
  if (bChatUsingAConversation?.conversationId === aConversationId) {
    fail("User B could post into User A conversation");
  } else {
    pass("User B chat call does not reuse User A conversation");
  }

  const bConversationId = await createConversation(tokenB, `B isolation ${stamp}`);
  await sendChat(tokenB, {
    conversationId: bConversationId,
    question: `Hello from B ${stamp}`,
  });
  const bDocumentId = await uploadTxtDocument(
    tokenB,
    `b-isolation-${stamp}.txt`,
    `secret-from-b-${stamp}`,
  );
  pass("User B created conversation and document");

  const aConversationIdsAfterB = await listConversationIds(tokenA);
  const aDocumentIdsAfterB = await listDocumentIds(tokenA);
  if (aConversationIdsAfterB.has(bConversationId)) {
    fail("User A can see User B conversation");
  } else {
    pass("User A cannot see User B conversation in list");
  }
  if (aDocumentIdsAfterB.has(bDocumentId)) {
    fail("User A can see User B document");
  } else {
    pass("User A cannot see User B document in list");
  }

  if (process.exitCode && process.exitCode !== 0) {
    console.error("Isolation test completed with failures.");
    return;
  }
  console.log("Isolation test completed successfully.");
}

main().catch((err) => {
  fail(err instanceof Error ? err.message : String(err));
});
