# 第73变

AI 实用变化分享与验证平台。每个变化都是可直接试变的配方：看得到提示词，试得出结果，再决定是否收入锦囊。

## 技术栈

Next.js 14 App Router、TypeScript、Tailwind CSS、Prisma、PostgreSQL、NextAuth、OpenAI / Anthropic API。

## 本地启动

1. 安装依赖：`npm install`
2. 复制环境变量：`cp .env.example .env`
3. 填入 PostgreSQL 连接、NextAuth 密钥和 Resend 配置。
4. 初始化数据库：`npm run db:push && npm run db:seed`
5. 启动：`npm run dev`

浏览器打开 `http://localhost:3000`。

## 环境变量

| 变量 | 用途 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL 连接字符串（Supabase 可直接使用） |
| `NEXTAUTH_URL` | 本地为 `http://localhost:3000`，部署后填写正式域名 |
| `NEXTAUTH_SECRET` | NextAuth 会话签名密钥 |
| `RESEND_API_KEY` | Resend 邮件服务密钥，用于发送邮箱登录链接 |
| `EMAIL_FROM` | 发件人地址，例如 `第73变 <onboarding@e.biubiuai.com.cn>` |
| `OPENAI_API_KEY` | GPT 系列试变能力 |
| `OPENAI_BASE_URL` | 可选。OpenAI 兼容服务的 API 根地址，默认 `https://api.openai.com/v1` |
| `OPENAI_IMPORT_MODEL` | 可选。导入提示词时使用的 OpenAI 兼容模型，默认 `gpt-4o-mini` |
| `ANTHROPIC_API_KEY` | Claude 系列试变能力 |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis 限额服务凭据 |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | 可选。服务端与浏览器错误追踪地址（DSN 可公开） |

邮箱登录链接会回到 `NEXTAUTH_URL` 指定的站点；生产环境请将 `NEXTAUTH_URL` 设置为正式域名，并确认 `EMAIL_FROM` 使用已在 Resend 验证的域名。

## 部署到 Vercel

1. 将仓库导入 Vercel。
2. 创建 Supabase PostgreSQL 数据库，并在 Vercel 的 Environment Variables 配置上表所有变量。
3. 在部署环境执行 `npx prisma db push && npm run db:seed` 一次。
4. 部署后，确认 `EMAIL_FROM` 使用已在 Resend 验证的域名，并更新 `NEXTAUTH_URL`。

Vercel 构建会自动生成 Prisma Client。数据库迁移可在团队正式上线前改用 `prisma migrate deploy` 管理。
