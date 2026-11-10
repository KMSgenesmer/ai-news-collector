import Parser from "rss-parser";
import {
  FETCH_WINDOW_HOURS,
  MAX_ITEMS_PER_SOURCE,
  type NewsSource,
} from "./sources";

export type RawArticle = {
  url: string;
  source: string;
  titleEn: string;
  summary: string; // HTML 제거된 원문 요약 (임시로 summary_ko에 저장)
  imageUrl: string | null;
  publishedAt: Date;
};

type FeedItem = {
  title?: string;
  link?: string;
  isoDate?: string;
  content?: string;
  contentSnippet?: string;
  "content:encoded"?: string;
  enclosure?: { url?: string };
};

const parser = new Parser<Record<string, never>, FeedItem>({
  timeout: 10_000,
  customFields: { item: ["content:encoded"] },
});

const MAX_SUMMARY_CHARS = 300;

function stripHtml(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

function firstImage(item: FeedItem): string | null {
  if (item.enclosure?.url) return item.enclosure.url;
  const html = item["content:encoded"] ?? item.content ?? "";
  return html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? null;
}

// 소스 하나를 가져온다. 실패하면 throw (호출 측에서 소스 단위로 처리)
// 지난 FETCH_WINDOW_HOURS 시간 이내 발행된 기사만 반환한다. 발행일이 없으면 제외.
export async function fetchFeed(source: NewsSource): Promise<RawArticle[]> {
  const feed = await parser.parseURL(source.feedUrl);
  const cutoff = Date.now() - FETCH_WINDOW_HOURS * 60 * 60 * 1000;

  const out: RawArticle[] = [];
  for (const item of feed.items) {
    if (!item.link || !item.title || !item.isoDate) continue;
    const publishedAt = new Date(item.isoDate);
    if (Number.isNaN(publishedAt.getTime()) || publishedAt.getTime() < cutoff) continue;

    const raw = item.contentSnippet ?? item.content ?? item["content:encoded"] ?? "";
    out.push({
      url: item.link.trim(),
      source: source.name,
      titleEn: item.title.trim(),
      summary: truncate(stripHtml(raw), MAX_SUMMARY_CHARS),
      imageUrl: firstImage(item),
      publishedAt,
    });
  }

  return out
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, MAX_ITEMS_PER_SOURCE);
}
