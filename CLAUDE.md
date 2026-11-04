# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

Only the `create-next-app` scaffold exists (`src/app/{layout,page}.tsx`, `globals.css`). `PRD.md` (Korean) is the source of truth for what to build; follow its section 14 implementation order (Clerk → Neon/Drizzle → categories CRUD → RSS + Claude pipeline → card UI → Notion OAuth/MCP → reclassify/polish). Clerk, Drizzle, Neon, and the Anthropic SDK are **not installed yet**.

## Commands

```bash
npm run dev     # dev server (Turbopack) at http://localhost:3000
npm run build   # production build
npm run lint    # eslint (flat config, eslint.config.mjs)
npx tsc --noEmit  # typecheck (no script defined; PRD requires typecheck to pass)
```

No test runner is configured.

## Next.js version caveat

`next` is 16.4.5 / React 19.3. `AGENTS.md` warns this version has breaking changes versus common training data: read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code. `next.config.ts` enables `cacheComponents` and `partialPrefetching` and wires Tailwind v4 via a Turbopack `*.css` rule (`@tailwindcss/turbopack`), so caching/rendering semantics differ from older App Router behavior.

## Architecture (from PRD.md)

- **Auth**: Clerk; every page and API route must require a logged-in user (route protection is a core requirement).
- **Data ownership split**: `articles` (incl. Korean title/summary) are shared across all users; `categories` and `article_categories` (classification) are per-user. Notion tokens (`notion_connections`) are per-user and must be stored encrypted, key from env.
- **Fetch pipeline** (`POST /api/news/fetch`): pull RSS from TechCrunch AI and The Verge AI → skip URLs already in `articles` → translate/summarize only genuinely new articles → for articles another user already processed, skip translation and only classify for the current user. Classification picks exactly one of the user's categories, else leaves `category_id` null (uncategorized). Process in batches; keep successes on partial failure and report errors. Limit to latest N per source because of serverless timeouts.
- **Categories**: seeded defaults on first login (모델·연구 / 제품·서비스 / 투자·비즈니스 / 규제·정책 / 기타); deleting a category sets affected articles to uncategorized; "reclassify" re-runs classification.
- **Notion save**: Claude API call with `mcp_servers` attaching Notion's hosted MCP using the user's OAuth token; Claude creates the page. Dedupe via `notion_saves`. PRD fallback if the connector is blocked: call MCP directly from the server with the MCP SDK.
- Out of scope: full-article crawling, scheduled fetching, multi-category articles, extra news sources.
