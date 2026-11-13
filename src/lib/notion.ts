// Notion 데이터베이스(제목/요약/출처/카테고리/날짜)에 뉴스 한 건을 페이지로 저장한다.
// 토큰/DB ID는 서버 환경변수(NOTION_API_TOKEN, NOTION_DATABASE_ID)에서만 읽는다.

const NOTION_VERSION = "2022-06-28";
const TEXT_LIMIT = 2000; // Notion rich_text 한 덩어리 최대 길이

export type NewsPageInput = {
  title: string;
  summary: string;
  url: string;
  category: string | null;
  publishedAt: Date | null;
};

function clip(text: string) {
  return text.length > TEXT_LIMIT ? text.slice(0, TEXT_LIMIT - 1) + "…" : text;
}

export async function createNewsPage(input: NewsPageInput): Promise<string> {
  const token = process.env.NOTION_API_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!token || !databaseId) {
    throw new Error("Notion 환경변수(NOTION_API_TOKEN, NOTION_DATABASE_ID)가 설정되지 않았습니다.");
  }

  const properties: Record<string, unknown> = {
    제목: { title: [{ text: { content: clip(input.title) } }] },
    요약: { rich_text: [{ text: { content: clip(input.summary) } }] },
    출처: { url: input.url },
  };
  if (input.category) properties["카테고리"] = { select: { name: input.category } };
  if (input.publishedAt) {
    properties["날짜"] = { date: { start: input.publishedAt.toISOString() } };
  }

  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ parent: { database_id: databaseId }, properties }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(`Notion 저장 실패 (${res.status}): ${body?.message ?? res.statusText}`);
  }

  const page = (await res.json()) as { url: string };
  return page.url;
}
