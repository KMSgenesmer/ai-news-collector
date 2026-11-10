import { categoryBadgeClass } from "./category-colors";

type Props = {
  categories: { id: number; name: string }[];
  totalCount: number;
};

const chipBase =
  "inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium";

export function CategoryBar({ categories, totalCount }: Props) {
  return (
    <nav aria-label="카테고리" className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        aria-pressed="true"
        className={`${chipBase} bg-indigo-600 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`}
      >
        전체
        <span className="ml-1.5 text-xs opacity-70">{totalCount}</span>
      </button>

      {categories.map((c) => (
        <span key={c.id} className={`${chipBase} ${categoryBadgeClass(c.id)}`}>
          {c.name}
        </span>
      ))}

      {/* 카테고리 끝: 추가 버튼 (카테고리 CRUD 구현 전까지 비활성) */}
      <button
        type="button"
        disabled
        title="카테고리 추가는 준비 중입니다"
        className={`${chipBase} gap-1 border border-dashed border-slate-300 text-slate-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700`}
      >
        <span aria-hidden>+</span> 카테고리 추가
      </button>
    </nav>
  );
}
