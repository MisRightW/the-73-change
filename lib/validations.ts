import { Category } from "@prisma/client";
import { z } from "zod";

export const changeSchema = z.object({
  title: z.string().trim().min(2).max(100), description: z.string().trim().min(4).max(280),
  category: z.nativeEnum(Category), modelId: z.string().min(1), promptContent: z.string().trim().min(1).max(12000),
  temperature: z.coerce.number().min(0).max(2), maxTokens: z.coerce.number().int().min(64).max(8192),
  inputExample: z.string().max(4000).optional().nullable(), outputExample: z.string().max(8000).optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(30)).max(8), published: z.boolean(), changelog: z.string().max(300).optional().nullable()
});
export const runSchema = z.object({ input: z.string().trim().min(1).max(8000), versionId: z.string().optional() });
