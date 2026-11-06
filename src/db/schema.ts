import {
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

// 기사 + 한국어 번역/요약: 전 사용자 공유
export const articles = pgTable(
  "articles",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    url: text().notNull().unique(),
    source: text().notNull(),
    titleEn: text("title_en").notNull(),
    titleKo: text("title_ko").notNull(),
    summaryKo: text("summary_ko").notNull(),
    imageUrl: text("image_url"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("articles_published_at_idx").on(t.publishedAt)],
);

// 카테고리: 사용자별 (userId = Clerk user id)
export const categories = pgTable(
  "categories",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: text("user_id").notNull(),
    name: text().notNull(),
    description: text(), // 분류 힌트
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique("categories_user_id_name_unique").on(t.userId, t.name)],
);

// 분류 결과: 사용자별. categoryId가 null이면 미분류
export const articleCategories = pgTable(
  "article_categories",
  {
    userId: text("user_id").notNull(),
    articleId: integer("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    categoryId: integer("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.articleId] }),
    index("article_categories_user_category_idx").on(t.userId, t.categoryId),
  ],
);

// Notion 저장 기록 (PK로 중복 저장 방지)
export const notionSaves = pgTable(
  "notion_saves",
  {
    userId: text("user_id").notNull(),
    articleId: integer("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    notionPageUrl: text("notion_page_url").notNull(),
    savedAt: timestamp("saved_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.articleId] })],
);

// Notion OAuth 연결: 토큰은 암호화된 문자열로 저장
export const notionConnections = pgTable("notion_connections", {
  userId: text("user_id").primaryKey(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type ArticleCategory = typeof articleCategories.$inferSelect;
export type NewArticleCategory = typeof articleCategories.$inferInsert;
export type NotionSave = typeof notionSaves.$inferSelect;
export type NewNotionSave = typeof notionSaves.$inferInsert;
export type NotionConnection = typeof notionConnections.$inferSelect;
export type NewNotionConnection = typeof notionConnections.$inferInsert;
