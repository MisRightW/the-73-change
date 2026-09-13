import { Category } from "@prisma/client";

export const categoryContent: Record<Category, { description: string; example: string }> = {
  WORKPLACE: { description: "把交付、沟通和协作里的重复劳动交给变化。", example: "会议纪要、周报、邮件" },
  CONTENT: { description: "从选题到成稿，让每一次表达更有方向。", example: "短视频、图文、公众号" },
  DEVELOPMENT: { description: "用清晰的上下文，换回更可靠的代码答案。", example: "审查、测试、排障" },
  LEARNING: { description: "把陌生知识拆成能理解、能复习的步骤。", example: "概念、外语、复盘" },
  ECOMMERCE: { description: "围绕商品、用户和转化，少走重复的运营弯路。", example: "标题、客服、评价" },
  DATA_ANALYSIS: { description: "从数据表中找到异常、结论和下一步动作。", example: "报表、洞察、诊断" },
  LIFE: { description: "把琐碎计划理顺，把时间留给真正想做的事。", example: "出行、饮食、整理" }
};

export const featuredTopics = [
  { title: "一周交付加速", description: "从开会到汇报，把职场里最常见的交付先变顺。", href: "/changes?category=WORKPLACE", eyebrow: "本周专题", count: "3 个起手变化" },
  { title: "把内容写到能发布", description: "选题、标题、脚本与长文结构，一次补齐表达链路。", href: "/changes?category=CONTENT", eyebrow: "编辑精选", count: "4 个创作变化" },
  { title: "开发者的省时配方", description: "先让 AI 帮你发现问题，再决定下一行代码怎么写。", href: "/changes?category=DEVELOPMENT", eyebrow: "持续更新", count: "4 个开发变化" }
];

export const guidanceByCategory: Record<Category, { preparation: string; focus: string; followUp: string }> = {
  WORKPLACE: { preparation: "保留人物、时间、目标和约束，原始素材越完整越好。", focus: "先看结论和待办是否准确，再调整语气与格式。", followUp: "把最终版本贴回工作流，下一次可直接复用同一输入结构。" },
  CONTENT: { preparation: "说明受众、平台、产品卖点和希望的表达边界。", focus: "优先检查事实、品牌口吻和不该夸大的承诺。", followUp: "把可用段落拆进标题、正文和发布素材，而非整段照搬。" },
  DEVELOPMENT: { preparation: "给出最小可复现代码、报错信息、语言版本和预期行为。", focus: "逐条验证建议，尤其留意安全、边界条件和依赖版本。", followUp: "把最终修改与测试结果一起保存，方便团队复盘。" },
  LEARNING: { preparation: "说明已有基础、学习目标和最卡住的具体地方。", focus: "确认解释是否真的能复述，而不只是看起来通顺。", followUp: "把输出改写成自己的例子，再安排一次间隔复习。" },
  ECOMMERCE: { preparation: "提供商品信息、目标人群、平台规则和不可触碰的表述。", focus: "核对规格、价格与承诺，避免生成未经证实的信息。", followUp: "挑选 1 至 2 个版本小范围测试，再根据数据迭代。" },
  DATA_ANALYSIS: { preparation: "说明数据口径、时间范围、指标含义与想解决的问题。", focus: "确认结论与数据一致，区分事实、假设和下一步验证。", followUp: "把结论落成可执行动作，并补充后续观察指标。" },
  LIFE: { preparation: "写清时间、预算、偏好和必须避开的限制。", focus: "先检查计划是否现实，再按自己的节奏删减或调整。", followUp: "把真正执行过的版本留下，下一次会更贴合自己。" }
};
