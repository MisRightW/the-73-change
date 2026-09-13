"use client";

import { Play, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { RunPanel } from "@/components/run-panel";

export function MobileRunSheet({ changeId, initialInput, promptContent, versionId, temperature, maxTokens }: { changeId: string; initialInput: string; promptContent?: string; versionId?: string; temperature?: number; maxTokens?: number }) {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKeyDown); previousFocusRef.current?.focus(); };
  }, [open]);
  return <div className="mt-6 lg:hidden"><button onClick={() => setOpen(true)} className="inline-flex h-11 w-full items-center justify-center gap-2 bg-coral px-4 text-sm font-semibold text-white hover:bg-[#A31D20]" style={{ borderRadius: 4 }}><Play size={16} aria-hidden="true" />打开试变面板</button>{open && <div role="dialog" aria-modal="true" aria-labelledby="mobile-run-sheet-title" className="fixed inset-0 z-50 flex flex-col bg-[var(--paper)] motion-safe:animate-[fade-in_180ms_ease-out]">
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-[var(--card)] px-4"><h2 id="mobile-run-sheet-title" className="font-serif text-lg font-bold">试变面板</h2><button ref={closeButtonRef} onClick={() => setOpen(false)} aria-label="关闭试变面板" className="grid h-11 w-11 place-items-center border hover:border-coral hover:text-coral" style={{ borderRadius: 4 }}><X size={18} aria-hidden="true" /></button></header>
    <div className="min-h-0 flex-1 overflow-y-auto p-4"><RunPanel changeId={changeId} initialInput={initialInput} promptContent={promptContent} versionId={versionId} temperature={temperature} maxTokens={maxTokens} panelId="mobile-run-panel" showHeading={false} /></div>
  </div>}</div>;
}
