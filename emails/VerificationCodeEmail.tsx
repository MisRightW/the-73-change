import { Body, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";
import * as React from "react";

export function VerificationCodeEmail({ code }: { code: string }) {
  return <Html lang="zh-CN"><Head /><Preview>第73变验证码：{code}</Preview><Body style={body}><Container style={container}><Heading style={heading}>第73变</Heading><Text style={text}>你的登录验证码是</Text><Section style={codeBox}><Text style={codeText}>{code}</Text></Section><Text style={text}>验证码将在 10 分钟后失效。</Text><Text style={notice}>为保障账号安全，请勿向任何人透露验证码。若非本人操作，请忽略此邮件。</Text></Container></Body></Html>;
}

const body = { backgroundColor: "#F7F3EB", color: "#2B2B2B", fontFamily: '"Noto Sans SC", "PingFang SC", sans-serif', margin: "0", padding: "24px" };
const container = { backgroundColor: "#FFFFFF", border: "1px solid #E5DFD3", borderRadius: "6px", margin: "0 auto", maxWidth: "520px", padding: "32px" };
const heading = { color: "#C3272B", fontFamily: '"Noto Serif SC", serif', fontSize: "28px", margin: "0 0 20px" };
const text = { fontSize: "15px", lineHeight: "1.7", margin: "12px 0" };
const codeBox = { backgroundColor: "#F7F3EB", border: "1px solid #E5DFD3", borderRadius: "4px", margin: "20px 0", textAlign: "center" as const };
const codeText = { color: "#C3272B", fontFamily: "monospace", fontSize: "34px", fontWeight: "700", letterSpacing: "8px", margin: "18px 0 18px 8px" };
const notice = { color: "#6F6A61", fontSize: "13px", lineHeight: "1.7", marginTop: "24px" };
