"use client";
import { useState } from "react";
import { Bookmark } from "lucide-react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { LoginPrompt } from "@/components/login-prompt";
import { savePendingCollection } from "@/components/pending-collection";
import { useToast } from "@/components/toast-provider";

export function CollectButton({ id, initial }: { id: string; initial: boolean }) {
  const { data: session } = useSession(); const router = useRouter(); const pathname = usePathname(); const { toast } = useToast();
  const [collected, setCollected] = useState(initial); const [busy, setBusy] = useState(false); const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const toggle = async () => {
    if (!session) { setLoginPromptOpen(true); return; }
    const previous = collected; setCollected(!previous); setBusy(true);
    try {
      const response = await fetch(`/api/changes/${id}/collect`, { method: "POST" }); const data = await response.json();
      if (!response.ok) throw new Error(data.error || "收入锦囊未完成");
      setCollected(data.collected); toast(data.collected ? "已收入锦囊" : "已从锦囊移除");
    } catch {
      setCollected(previous); toast("收入锦囊未完成，请再试一次", "error");
    } finally { setBusy(false); }
  };
  const continueToLogin = () => { savePendingCollection(id); router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`); };
  return <><button aria-pressed={collected} disabled={busy} onClick={toggle} className={`inline-flex h-11 items-center gap-2 border px-4 text-sm font-medium disabled:opacity-50 ${collected ? "border-gold bg-[#FBF7ED] text-[#8A6B31] dark:bg-[#352F22]" : "hover:border-gold hover:text-[#8A6B31]"}`} style={{ borderRadius: 4 }}><Bookmark size={16} fill={collected ? "currentColor" : "none"} aria-hidden="true" />{collected ? "已收入锦囊" : "收入锦囊"}</button><LoginPrompt open={loginPromptOpen} onClose={() => setLoginPromptOpen(false)} onContinue={continueToLogin} /></>;
}
