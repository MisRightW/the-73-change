import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query) return NextResponse.json([]);
  const items = await prisma.technique.findMany({ where: { published: true, OR: [{ title: { contains: query, mode: "insensitive" } }, { tags: { some: { name: { contains: query, mode: "insensitive" } } } }] }, orderBy: { updatedAt: "desc" }, take: 5, select: { id: true, title: true, category: true } });
  return NextResponse.json(items);
}
