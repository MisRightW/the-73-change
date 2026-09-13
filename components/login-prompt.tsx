"use client";

import { LogIn, X } from "lucide-react";

export function LoginPrompt({ open, onClose, onContinue }: { open: boolean; onClose: () => void; onContinue: () => void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-40 grid place-items-end bg-[#2B2B2B]/30 p-4 sm:place-items-center" role="presentation" onMouseDown={onClose}><section role="dialog" aria-modal="true" aria-labelledby="login-prompt-title" className="panel w-full max-w-sm p-5 shadow-[0_8px_24px_rgba(43,43,43,0.12)]" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><p className="heading-kicker">收入锦囊</p><h2 id="login-prompt-title" className="mt-1 text-xl font-bold">登录后，把这一变带走</h2><p className="muted mt-2 text-sm leading-6">登录完成后会自动收入锦囊，不需要再点一次。</p></div><button type="button" aria-label="关闭登录提示" onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center border hover:border-coral hover:text-coral" style={{ borderRadius: 4 }}><X size={17} /></button></div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="h-11 border px-4 text-sm font-medium hover:border-coral hover:text-coral" style={{ borderRadius: 4 }}>暂不登录</button><button type="button" onClick={onContinue} className="inline-flex h-11 items-center gap-2 bg-coral px-4 text-sm font-medium text-white hover:bg-[#A31D20]" style={{ borderRadius: 4 }}><LogIn size={16} />去登录</button></div></section></div>;
}
