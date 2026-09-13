"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Bell, CheckCheck, LogOut, Menu, Plus, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";

type Notification = { id: string; sourceId: string; sourceType: string; content: string; isRead: boolean; createdAt: string };

export function SiteHeader() {
  const { data: session, status } = useSession();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "变友";

  const loadNotifications = async (): Promise<{ items: Notification[]; unreadCount: number } | null> => {
    try {
      const response = await fetch("/api/notifications");
      if (!response.ok) return null;
      const data = await response.json() as { items?: Notification[]; unreadCount?: number };
      const latest = { items: data.items || [], unreadCount: data.unreadCount || 0 };
      setNotifications(latest.items);
      setUnread(latest.unreadCount);
      return latest;
    } catch { setUnread(0); return null; }
  };

  useEffect(() => {
    if (session) void loadNotifications();
    else { setUnread(0); setNotifications([]); setNoticeOpen(false); }
  }, [session]);

  const toggleNotifications = async () => {
    const next = !noticeOpen;
    setNoticeOpen(next);
    if (!next) return;
    const latest = await loadNotifications();
    if (latest && latest.unreadCount > 0) {
      setUnread(0);
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      void fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
    }
  };

  const bell = <div className="relative">
    <button onClick={() => void toggleNotifications()} aria-label="查看我的消息" aria-expanded={noticeOpen} aria-controls="notification-preview" className="relative grid h-11 w-11 place-items-center border hover:border-coral hover:text-coral" style={{ borderRadius: 4 }}><Bell size={17} aria-hidden="true" />{unread > 0 && <span aria-label={`${unread} 条未读消息`} className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-coral px-1 text-[10px] text-white">{unread > 99 ? "99+" : unread}</span>}</button>
    {noticeOpen && <section id="notification-preview" aria-label="消息预览" className="absolute right-0 top-[calc(100%+0.5rem)] w-80 overflow-hidden border bg-[var(--card)] shadow-sm motion-safe:animate-[fade-in_180ms_ease-out]" style={{ borderRadius: 6 }}>
      <div className="flex items-center justify-between border-b px-4 py-3"><p className="font-serif font-bold">我的消息</p><CheckCheck size={16} className="text-moss" aria-label="已标为已读" /></div>
      {notifications.length ? <div className="divide-y">{notifications.slice(0, 4).map((item) => <Link key={item.id} href={item.sourceType === "TECHNIQUE" ? `/changes/${item.sourceId}` : "/notifications"} onClick={() => setNoticeOpen(false)} className="block px-4 py-3 hover:bg-mist"><p className="line-clamp-2 text-sm leading-5 text-ink">{item.content}</p><p className="muted mt-1 text-xs">{formatDate(item.createdAt)}</p></Link>)}</div> : <p className="muted px-4 py-8 text-center text-sm">还没有新的动静</p>}
      <Link href="/notifications" onClick={() => setNoticeOpen(false)} className="flex h-11 items-center justify-center border-t text-sm font-medium text-teal hover:bg-mist hover:text-coral">查看全部消息</Link>
    </section>}
  </div>;

  return <header className="relative z-20 border-b" style={{ background: "var(--paper)" }}><div className="shell flex h-16 items-center justify-between gap-3"><Link href="/" className="flex items-center gap-2 font-bold text-ink"><span className="stamp-mark h-8 w-8 text-base">变</span><span className="font-serif text-lg">第<span className="numeric numeric-emphasis">73</span>变</span></Link><nav className="hidden items-center gap-2 text-sm md:flex"><Link href="/changes" className="px-2 py-2 hover:text-coral">找变化</Link>{status === "loading" ? <span className="muted">变化中...</span> : session ? <><Link href="/u/me" className="flex h-11 items-center gap-2 px-2 hover:text-coral"><span className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full border border-gold bg-mist text-xs font-semibold text-teal">{session.user?.image ? <img src={session.user.image} alt="" className="h-full w-full object-cover" /> : userName.slice(0, 1)}</span><span className="max-w-24 truncate">{userName}</span></Link>{bell}<Link href="/changes/new" className="inline-flex h-11 items-center gap-1 bg-coral px-3 font-medium text-white hover:bg-[#A31D20]" style={{ borderRadius: 4 }}><Plus size={15} aria-hidden="true" />授人以变</Link><button onClick={() => signOut({ callbackUrl: "/" })} aria-label="退出登录" className="grid h-11 w-11 place-items-center border hover:border-coral hover:text-coral" style={{ borderRadius: 4 }}><LogOut size={16} aria-hidden="true" /></button></> : <Link href="/login" className="inline-flex h-11 items-center gap-1 bg-coral px-3 font-medium text-white hover:bg-[#A31D20]" style={{ borderRadius: 4 }}>登录</Link>}</nav><div className="flex items-center gap-2 md:hidden"><Link href="/changes" aria-label="找变化" className="grid h-11 w-11 place-items-center border hover:border-coral hover:text-coral" style={{ borderRadius: 4 }}><Search size={18} aria-hidden="true" /></Link>{session && bell}<button onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "收起菜单" : "打开菜单"} aria-expanded={menuOpen} className="grid h-11 w-11 place-items-center border hover:border-coral hover:text-coral" style={{ borderRadius: 4 }}>{menuOpen ? <X size={19} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}</button></div></div>{menuOpen && <nav aria-label="移动菜单" className="border-t px-4 py-3 md:hidden" style={{ background: "var(--card)" }}><div className="shell grid gap-1 px-0"><Link onClick={() => setMenuOpen(false)} href="/changes" className="flex h-11 items-center px-3 text-sm hover:bg-mist">找变化</Link>{session ? <><Link onClick={() => setMenuOpen(false)} href="/u/me" className="flex h-11 items-center px-3 text-sm hover:bg-mist">我的变法</Link><Link onClick={() => setMenuOpen(false)} href="/notifications" className="flex h-11 items-center px-3 text-sm hover:bg-mist">我的消息</Link><Link onClick={() => setMenuOpen(false)} href="/changes/new" className="flex h-11 items-center px-3 text-sm font-medium text-coral hover:bg-mist">授人以变</Link><button onClick={() => signOut({ callbackUrl: "/" })} className="flex h-11 items-center px-3 text-left text-sm hover:bg-mist">退出</button></> : <Link onClick={() => setMenuOpen(false)} href="/login" className="flex h-11 items-center px-3 text-sm font-medium text-coral hover:bg-mist">登录</Link>}</div></nav>}</header>;
}
