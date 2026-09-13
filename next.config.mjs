import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = { output: "standalone", experimental: { serverActions: { bodySizeLimit: "1mb" } } };
export default withSentryConfig(nextConfig, { silent: true }, { tunnelRoute: "/monitoring" });
