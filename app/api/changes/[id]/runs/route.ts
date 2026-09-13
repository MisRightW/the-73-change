import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 10;
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(); const cursor = request.nextUrl.searchParams.get("cursor");
  const technique = await prisma.technique.findUnique({ where: { id: params.id }, select: { published: true, authorId: true } });
  if (!technique || (!technique.published && technique.authorId !== user?.id)) return NextResponse.json({ error: "未找到这一变" }, { status: 404 });
  const runs = await prisma.techniqueRun.findMany({ where: { techniqueId: params.id, status: "SUCCESS" }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: PAGE_SIZE + 1, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}), include: { user: { select: { name: true, image: true } }, vote: { select: { value: true } } } });
  const visible = runs.slice(0, PAGE_SIZE);
  return NextResponse.json({ items: visible.map((run) => ({ id: run.id, input: run.input, output: run.output, createdAt: run.createdAt.toISOString(), user: run.user, vote: run.userId === user?.id ? run.vote?.value || null : null })), nextCursor: runs.length > PAGE_SIZE ? visible.at(-1)?.id || null : null });
}
