import { Body, Button, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import * as React from "react";

export function MagicLinkEmail({ url }: { url: string }) {
  return <Html lang="zh-CN"><Head /><Preview>点击链接登录第73变</Preview><Body style={body}><Container style={container}><Heading style={heading}>第73变</Heading><Text style={text}>有人正在用这个邮箱登录第73变。</Text><Button href={url} style={button}>一键登录</Button><Text style={hint}>链接将在 10 分钟后失效，且只能使用一次。</Text><Text style={notice}>如果不是你本人操作，请忽略此邮件。请勿转发登录链接。</Text></Container></Body></Html>;
}

const body = { backgroundColor: "#F7F3EB", color: "#2B2B2B", fontFamily: '"Noto Sans SC", "PingFang SC", sans-serif', margin: "0", padding: "24px" };
const container = { backgroundColor: "#FFFFFF", border: "1px solid #E5DFD3", borderRadius: "6px", margin: "0 auto", maxWidth: "520px", padding: "32px" };
const heading = { color: "#C3272B", fontFamily: '"Noto Serif SC", serif', fontSize: "28px", margin: "0 0 20px" };
const text = { fontSize: "15px", lineHeight: "1.7", margin: "12px 0" };
const button = { backgroundColor: "#C3272B", borderRadius: "4px", color: "#FFFFFF", display: "inline-block", fontSize: "16px", fontWeight: "600", padding: "12px 24px", textDecoration: "none", margin: "16px 0" };
const hint = { color: "#6F6A61", fontSize: "13px", lineHeight: "1.7", margin: "8px 0" };
const notice = { color: "#6F6A61", fontSize: "13px", lineHeight: "1.7", marginTop: "24px" };
