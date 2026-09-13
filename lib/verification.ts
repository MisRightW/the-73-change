import { createHash, randomInt, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const codePattern = /^\d{6}$/;
const codeLifetimeMs = 10 * 60 * 1000;
const maxAttempts = 5;

export function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isValidEmail(email: string) { return emailPattern.test(email); }
export function isValidVerificationCode(code: unknown) { return typeof code === "string" && codePattern.test(code); }
export function generateVerificationCode() { return randomInt(0, 1_000_000).toString().padStart(6, "0"); }
export function hashVerificationCode(code: string) { return createHash("sha256").update(code).digest("hex"); }

function codeMatches(value: string, hashedCode: string) {
  const expected = Buffer.from(hashVerificationCode(value));
  const actual = Buffer.from(hashedCode);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function createVerificationCode(email: string, code: string) {
  const expiresAt = new Date(Date.now() + codeLifetimeMs);
  await prisma.verificationCode.updateMany({ where: { email, used: false }, data: { used: true } });
  return prisma.verificationCode.create({ data: { email, code: hashVerificationCode(code), expiresAt } });
}

export async function deleteVerificationCode(id: string) {
  await prisma.verificationCode.deleteMany({ where: { id, used: false } });
}

export async function consumeVerificationCode(email: string, code: string) {
  if (!isValidVerificationCode(code)) return false;
  return prisma.$transaction(async (tx) => {
    const record = await tx.verificationCode.findFirst({
      where: { email, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" }
    });
    if (!record || record.attempts >= maxAttempts) return false;
    if (!codeMatches(code, record.code)) {
      const attempts = record.attempts + 1;
      await tx.verificationCode.update({ where: { id: record.id }, data: { attempts, ...(attempts >= maxAttempts ? { used: true } : {}) } });
      return false;
    }
    const consumed = await tx.verificationCode.updateMany({ where: { id: record.id, used: false }, data: { used: true } });
    return consumed.count === 1;
  });
}

export async function checkVerificationCode(email: string, code: string) {
  if (!isValidVerificationCode(code)) return false;
  return prisma.$transaction(async (tx) => {
    const record = await tx.verificationCode.findFirst({
      where: { email, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" }
    });
    if (!record || record.attempts >= maxAttempts) return false;
    if (codeMatches(code, record.code)) return true;
    const attempts = record.attempts + 1;
    await tx.verificationCode.update({ where: { id: record.id }, data: { attempts, ...(attempts >= maxAttempts ? { used: true } : {}) } });
    return false;
  });
}
