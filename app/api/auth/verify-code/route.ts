import { NextRequest, NextResponse } from "next/server";
import { checkVerificationCode, isValidEmail, isValidVerificationCode, normalizeEmail } from "@/lib/verification";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { email?: unknown; code?: unknown };
    const email = normalizeEmail(body.email);
    const code = typeof body.code === "string" ? body.code : "";
    if (!isValidEmail(email) || !isValidVerificationCode(code)) return NextResponse.json({ valid: false });
    return NextResponse.json({ valid: await checkVerificationCode(email, code) });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
