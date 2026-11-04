# PRD: AI 뉴스 수집기

## 1. 개요
해외 AI 뉴스를 RSS로 수집하고, Claude API가 한국어로 번역·요약·카테고리 분류한 결과를 카드 형태로 보여주는 웹앱. 마음에 드는 뉴스는 카드의 버튼으로 노션에 저장할 수 있다.

## 2. 목표
- 해외 AI 뉴스를 한국어로 빠르게 훑어볼 수 있게 한다.
- 관심 카테고리별로 뉴스를 골라 볼 수 있게 한다.
- 필요한 뉴스를 클릭 한 번으로 노션에 보관한다.

## 3. 핵심 기능
1. **로그인**: 앱 실행 시 로그인 필수 (Clerk). 미로그인 시 로그인 화면으로 이동.
2. **뉴스 가져오기**: "뉴스 가져오기" 버튼 클릭 시 RSS 수집 → 번역/요약 → 카테고리 분류.
3. **카드 UI**: 한국어 제목, 요약, 출처·날짜, 카테고리 배지, 원문 링크, "Notion 저장" 버튼.
4. **카테고리 필터**: 카테고리를 선택하면 해당 뉴스만 표시.
5. **카테고리 관리**: 추가·수정·삭제 가능. 변경 후 "재분류"로 기존 뉴스에 반영.
6. **Notion 저장**: 카드의 버튼으로 선택한 뉴스를 노션 페이지로 저장. 저장 완료 표시 및 중복 저장 방지.

## 4. 뉴스 소스
- TechCrunch AI: https://techcrunch.com/category/artificial-intelligence/feed/
- The Verge AI: https://www.theverge.com/rss/ai-artificial-intelligence/index.xml

## 5. 기술 스택
| 영역 | 선택 |
|---|---|
| 프레임워크 | Next.js (App Router, TypeScript) |
| 로그인 | Clerk |
| DB / ORM | Neon (PostgreSQL), Drizzle ORM |
| 번역·요약·분류 | Claude API |
| 노션 저장 | Claude API MCP 커넥터 + Notion 호스팅 MCP 서버 |

## 6. 확정된 결정 사항
- **데이터 범위**: 기사와 번역/요약은 전 사용자 공유, 카테고리와 분류 결과는 사용자별.
- **카테고리 정책**: 기본 카테고리를 시드로 제공(모델·연구 / 제품·서비스 / 투자·비즈니스 / 규제·정책 / 기타). 기사당 카테고리는 1개.
- **노션 연동**: Claude API 호출 시 `mcp_servers`로 Notion MCP를 붙여 Claude가 페이지를 생성. 사용자별 Notion OAuth 토큰 필요.

## 7. 사용자 흐름
1. 앱 접속 → 로그인
2. (최초) 기본 카테고리 자동 생성, 필요 시 설정에서 Notion 연결
3. "뉴스 가져오기" 클릭 → 신규 기사 수집·번역·요약·분류 → 카드 표시
4. 카테고리 칩으로 필터링
5. 카테고리 추가/수정/삭제 → "재분류"로 반영
6. 카드의 "Notion 저장" 클릭 → 노션에 저장, 카드에 "저장됨" 표시

## 8. 처리 로직
- URL 기준으로 이미 저장된 기사는 건너뛴다(중복 방지).
- 신규 기사만 번역·요약하여 공유 저장하고, 다른 사용자가 이미 처리한 기사는 번역을 생략하고 분류만 수행해 비용을 줄인다.
- 분류는 현재 사용자의 카테고리 목록 중 1개를 선택하며, 해당하지 않으면 미분류로 둔다.
- 여러 기사를 배치로 처리하고, 일부 실패해도 성공한 기사는 저장하며 오류를 안내한다.
- 카테고리 삭제 시 해당 기사는 미분류로 전환한다.

## 9. 데이터 모델
- `articles`: id, url(unique), source, title_en, title_ko, summary_ko, image_url, published_at, fetched_at
- `categories`: id, user_id, name, description(분류 힌트), created_at — (user_id, name) unique
- `article_categories`: user_id, article_id, category_id(nullable) — PK(user_id, article_id)
- `notion_saves`: user_id, article_id, notion_page_url, saved_at
- `notion_connections`: user_id, access_token(암호화), refresh_token(암호화), expires_at

## 10. API (예정)
- `POST /api/news/fetch` — 뉴스 수집·처리
- `GET /api/news?category=` — 목록/필터 조회
- `POST /api/news/reclassify` — 재분류
- `GET|POST|PATCH|DELETE /api/categories` — 카테고리 CRUD
- `GET /api/notion/connect`, `GET /api/notion/callback` — Notion 연결
- `POST /api/notion/save` — 노션 저장

## 11. 비기능 요구사항
- 모든 페이지·API는 로그인 사용자만 접근 가능.
- Notion 토큰은 암호화하여 저장하고, 비밀 키는 환경변수로 관리.
- 가져오기 중 로딩 상태와 오류 메시지를 표시.
- 서버리스 타임아웃을 고려해 소스당 최신 N개로 제한하거나 배치 처리.

## 12. 범위 제외
- 원문 전체 크롤링 (RSS가 제공하는 내용 기준으로 요약)
- 자동/예약 수집 (버튼 클릭 시에만 수집)
- 한 기사에 여러 카테고리 부여
- 위 두 곳 외의 뉴스 소스 추가 (추후 확장)

## 13. 리스크
- **Notion MCP OAuth**: 사용자별 토큰 획득 흐름이 가장 복잡하다. 구현 시 최신 Notion MCP와 Claude API MCP 커넥터 문서를 확인하고, 막히면 앱 서버에서 MCP SDK로 직접 호출하는 방식으로 대체한다.
- **Claude 비용/지연**: 신규 기사만 처리하고 저비용 모델을 고려한다.
- **RSS 본문 길이**: 피드가 짧은 내용만 제공할 수 있어 요약 품질이 제한될 수 있다.

## 14. 구현 순서
1. Next.js 스캐폴딩 + Clerk 연동·라우트 보호
2. Neon + Drizzle 스키마/마이그레이션
3. 카테고리 CRUD + 기본 시드
4. RSS 수집 + Claude 번역/요약/분류 + "뉴스 가져오기"
5. 카드 UI · 카테고리 필터
6. Notion OAuth 연결 + MCP 저장
7. 재분류, 에러/로딩 처리, 마무리

## 15. 검증 방법
- 비로그인 접근 시 로그인 화면으로 이동하는지 확인
- "뉴스 가져오기" 후 카드에 한국어 제목·요약·카테고리가 표시되고, 재실행 시 중복이 없는지 확인
- 카테고리 추가/수정/삭제 후 필터·재분류가 반영되고, 다른 계정과 카테고리가 분리되는지 확인
- Notion 연결 후 "Notion 저장"으로 페이지가 생성되고, 중복 저장이 차단되는지 확인
- 마이그레이션 적용 및 빌드/타입체크 통과
