import { NextRequest, NextResponse } from "next/server";
import { Category } from "@prisma/client";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { takeDailyLimit } from "@/lib/rate-limit";
import { reportApiError } from "@/lib/observability";

const importResultSchema = z.object({ title: z.string().trim().min(1).max(20), description: z.string().trim().min(1).max(50), category: z.nativeEnum(Category), tags: z.array(z.string().trim().min(1).max(30)).min(3).max(5), inputExample: z.string().trim().min(1).max(4000), outputExample: z.string().max(8000).optional().default(""), hasInputPlaceholder: z.boolean() });

function parseJson(content: string) {
  const cleaned = content.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(cleaned);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "请先登录后再导入变化" }, { status: 401 });
  const body = await request.json(); const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt || prompt.length > 12000) return NextResponse.json({ error: "请粘贴不超过 12000 字的提示词内容" }, { status: 400 });
  const rate = await takeDailyLimit("import", user.id); if (!rate.allowed) return NextResponse.json({ error: "今日导入次数已达 10 次" }, { status: 429 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "平台导入能力尚未完成配置" }, { status: 503 });
  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
  let response: Response;
  try { response = await fetch(`${baseUrl}/chat/completions`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: JSON.stringify({ model: process.env.OPENAI_IMPORT_MODEL || "gpt-4o-mini", temperature: 0.2, response_format: { type: "json_object" }, messages: [{ role: "system", content: "你是第73变的结构化编辑。把用户给出的提示词转换为严格 JSON。字段：title(不超过20字)、description(不超过50字)、category(只能是 WORKPLACE/CONTENT/DEVELOPMENT/LEARNING/ECOMMERCE/DATA_ANALYSIS/LIFE)、tags(3到5个)、inputExample、outputExample、hasInputPlaceholder。保留原提示词用途，不要编造危险承诺。" }, { role: "user", content: prompt }] }) }); }
  catch (error) { reportApiError("changes.import", error, { userId: user.id }); return NextResponse.json({ error: "导入暂时未成，请稍后再试" }, { status: 502 }); }
  const data = await response.json();
  if (!response.ok) { reportApiError("changes.import", new Error(data.error?.message || "导入上游失败"), { userId: user.id, status: response.status }); return NextResponse.json({ error: data.error?.message || "导入暂时未成，请稍后再试" }, { status: 502 }); }
  try { const parsed = importResultSchema.parse(parseJson(data.choices?.[0]?.message?.content || "")); return NextResponse.json({ ...parsed, promptContent: prompt, remaining: rate.remaining }); }
  catch { return NextResponse.json({ error: "这段内容暂时无法整理成变化，请稍作调整后再试" }, { status: 422 }); }
}
