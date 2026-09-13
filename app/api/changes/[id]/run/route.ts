import { NextResponse } from "next/server";
import { RunErrorType, RunStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runSchema } from "@/lib/validations";
import { takeDailyLimit } from "@/lib/rate-limit";
import { reportApiError } from "@/lib/observability";

const encoder = new TextEncoder();

class RunError extends Error {
  constructor(public type: RunErrorType, message: string) { super(message); }
}

function classifyError(error: unknown) {
  if (error instanceof RunError) return error;
  if (error instanceof DOMException && error.name === "AbortError") return new RunError(RunErrorType.TIMEOUT, "试变等待超过 30 秒，请稍后再试");
  return new RunError(RunErrorType.UNKNOWN, "试变暂时未成，请稍后再试");
}

function errorFromResponse(status: number, data: { error?: { message?: string; code?: string; type?: string }; message?: string }) {
  const message = data.error?.message || data.message || "试变暂时未成，请稍后再试";
  const code = `${data.error?.code || ""} ${data.error?.type || ""} ${message}`.toLowerCase();
  if (status === 401 || status === 403 || code.includes("api_key") || code.includes("authentication")) return new RunError(RunErrorType.API_KEY_ERROR, "平台试变能力尚未完成配置");
  if (code.includes("content_filter") || code.includes("safety") || code.includes("moderation")) return new RunError(RunErrorType.CONTENT_FILTER, "输入内容暂时无法试变，请调整后再试");
  if (status === 400 || code.includes("invalid")) return new RunError(RunErrorType.INVALID_INPUT, "这次输入无法试变，请检查内容后再试");
  return new RunError(RunErrorType.UNKNOWN, message);
}

function apiModelId(model: { id: string; name: string; provider: string }) {
  if (model.provider === "OPENAI") return model.id === "gpt-4o" ? "gpt-4o" : model.name;
  if (model.provider === "ANTHROPIC") return model.id === "claude-3-5" ? "claude-3-5-sonnet-latest" : model.name;
  return model.name;
}

async function consumeSse(response: Response, onData: (data: Record<string, unknown>) => void) {
  if (!response.body) throw new RunError(RunErrorType.UNKNOWN, "试变结果为空，请稍后再试");
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = "";
  const process = (chunk: string) => {
    for (const frame of chunk.split("\n\n")) {
      const data = frame.split("\n").filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trim()).join("\n");
      if (!data || data === "[DONE]") continue;
      try { onData(JSON.parse(data)); } catch { /* Ignore provider keepalive frames. */ }
    }
  };
  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done }).replaceAll("\r\n", "\n");
    const boundary = buffer.lastIndexOf("\n\n");
    if (boundary >= 0) { process(buffer.slice(0, boundary)); buffer = buffer.slice(boundary + 2); }
    if (done) break;
  }
  if (buffer.trim()) process(buffer);
}

async function streamModel(model: { id: string; name: string; provider: string }, prompt: string, temperature: number, maxTokens: number, onText: (text: string) => void) {
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    if (model.provider === "OPENAI") {
      if (!process.env.OPENAI_API_KEY) throw new RunError(RunErrorType.API_KEY_ERROR, "平台试变能力尚未完成配置");
      const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
      const response = await fetch(`${baseUrl}/chat/completions`, { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: JSON.stringify({ model: apiModelId(model), stream: true, messages: [{ role: "user", content: prompt }], temperature, max_tokens: maxTokens }) });
      if (!response.ok) throw errorFromResponse(response.status, await response.json());
      await consumeSse(response, (data) => { const delta = (data.choices as Array<{ delta?: { content?: string } }> | undefined)?.[0]?.delta?.content; if (delta) onText(delta); });
      return;
    }
    if (model.provider === "ANTHROPIC") {
      if (!process.env.ANTHROPIC_API_KEY) throw new RunError(RunErrorType.API_KEY_ERROR, "平台试变能力尚未完成配置");
      const response = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: apiModelId(model), stream: true, max_tokens: maxTokens, temperature, messages: [{ role: "user", content: prompt }] }) });
      if (!response.ok) throw errorFromResponse(response.status, await response.json());
      await consumeSse(response, (data) => { const delta = (data.delta as { text?: string } | undefined)?.text; if (delta) onText(delta); });
      return;
    }
    throw new RunError(RunErrorType.UNKNOWN, "该模型暂未接入试变能力");
  } finally { clearTimeout(timeout); }
}

async function persistFailure(data: { techniqueId: string; versionId: string; userId: string; input: string; model: string; started: number; error: RunError }) {
  await prisma.techniqueRun.create({ data: { techniqueId: data.techniqueId, versionId: data.versionId, userId: data.userId, input: data.input, model: data.model, status: data.error.type === RunErrorType.TIMEOUT ? RunStatus.TIMEOUT : RunStatus.ERROR, errorType: data.error.type, errorMessage: data.error.message, durationMs: Date.now() - data.started } });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "请先登录后再试变", errorType: RunErrorType.INVALID_INPUT }, { status: 401 });
  const parsed = runSchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "请输入要试变的内容", errorType: RunErrorType.INVALID_INPUT }, { status: 400 });
  const limit = await takeDailyLimit("run", user.id);
  if (!limit.allowed) return NextResponse.json({ error: "今日试变次数已达 20 次", errorType: RunErrorType.INVALID_INPUT }, { status: 429 });
  const technique = await prisma.technique.findUnique({ where: { id: params.id }, include: { currentVersion: { include: { model: true } } } });
  if (!technique || !technique.currentVersion || (!technique.published && technique.authorId !== user.id)) return NextResponse.json({ error: "未找到这一变", errorType: RunErrorType.INVALID_INPUT }, { status: 404 });
  const version = parsed.data.versionId ? await prisma.techniqueVersion.findFirst({ where: { id: parsed.data.versionId, techniqueId: technique.id }, include: { model: true } }) : technique.currentVersion;
  if (!version) return NextResponse.json({ error: "未找到这个版本", errorType: RunErrorType.INVALID_INPUT }, { status: 404 });
  const prompt = version.promptContent.includes("{{input}}") ? version.promptContent.replaceAll("{{input}}", parsed.data.input) : `${version.promptContent}\n\n${parsed.data.input}`;
  const started = Date.now();
  if (version.model.provider !== "OPENAI" && version.model.provider !== "ANTHROPIC") {
    const error = new RunError(RunErrorType.UNKNOWN, "该模型暂未接入试变能力");
    await persistFailure({ techniqueId: technique.id, versionId: version.id, userId: user.id, input: parsed.data.input, model: version.model.name, started, error });
    return NextResponse.json({ error: error.message, errorType: error.type }, { status: 422 });
  }
  const stream = new ReadableStream({
    async start(controller) {
      let output = "";
      const send = (event: string, payload: object) => controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`));
      try {
        await streamModel(version.model, prompt, version.temperature, version.maxTokens, (text) => { output += text; send("text", { text }); });
        const run = await prisma.techniqueRun.create({ data: { techniqueId: technique.id, versionId: version.id, userId: user.id, input: parsed.data.input, output, model: version.model.name, status: RunStatus.SUCCESS, durationMs: Date.now() - started } });
        send("complete", { runId: run.id, output, durationMs: run.durationMs, remaining: limit.remaining });
      } catch (cause) {
        const error = classifyError(cause);
        reportApiError("changes.run", cause, { techniqueId: technique.id, userId: user.id, errorType: error.type });
        await persistFailure({ techniqueId: technique.id, versionId: version.id, userId: user.id, input: parsed.data.input, model: version.model.name, started, error });
        send("error", { error: error.message, errorType: error.type });
      } finally { controller.close(); }
    }
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" } });
}
