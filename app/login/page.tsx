"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { Mail, Send } from "lucide-react";
import { useToast } from "@/components/toast-provider";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const callbackUrl = () => {
    const requested = new URLSearchParams(window.location.search).get("callbackUrl") || "/";
    return requested.startsWith("/") && !requested.startsWith("//") ? requested : "/";
  };

  const requestMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!emailPattern.test(normalized)) { setError("请输入正确的邮箱地址"); return; }
    setSending(true); setError("");
    try {
      const result = await signIn("email", { email: normalized, redirect: false, callbackUrl: callbackUrl() });
      if (!result || result.error) throw new Error(result?.error || "魔法链接发送失败");
      setEmail(normalized); setSent(true); toast("登录链接已发送，请查收邮件");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "登录链接暂时无法发送，请稍后再试");
    } finally { setSending(false); }
  };

  return <main className="shell grid min-h-[calc(100vh-8rem)] place-items-center py-10"><section className="panel w-full max-w-md p-7 sm:p-9"><span className="stamp-mark h-9 w-9 text-lg">变</span><p className="heading-kicker mt-5">欢迎变友</p><h1 className="mt-2 text-3xl font-bold">欢迎来到第73变</h1><p className="muted mt-3 text-sm leading-6">输入邮箱，收取一次性登录链接，点击即可进入。</p><form onSubmit={requestMagicLink} className="mt-7 space-y-4"><div><label htmlFor="login-email" className="mb-2 block text-sm font-medium">邮箱</label><div className="relative"><Mail size={16} className="muted pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" /><input id="login-email" autoFocus type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(""); setSent(false); }} placeholder="你的邮箱" className="h-11 w-full border py-2 pl-9 pr-3 text-sm outline-none focus:border-coral" style={{ borderRadius: 4, background: "var(--paper)" }} /></div></div>{error && <p role="alert" className="text-sm text-failure">{error}</p>}{sent && <div role="status" className="border border-moss bg-[#EEF4EE] p-3 text-sm leading-6 text-moss" style={{ borderRadius: 4 }}>登录链接已提交到邮件服务：<strong>{email}</strong>。请检查收件箱和垃圾邮件，几分钟后仍未收到可重新发送。</div>}<button type="submit" disabled={sending} className="inline-flex h-11 w-full items-center justify-center gap-2 bg-coral px-4 text-sm font-semibold text-white hover:bg-[#A31D20] disabled:cursor-not-allowed disabled:opacity-50" style={{ borderRadius: 4 }}><Send size={17} aria-hidden="true" />{sending ? <span className="ellipsis">发送中</span> : sent ? "重新发送登录链接" : "发送登录链接"}</button></form><p className="muted mt-6 text-xs leading-5">链接有效期 10 分钟，只能使用一次。登录即表示你同意以友善、真实的方式参与每一次变化。</p></section></main>;
}
