import { NextResponse } from "next/server";
import { VoteValue } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: { runId: string } }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "请先登录后再判断这一变" }, { status: 401 });
  const { value } = await request.json(); if (!Object.values(VoteValue).includes(value)) return NextResponse.json({ error: "请选择成变结果" }, { status: 400 });
  const run = await prisma.techniqueRun.findUnique({ where: { id: params.runId }, select: { userId: true } });
  if (!run) return NextResponse.json({ error: "未找到试变记录" }, { status: 404 }); if (run.userId !== user.id) return NextResponse.json({ error: "只能评价自己的试变" }, { status: 403 });
  const vote = await prisma.vote.upsert({ where: { runId: params.runId }, update: { value }, create: { runId: params.runId, userId: user.id, value } });
  return NextResponse.json(vote);
}
