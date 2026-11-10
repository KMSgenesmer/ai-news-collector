import { auth } from "@clerk/nextjs/server";
import { getDashboardArticles, getUserCategories } from "@/db/queries";
import { CategoryBar } from "./category-bar";
import { NewsCard } from "./news-card";

export async function DashboardContent() {
  const { userId } = await auth.protect();

  const [articles, categories] = await Promise.all([
    getDashboardArticles(userId),
    getUserCategories(userId),
  ]);

  return (
    <>
      <CategoryBar categories={categories} totalCount={articles.length} />

      {articles.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 py-16 text-center text-slate-500 dark:border-slate-700">
          아직 수집된 뉴스가 없어요. 뉴스를 가져와 보세요.
        </div>
      ) : (
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </section>
      )}
    </>
  );
}

export function DashboardSkeleton() {
  return (
    <div aria-hidden>
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-9 w-24 animate-pulse rounded-full bg-slate-200/70 dark:bg-slate-800"
          />
        ))}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-800"
          />
        ))}
      </div>
    </div>
  );
}
