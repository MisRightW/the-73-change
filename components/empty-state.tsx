import Link from "next/link";
import { ArrowRight, ScrollText } from "lucide-react";

export function EmptyState({ title, description, actionHref = "/changes", actionLabel = "去找变化" }: { title: string; description: string; actionHref?: string; actionLabel?: string }) {
  return <div className="panel muted flex flex-col items-center p-8 text-center"><ScrollText size={25} className="text-teal" aria-hidden="true" /><h3 className="mt-3 font-serif text-lg font-bold text-ink">{title}</h3><p className="mt-2 max-w-sm text-sm leading-6">{description}</p><Link href={actionHref} className="mt-4 inline-flex h-11 items-center gap-1 text-sm font-medium text-teal hover:text-coral">{actionLabel}<ArrowRight size={15} aria-hidden="true" /></Link></div>;
}
