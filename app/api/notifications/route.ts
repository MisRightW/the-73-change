import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ items: [], unreadCount: 0 });
  const [items, unreadCount] = await prisma.$transaction([prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 }), prisma.notification.count({ where: { userId: user.id, isRead: false } })]);
  return NextResponse.json({ items, unreadCount });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const body: { ids?: unknown; all?: boolean } = await request.json(); const ids = Array.isArray(body.ids) ? body.ids.filter((id: unknown): id is string => typeof id === "string") : [];
  await prisma.notification.updateMany({ where: { userId: user.id, ...(body.all ? {} : { id: { in: ids } }) }, data: { isRead: true } });
  return NextResponse.json({ marked: true });
}
