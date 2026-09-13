import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/site-header";
import { PageTransition } from "@/components/page-transition";
import { MobileNav } from "@/components/mobile-nav";

export const metadata: Metadata = { title: { default: "第73变", template: "%s - 第73变" }, description: "AI 时代，人人都能有第 73 变" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="zh-CN"><body><Providers><SiteHeader /><PageTransition>{children}</PageTransition><MobileNav /><footer className="mt-16 border-t py-8 text-center text-sm muted">第73变 · AI 时代，人人都能有第 73 变</footer></Providers></body></html>; }
