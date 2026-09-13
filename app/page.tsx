import Link from "next/link";
import { ArrowRight, BarChart3, BriefcaseBusiness, Code2, GraduationCap, HeartHandshake, PenLine, ShoppingBag } from "lucide-react";
import { Category } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { categories, categoryLabels } from "@/lib/utils";
import { categoryContent, featuredTopics } from "@/lib/content-curation";
import { ChangeCard } from "@/components/change-card";
import { getRecommendations } from "@/lib/recommendations";
import { SearchBox } from "@/components/search-box";
import { ImmersiveChangeField } from "@/components/immersive-change-field";

export const dynamic = "force-dynamic";

const categoryIcons: Record<Category, typeof BriefcaseBusiness> = {
  WORKPLACE: BriefcaseBusiness, CONTENT: PenLine, DEVELOPMENT: Code2, LEARNING: GraduationCap,
  ECOMMERCE: ShoppingBag, DATA_ANALYSIS: BarChart3, LIFE: HeartHandshake
};

async function getHomeContent() {
  try {
    const [user, groups] = await Promise.all([getCurrentUser(), prisma.technique.groupBy({ by: ["category"], where: { published: true }, _count: { _all: true } })]);
    const counts = new Map(groups.map((item) => [item.category, item._count._all]));
    return { changes: await getRecommendations(user?.id || null), counts };
  } catch {
    return { changes: [], counts: new Map<Category, number>() };
  }
}

export default async function Home() {
  const { changes, counts } = await getHomeContent();
  const fieldChanges = changes.slice(0, 3).map((change) => ({ id: change.id, title: change.title, category: categoryLabels[change.category], rate: change.hasSufficientSample ? change.rate : undefined }));
  return <main>
    <section className="relative overflow-hidden border-b bg-[#171512] text-[#ede6d6]">
      <div className="shell grid max-w-7xl gap-8 py-8 sm:py-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center lg:gap-12 lg:py-16">
        <div className="relative z-10 order-2 lg:order-1"><span className="stamp-mark h-9 w-9 text-lg">变</span><p className="mt-5 text-xs font-semibold tracking-[0.2em] text-[#c9a96e]">THE <span className="numeric">73</span>RD CHANGE</p><h1 className="mt-4 max-w-xl font-serif text-4xl font-semibold leading-[1.12] sm:text-6xl">孙悟空有七十二变，<br />你有第 <span className="numeric text-[#c9a96e]">73</span> 变。</h1><p className="mt-6 max-w-lg text-sm leading-7 text-[#c4baaa] sm:text-base">从看懂配方到亲手试变，再把真实经验分享给大家。这里教你把 AI 用在每一件具体的小事上。</p><div className="mt-8 max-w-xl"><SearchBox variant="hero" /></div></div>
        <div className="order-1 lg:order-2"><ImmersiveChangeField changes={fieldChanges} /></div>
      </div>
    </section>
    <section className="border-b bg-[var(--card)]"><div className="shell py-12 sm:py-14"><div className="max-w-xl"><p className="heading-kicker">一条变法路径</p><h2 className="mt-2 font-serif text-2xl font-semibold sm:text-3xl">从看懂，到真的会用</h2><p className="muted mt-3 text-sm leading-6">每一次试变都是一次练习，每一句心得都会让下一位变友少走一步弯路。</p></div><div className="mt-9 grid gap-8 sm:grid-cols-3 sm:gap-6">{[{ number: "01", label: "看懂", title: "先看清楚为什么", text: "公开配方、输入和输出示例，知道每一步在解决什么。" }, { number: "02", label: "试变", title: "换成你的真实场景", text: "把自己的问题放进去，马上看到结果，也可以使用你配置的模型。" }, { number: "03", label: "分享", title: "把经验留给下一人", text: "投一票、写一句心得，帮助大家判断这一变是否真的成了。" }].map((step, index) => <div key={step.number} className="relative pl-12 sm:pl-0 sm:pr-5"><div className="absolute left-0 top-0 grid h-8 w-8 place-items-center border border-coral bg-[var(--card)] font-mono text-xs font-semibold text-coral sm:static sm:mb-5" style={{ borderRadius: 999 }}>{step.number}</div>{index < 2 && <span className="absolute left-4 top-8 h-[calc(100%+2rem)] w-px bg-[var(--line)] sm:left-auto sm:right-0 sm:top-4 sm:h-px sm:w-[calc(100%-1.5rem)]" aria-hidden="true" />}<p className="heading-kicker text-[11px]">{step.label}</p><h3 className="mt-2 font-serif text-lg font-semibold">{step.title}</h3><p className="muted mt-2 text-sm leading-6">{step.text}</p></div>)}</div></div></section>
    <section className="shell py-12"><div className="mb-5"><p className="heading-kicker">变什么</p><h2 className="mt-1 text-2xl font-semibold">从眼前这件事开始变</h2><p className="muted mt-2 text-sm">按场景找配方，先从最常遇到的问题下手。</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{categories.map((category) => { const Icon = categoryIcons[category.value]; const detail = categoryContent[category.value]; return <Link key={category.value} href={`/changes?category=${category.value}`} className="paper-surface group border p-4 hover:border-coral hover:shadow-[0_2px_5px_rgba(43,43,43,0.06)]" style={{ borderRadius: 4 }}><div className="flex items-start justify-between gap-4"><Icon size={19} className="text-teal group-hover:text-coral" aria-hidden="true" /><span className="numeric muted text-sm">{counts.get(category.value) || 0}</span></div><h3 className="mt-5 font-serif text-lg font-semibold">{category.label}</h3><p className="muted mt-2 text-sm leading-6">{detail.description}</p><p className="mt-3 text-xs font-medium text-teal">{detail.example}</p></Link>; })}</div></section>
    <section className="border-y bg-[var(--card)] py-12"><div className="shell"><div className="mb-6"><p className="heading-kicker">运营精选</p><h2 className="mt-1 text-2xl font-semibold">跟着一个专题，连着变几件事</h2></div><div className="grid gap-4 lg:grid-cols-3">{featuredTopics.map((topic) => <Link key={topic.title} href={topic.href} className="group border border-[var(--line)] p-5 hover:border-coral" style={{ borderRadius: 4 }}><p className="heading-kicker">{topic.eyebrow}</p><h3 className="mt-3 font-serif text-xl font-semibold group-hover:text-coral">{topic.title}</h3><p className="muted mt-3 text-sm leading-6">{topic.description}</p><div className="mt-5 flex items-center justify-between text-sm font-medium text-teal"><span>{topic.count}</span><ArrowRight size={16} aria-hidden="true" /></div></Link>)}</div></div></section>
    <section className="shell py-12"><div className="mb-6 flex items-center justify-between"><div><p className="heading-kicker">为你推荐</p><h2 className="mt-1 text-2xl font-semibold">值得先试一变</h2></div><Link href="/changes" className="inline-flex items-center gap-1 text-sm font-medium text-teal hover:text-coral">看全部变化 <ArrowRight size={16} aria-hidden="true" /></Link></div>{changes.length ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{changes.map((change) => <ChangeCard key={change.id} change={change} />)}</div> : <div className="panel muted p-10 text-center">还没有公开的变化，先授人以变吧。</div>}</section>
  </main>;
}
