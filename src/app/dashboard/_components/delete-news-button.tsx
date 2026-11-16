"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function DeleteNewsButton({ articleId }: { articleId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/news/${articleId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "삭제에 실패했습니다.");
        return;
      }
      // 서버 데이터를 다시 불러와 카드를 화면에서 제거
      startTransition(() => router.refresh());
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-label="뉴스 삭제"
        title="뉴스 삭제"
        className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-rose-400"
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="h-4 w-4"
          aria-hidden
        >
          <path d="M5 5l10 10M15 5L5 15" />
        </svg>
      </button>
      {error && (
        <p role="alert" className="max-w-40 text-right text-xs text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}
