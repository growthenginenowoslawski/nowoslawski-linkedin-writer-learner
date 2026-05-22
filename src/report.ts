import fs from 'node:fs';
import path from 'node:path';
import type { LinkedInPost, AuthorBaseline } from './types.ts';

function snippet(text: string, n = 220): string {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n) + '…' : t;
}

function postLine(p: LinkedInPost): string {
  return `- **${p.engagementTotal} engagements** (${p.likes} likes / ${p.comments} comments / ${p.reposts} reposts) — *${p.postType}* — [link](${p.postUrl})\n  > ${snippet(p.text)}`;
}

export function writeReport(
  outDir: string,
  dateStr: string,
  baselines: AuthorBaseline[],
  working: LinkedInPost[],
  underperforming: LinkedInPost[],
  allPosts: LinkedInPost[],
): { reportPath: string; dataPath: string } {
  fs.mkdirSync(outDir, { recursive: true });

  const yourBase = baselines.find((b) => b.isOwn);
  const compBases = baselines.filter((b) => !b.isOwn).sort((a, b) => b.medianEngagement - a.medianEngagement);

  const lines: string[] = [];
  lines.push(`# LinkedIn Post Analysis — ${dateStr}\n`);
  lines.push(`Scraped ${allPosts.length} posts across ${baselines.length} profiles.\n`);

  lines.push(`## Your baseline\n`);
  if (yourBase) {
    lines.push(`- **${yourBase.authorName}** — ${yourBase.postCount} posts, median engagement = **${yourBase.medianEngagement}**\n`);
    lines.push(`### Your top 5 posts`);
    yourBase.topPosts.forEach((p) => lines.push(postLine(p)));
    lines.push(`\n### Your bottom 5 posts`);
    yourBase.bottomPosts.forEach((p) => lines.push(postLine(p)));
  } else {
    lines.push(`_No posts scraped from your profile._\n`);
  }

  lines.push(`\n## Competitor baselines (sorted by median engagement)\n`);
  for (const c of compBases) {
    lines.push(`### ${c.authorName} — ${c.postCount} posts, median = ${c.medianEngagement}`);
    lines.push(`Top 3:`);
    c.topPosts.slice(0, 3).forEach((p) => lines.push(postLine(p)));
    lines.push('');
  }

  lines.push(`\n## What's working (≥ 2× the author's median engagement)\n`);
  lines.push(`${working.length} posts qualify.\n`);
  working.slice(0, 25).forEach((p) => {
    lines.push(`- **${p.authorName}** — ${p.engagementTotal} eng · *${p.postType}* · [link](${p.postUrl})`);
    lines.push(`  > ${snippet(p.text, 280)}`);
  });

  lines.push(`\n## What's underperforming (< 0.5× the author's median)\n`);
  lines.push(`${underperforming.length} posts qualify.\n`);
  underperforming.slice(0, 15).forEach((p) => {
    lines.push(`- **${p.authorName}** — ${p.engagementTotal} eng · *${p.postType}* · [link](${p.postUrl})`);
    lines.push(`  > ${snippet(p.text, 200)}`);
  });

  lines.push(`\n---\n`);
  lines.push(`Raw data: \`linkedin-posts-${dateStr}.json\` in this folder. Feed into Claude Code and ask for theme/hook analysis.\n`);

  const reportPath = path.join(outDir, `report-${dateStr}.md`);
  const dataPath = path.join(outDir, `linkedin-posts-${dateStr}.json`);
  fs.writeFileSync(reportPath, lines.join('\n'));
  fs.writeFileSync(
    dataPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), baselines, working, underperforming, allPosts }, null, 2),
  );
  return { reportPath, dataPath };
}
