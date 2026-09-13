"use client";

import Link from "next/link";
import { Bookmark, Home, Plus, Search, UserRound } from "lucide-react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

const entries = [
  { href: "/", label: "首页", icon: Home, protected: false, matches: (path: string) => path === "/" },
  { href: "/changes", label: "变化", icon: Search, protected: false, matches: (path: string) => path.startsWith("/changes") && path !== "/changes/new" },
  { href: "/changes/new", label: "授人以变", icon: Plus, protected: true, matches: (path: string) => path === "/changes/new" },
  { href: "/u/me#collections", label: "锦囊", icon: Bookmark, protected: true, matches: () => false },
  { href: "/u/me", label: "我的", icon: UserRound, protected: true, matches: (path: string) => path.startsWith("/u/") }
];

export function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  return <nav aria-label="移动端主导航" className="fixed inset-x-0 bottom-0 z-30 grid h-16 grid-cols-5 border-t bg-[var(--card)] md:hidden">
    {entries.map(({ href, label, icon: Icon, protected: requiresLogin, matches }) => {
      const target = requiresLogin && !session ? `/login?callbackUrl=${encodeURIComponent(href)}` : href;
      const active = matches(pathname);
      return <Link key={label} href={target} aria-current={active ? "page" : undefined} className={`flex min-w-0 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${active ? "text-coral" : "muted hover:text-teal"}`}><Icon size={19} strokeWidth={active ? 2.25 : 1.8} aria-hidden="true" /><span className="truncate px-1">{label}</span></Link>;
    })}
  </nav>;
}
