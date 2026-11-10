# UI 가이드 — AI뉴스 수집기

앱 이름: **AI뉴스 수집기**
스타일링: **Tailwind CSS v4** (유틸리티 클래스 우선, 커스텀 CSS 최소화)
디자인 방향: 깔끔하고 읽기 편한 라이트 중심 UI. 여백을 넉넉히, 색은 절제하고 카테고리 배지에만 포인트 컬러를 쓴다.

---

## 1. 디자인 원칙

1. **읽기 우선** — 카드의 주인공은 한국어 제목과 요약. 메타 정보(출처·날짜)는 작고 옅게.
2. **여백으로 구분** — 진한 테두리/그림자 대신 얇은 테두리(`border-slate-200`)와 넉넉한 패딩.
3. **색은 의미 있게** — 기본은 슬레이트 계열 무채색, 강조(주요 버튼·선택된 카테고리)는 인디고 하나만.
4. **일관된 라운드** — 카드·버튼·입력은 `rounded-xl` / `rounded-lg`, 칩은 `rounded-full`.
5. **다크 모드 대응** — `dark:` 변형으로 지원 (`prefers-color-scheme` 기준).

---

## 2. 디자인 토큰

Tailwind 기본 팔레트를 그대로 사용한다. 별도 토큰을 추가하지 않는다.

| 용도 | 라이트 | 다크 |
|---|---|---|
| 페이지 배경 | `bg-slate-50` | `dark:bg-slate-950` |
| 카드/헤더 배경 | `bg-white` | `dark:bg-slate-900` |
| 테두리 | `border-slate-200` | `dark:border-slate-800` |
| 본문 텍스트 | `text-slate-700` | `dark:text-slate-300` |
| 제목 텍스트 | `text-slate-900` | `dark:text-slate-50` |
| 보조 텍스트 | `text-slate-500` | `dark:text-slate-400` |
| 강조(Primary) | `bg-indigo-600` / hover `bg-indigo-700` | `dark:bg-indigo-500` / hover `dark:bg-indigo-400` |
| 포커스 링 | `focus-visible:ring-2 ring-indigo-500 ring-offset-2` | 동일 |

### 타이포그래피

| 요소 | 클래스 |
|---|---|
| 앱 이름 | `text-lg font-bold tracking-tight` |
| 카드 제목 | `text-lg font-semibold leading-snug` |
| 카드 요약 | `text-sm leading-relaxed text-slate-600` |
| 메타 정보 | `text-xs text-slate-500` |
| 칩/배지 | `text-sm font-medium` / `text-xs font-medium` |

한글 가독성을 위해 본문 `leading-relaxed`(1.625) 이상, 요약 줄 수는 `line-clamp-3`으로 제한한다.
폰트는 시스템 한글 폰트 스택을 따르며, `globals.css`의 `Arial, Helvetica` 고정은 `var(--font-sans)`로 교체한다.

### 카테고리 배지 색상

카테고리는 사용자가 추가할 수 있으므로 색을 고정 매핑하지 않고, 카테고리 id 기반으로 아래 팔레트에서 순환 배정한다.
미분류는 항상 슬레이트.

| 순서 | 클래스 |
|---|---|
| 1 | `bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300` |
| 2 | `bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300` |
| 3 | `bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300` |
| 4 | `bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300` |
| 5 | `bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300` |
| 미분류 | `bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300` |

---

## 3. 메인 화면 레이아웃 (대시보드)

```
┌──────────────────────────────────────────────────────────┐
│ AI뉴스 수집기                  [뉴스 가져오기]  [재분류] 👤 │  ← 헤더 (sticky)
├──────────────────────────────────────────────────────────┤
│                                                          │
│  [전체] [모델·연구] [제품·서비스] [투자·비즈니스]            │  ← 카테고리 바
│  [규제·정책] [기타] [미분류] [+ 카테고리 추가]              │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐          │
│  │ 뉴스 카드   │  │ 뉴스 카드   │  │ 뉴스 카드   │          │  ← 카드 그리드
│  └────────────┘  └────────────┘  └────────────┘          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐          │
│  │ 뉴스 카드   │  │ 뉴스 카드   │  │ 뉴스 카드   │          │
│  └────────────┘  └────────────┘  └────────────┘          │
└──────────────────────────────────────────────────────────┘
```

### 페이지 골격

```tsx
<div className="min-h-screen bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300">
  <Header />
  <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
    <CategoryBar />
    <NewsGrid />
  </main>
</div>
```

- 콘텐츠 최대 너비 `max-w-6xl`, 좌우 패딩은 반응형(`px-4 sm:px-6 lg:px-8`).
- 카테고리 바와 카드 그리드 사이 간격 `mt-6`.

---

## 4. 컴포넌트

### 4.1 헤더

```tsx
<header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
  <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
    <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
      AI뉴스 수집기
    </h1>
    <div className="flex items-center gap-2">
      <button className="...secondary">재분류</button>
      <button className="...primary">뉴스 가져오기</button>
      {/* Clerk <UserButton /> */}
    </div>
  </div>
</header>
```

- 좌측: 앱 이름. 우측: 액션 버튼 + Clerk 사용자 메뉴.
- 모바일(`< sm`)에서는 버튼 텍스트를 유지하되 `재분류`는 아이콘 전용으로 줄여도 된다.
- "뉴스 가져오기" 진행 중에는 버튼을 `disabled` + 스피너, 라벨은 `가져오는 중…`.

### 4.2 카테고리 바 (뉴스 카드 목록 위)

카테고리 칩을 가로로 나열하고, **맨 끝에 `+ 카테고리 추가` 버튼**을 둔다.
칩이 많아지면 줄바꿈(`flex-wrap`)으로 처리한다 (가로 스크롤 사용 안 함).

```tsx
<nav aria-label="카테고리" className="flex flex-wrap items-center gap-2">
  {/* 전체 + 사용자 카테고리 + 미분류 */}
  <button
    aria-pressed={selected}
    className={
      selected
        ? "rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white"
        : "rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
    }
  >
    모델·연구
  </button>

  {/* 카테고리 끝: 추가 버튼 */}
  <button className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-500 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:hover:border-indigo-400 dark:hover:text-indigo-300">
    <span aria-hidden>+</span> 카테고리 추가
  </button>
</nav>
```

규칙

- 순서: `전체` → 사용자 카테고리(정렬 순) → `미분류` → `+ 카테고리 추가`(항상 마지막).
- 선택 상태: 채워진 인디고(`bg-indigo-600 text-white`). 한 번에 하나만 선택, `aria-pressed` 사용.
- 각 칩 우측에 기사 수를 작게 표시할 수 있다: `<span className="ml-1.5 text-xs opacity-70">12</span>`.
- 추가 버튼은 **점선 테두리**로 일반 칩과 시각적으로 구분한다.
- 추가 버튼 클릭 → 인라인 입력(칩 자리에서 `input`으로 전환) 또는 작은 모달. 입력 후 Enter로 저장, Esc로 취소.
- 사용자 카테고리 칩은 hover 시 수정/삭제 메뉴(`⋯`)를 노출한다. 삭제 시 "해당 기사는 미분류로 이동합니다" 확인 문구를 보여준다.
- 카테고리 변경 후에는 헤더의 `재분류` 버튼으로 기존 뉴스에 반영한다.

### 4.3 뉴스 카드

```tsx
<article className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
  {/* 상단: 카테고리 배지 + 저장 상태 */}
  <div className="flex items-center justify-between">
    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
      모델·연구
    </span>
    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">✓ 저장됨</span>
  </div>

  {/* 제목 */}
  <h2 className="mt-3 text-lg font-semibold leading-snug text-slate-900 dark:text-slate-50">
    한국어 제목
  </h2>

  {/* 요약 */}
  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
    한국어 요약
  </p>

  {/* 메타 */}
  <p className="mt-3 text-xs text-slate-500">TechCrunch · 2026.11.10</p>

  {/* 하단 액션 */}
  <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
    <a className="text-sm font-medium text-slate-600 hover:text-indigo-600" target="_blank" rel="noopener noreferrer">
      원문 보기 ↗
    </a>
    <button className="...secondary">Notion 저장</button>
  </div>
</article>
```

구성 순서(위 → 아래): 카테고리 배지 / 저장 상태 → 제목 → 요약(3줄 제한) → 출처·날짜 → 구분선 → 원문 링크 + Notion 저장 버튼.

- 카드 높이는 그리드 행 기준으로 맞추고, 하단 액션은 `mt-auto`로 바닥에 고정한다.
- 이미 저장된 카드: `Notion 저장` 버튼 대신 `✓ 저장됨`을 표시하고 버튼은 `disabled` (중복 저장 방지).
- 저장 중: 버튼 `disabled` + `저장 중…`.
- Notion 미연결 상태에서 저장 클릭 시 연결 안내(설정으로 이동)를 보여준다.
- 외부 링크는 항상 `target="_blank" rel="noopener noreferrer"`.

### 4.4 뉴스 그리드

```tsx
<section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {articles.map(a => <NewsCard key={a.id} {...a} />)}
</section>
```

| 화면 너비 | 열 수 |
|---|---|
| 기본(모바일) | 1 |
| `sm` (≥640px) | 2 |
| `lg` (≥1024px) | 3 |

### 4.5 버튼

| 종류 | 클래스 |
|---|---|
| Primary | `inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50` |
| Secondary | `inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-50` |
| Danger (삭제 확인) | `rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700` |

모든 버튼에 키보드 포커스 링을 적용한다.

---

## 5. 상태 화면

| 상태 | 표현 |
|---|---|
| 로딩 | 카드 모양 스켈레톤 6개: `animate-pulse rounded-xl bg-slate-200/70 h-48` (다크: `dark:bg-slate-800`) |
| 기사 없음(최초) | 중앙 정렬 안내 + Primary 버튼. 문구: "아직 수집된 뉴스가 없어요. 뉴스를 가져와 보세요." |
| 필터 결과 없음 | "이 카테고리에는 아직 뉴스가 없어요." + `전체 보기` 링크 |
| 가져오기 진행 | 헤더 버튼 스피너 + 목록 상단에 얇은 진행 안내 배너 |
| 부분 실패 | 목록 상단에 `bg-amber-50 text-amber-800` 배너로 실패 건수 표시, 성공한 카드는 그대로 노출 |
| 오류 | `bg-rose-50 text-rose-800` 배너 + 재시도 버튼 |

빈 상태 컨테이너: `rounded-xl border border-dashed border-slate-300 py-16 text-center text-slate-500`.

---

## 6. 접근성 · 반응형 체크리스트

- 본문 텍스트 대비 WCAG AA 이상 (슬레이트 600 이상을 흰 배경에서 사용).
- 아이콘만 있는 버튼에는 `aria-label`.
- 카테고리 필터는 `<nav aria-label="카테고리">` + 버튼 `aria-pressed`.
- 토스트/배너는 `role="status"`(오류는 `role="alert"`).
- 터치 타겟 최소 높이 36px 이상 (`py-1.5` + `text-sm` 기준 충족).
- 360px 너비에서 가로 스크롤이 생기지 않아야 한다.

---

## 7. 구현 메모

- 로그인/회원가입 화면은 Clerk 컴포넌트를 쓰되 페이지 배경만 `bg-slate-50`로 맞춘다.
- `globals.css`: `@import "tailwindcss";` 유지, 색상 변수는 쓰지 않고 `dark:` 유틸리티로 통일한다 (현재 `--background` 변수 방식은 정리 대상).
- 컴포넌트 분리 제안: `Header`, `CategoryBar`, `CategoryChip`, `AddCategoryButton`, `NewsGrid`, `NewsCard`, `EmptyState`, `Banner`.
- 화면 구성은 PRD 14장 구현 순서의 5단계(카드 UI · 카테고리 필터)에서 적용한다.
