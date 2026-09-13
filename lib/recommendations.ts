import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { calculateChangeMetrics } from "@/lib/change-metrics";

const changeSelect = {
  id: true, title: true, description: true, category: true, createdAt: true,
  author: { select: { name: true } }, tags: { select: { name: true } },
  currentVersion: { select: { model: { select: { name: true } } } },
  runs: { where: { status: "SUCCESS" as const }, select: { createdAt: true, vote: { select: { value: true } } } }
};

const cachedRecommendations = unstable_cache(async (userId: string | null) => {
  const categoryWeights = new Map<string, number>(); let invalidTechniqueIds: string[] = [];
  if (userId) {
    const [runs, collections, invalidRuns] = await Promise.all([
      prisma.techniqueRun.findMany({ where: { userId }, select: { technique: { select: { category: true } } } }),
      prisma.collection.findMany({ where: { userId }, select: { technique: { select: { category: true } } } }),
      prisma.techniqueRun.findMany({ where: { userId, vote: { value: "INVALID" } }, select: { techniqueId: true } })
    ]);
    runs.forEach((run) => categoryWeights.set(run.technique.category, (categoryWeights.get(run.technique.category) || 0) + 1));
    collections.forEach((collection) => categoryWeights.set(collection.technique.category, (categoryWeights.get(collection.technique.category) || 0) + 3));
    invalidTechniqueIds = invalidRuns.map((run) => run.techniqueId);
  }
  const categories = [...categoryWeights.keys()] as never[];
  const candidates = await prisma.technique.findMany({ where: { published: true, ...(userId ? { authorId: { not: userId }, id: { notIn: invalidTechniqueIds } } : {}), ...(categories.length ? { category: { in: categories } } : {}) }, select: changeSelect, take: 48, orderBy: { updatedAt: "desc" } });
  return candidates.map(({ runs, ...item }) => ({ ...item, ...calculateChangeMetrics(runs), preference: categoryWeights.get(item.category) || 0 })).sort((left, right) => right.preference - left.preference || Number(right.hasSufficientSample) - Number(left.hasSufficientSample) || right.rate - left.rate || right.recentRunCount - left.recentRunCount).slice(0, 6);
}, ["behavior-recommendations"], { revalidate: 600 });

export async function getRecommendations(userId: string | null) { return cachedRecommendations(userId); }
