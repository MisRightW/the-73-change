import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: Request, { params }: { params: { commentId: string } }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const comment = await prisma.comment.findUnique({ where: { id: params.commentId }, select: { userId: true } });
  if (!comment) return NextResponse.json({ error: "未找到这条变化心得" }, { status: 404 });
  if (comment.userId !== user.id) return NextResponse.json({ error: "只能删去自己的变化心得" }, { status: 403 });
  await prisma.comment.delete({ where: { id: params.commentId } });
  return NextResponse.json({ deleted: true });
}
