import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChangeForm } from "@/components/change-form";
export const metadata = { title: "授人以变" };
export default async function NewChangePage() { if (!await getCurrentUser()) redirect("/login"); const models = await prisma.model.findMany({ where: { isActive: true }, select: { id: true, name: true } }); return <main className="shell max-w-3xl py-10"><p className="heading-kicker">授人以变</p><h1 className="mt-1 text-3xl font-bold">把你的第 73 变交给大家</h1><p className="muted mt-2">写清楚配方和示例，让别人能立刻试变。</p><div className="mt-7"><ChangeForm models={models}/></div></main>; }
