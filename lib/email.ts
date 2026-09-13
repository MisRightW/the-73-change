import { Resend } from "resend";
import { render } from "@react-email/render";
import { MagicLinkEmail } from "@/emails/MagicLinkEmail";
import { VerificationCodeEmail } from "@/emails/VerificationCodeEmail";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Resend 邮件服务尚未配置");
  return new Resend(apiKey);
}

function getEmailFrom() {
  return process.env.EMAIL_FROM || "第73变 <onboarding@e.biubiuai.com.cn>";
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "未知收件人";
  return `${name.slice(0, 2)}***@${domain}`;
}

export async function sendMagicLinkEmail(email: string, url: string) {
  const resend = getResendClient();
  const html = await render(MagicLinkEmail({ url }));
  const text = `第73变\n\n点击以下链接登录：\n${url}\n\n链接将在 10 分钟后失效，且只能使用一次。\n如果不是你本人操作，请忽略此邮件。`;
  const { data, error } = await resend.emails.send({ from: getEmailFrom(), to: email, subject: "点击链接登录第73变", html, text });
  if (error) {
    console.error("Resend 魔法链接发送失败", { name: error.name, message: error.message });
    throw new Error(error.message || "魔法链接发送失败");
  }
  console.info("Resend 魔法链接已提交", { id: data?.id || "未知", 收件人: maskEmail(email), 发件人: getEmailFrom() });
}

export async function sendVerificationCodeEmail(email: string, code: string) {
  const resend = getResendClient();
  const html = await render(VerificationCodeEmail({ code }));
  const { error } = await resend.emails.send({ from: getEmailFrom(), to: email, subject: "第73变验证码", html });
  if (error) {
    console.error("Resend 验证邮件发送失败", { name: error.name, message: error.message });
    throw new Error(error.message || "邮件发送失败");
  }
}
