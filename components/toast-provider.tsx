"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { Check, CircleAlert, Info } from "lucide-react";

type ToastTone = "success" | "error" | "info";
type ToastItem = { id: number; message: string; tone: ToastTone };
type ToastContextValue = { toast: (message: string, tone?: ToastTone) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const toast = useCallback((message: string, tone: ToastTone = "success") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setItems((current) => [...current, { id, message, tone }].slice(-3));
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 2800);
  }, []);
  return <ToastContext.Provider value={{ toast }}>{children}<div aria-live="polite" aria-atomic="true" className="pointer-events-none fixed inset-x-4 bottom-5 z-50 mx-auto flex w-auto max-w-sm flex-col gap-2 sm:inset-x-auto sm:right-5"><span className="sr-only">操作反馈</span>{items.map((item) => <div key={item.id} role={item.tone === "error" ? "alert" : "status"} className={`pointer-events-auto flex items-center gap-2 border px-4 py-3 text-sm shadow-[0_2px_8px_rgba(43,43,43,0.10)] ${item.tone === "success" ? "border-[#8EAF97] bg-[#F0F6F1] text-moss dark:bg-[#233126]" : item.tone === "error" ? "border-[#D7A18B] bg-[#F9EEE8] text-failure dark:bg-[#34251F]" : "border-gold bg-[#FBF7ED] text-teal dark:bg-[#352F22]"}`} style={{ borderRadius: 4 }}>{item.tone === "success" ? <Check size={17} aria-hidden="true" /> : item.tone === "error" ? <CircleAlert size={17} aria-hidden="true" /> : <Info size={17} aria-hidden="true" />}<span>{item.message}</span></div>)}</div></ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast 必须在 ToastProvider 内使用");
  return context;
}
