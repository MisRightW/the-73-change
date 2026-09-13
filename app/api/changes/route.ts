import { NextRequest, NextResponse } from "next/server";
import { Category, Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { changeSchema } from "@/lib/validations";
import { calculateChangeMetrics } from "@/lib/change-metrics";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const category = searchParams.get("category"); const model = searchParams.get("model"); const tag = searchParams.get("tag"); const sort = searchParams.get("sort") || "latest";
  const where: Prisma.TechniqueWhereInput = { published: true, ...(category && Object.values(Category).includes(category as Category) ? { category: category as Category } : {}), ...(model ? { currentVersion: { modelId: model } } : {}), ...(tag ? { OR: [{ title: { contains: tag, mode: "insensitive" } }, { tags: { some: { name: { contains: tag, mode: "insensitive" } } } }] } : {}) };
  const orderBy: Prisma.TechniqueOrderByWithRelationInput[] = sort === "hot" ? [{ runs: { _count: "desc" } }] : [{ updatedAt: "desc" }];
  const [items, total] = await prisma.$transaction([
    prisma.technique.findMany({ where, orderBy, skip: (page - 1) * 12, take: 12, select: { id: true, title: true, description: true, category: true, createdAt: true, author: { select: { name: true, image: true } }, tags: { select: { name: true } }, currentVersion: { select: { model: { select: { name: true } } } }, _count: { select: { collections: true } }, runs: { where: { status: "SUCCESS" }, select: { createdAt: true, vote: { select: { value: true } } } } } }),
    prisma.technique.count({ where })
  ]);
  const result = items.map(({ runs, ...item }) => ({ ...item, ...calculateChangeMetrics(runs) }));
  if (sort === "rate") result.sort((a, b) => b.rate - a.rate || b.recentRunCount - a.recentRunCount);
  return NextResponse.json({ items: result, pagination: { page, total, pages: Math.ceil(total / 12) } });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "请先登录后再授人以变" }, { status: 401 });
  const parsed = changeSchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "变化内容不符合要求", issues: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;
  const technique = await prisma.$transaction(async (tx) => {
    const created = await tx.technique.create({ data: { title: data.title, description: data.description, category: data.category, authorId: user.id, published: data.published, tags: { connectOrCreate: data.tags.map((name) => ({ where: { name }, create: { name } })) } } });
    const version = await tx.techniqueVersion.create({ data: { techniqueId: created.id, versionNumber: 1, promptContent: data.promptContent, modelId: data.modelId, temperature: data.temperature, maxTokens: data.maxTokens, inputExample: data.inputExample || null, outputExample: data.outputExample || null, changelog: data.changelog || "初始变化" } });
    return tx.technique.update({ where: { id: created.id }, data: { currentVersionId: version.id } });
  });
  return NextResponse.json(technique, { status: 201 });
}
