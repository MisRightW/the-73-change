"use client";
import { SessionProvider } from "next-auth/react";
import { PendingCollectionExecutor } from "@/components/pending-collection";
import { ToastProvider } from "@/components/toast-provider";
import { WelcomeGuide } from "@/components/welcome-guide";
export function Providers({ children }: { children: React.ReactNode }) { return <SessionProvider><ToastProvider><PendingCollectionExecutor /><WelcomeGuide />{children}</ToastProvider></SessionProvider>; }
