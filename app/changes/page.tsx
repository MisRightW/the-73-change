import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ChangeList } from "@/components/change-list";
import { FilterBar } from "@/components/filter-bar";
import { calculateChangeMetrics } from "@/lib/change-metrics";

export const dynamic = "force-dynamic";

export default async function ChangesPage({ searchParams }: { searchParams: { category?: string; model?: string; tag?: string; sort?: string; page?: string } }) {
  const page = Math.max(1, Number(searchParams.page) || 1); const sort = searchParams.sort || "latest";
  const where: Prisma.TechniqueWhereInput = { published: true, ...(searchParams.category ? { category: searchParams.category as never } : {}), ...(searchParams.model ? { currentVersion: { modelId: searchParams.model } } : {}), ...(searchParams.tag ? { OR: [{ title: { contains: searchParams.tag, mode: "insensitive" } }, { tags: { some: { name: { contains: searchParams.tag, mode: "insensitive" } } } }] } : {}) };
  const [items, total, models] = await prisma.$transaction([
    prisma.technique.findMany({
      where, take: 12, skip: (page - 1) * 12,
      orderBy: sort === "hot" ? { runs: { _count: "desc" } } : { updatedAt: "desc" },
      select: { id: true, title: true, description: true, category: true, createdAt: true,
        author: { select: { name: true } }, tags: { select: { name: true } },
        currentVersion: { select: { model: { select: { name: true } } } },
        runs: { where: { status: "SUCCESS" }, select: { createdAt: true, vote: { select: { value: true } } } }
      }
    }),
    prisma.technique.count({ where }),
    prisma.model.findMany({ where: { isActive: true }, select: { id: true, name: true } })
  ]);
  const changes = items.map(({ runs, ...item }) => ({ ...item, ...calculateChangeMetrics(runs) })).sort((a, b) => sort === "rate" ? b.rate - a.rate : 0);
  const query = new URLSearchParams(Object.entries({ category: searchParams.category, model: searchParams.model, tag: searchParams.tag, sort: searchParams.sort }).filter((entry): entry is [string, string] => Boolean(entry[1]))).toString();
  return <main className="shell py-10"><p className="heading-kicker">全部变化</p><h1 className="mt-1 text-3xl font-bold">找一变，解一事</h1><p className="muted mt-2">每一变都能直接试变，先看结果再决定带走。</p><div className="mt-7"><FilterBar models={models}/></div><p className="muted mt-6 text-sm">共 {total} 个变化</p><ChangeList initialItems={changes} initialPagination={{ page, total, pages: Math.ceil(total / 12) }} query={query} /></main>;
}
