import {
  ensureDefaultCategories,
  findArticlesByUrls,
  getClassifiedArticleIds,
  getUserCategoriesForClassify,
  insertArticles,
  upsertClassifications,
} from "@/db/queries";
import { classify, translateAndClassify } from "./claude";
import { fetchFeed, type RawArticle } from "./rss";
import { NEWS_SOURCES } from "./sources";

const BATCH_SIZE = 10;

export type FetchError = { target: string; reason: string };

export type FetchResult = {
  fetched: number; // 지난 24시간 내 RSS에서 읽은 기사 수 (URL 중복 제거 후)
  added: number; // 새로 저장된 기사 수 (번역·요약 완료)
  skipped: number; // 이미 저장돼 있던 기사 수
  classified: number; // 이번에 내 카테고리로 분류된 기사 수 (신규 + 기존)
  errors: FetchError[];
};

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// RSS 수집 → 신규 기사만 한국어 번역/요약/분류 → 저장.
// 이미 다른 사용자가 처리한 기사는 번역을 건너뛰고 현재 사용자 기준 분류만 한다.
export async function runFetch(userId: string): Promise<FetchResult> {
  const result: FetchResult = { fetched: 0, added: 0, skipped: 0, classified: 0, errors: [] };

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

  let categories;
  let existing;
  try {
    await ensureDefaultCategories(userId);
    [categories, existing] = await Promise.all([
      getUserCategoriesForClassify(userId),
      findArticlesByUrls(raw.map((a) => a.url)),
    ]);
  } catch (e) {
    result.errors.push({ target: "DB 조회", reason: errMsg(e) });
    return result;
  }

  const existingUrls = new Set(existing.map((a) => a.url));
  const fresh = raw.filter((a) => !existingUrls.has(a.url));
  result.skipped = raw.length - fresh.length;

  // 1) 신규 기사: 번역 + 요약 + 분류 (배치). 번역에 실패한 배치는 저장하지 않는다
  //    (영문 임시값을 저장하면 다음 가져오기 때 중복으로 건너뛰어 영영 번역되지 않음)
  for (const [bi, batch] of chunk(fresh, BATCH_SIZE).entries()) {
    const label = `번역 배치 ${bi + 1}`;
    try {
      const items = batch.map((a, i) => ({ id: i, titleEn: a.titleEn, content: a.summary }));
      const translated = new Map(
        (await translateAndClassify(items, categories)).map((r) => [r.id, r]),
      );

      const rows = batch.flatMap((a, i) => {
        const t = translated.get(i);
        return t
          ? [{
              url: a.url,
              source: a.source,
              titleEn: a.titleEn,
              titleKo: t.titleKo,
              summaryKo: t.summaryKo,
              imageUrl: a.imageUrl,
              publishedAt: a.publishedAt,
            }]
          : [];
      });
      const inserted = await insertArticles(rows);
      const idByUrl = new Map(inserted.map((r) => [r.url, r.id]));
      result.added += inserted.length;

      const classifications = batch.flatMap((a, i) => {
        const articleId = idByUrl.get(a.url);
        const t = translated.get(i);
        return articleId !== undefined && t
          ? [{ userId, articleId, categoryId: t.categoryId }]
          : [];
      });
      await upsertClassifications(classifications);
      result.classified += classifications.length;

      if (rows.length < batch.length) {
        result.errors.push({ target: label, reason: "일부 기사의 번역 결과가 누락되어 건너뜀" });
      }
    } catch (e) {
      result.errors.push({ target: label, reason: errMsg(e) });
    }
  }

  // 2) 이미 저장된 기사 중 내 분류가 없는 것: 번역 없이 분류만
  try {
    const classifiedIds = await getClassifiedArticleIds(
      userId,
      existing.map((a) => a.id),
    );
    const pending = existing.filter((a) => !classifiedIds.has(a.id));

    for (const [bi, batch] of chunk(pending, BATCH_SIZE).entries()) {
      try {
        const results = await classify(
          batch.map((a) => ({ id: a.id, title: a.titleKo, summary: a.summaryKo })),
          categories,
        );
        const rows = results.map((r) => ({ userId, articleId: r.id, categoryId: r.categoryId }));
        await upsertClassifications(rows);
        result.classified += rows.length;
      } catch (e) {
        result.errors.push({ target: `분류 배치 ${bi + 1}`, reason: errMsg(e) });
      }
    }
  } catch (e) {
    result.errors.push({ target: "분류 조회", reason: errMsg(e) });
  }

  return result;
}
