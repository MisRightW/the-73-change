"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/toast-provider";

const pendingCollectionKey = "the73:pending-collection";

export function savePendingCollection(techniqueId: string) {
  sessionStorage.setItem(pendingCollectionKey, techniqueId);
}

export function PendingCollectionExecutor() {
  const { status } = useSession();
  const { toast } = useToast();
  useEffect(() => {
    if (status !== "authenticated") return;
    const techniqueId = sessionStorage.getItem(pendingCollectionKey);
    if (!techniqueId) return;
    sessionStorage.removeItem(pendingCollectionKey);
    fetch(`/api/changes/${techniqueId}/collect`, { method: "POST" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "收入锦囊未完成");
        toast(data.collected ? "已收入锦囊" : "已从锦囊移除");
      })
      .catch(() => toast("收入锦囊未完成，请再试一次", "error"));
  }, [status, toast]);
  return null;
}
