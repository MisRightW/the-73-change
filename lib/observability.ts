import * as Sentry from "@sentry/nextjs";

export function reportApiError(operation: string, error: unknown, context: Record<string, string | number | boolean | undefined> = {}) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ level: "error", operation, message, ...context }));
  Sentry.withScope((scope) => { scope.setTag("operation", operation); scope.setContext("request", context); Sentry.captureException(error); });
}
