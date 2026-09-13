"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const storageKey = "the73:onboarding-dismissed";
const steps = [
  { title: "欢迎来到第73变", description: "孙悟空有七十二变，你有第 73 变。" },
  { title: "找一个变化，试试看", description: "从真实变友分享的变化里，挑一个马上试变。" },
  { title: "觉得有用？投一票", description: "留下真实判断，帮助更多人找到成了的变化。" }
];

export function WelcomeGuide() {
  const { status } = useSession();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (status !== "unauthenticated") return;
    setOpen(localStorage.getItem(storageKey) !== "true");
    setReady(true);
  }, [status]);

  const dismiss = () => {
    localStorage.setItem(storageKey, "true");
    setOpen(false);
  };

  if (!ready || !open || status !== "unauthenticated") return null;
  const current = steps[step];
  const isLast = step === steps.length - 1;
  return <aside aria-label="新手引导" className="fixed bottom-20 right-4 z-40 w-[calc(100%-2rem)] max-w-sm border bg-[var(--card)] p-5 shadow-sm md:bottom-5" style={{ borderRadius: 6 }}>
    <div className="flex items-start justify-between gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-gold bg-mist text-coral" style={{ borderRadius: 4 }}><Sparkles size={17} aria-hidden="true" /></div>
      <button onClick={dismiss} aria-label="关闭新手引导" className="muted grid h-9 w-9 shrink-0 place-items-center hover:text-coral" style={{ borderRadius: 4 }}><X size={17} aria-hidden="true" /></button>
    </div>
    <p className="heading-kicker mt-3">初来一变</p>
    <h2 className="mt-1 text-xl font-bold">{current.title}</h2>
    <p className="muted mt-2 text-sm leading-6">{current.description}</p>
    <div className="mt-4 flex items-center justify-between gap-3">
      <div className="flex gap-1.5" aria-label={`第 ${step + 1} 步，共 ${steps.length} 步`}>{steps.map((_, index) => <span key={index} className={`h-1.5 w-5 ${index === step ? "bg-coral" : "bg-mist"}`} style={{ borderRadius: 2 }} />)}</div>
      {isLast ? <Link href="/changes" onClick={dismiss} className="inline-flex h-11 items-center gap-1.5 bg-coral px-3 text-sm font-medium text-white hover:bg-[#A31D20]" style={{ borderRadius: 4 }}>去找变化<ArrowRight size={15} aria-hidden="true" /></Link> : <button onClick={() => setStep((value) => value + 1)} className="inline-flex h-11 items-center gap-1.5 border px-3 text-sm font-medium text-teal hover:border-coral hover:text-coral" style={{ borderRadius: 4 }}>下一步<ArrowRight size={15} aria-hidden="true" /></button>}
    </div>
  </aside>;
}
