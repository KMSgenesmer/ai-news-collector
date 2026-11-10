import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardHeader } from "./_components/dashboard-header";
import {
  DashboardContent,
  DashboardSkeleton,
} from "./_components/dashboard-content";

export const metadata: Metadata = {
  title: "대시보드 | AI뉴스 수집기",
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex-1 bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300">
      <DashboardHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </main>
    </div>
  );
}
