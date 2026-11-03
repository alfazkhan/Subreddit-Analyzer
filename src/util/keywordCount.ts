import type { KeywordCountResult } from "@/util/Types";

export default function keywordCount(data: { keywords?: string }[]): KeywordCountResult {
  const counts: { [key: string]: number } = {};
  
  data.forEach((post: { keywords?: string }) => {
    const keywords: Record<string, unknown> | null = post.keywords
      ? JSON.parse(post.keywords)
      : null;
    if (!keywords) return;

    Object.keys(keywords).forEach((keyword: string) => {
      if (Number.isInteger(parseInt(keyword))) {
        return;
      }
      counts[keyword] === undefined ? (counts[keyword] = 1) : (counts[keyword]++);
    });
  });
  
  return counts;
}
