CREATE TABLE "VerificationCode" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "used" BOOLEAN NOT NULL DEFAULT false,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VerificationCode_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VerificationCode_email_code_idx" ON "VerificationCode"("email", "code");
CREATE INDEX "VerificationCode_email_used_expiresAt_createdAt_idx" ON "VerificationCode"("email", "used", "expiresAt", "createdAt");
