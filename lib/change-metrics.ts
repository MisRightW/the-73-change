import { VoteValue } from "@prisma/client";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const Z_95 = 1.96;

export type ChangeMetricRun = { createdAt: Date; vote?: { value: VoteValue } | null };

export function wilsonLowerBound(successes: number, total: number, z = Z_95) {
  if (total <= 0) return 0;
  const proportion = successes / total;
  const zSquared = z * z;
  return Math.max(0, (proportion + zSquared / (2 * total) - z * Math.sqrt((proportion * (1 - proportion) + zSquared / (4 * total)) / total)) / (1 + zSquared / total));
}

function ageWeight(createdAt: Date, now: Date) {
  const age = now.getTime() - createdAt.getTime();
  if (age <= SEVEN_DAYS_MS) return 1;
  if (age <= THIRTY_DAYS_MS) return 0.5;
  return 0;
}

export function calculateChangeMetrics(runs: ChangeMetricRun[], now = new Date()) {
  const recentRuns = runs.filter((run) => ageWeight(run.createdAt, now) > 0);
  const weightedTotal = recentRuns.reduce((sum, run) => sum + ageWeight(run.createdAt, now), 0);
  const weightedValid = recentRuns.reduce((sum, run) => sum + (run.vote?.value === VoteValue.VALID ? ageWeight(run.createdAt, now) : 0), 0);
  const rate = Math.round(wilsonLowerBound(weightedValid, weightedTotal) * 100);
  return {
    rate,
    recentRunCount: recentRuns.length,
    hasSufficientSample: recentRuns.length >= 5
  };
}
