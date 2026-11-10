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
