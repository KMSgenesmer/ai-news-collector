"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type FetchResponse = {
  fetched: number;
  added: number;
  skipped: number;
  classified: number;
  errors: { target: string; reason: string }[];
  error?: string;
};

type Message = { kind: "ok" | "warn" | "error"; text: string };

const MESSAGE_STYLE: Record<Message["kind"], string> = {
  ok: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  warn: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  error: "bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
};

export function FetchNewsButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isRefreshing, startTransition] = useTransition();
  const [message, setMessage] = useState<Message | null>(null);

  async function handleClick() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/news/fetch", { method: "POST" });
      const data = (await res.json()) as FetchResponse;
      if (!res.ok) {
        setMessage({ kind: "error", text: data.error ?? "뉴스 가져오기에 실패했습니다." });
        return;
      }
      if (data.errors.length > 0) {
        setMessage({
          kind: "warn",
          text: `${data.added}건 추가, ${data.errors.length}건 실패 (${data.errors
            .map((e) => e.target)
            .join(", ")})`,
        });
      } else {
        setMessage({
          kind: "ok",
          text:
            data.added > 0
              ? `새 기사 ${data.added}건을 번역·분류해 추가했어요.`
              : "새로 추가할 기사가 없어요.",
        });
      }
      startTransition(() => router.refresh());
    } catch {
      setMessage({ kind: "error", text: "네트워크 오류가 발생했습니다." });
    } finally {
      setLoading(false);
    }
  }

  const busy = loading || isRefreshing;

  return (
    <div className="flex items-center gap-3">
      {message && (
        <p
          role={message.kind === "error" ? "alert" : "status"}
          className={`hidden max-w-xs truncate rounded-lg px-3 py-1.5 text-sm sm:block ${MESSAGE_STYLE[message.kind]}`}
          title={message.text}
        >
          {message.text}
        </p>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy && (
          <svg
            aria-hidden
            className="mr-2 h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
        )}
        {busy ? "가져오는 중…" : "뉴스 가져오기"}
      </button>
    </div>
  );
}
