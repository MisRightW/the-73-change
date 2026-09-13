import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clipboard, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { calculateChangeMetrics } from "@/lib/change-metrics";
import { categoryLabels, formatDate } from "@/lib/utils";
import { RunPanel } from "@/components/run-panel";
import { RunHistory } from "@/components/run-history";
import { CollectButton } from "@/components/collect-button";
import { CommentSection } from "@/components/comment-section";
import { MobileRunSheet } from "@/components/mobile-run-sheet";
import { ChangeCard } from "@/components/change-card";
import { ChangeGuidance } from "@/components/change-guidance";

export const dynamic = "force-dynamic";

const cardSelect = {
  id: true, title: true, description: true, category: true, createdAt: true,
  author: { select: { name: true } }, tags: { select: { name: true } },
  currentVersion: { select: { model: { select: { name: true } } } },
  runs: { where: { status: "SUCCESS" as const }, select: { createdAt: true, vote: { select: { value: true } } } }
};

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const item = await prisma.technique.findUnique({ where: { id: params.id }, select: { title: true, description: true } });
  return item ? { title: item.title, description: item.description } : { title: "未找到变化" };
}

export default async function ChangePage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const change = await prisma.technique.findUnique({
    where: { id: params.id },
    include: {
      author: { select: { id: true, name: true } }, tags: true,
      currentVersion: { include: { model: true } },
      versions: { include: { model: true }, orderBy: { versionNumber: "desc" } },
      runs: { where: { status: "SUCCESS" }, include: { vote: true, user: { select: { name: true, image: true } } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 11 }
    }
  });
  if (!change || (!change.published && change.authorId !== user?.id) || !change.currentVersion) notFound();

  const [metricRuns, collection, similarItems] = await Promise.all([
    prisma.techniqueRun.findMany({ where: { techniqueId: change.id, status: "SUCCESS", createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }, select: { createdAt: true, vote: { select: { value: true } } } }),
    user ? prisma.collection.findUnique({ where: { userId_techniqueId: { userId: user.id, techniqueId: change.id } } }) : null,
    prisma.technique.findMany({ where: { published: true, category: change.category, id: { not: change.id } }, orderBy: { updatedAt: "desc" }, take: 3, select: cardSelect })
  ]);

  const metrics = calculateChangeMetrics(metricRuns);
  const similarChanges = similarItems.map(({ runs, ...item }) => ({ ...item, ...calculateChangeMetrics(runs) }));
  const initialRuns = change.runs.slice(0, 10).map((run) => ({ id: run.id, input: run.input, output: run.output, createdAt: run.createdAt.toISOString(), user: run.user, vote: run.userId === user?.id ? run.vote?.value || null : null }));
  const initialCursor = change.runs.length > 10 ? initialRuns.at(-1)?.id || null : null;

  return <main className="shell py-10"><div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]"><article className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="pill bg-[#E8F0EE] text-teal dark:bg-[#263837]">{categoryLabels[change.category]}</span>{change.tags.map((tag) => <span key={tag.id} className="pill muted bg-mist">#{tag.name}</span>)}</div><div className="mt-4 flex items-start justify-between gap-3"><div><h1 className="text-3xl font-bold leading-tight sm:text-4xl">{change.title}</h1><p className="muted mt-3 text-lg leading-7">{change.description}</p></div>{change.authorId === user?.id && <Link href={`/changes/${change.id}/edit`} aria-label="更新变化" className="grid h-11 w-11 shrink-0 place-items-center border hover:border-coral hover:text-coral" style={{ borderRadius: 4 }}><Pencil size={17} /></Link>}</div><div className="muted mt-5 flex flex-wrap items-center gap-4 text-sm"><Link href={`/u/${change.author.id}`} className="font-medium text-ink hover:text-coral">{change.author.name || "匿名变友"}</Link><span>第 <span className="numeric">{change.currentVersion.versionNumber}</span> 变</span><span>{formatDate(change.updatedAt)}</span></div><div className="mt-6 flex flex-wrap gap-3"><CollectButton id={change.id} initial={Boolean(collection)} /><MetricSummary hasSample={metrics.hasSufficientSample} rate={metrics.rate} runs={metrics.recentRunCount} /></div><MobileRunSheet changeId={change.id} initialInput={change.currentVersion.inputExample || ""} /><section className="mt-8"><div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-bold">变化配方</h2><button aria-label="复制变化配方" className="grid h-11 w-11 place-items-center border hover:border-coral hover:text-coral" style={{ borderRadius: 4 }}><Clipboard size={16} /></button></div><pre className="min-w-0 overflow-x-auto whitespace-pre border border-[#3A352E] bg-[#1E1B16] p-5 text-sm leading-7 text-[#EDE6D6]" style={{ borderRadius: 4 }}>{change.currentVersion.promptContent}</pre></section><section className="mt-7 grid gap-4 sm:grid-cols-2"><ExampleCard title="输入示例" value={change.currentVersion.inputExample || "等待你来试变"} /><ExampleCard title="输出示例" value={change.currentVersion.outputExample || "试变后见分晓"} /></section><ChangeGuidance category={change.category} /><section className="mt-8"><div className="mb-4 flex items-center justify-between"><div><p className="heading-kicker">同类变化</p><h2 className="mt-1 text-xl font-bold">这件事还可以这样变</h2></div><Link href={`/changes?category=${change.category}`} className="text-sm font-medium text-teal hover:text-coral">看全部</Link></div>{similarChanges.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{similarChanges.map((item) => <ChangeCard key={item.id} change={item} />)}</div> : <p className="panel muted p-5 text-sm">同类变化正在收集，先把这一变试透。</p>}</section><section className="mt-7"><h2 className="mb-3 text-xl font-bold">历次变化</h2><div className="flex flex-wrap gap-2">{change.versions.map((version) => <span key={version.id} className={`pill ${version.id === change.currentVersionId ? "border-moss bg-mist text-moss" : "muted bg-mist"}`}>第 <span className="numeric">{version.versionNumber}</span> 变 · {version.model.name}</span>)}</div></section><RunHistory changeId={change.id} initialRuns={initialRuns} initialCursor={initialCursor} /><CommentSection changeId={change.id} currentUserId={user?.id} /></article><aside className="hidden lg:sticky lg:top-5 lg:block lg:self-start"><RunPanel changeId={change.id} initialInput={change.currentVersion.inputExample || ""} /><div className="panel mt-4 p-5 text-sm"><p className="font-serif font-bold">参数</p><dl className="muted mt-3 space-y-2"><div className="flex justify-between"><dt>适用模型</dt><dd>{change.currentVersion.model.name}</dd></div><div className="flex justify-between"><dt>温度</dt><dd><span className="numeric">{change.currentVersion.temperature}</span></dd></div><div className="flex justify-between"><dt>最大输出长度</dt><dd><span className="numeric">{change.currentVersion.maxTokens}</span></dd></div></dl></div></aside></div></main>;
}

function MetricSummary({ hasSample, rate, runs }: { hasSample: boolean; rate: number; runs: number }) { return <div className="paper-surface min-w-[220px] border px-4 py-2 text-sm" style={{ borderRadius: 4 }}><div className="flex items-center justify-between gap-4"><strong className="text-moss">成变率 {hasSample ? <span className="numeric numeric-emphasis">{rate}%</span> : "待汇总"}</strong><span className="muted text-xs"><span className="numeric">30</span>天 <span className="numeric">{runs}</span> 次试变</span></div>{hasSample && <div className="mt-2 h-1 overflow-hidden bg-mist" style={{ borderRadius: 2 }}><div className="h-full bg-moss" style={{ width: `${rate}%` }} /></div>}</div>; }
function ExampleCard({ title, value }: { title: string; value: string }) { return <div className="panel min-w-0 p-5"><h2 className="font-serif font-bold">{title}</h2><p className="muted mt-3 whitespace-pre-wrap text-sm leading-6">{value}</p></div>; }
