// ui.md 「카테고리 배지 색상」: 카테고리 id 기반으로 팔레트를 순환 배정
const PALETTE = [
  "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
];

const UNCATEGORIZED =
  "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";

export function categoryBadgeClass(categoryId: number | null) {
  if (categoryId === null) return UNCATEGORIZED;
  return PALETTE[categoryId % PALETTE.length];
}
