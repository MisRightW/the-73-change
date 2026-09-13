"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error); }, [error]);
  return <html lang="zh-CN"><body><main className="grid min-h-screen place-items-center bg-mist p-6"><section className="panel max-w-md p-8 text-center"><span className="stamp-mark h-9 w-9 text-lg">变</span><p className="heading-kicker mt-4">第73变</p><h1 className="mt-2 text-3xl font-bold">这一变暂时卡住了</h1><p className="muted mt-3">稍等片刻，再回来试变。</p><button onClick={reset} className="mt-6 h-11 bg-coral px-5 text-sm font-medium text-white hover:bg-[#A31D20]" style={{ borderRadius: 4 }}>再试一变</button></section></main></body></html>;
}
