import type { DashboardArticle } from "@/db/queries";
import { categoryBadgeClass } from "./category-colors";
import { SaveNewsButton } from "./save-news-button";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// "2026. 11. 10." -> "2026.11.10"
function formatDate(date: Date) {
  return dateFormatter.format(date).replace(/\.\s/g, ".").replace(/\.$/, "");
}

export function NewsCard({ article }: { article: DashboardArticle }) {
  const { categoryId, categoryName, saved, publishedAt } = article;

  return (
    <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      <div className="flex items-center justify-between">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryBadgeClass(categoryId)}`}
        >
          {categoryName ?? "미분류"}
        </span>
      </div>

      <h2 className="mt-3 text-lg font-semibold leading-snug text-slate-900 dark:text-slate-50">
        {article.titleKo}
      </h2>

      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        {article.summaryKo}
      </p>

      <p className="mt-3 text-xs text-slate-500">
        {article.source}
        {publishedAt && (
          <>
            {" · "}
            <time dateTime={publishedAt.toISOString()}>
              {formatDate(publishedAt)}
            </time>
          </>
        )}
      </p>

      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300"
        >
          원문 보기 ↗
        </a>
        <SaveNewsButton articleId={article.id} saved={saved} />
      </div>
    </article>
  );
}
