"use client";

import { useState } from "react";
import { FileInput } from "lucide-react";

export type ImportedChange = { title: string; description: string; category: string; tags: string[]; inputExample: string; outputExample: string; promptContent: string; hasInputPlaceholder: boolean };
export function ImportPrompt({ onParsed }: { onParsed: (data: ImportedChange) => void }) {
  const [prompt, setPrompt] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const parse = async () => { if (!prompt.trim()) return; setBusy(true); setError(""); try { const response = await fetch("/api/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "导入暂时未成"); onParsed(data); } catch (cause) { setError(cause instanceof Error ? cause.message : "导入暂时未成"); } finally { setBusy(false); } };
  return <section className="border-b pb-5"><div className="flex items-center gap-2"><FileInput size={17} className="text-coral"/><h2 className="font-serif font-bold">导入提示词</h2></div><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={12000} placeholder="粘贴已有提示词，整理成一变" className="mt-3 min-h-32 w-full border p-3 text-sm outline-none focus:border-coral" style={{ borderRadius: 4, background: "var(--paper)" }} /><div className="mt-2 flex items-center justify-between"><span className="muted text-xs">{prompt.length}/12000</span><button type="button" disabled={busy || !prompt.trim()} onClick={parse} className="inline-flex h-10 items-center gap-2 border px-4 text-sm font-medium hover:border-coral hover:text-coral disabled:opacity-50" style={{ borderRadius: 4 }}>{busy ? <span className="ellipsis">整理中</span> : "解析"}</button></div>{error && <p className="mt-2 text-sm text-failure">{error}</p>}</section>;
}
