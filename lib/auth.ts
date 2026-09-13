import { PrismaAdapter } from "@auth/prisma-adapter";
import { getServerSession, type NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import type { Provider } from "next-auth/providers/index";
import { prisma } from "@/lib/prisma";
import { sendMagicLinkEmail } from "@/lib/email";
import { normalizeEmail } from "@/lib/verification";

const providers: Provider[] = [
  EmailProvider({
    server: { host: "localhost", port: 25 },
    from: process.env.EMAIL_FROM || "第73变 <onboarding@e.biubiuai.com.cn>",
    maxAge: 10 * 60,
    normalizeIdentifier: (identifier) => normalizeEmail(identifier),
    async sendVerificationRequest({ identifier, url }) {
      await sendMagicLinkEmail(identifier, url);
    }
  })
];

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma), providers, session: { strategy: "jwt" }, pages: { signIn: "/login" }
};
export const getCurrentUser = async () => {
  const session = await getServerSession(authOptions);
  return session?.user?.email ? prisma.user.findUnique({ where: { email: session.user.email } }) : null;
};
