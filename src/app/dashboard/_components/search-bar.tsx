"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

type Props = {
  initialQuery: string;
};

export function SearchBar({ initialQuery }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();

  // '검색' 버튼 클릭과 Enter 키 모두 form submit으로 처리된다.
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = value.trim();
    startTransition(() => {
      router.push(q ? `/dashboard?q=${encodeURIComponent(q)}` : "/dashboard");
    });
  }

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className="mt-6 flex items-center gap-2"
    >
      <label htmlFor="news-search" className="sr-only">
        뉴스 키워드 검색
      </label>
      <input
        id="news-search"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="키워드로 뉴스 검색"
        className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
      />
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
      >
        {isPending ? "검색 중…" : "검색"}
      </button>
    </form>
  );
}
