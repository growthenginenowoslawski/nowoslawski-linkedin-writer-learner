import type { LinkedInPost, AuthorBaseline } from './types.ts';

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function buildBaselines(posts: LinkedInPost[]): AuthorBaseline[] {
  const byAuthor = new Map<string, LinkedInPost[]>();
  for (const p of posts) {
    if (!byAuthor.has(p.authorName)) byAuthor.set(p.authorName, []);
    byAuthor.get(p.authorName)!.push(p);
  }

  const baselines: AuthorBaseline[] = [];
  for (const [authorName, authorPosts] of byAuthor) {
    const engagements = authorPosts.map((p) => p.engagementTotal);
    const med = median(engagements);
    const sorted = [...authorPosts].sort((a, b) => b.engagementTotal - a.engagementTotal);
    baselines.push({
      authorName,
      isOwn: authorPosts[0].isOwnPost,
      postCount: authorPosts.length,
      medianEngagement: med,
      topPosts: sorted.slice(0, 5),
      bottomPosts: sorted.slice(-5).reverse(),
    });
  }
  return baselines;
}

export function classifyWhatsWorking(
  posts: LinkedInPost[],
  baselines: AuthorBaseline[],
): { working: LinkedInPost[]; underperforming: LinkedInPost[] } {
  const baseMap = new Map(baselines.map((b) => [b.authorName, b.medianEngagement]));
  const working: LinkedInPost[] = [];
  const underperforming: LinkedInPost[] = [];
  for (const p of posts) {
    const base = baseMap.get(p.authorName) ?? 0;
    if (p.engagementTotal >= base * 2 && p.engagementTotal > 5) working.push(p);
    else if (p.engagementTotal < base / 2 && base > 0) underperforming.push(p);
  }
  working.sort((a, b) => b.engagementTotal - a.engagementTotal);
  underperforming.sort((a, b) => a.engagementTotal - b.engagementTotal);
  return { working, underperforming };
}
