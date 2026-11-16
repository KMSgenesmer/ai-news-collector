import { auth } from "@clerk/nextjs/server";
import { getDashboardArticles, getUserCategories } from "@/db/queries";
import Link from "next/link";
import { CategoryBar } from "./category-bar";
import { NewsCard } from "./news-card";
import { SearchBar } from "./search-bar";

export async function DashboardContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { userId } = await auth.protect();
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";

  const [articles, categories] = await Promise.all([
    getDashboardArticles(userId, query),
    getUserCategories(userId),
  ]);

  return (
    <>
      <CategoryBar categories={categories} totalCount={articles.length} />
      <SearchBar key={query} initialQuery={query} />

      {articles.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 py-16 text-center text-slate-500 dark:border-slate-700">
          {query ? (
            <>
              &lsquo;{query}&rsquo;에 대한 검색 결과가 없어요.{" "}
              <Link
                href="/dashboard"
                className="font-medium text-indigo-600 hover:underline dark:text-indigo-300"
              >
                전체 보기
              </Link>
            </>
          ) : (
            "아직 수집된 뉴스가 없어요. 뉴스를 가져와 보세요."
          )}
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
