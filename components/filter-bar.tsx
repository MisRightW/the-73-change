"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { categories } from "@/lib/utils";
import { SearchBox } from "@/components/search-box";

export function FilterBar({ models }: { models: { id: string; name: string }[] }) {
  const router = useRouter(); const params = useSearchParams();
  const update = (key: string, value: string) => { const next = new URLSearchParams(params.toString()); value ? next.set(key, value) : next.delete(key); next.delete("page"); router.push(`/changes?${next}`); };
  return <div className="panel grid gap-3 p-4 md:grid-cols-4"><select value={params.get("category") || ""} onChange={(e) => update("category", e.target.value)} className="h-11 border px-3" style={{ borderRadius: 4, background: "var(--paper)" }}><option value="">全部变什么</option>{categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><select value={params.get("model") || ""} onChange={(e) => update("model", e.target.value)} className="h-11 border px-3" style={{ borderRadius: 4, background: "var(--paper)" }}><option value="">全部模型</option>{models.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><SearchBox initialValue={params.get("tag") || ""} /><select value={params.get("sort") || "latest"} onChange={(e) => update("sort", e.target.value)} className="h-11 border px-3" style={{ borderRadius: 4, background: "var(--paper)" }}><option value="latest">最新变化</option><option value="hot">最多试变</option><option value="rate">成变率最高</option></select></div>;
}
