import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { getArticleForSave, insertNotionSave } from "@/db/queries";
import { createNewsPage } from "@/lib/notion";

const bodySchema = z.object({ articleId: z.number().int().positive() });

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "articleId가 필요합니다." }, { status: 400 });
  }

  const article = await getArticleForSave(userId, parsed.data.articleId);
  if (!article) {
    return Response.json({ error: "기사를 찾을 수 없습니다." }, { status: 404 });
  }
  // 중복 저장 방지
  if (article.savedArticleId !== null) {
    return Response.json({ saved: true, alreadySaved: true });
  }

  try {
    const pageUrl = await createNewsPage({
      title: article.titleKo,
      summary: article.summaryKo,
      url: article.url,
      category: article.categoryName,
      publishedAt: article.publishedAt,
    });
    await insertNotionSave(userId, article.id, pageUrl);
    return Response.json({ saved: true, pageUrl });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Notion 저장에 실패했습니다." },
      { status: 500 },
    );
  }
}
