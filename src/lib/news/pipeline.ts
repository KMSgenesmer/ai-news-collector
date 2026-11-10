import { insertArticles } from "@/db/queries";
import { fetchFeed, type RawArticle } from "./rss";
import { NEWS_SOURCES } from "./sources";

export type FetchError = { target: string; reason: string };

export type FetchResult = {
  fetched: number; // 지난 24시간 내 RSS에서 읽은 기사 수 (URL 중복 제거 후)
  added: number; // 새로 저장된 기사 수
  skipped: number; // 이미 저장돼 있어 건너뛴 수
  errors: FetchError[];
};

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

// RSS 수집 → 24시간 필터(rss.ts) → articles 저장. 분류/번역은 하지 않는다.
// title_ko / summary_ko는 번역 기능 전까지 영문 제목 / 원문 요약을 임시로 넣는다.
export async function runFetch(): Promise<FetchResult> {
  const result: FetchResult = { fetched: 0, added: 0, skipped: 0, errors: [] };

  // 한 소스가 실패해도 나머지는 진행
  const feeds = await Promise.allSettled(NEWS_SOURCES.map(fetchFeed));
  const byUrl = new Map<string, RawArticle>(); // 소스 간 URL 중복 제거
  feeds.forEach((f, i) => {
    if (f.status === "fulfilled") {
      for (const a of f.value) if (!byUrl.has(a.url)) byUrl.set(a.url, a);
    } else {
      result.errors.push({ target: NEWS_SOURCES[i].name, reason: errMsg(f.reason) });
    }
  });

  const raw = [...byUrl.values()];
  result.fetched = raw.length;
  if (raw.length === 0) return result;

  try {
    // url UNIQUE + onConflictDoNothing → 이미 있는 URL은 삽입되지 않음
    const inserted = await insertArticles(
      raw.map((a) => ({
        url: a.url,
        source: a.source,
        titleEn: a.titleEn,
        titleKo: a.titleEn,
        summaryKo: a.summary || a.titleEn,
        imageUrl: a.imageUrl,
        publishedAt: a.publishedAt,
      })),
    );
    result.added = inserted.length;
    result.skipped = raw.length - inserted.length;
  } catch (e) {
    result.errors.push({ target: "DB 저장", reason: errMsg(e) });
  }

  return result;
}
