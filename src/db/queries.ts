import { and, eq, sql } from "drizzle-orm";
import { db } from "./index";
import {
  articleCategories,
  articles,
  categories,
  notionSaves,
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
