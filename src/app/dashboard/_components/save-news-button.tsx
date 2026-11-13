"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const BUTTON_BASE =
  "inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2";

export function SaveNewsButton({
  articleId,
  saved: initialSaved,
}: {
  articleId: number;
  saved: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notion/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId }),
      });
      const data = (await res.json()) as { saved?: boolean; error?: string };
      if (!res.ok || !data.saved) {
        setError(data.error ?? "저장에 실패했습니다.");
        return;
      }
      setSaved(true);
      startTransition(() => router.refresh());
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (saved) {
    return (
      <button
        type="button"
        disabled
        className={`${BUTTON_BASE} cursor-default border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300`}
      >
        ✓ 저장됨
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`${BUTTON_BASE} border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-400 dark:hover:text-indigo-300`}
      >
        {loading ? "저장 중…" : "뉴스저장"}
      </button>
      {error && (
        <p role="alert" className="max-w-48 text-right text-xs text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}
