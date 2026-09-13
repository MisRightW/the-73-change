"use client";

import { useEffect, useId, useState } from "react";
import { Clock3, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { categoryLabels } from "@/lib/utils";

type Suggestion = { id: string; title: string; category: keyof typeof categoryLabels };
type SearchOption = { kind: "suggestion"; item: Suggestion } | { kind: "recent"; value: string };
const recentKey = "the73:recent-searches";

export function SearchBox({ initialValue = "", variant = "filter" }: { initialValue?: string; variant?: "hero" | "filter" }) {
  const router = useRouter(); const listboxId = useId(); const [value, setValue] = useState(initialValue); const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [recent, setRecent] = useState<string[]>([]); const [open, setOpen] = useState(false); const [loading, setLoading] = useState(false); const [activeIndex, setActiveIndex] = useState(-1);
  const query = value.trim(); const options: SearchOption[] = query ? suggestions.map((item) => ({ kind: "suggestion", item })) : recent.map((item) => ({ kind: "recent", value: item }));
  useEffect(() => { try { const stored = JSON.parse(localStorage.getItem(recentKey) || "[]"); if (Array.isArray(stored)) setRecent(stored.filter((item): item is string => typeof item === "string").slice(0, 5)); } catch { setRecent([]); } }, []);
  useEffect(() => {
    if (!open || !query) { setSuggestions([]); setLoading(false); return; }
    const controller = new AbortController(); const timer = window.setTimeout(() => {
      setLoading(true);
      fetch(`/api/changes/suggestions?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then(async (response) => response.ok ? response.json() : Promise.reject())
        .then((data: Suggestion[]) => setSuggestions(data))
        .catch(() => setSuggestions([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [open, query]);
  useEffect(() => { setActiveIndex(-1); }, [query, open]);
  const remember = (keyword: string) => { const next = [keyword, ...recent.filter((item) => item !== keyword)].slice(0, 5); setRecent(next); localStorage.setItem(recentKey, JSON.stringify(next)); };
  const search = (keyword = query) => { const trimmed = keyword.trim(); if (!trimmed) return; remember(trimmed); setOpen(false); router.push(`/changes?tag=${encodeURIComponent(trimmed)}`); };
  const choose = (option: SearchOption) => { if (option.kind === "suggestion") { remember(option.item.title); setOpen(false); router.push(`/changes/${option.item.id}`); return; } search(option.value); };
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") { event.preventDefault(); if (options.length) setActiveIndex((current) => (current + 1 + options.length) % options.length); }
    if (event.key === "ArrowUp") { event.preventDefault(); if (options.length) setActiveIndex((current) => (current - 1 + options.length) % options.length); }
    if (event.key === "Escape") { setOpen(false); event.currentTarget.blur(); }
    if (event.key === "Enter") { event.preventDefault(); if (activeIndex >= 0 && options[activeIndex]) choose(options[activeIndex]); else search(); }
  };
  const hero = variant === "hero";
  return <div className={`relative ${hero ? "mx-auto mt-8 max-w-xl" : "w-full"}`}><form onSubmit={(event) => { event.preventDefault(); search(); }} className={`${hero ? "paper-surface p-1" : ""} flex border`} style={{ borderRadius: 4 }}><input value={value} onChange={(event) => setValue(event.target.value)} onFocus={() => setOpen(true)} onBlur={() => window.setTimeout(() => setOpen(false), 150)} onKeyDown={onKeyDown} role="combobox" aria-expanded={open && (Boolean(options.length) || loading)} aria-controls={listboxId} aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined} aria-autocomplete="list" placeholder={hero ? "搜索你想变的事" : "按标题或标签找变化"} className={`min-w-0 flex-1 bg-transparent px-3 outline-none focus:ring-2 focus:ring-coral ${hero ? "h-11 px-4" : "h-11"}`} /><button aria-label="搜索变化" className={`${hero ? "bg-coral text-white hover:bg-[#A31D20]" : "border-l text-teal hover:text-coral"} grid h-11 w-11 place-items-center`} style={{ borderRadius: hero ? 3 : 0 }}><Search size={18} aria-hidden="true" /></button></form>{open && (loading || options.length > 0 || Boolean(query)) && <div id={listboxId} role="listbox" className="paper-surface absolute z-30 mt-1 w-full overflow-hidden border shadow-[0_3px_10px_rgba(43,43,43,0.08)]" style={{ borderRadius: 4 }}>{loading ? <p className="muted px-4 py-3 text-sm"><span className="ellipsis">查找中</span></p> : options.length ? <>{!query && <p className="muted flex items-center gap-1 border-b px-4 py-2 text-xs"><Clock3 size={13} aria-hidden="true" />最近搜索</p>}{options.map((option, index) => <button key={option.kind === "suggestion" ? option.item.id : option.value} id={`${listboxId}-${index}`} role="option" aria-selected={activeIndex === index} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => choose(option)} className={`flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm ${activeIndex === index ? "bg-mist text-coral" : "hover:bg-mist"}`}>{option.kind === "suggestion" ? <><span className="min-w-0 truncate font-medium">{option.item.title}</span><span className="pill shrink-0 bg-[#E8F0EE] text-[10px] text-teal">{categoryLabels[option.item.category]}</span></> : <span>{option.value}</span>}</button>)}</> : <p className="muted px-4 py-3 text-sm">没有匹配的变化，按回车搜索全部结果。</p>}</div>}</div>;
}
