import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChangeCard } from "@/components/change-card";
import { calculateChangeMetrics } from "@/lib/change-metrics";

const changeSelect = {
  id: true, title: true, description: true, category: true, createdAt: true,
  author: { select: { name: true } }, tags: { select: { name: true } },
  currentVersion: { select: { model: { select: { name: true } } } },
  runs: { where: { status: "SUCCESS" as const }, select: { createdAt: true, vote: { select: { value: true } } } }
};

function toCard(item: { runs: { createdAt: Date; vote: { value: "VALID" | "PARTIAL" | "INVALID" } | null }[]; [key: string]: unknown }) {
  const { runs, ...rest } = item;
  return { ...rest, ...calculateChangeMetrics(runs) } as Parameters<typeof ChangeCard>[0]["change"];
}

export default async function UserPage({ params }: { params: { userId: string } }) {
  const current = await getCurrentUser();
  if (params.userId === "me") { if (!current) redirect("/login"); redirect(`/u/${current.id}`); }
  const user = await prisma.user.findUnique({ where: { id: params.userId }, select: { id: true, name: true, techniques: { where: { published: true }, orderBy: { updatedAt: "desc" }, select: changeSelect } } });
  if (!user) notFound();
  const own = current?.id === user.id;
  const [collections, recentRuns] = own ? await Promise.all([
    prisma.collection.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, select: { technique: { select: changeSelect } } }),
    prisma.techniqueRun.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 8, select: { id: true, output: true, technique: { select: { id: true, title: true } } } })
  ]) : [[], []];
  const cards = user.techniques.map(toCard);
  const collected = collections.map(({ technique }) => toCard(technique));
  return <main className="shell py-10"><section className="flex items-center gap-4 border-b pb-7"><div className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-2 border-gold bg-mist font-serif text-2xl font-bold text-teal">{(user.name || "变友").slice(0, 1)}</div><div><p className="heading-kicker">{own ? "我的变法" : "变友的变法"}</p><h1 className="mt-1 text-3xl font-bold">{user.name || "匿名变友"}</h1><p className="muted mt-1 text-sm">已经授出 {cards.length} 个变化</p></div></section><section className="mt-8"><h2 className="text-2xl font-bold">授出的变化</h2>{cards.length ? <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{cards.map((change) => <ChangeCard key={change.id} change={change}/>)}</div> : <p className="panel muted mt-4 p-8 text-center">还没有公开的变化。</p>}</section>{own && <section id="collections" className="mt-10"><h2 className="text-2xl font-bold">收入锦囊</h2>{collected.length ? <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{collected.map((change) => <ChangeCard key={change.id} change={change}/>)}</div> : <p className="panel muted mt-4 p-8 text-center">锦囊还是空的，去找一变吧。</p>}</section>}{own && <section className="mt-10"><h2 className="text-2xl font-bold">最近试变</h2><div className="panel mt-4 divide-y">{recentRuns.length ? recentRuns.map((run) => <div key={run.id} className="p-4"><a href={`/changes/${run.technique.id}`} className="font-medium hover:text-coral">{run.technique.title}</a><p className="muted mt-1 line-clamp-1 text-sm">{run.output || "这次试变没有成"}</p></div>) : <p className="muted p-8 text-center">还没有试变记录。</p>}</div></section>}</main>;
}
