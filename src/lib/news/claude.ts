import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

// 번역/요약/분류는 단순 작업이라 저비용 모델 사용 (PRD 13장)
const MODEL = "claude-haiku-5-5";

const client = new Anthropic(); // ANTHROPIC_API_KEY 환경변수

export type CategoryOption = {
  id: number;
  name: string;
  description: string | null;
};

export type TranslateInput = {
  id: number; // 호출 측이 결과를 매칭하기 위한 임시 키
  titleEn: string;
  content: string;
};

export type TranslateResult = {
  id: number;
  titleKo: string;
  summaryKo: string;
  categoryId: number | null;
};

export type ClassifyInput = {
  id: number;
  title: string;
  summary: string;
};

export type ClassifyResult = {
  id: number;
  categoryId: number | null;
};

const translateSchema = z.object({
  results: z.array(
    z.object({
      id: z.number(),
      titleKo: z.string(),
      summaryKo: z.string(),
      categoryId: z.number().nullable(),
    }),
  ),
});

const classifySchema = z.object({
  results: z.array(
    z.object({
      id: z.number(),
      categoryId: z.number().nullable(),
    }),
  ),
});

function categoriesBlock(categories: CategoryOption[]): string {
  if (categories.length === 0) return "(카테고리 없음 - categoryId는 항상 null)";
  return categories
    .map((c) => `- id=${c.id} | ${c.name}${c.description ? ` | 힌트: ${c.description}` : ""}`)
    .join("\n");
}

const CLASSIFY_RULE =
  "categoryId에는 아래 카테고리 목록 중 가장 알맞은 하나의 id만 넣는다. 어디에도 해당하지 않으면 null.";

// 목록에 없는 id가 오면 미분류(null)로 처리
function sanitizeCategory(id: number | null, categories: CategoryOption[]): number | null {
  return id !== null && categories.some((c) => c.id === id) ? id : null;
}

// 신규 기사: 한국어 제목 번역 + 한국어 요약 + 분류를 한 번에
export async function translateAndClassify(
  items: TranslateInput[],
  categories: CategoryOption[],
): Promise<TranslateResult[]> {
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    system:
      "너는 AI 뉴스 편집자다. 각 영문 기사에 대해 (1) titleKo: 자연스러운 한국어 제목, " +
      "(2) summaryKo: 핵심만 담은 한국어 요약 2~3문장(제공된 본문 범위 안에서만, 추측 금지), " +
      `(3) categoryId를 반환한다. ${CLASSIFY_RULE} 입력의 모든 id에 대해 결과를 하나씩 반환한다.`,
    messages: [
      {
        role: "user",
        content:
          `## 카테고리\n${categoriesBlock(categories)}\n\n## 기사\n` +
          JSON.stringify(items.map((i) => ({ id: i.id, title: i.titleEn, content: i.content }))),
      },
    ],
    output_config: { effort: "low", format: zodOutputFormat(translateSchema) },
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error(`Claude 응답을 사용할 수 없습니다 (stop_reason=${response.stop_reason})`);
  }

  return response.parsed_output.results.map((r) => ({
    ...r,
    categoryId: sanitizeCategory(r.categoryId, categories),
  }));
}

// 이미 번역된 기사: 현재 사용자 카테고리로 분류만
export async function classify(
  items: ClassifyInput[],
  categories: CategoryOption[],
): Promise<ClassifyResult[]> {
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    system:
      `너는 AI 뉴스 분류기다. 각 기사에 대해 categoryId를 반환한다. ${CLASSIFY_RULE} ` +
      "입력의 모든 id에 대해 결과를 하나씩 반환한다.",
    messages: [
      {
        role: "user",
        content: `## 카테고리\n${categoriesBlock(categories)}\n\n## 기사\n${JSON.stringify(items)}`,
      },
    ],
    output_config: { effort: "low", format: zodOutputFormat(classifySchema) },
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error(`Claude 응답을 사용할 수 없습니다 (stop_reason=${response.stop_reason})`);
  }

  return response.parsed_output.results.map((r) => ({
    ...r,
    categoryId: sanitizeCategory(r.categoryId, categories),
  }));
}
