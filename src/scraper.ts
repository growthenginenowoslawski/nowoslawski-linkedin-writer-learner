import axios from 'axios';
import type { LinkedInPost, Profile } from './types.ts';

const HOST = process.env.RAPIDAPI_HOST || 'linkedin-bulk-data-scraper.p.rapidapi.com';
const KEY = process.env.RAPIDAPI_KEY;

function detectPostType(raw: any): LinkedInPost['postType'] {
  const t = (raw?.contentType ?? raw?.postType ?? raw?.content_type ?? '').toLowerCase();
  if (t.includes('video')) return 'video';
  if (t.includes('carousel') || t.includes('document')) return 'carousel';
  if (t.includes('poll')) return 'poll';
  if (t.includes('article')) return 'article';
  if (t.includes('image') || t.includes('photo')) return 'image';
  if (Array.isArray(raw?.images) && raw.images.length > 1) return 'carousel';
  if (Array.isArray(raw?.images) && raw.images.length > 0) return 'image';
  if (raw?.video || raw?.videoUrl) return 'video';
  return 'text';
}

function toInt(v: any): number {
  if (typeof v === 'number') return v;
  if (!v) return 0;
  const n = parseInt(String(v).replace(/[^\d]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

function normalizeItem(item: any, profile: Profile, isOwn: boolean): LinkedInPost | null {
  const postUrl =
    item.postUrl ?? item.shareUrl ?? item.url ?? item.linkedinUrl ?? item.post_url;
  if (!postUrl) return null;

  const text = item.text ?? item.content ?? item.postText ?? item.description ?? '';

  const likes = toInt(item.likeCount ?? item.likesCount ?? item.likes ?? item.reactionsCount);
  const comments = toInt(item.commentsCount ?? item.commentCount ?? item.comments);
  const reposts = toInt(item.repostsCount ?? item.shareCount ?? item.reposts ?? item.shares);

  const postedAt =
    item.postedAt ?? item.postedDate ?? item.date ?? item.publishedAt ?? item.time;

  return {
    authorName: profile.name,
    authorUrl: profile.linkedinUrl,
    isOwnPost: isOwn,
    postUrl,
    postedAt: typeof postedAt === 'object' ? postedAt?.date : postedAt,
    postType: detectPostType(item),
    text: String(text).slice(0, 4000),
    likes,
    comments,
    reposts,
    engagementTotal: likes + comments + reposts,
    scrapedAt: new Date().toISOString(),
  };
}

async function fetchProfilePosts(
  profile: Profile,
  isOwn: boolean,
  postsToFetch: number,
): Promise<LinkedInPost[]> {
  if (!KEY) throw new Error('RAPIDAPI_KEY is not set. Run `npm run setup` first.');

  const url = `https://${HOST}/person_updates`;
  const all: LinkedInPost[] = [];
  let page = 1;
  const PER_PAGE = 25;

  while (all.length < postsToFetch && page <= 10) {
    try {
      const resp = await axios.get(url, {
        params: {
          linkedin_url: profile.linkedinUrl,
          page,
        },
        headers: {
          'x-rapidapi-key': KEY,
          'x-rapidapi-host': HOST,
        },
        timeout: 60_000,
      });

      const data = resp.data;
      const items: any[] =
        data?.data?.posts ?? data?.posts ?? data?.data ?? (Array.isArray(data) ? data : []);

      if (!items.length) break;

      for (const item of items) {
        const post = normalizeItem(item, profile, isOwn);
        if (post) all.push(post);
        if (all.length >= postsToFetch) break;
      }

      if (items.length < PER_PAGE) break;
      page++;
    } catch (err: any) {
      const status = err?.response?.status;
      console.error(
        `  ${profile.name}: page ${page} failed (${status ?? 'no status'}): ${err.message}`,
      );
      if (status === 401 || status === 403) {
        throw new Error(
          'RapidAPI auth failed. Check that RAPIDAPI_KEY is correct and that you are subscribed to the LinkedIn Bulk Data Scraper API. See README.',
        );
      }
      if (status === 429) {
        console.error('  Hit rate limit. Stopping early.');
      }
      break;
    }
  }
  return all;
}

export async function scrapeAll(
  you: Profile,
  competitors: Profile[],
  yourPostsToFetch: number,
  competitorPostsToFetch: number,
): Promise<LinkedInPost[]> {
  const all: LinkedInPost[] = [];

  console.log(`\nScraping your profile (${you.name}, target ${yourPostsToFetch} posts)...`);
  const yours = await fetchProfilePosts(you, true, yourPostsToFetch);
  console.log(`  got ${yours.length} posts`);
  all.push(...yours);

  for (const c of competitors) {
    console.log(`Scraping ${c.name} (target ${competitorPostsToFetch} posts)...`);
    const posts = await fetchProfilePosts(c, false, competitorPostsToFetch);
    console.log(`  got ${posts.length} posts`);
    all.push(...posts);
  }

  return all;
}
