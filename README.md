# AI뉴스 수집기

해외 AI 뉴스를 RSS로 수집하고, Claude API가 한국어로 번역·요약·카테고리 분류한 결과를 카드 형태로 보여주는 웹앱입니다. 마음에 드는 뉴스는 카드의 버튼으로 Notion에 저장할 수 있습니다.

## 주요 기능

- **로그인**: Clerk 기반, 로그인한 사용자만 접근 가능
- **뉴스 가져오기**: TechCrunch AI / The Verge AI RSS 수집 → 한국어 번역·요약 → 카테고리 분류
- **카드 UI**: 한국어 제목·요약, 출처·날짜, 카테고리 배지, 원문 링크
- **Notion 저장**: 카드의 버튼으로 저장, 저장 완료 표시 및 중복 저장 방지

## 기술 스택

| 영역 | 사용 기술 |
|---|---|
| 프레임워크 | Next.js 16 (App Router), React 19, TypeScript |
| 스타일 | Tailwind CSS v4 |
| 로그인 | Clerk |
| DB / ORM | Neon (PostgreSQL), Drizzle ORM |
| 번역·요약·분류 | Claude API (`@anthropic-ai/sdk`) |
| RSS | rss-parser |

## 시작하기

### 1. 설치

```bash
npm install
```

### 2. 환경변수

프로젝트 루트에 `.env.local` 파일을 만들고 아래 값을 채웁니다.

```env
# Clerk (https://dashboard.clerk.com → API keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Neon
DATABASE_URL=

# Claude API
ANTHROPIC_API_KEY=

# Notion 저장
NOTION_API_TOKEN=
NOTION_DATABASE_ID=
```

### 3. DB 마이그레이션

```bash
npm run db:migrate
```

### 4. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 (Turbopack) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | 타입체크 |
| `npm run db:generate` | Drizzle 마이그레이션 생성 |
| `npm run db:migrate` | 마이그레이션 적용 |
| `npm run db:studio` | Drizzle Studio |

## 데이터 모델

- `articles`: 기사와 한국어 제목·요약 (전 사용자 공유)
- `categories`, `article_categories`: 카테고리와 분류 결과 (사용자별)
- `notion_saves`: Notion 저장 기록 (중복 저장 방지)
- `notion_connections`: 사용자별 Notion 연결 정보 (예정)

## 문서

- [`PRD.md`](./PRD.md): 제품 요구사항과 구현 순서
- [`ui.md`](./ui.md): UI/스타일 가이드

## 범위 제외

원문 전체 크롤링, 예약/자동 수집, 한 기사에 여러 카테고리 부여, 두 곳 외의 뉴스 소스 추가.
