import { UserButton } from "@clerk/nextjs";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
          AI뉴스 수집기
        </h1>
        <UserButton />
      </div>
    </header>
  );
}
