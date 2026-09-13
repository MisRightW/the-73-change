import { NextResponse } from "next/server";
import { RunStatus } from "@prisma/client";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const clientRunSchema = z.object({
  versionId: z.string().min(1),
  input: z.string().trim().min(1).max(8000),
  output: z.string().max(100000),
  model: z.string().trim().min(1).max(120)
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录后再试变" }, { status: 401 });
  const parsed = clientRunSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "模型试变记录格式不正确" }, { status: 400 });
  const version = await prisma.techniqueVersion.findFirst({ where: { id: parsed.data.versionId, techniqueId: params.id, technique: { OR: [{ published: true }, { authorId: user.id }] } }, select: { id: true } });
  if (!version) return NextResponse.json({ error: "未找到这一变的版本" }, { status: 404 });
  const run = await prisma.techniqueRun.create({ data: { techniqueId: params.id, versionId: version.id, userId: user.id, input: parsed.data.input, output: parsed.data.output, model: parsed.data.model, status: RunStatus.SUCCESS } });
  return NextResponse.json({ runId: run.id });
}
