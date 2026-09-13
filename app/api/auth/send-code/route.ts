import { NextRequest, NextResponse } from "next/server";
import { sendVerificationCodeEmail } from "@/lib/email";
import { takeEmailCodeLimit } from "@/lib/rate-limit";
import { createVerificationCode, deleteVerificationCode, generateVerificationCode, isValidEmail, normalizeEmail } from "@/lib/verification";

const diagnostics = globalThis as typeof globalThis & { latestEmailDeliveryFailure?: string };

function getClientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { email?: unknown };
    const email = normalizeEmail(body.email);
    if (!isValidEmail(email)) return NextResponse.json({ error: "请输入正确的邮箱地址" }, { status: 400 });
    const [emailLimit, ipLimit] = await Promise.all([takeEmailCodeLimit("email", email), takeEmailCodeLimit("emailIp", getClientIp(request))]);
    if (!emailLimit.allowed || !ipLimit.allowed) return NextResponse.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 });
    const code = generateVerificationCode();
    const record = await createVerificationCode(email, code);
    try {
      await sendVerificationCodeEmail(email, code);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      console.error("Verification code delivery failed", message);
      if (process.env.NODE_ENV === "development") diagnostics.latestEmailDeliveryFailure = message;
      await deleteVerificationCode(record.id);
      return NextResponse.json({ error: "验证码暂时无法发送，请稍后再试" }, { status: 500 });
    }
    return NextResponse.json({ sent: true });
  } catch {
    return NextResponse.json({ error: "验证码暂时无法发送，请稍后再试" }, { status: 500 });
  }
}

export async function GET() {
  if (process.env.NODE_ENV !== "development") return NextResponse.json({ error: "未找到" }, { status: 404 });
  return NextResponse.json({ latestFailure: diagnostics.latestEmailDeliveryFailure || null });
}
