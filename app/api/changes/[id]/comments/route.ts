import { NextRequest, NextResponse } from "next/server";
import { NotificationType } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const technique = await prisma.technique.findUnique({ where: { id: params.id }, select: { published: true } });
  if (!technique?.published) return NextResponse.json({ error: "未找到这一变" }, { status: 404 });
  const comments = await prisma.comment.findMany({ where: { techniqueId: params.id, parentId: null }, orderBy: { createdAt: "asc" }, include: { user: { select: { id: true, name: true, image: true } }, replies: { orderBy: { createdAt: "asc" }, include: { user: { select: { id: true, name: true, image: true } } } } } });
  return NextResponse.json(comments);
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "请先登录后再留下变化心得" }, { status: 401 });
  const body = await request.json(); const content = typeof body.content === "string" ? body.content.trim() : ""; const parentId = typeof body.parentId === "string" ? body.parentId : null;
  if (!content || content.length > 2000) return NextResponse.json({ error: "变化心得请控制在 2000 字以内" }, { status: 400 });
  const technique = await prisma.technique.findUnique({ where: { id: params.id }, select: { id: true, title: true, authorId: true, published: true } });
  if (!technique?.published) return NextResponse.json({ error: "未找到这一变" }, { status: 404 });
  const parent = parentId ? await prisma.comment.findFirst({ where: { id: parentId, techniqueId: technique.id }, select: { id: true, userId: true } }) : null;
  if (parentId && !parent) return NextResponse.json({ error: "未找到要回复的变化心得" }, { status: 404 });
  const comment = await prisma.comment.create({ data: { techniqueId: technique.id, userId: user.id, parentId: parent?.id || null, content }, include: { user: { select: { id: true, name: true, image: true } } } });
  const recipientId = parent?.userId || technique.authorId;
  if (recipientId !== user.id) await prisma.notification.create({ data: { userId: recipientId, type: NotificationType.COMMENT, sourceId: technique.id, sourceType: "TECHNIQUE", content: parent ? `${user.name || "一位变友"} 回复了你的变化心得` : `${user.name || "一位变友"} 留下了新的变化心得` } });
  return NextResponse.json(comment, { status: 201 });
}
