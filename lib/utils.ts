import { Category, VoteValue } from "@prisma/client";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export const categoryLabels: Record<Category, string> = {
  WORKPLACE: "职场效率", CONTENT: "内容创作", DEVELOPMENT: "编程开发",
  LEARNING: "学习辅导", ECOMMERCE: "电商运营", DATA_ANALYSIS: "数据分析", LIFE: "生活助手"
};
export const categories = Object.entries(categoryLabels).map(([value, label]) => ({ value: value as Category, label }));
export const voteLabels: Record<VoteValue, string> = { VALID: "这一变，成了", PARTIAL: "部分成了", INVALID: "没成" };
export function changeRate(valid: number, total: number) { return total ? Math.round((valid / total) * 100) : 0; }
export function formatDate(value: Date | string) { return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(new Date(value)); }
