import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "请先登录后再收入锦囊" }, { status: 401 });
  const where = { userId_techniqueId: { userId: user.id, techniqueId: params.id } };
  const existing = await prisma.collection.findUnique({ where });
  if (existing) { await prisma.collection.delete({ where }); return NextResponse.json({ collected: false }); }
  const technique = await prisma.technique.findUnique({ where: { id: params.id }, select: { authorId: true } });
  if (!technique) return NextResponse.json({ error: "未找到这一变" }, { status: 404 });
  await prisma.collection.create({ data: { userId: user.id, techniqueId: params.id } });
  if (technique.authorId !== user.id) await prisma.notification.create({ data: { userId: technique.authorId, type: NotificationType.COLLECT, sourceId: params.id, sourceType: "TECHNIQUE", content: `${user.name || "一位变友"} 将你的变化收入锦囊` } });
  return NextResponse.json({ collected: true });
}
