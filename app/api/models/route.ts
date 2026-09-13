import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export const GET = async () => NextResponse.json(await prisma.model.findMany({ where: { isActive: true }, select: { id: true, name: true, provider: true }, orderBy: { name: "asc" } }));
