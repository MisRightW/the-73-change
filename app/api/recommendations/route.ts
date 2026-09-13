import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateChangeMetrics } from "@/lib/change-metrics";
import { getRecommendations } from "@/lib/recommendations";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json(await getRecommendations(user?.id || null));
}
