import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "./index";
import {
  articleCategories,
  articles,
  categories,
  notionSaves,
  type NewArticle,
  type NewArticleCategory,
} from "./schema";

const ARTICLE_LIMIT = 60;

export type DashboardArticle = {
  id: number;
  url: string;
  source: string;
  titleKo: string;
  summaryKo: string;
  publishedAt: Date | null;
  categoryId: number | null;
  categoryName: string | null;
  saved: boolean;
};

// 최신순(발행일 내림차순, 발행일 없는 기사는 뒤로). 분류/저장 여부는 현재 사용자 기준.
export async function getDashboardArticles(
  userId: string,
): Promise<DashboardArticle[]> {
  const rows = await db
    .select({
      id: articles.id,
      url: articles.url,
      source: articles.source,
      titleKo: articles.titleKo,
      summaryKo: articles.summaryKo,
      publishedAt: articles.publishedAt,
      categoryId: categories.id,
      categoryName: categories.name,
      savedArticleId: notionSaves.articleId,
    })
    .from(articles)
    .leftJoin(
      articleCategories,
      and(
        eq(articleCategories.articleId, articles.id),
        eq(articleCategories.userId, userId),
      ),
    )
    .leftJoin(categories, eq(categories.id, articleCategories.categoryId))
    .leftJoin(
      notionSaves,
      and(
        eq(notionSaves.articleId, articles.id),
        eq(notionSaves.userId, userId),
      ),
    )
    .orderBy(
      sql`${articles.publishedAt} desc nulls last`,
      sql`${articles.id} desc`,
    )
    .limit(ARTICLE_LIMIT);

  return rows.map(({ savedArticleId, ...row }) => ({
    ...row,
    saved: savedArticleId !== null,
  }));
}

export async function getUserCategories(userId: string) {
  return db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(categories.id);
}

// 분류 힌트(description) 포함 — Claude 분류 프롬프트용
export async function getUserCategoriesForClassify(userId: string) {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      description: categories.description,
    })
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(categories.id);
}

export async function findArticlesByUrls(urls: string[]) {
  if (urls.length === 0) return [];
  return db
    .select({
      id: articles.id,
      url: articles.url,
      titleEn: articles.titleEn,
      titleKo: articles.titleKo,
      summaryKo: articles.summaryKo,
    })
    .from(articles)
    .where(inArray(articles.url, urls));
}

export async function insertArticles(rows: NewArticle[]) {
  if (rows.length === 0) return [];
  return db
    .insert(articles)
    .values(rows)
    .onConflictDoNothing({ target: articles.url })
    .returning({ id: articles.id, url: articles.url });
}

// 주어진 기사 중 현재 사용자의 분류 행이 이미 있는 article id
export async function getClassifiedArticleIds(userId: string, articleIds: number[]) {
  if (articleIds.length === 0) return new Set<number>();
  const rows = await db
    .select({ articleId: articleCategories.articleId })
    .from(articleCategories)
    .where(
      and(
        eq(articleCategories.userId, userId),
        inArray(articleCategories.articleId, articleIds),
      ),
    );
  return new Set(rows.map((r) => r.articleId));
}

export async function upsertClassifications(rows: NewArticleCategory[]) {
  if (rows.length === 0) return;
  await db
    .insert(articleCategories)
    .values(rows)
    .onConflictDoUpdate({
      target: [articleCategories.userId, articleCategories.articleId],
      set: { categoryId: sql`excluded.category_id` },
    });
}

const DEFAULT_CATEGORIES = [
  { name: "모델·연구", description: "새 AI 모델 공개, 벤치마크, 논문, 기술 연구" },
  { name: "제품·서비스", description: "AI 제품·기능 출시, 앱, 서비스 업데이트" },
  { name: "투자·비즈니스", description: "투자 유치, 인수합병, 기업 전략, 매출·실적" },
  { name: "규제·정책", description: "AI 규제, 법안, 정부 정책, 소송, 안전·윤리 이슈" },
  { name: "기타", description: "위 분류에 해당하지 않는 AI 관련 소식" },
];

// 첫 사용 시 기본 카테고리 시드 (카테고리가 하나도 없을 때만)
export async function ensureDefaultCategories(userId: string) {
  const existing = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.userId, userId))
    .limit(1);
  if (existing.length > 0) return;
  await db
    .insert(categories)
    .values(DEFAULT_CATEGORIES.map((c) => ({ ...c, userId })))
    .onConflictDoNothing();
}
