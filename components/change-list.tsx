"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChangeCard, type ChangeCardData } from "@/components/change-card";
import { EmptyState } from "@/components/empty-state";

type Pagination = { page: number; total: number; pages: number };

function CardSkeleton() { return <div aria-hidden="true" className="panel skeleton h-[250px] p-5" />; }

export function ChangeList({ initialItems, initialPagination, query }: { initialItems: ChangeCardData[]; initialPagination: Pagination; query: string }) {
  const [items, setItems] = useState(initialItems); const [pagination, setPagination] = useState(initialPagination); const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setItems(initialItems); setPagination(initialPagination); setError(""); setLoading(false); }, [initialItems, initialPagination, query]);
  const loadMore = useCallback(async (force = false) => {
    if (loading || (!force && error) || pagination.page >= pagination.pages) return;
    setLoading(true);
    try {
      const separator = query ? "&" : ""; const response = await fetch(`/api/changes?${query}${separator}page=${pagination.page + 1}`); const data = await response.json();
      if (!response.ok) throw new Error(data.error || "变化列表暂时无法加载");
      setItems((current) => [...current, ...data.items]); setPagination(data.pagination);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "变化列表暂时无法加载"); }
    finally { setLoading(false); }
  }, [error, loading, pagination, query]);
  useEffect(() => {
    if (!sentinelRef.current || pagination.page >= pagination.pages || error) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) void loadMore(); }, { rootMargin: "240px" });
    observer.observe(sentinelRef.current); return () => observer.disconnect();
  }, [error, loadMore, pagination.page, pagination.pages]);
  if (!items.length && error) return <div className="mt-4"><EmptyState title="变化列表暂时未展开" description={error} actionLabel="重新试试" actionHref={`/changes${query ? `?${query}` : ""}`} /></div>;
  if (!items.length) return <div className="mt-4"><EmptyState title="还没找到合适的变化" description="换个关键词、变什么或模型再看看。" /></div>;
  return <><div className="mt-4 grid animate-[fade-in_180ms_ease-out] gap-4 md:grid-cols-2 lg:grid-cols-3">{items.map((change) => <ChangeCard key={change.id} change={change} />)}{loading && Array.from({ length: 3 }).map((_, index) => <CardSkeleton key={`skeleton-${index}`} />)}</div>{error ? <div className="mt-5 flex items-center justify-between gap-3 border p-4 text-sm" style={{ borderRadius: 4 }}><span className="text-failure">{error}</span><button onClick={() => { setError(""); void loadMore(true); }} className="h-11 border px-4 font-medium hover:border-coral hover:text-coral" style={{ borderRadius: 4 }}>重试</button></div> : <div ref={sentinelRef} className="mt-5 flex min-h-11 items-center justify-center">{loading ? <span className="muted text-sm"><span className="ellipsis">正在加载更多变化</span></span> : pagination.page < pagination.pages ? <button onClick={() => void loadMore()} className="h-11 border px-4 text-sm font-medium hover:border-coral hover:text-coral" style={{ borderRadius: 4 }}>加载更多变化</button> : <span className="muted text-sm">已经看到全部变化</span>}</div>}</>;
}
