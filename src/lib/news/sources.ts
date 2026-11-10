export type NewsSource = {
  name: string;
  feedUrl: string;
};

export const NEWS_SOURCES: NewsSource[] = [
  {
    name: "TechCrunch",
    feedUrl: "https://techcrunch.com/category/artificial-intelligence/feed/",
  },
  {
    name: "The Verge",
    feedUrl: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
  },
];

// 이 시간 이내에 발행된 기사만 가져온다
export const FETCH_WINDOW_HOURS = 24;

// 안전장치: 소스당 최대 처리 개수
export const MAX_ITEMS_PER_SOURCE = 50;
