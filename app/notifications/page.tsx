import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationsList } from "@/components/notifications-list";

export const metadata = { title: "消息" };
export default async function NotificationsPage() { const user = await getCurrentUser(); if (!user) redirect("/login"); const items = await prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 }); return <main className="shell max-w-3xl py-10"><p className="heading-kicker">我的消息</p><h1 className="mt-1 text-3xl font-bold">变友的新动静</h1><NotificationsList initialItems={items}/></main>; }
