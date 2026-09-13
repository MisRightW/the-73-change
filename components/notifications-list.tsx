"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";

type Notification = { id: string; sourceId: string; sourceType: string; content: string; isRead: boolean; createdAt: Date };
export function NotificationsList({ initialItems }: { initialItems: Notification[] }) {
  const [items, setItems] = useState(initialItems); const unread = items.filter((item) => !item.isRead).length;
  const markAll = async () => { const response = await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) }); if (response.ok) setItems((current) => current.map((item) => ({ ...item, isRead: true }))); };
  const markOne = async (id: string) => { setItems((current) => current.map((item) => item.id === id ? { ...item, isRead: true } : item)); await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [id] }) }); };
  return <section className="panel mt-6 overflow-hidden">{unread > 0 && <div className="flex justify-end border-b p-3"><button onClick={markAll} className="inline-flex h-10 items-center gap-2 text-sm font-medium text-teal hover:text-coral"><CheckCheck size={16}/>全部标为已读</button></div>}{items.length ? <div className="divide-y">{items.map((item) => <Link key={item.id} href={item.sourceType === "TECHNIQUE" ? `/changes/${item.sourceId}` : "/notifications"} onClick={() => { if (!item.isRead) void markOne(item.id); }} className={`block p-4 hover:bg-mist ${item.isRead ? "" : "bg-mist/50"}`}><div className="flex gap-3"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.isRead ? "bg-transparent" : "bg-coral"}`}/><div><p className="text-sm leading-6 text-ink">{item.content}</p><p className="muted mt-1 text-xs">{formatDate(item.createdAt)}</p></div></div></Link>)}</div> : <EmptyState title="还没有新的动静" description="多试几变、多留下心得，新的消息会在这里出现。" actionLabel="去找变化" />}</section>;
}
