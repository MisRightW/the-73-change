import { CheckCircle2, ClipboardList, ScanSearch } from "lucide-react";
import { Category } from "@prisma/client";
import { guidanceByCategory } from "@/lib/content-curation";

export function ChangeGuidance({ category }: { category: Category }) {
  const guidance = guidanceByCategory[category];
  const items = [
    { icon: ClipboardList, title: "先备好素材", text: guidance.preparation },
    { icon: ScanSearch, title: "再核对结果", text: guidance.focus },
    { icon: CheckCircle2, title: "最后落到行动", text: guidance.followUp }
  ];
  return <section className="mt-8 border-t pt-8"><p className="heading-kicker">试变指南</p><h2 className="mt-1 text-xl font-bold">让这一变更容易成</h2><div className="mt-4 grid gap-3 sm:grid-cols-3">{items.map(({ icon: Icon, title, text }) => <article key={title} className="panel p-4"><Icon size={17} className="text-teal" aria-hidden="true" /><h3 className="mt-3 font-serif font-bold">{title}</h3><p className="muted mt-2 text-sm leading-6">{text}</p></article>)}</div></section>;
}
