import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { changeSchema } from "@/lib/validations";
import { calculateChangeMetrics } from "@/lib/change-metrics";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const technique = await prisma.technique.findUnique({ where: { id: params.id }, include: { author: { select: { id: true, name: true, image: true } }, tags: true, currentVersion: { include: { model: true } }, versions: { include: { model: true }, orderBy: { versionNumber: "desc" } }, runs: { where: { status: "SUCCESS" }, include: { vote: true, user: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 12 }, _count: { select: { collections: true } } } });
  if (!technique || (!technique.published && technique.authorId !== user?.id)) return NextResponse.json({ error: "未找到这一变" }, { status: 404 });
  const metricRuns = await prisma.techniqueRun.findMany({ where: { techniqueId: technique.id, status: "SUCCESS", createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }, select: { createdAt: true, vote: { select: { value: true } } } });
  const collected = user ? !!(await prisma.collection.findUnique({ where: { userId_techniqueId: { userId: user.id, techniqueId: technique.id } } })) : false;
  return NextResponse.json({ ...technique, stats: { collections: technique._count.collections, ...calculateChangeMetrics(metricRuns) }, collected, isAuthor: user?.id === technique.authorId });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "请先登录后再更新变化" }, { status: 401 });
  const parsed = changeSchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "变化内容不符合要求" }, { status: 400 });
  const original = await prisma.technique.findUnique({ where: { id: params.id }, select: { authorId: true } });
  if (!original) return NextResponse.json({ error: "未找到这一变" }, { status: 404 }); if (original.authorId !== user.id) return NextResponse.json({ error: "只能编辑自己的变化" }, { status: 403 });
  const data = parsed.data;
  const technique = await prisma.$transaction(async (tx) => {
    const last = await tx.techniqueVersion.findFirst({ where: { techniqueId: params.id }, orderBy: { versionNumber: "desc" }, select: { versionNumber: true } });
    const version = await tx.techniqueVersion.create({ data: { techniqueId: params.id, versionNumber: (last?.versionNumber ?? 0) + 1, promptContent: data.promptContent, modelId: data.modelId, temperature: data.temperature, maxTokens: data.maxTokens, inputExample: data.inputExample || null, outputExample: data.outputExample || null, changelog: data.changelog || "更新变化" } });
    return tx.technique.update({ where: { id: params.id }, data: { title: data.title, description: data.description, category: data.category, published: data.published, currentVersionId: version.id, tags: { set: [], connectOrCreate: data.tags.map((name) => ({ where: { name }, create: { name } })) } } });
  });
  return NextResponse.json(technique);
}
