"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type DocumentRow = {
  id: string;
  filename: string;
  mimeType?: string | null;
  createdAt?: string | null;
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  async function refresh() {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    const res = await fetch("/api/documents", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const json = await res.json();
    setDocuments(json.documents ?? []);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await refresh();
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">Documents</h1>
        <p className="mt-1 text-sm text-slate-600">
          Uploads are private to your account. Use them as context in{" "}
          <Link href="/chat" className="font-medium text-indigo-600 hover:underline">
            Chat
          </Link>
          .
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Upload</h2>
        <p className="mt-1 text-sm text-slate-500">Plain text and PDF files supported.</p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="flex flex-1 cursor-pointer flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">File</span>
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50/40">
              <input
                type="file"
                accept=".txt,.pdf"
                className="sr-only"
                onChange={(e) => {
                  setUploadError(null);
                  setFile(e.target.files?.[0] ?? null);
                }}
              />
              {file ? file.name : "Click to select .txt or .pdf"}
            </div>
          </label>
          <button
            type="button"
            disabled={!file || uploading}
            onClick={async () => {
              if (!file) return;
              setUploading(true);
              setUploadError(null);
              try {
                const { data } = await supabase.auth.getSession();
                const token = data.session?.access_token;
                if (!token) return;
                const fd = new FormData();
                fd.append("file", file);
                const res = await fetch("/api/documents/upload", {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}` },
                  body: fd,
                });
                if (!res.ok) {
                  const json = await res.json().catch(() => null);
                  const base = json?.error || "Upload failed.";
                  const hint = json?.hint ? `\n\n${json.hint}` : "";
                  throw new Error(base + hint);
                }
                setFile(null);
                await refresh();
              } catch (e) {
                setUploadError(e instanceof Error ? e.message : "Upload failed.");
              } finally {
                setUploading(false);
              }
            }}
            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>
        {uploadError ? (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{uploadError}</p>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Your files</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading…</div>
        ) : documents.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-600">No documents yet. Upload one above.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Uploaded</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((d) => (
                  <tr key={d.id} className="transition hover:bg-slate-50/80">
                    <td className="max-w-[200px] truncate px-6 py-4 font-medium text-slate-900">{d.filename}</td>
                    <td className="px-6 py-4 text-slate-600">{d.mimeType ?? "—"}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {d.createdAt ? new Date(d.createdAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/chat?documentId=${encodeURIComponent(d.id)}`}
                        className="font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        Open in chat
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
