import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { scrapeAll } from './scraper.ts';
import { buildBaselines, classifyWhatsWorking } from './analyzer.ts';
import { writeReport } from './report.ts';
import type { ProfilesConfig, LinkedInPost } from './types.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const PROFILES_PATH = path.join(ROOT, 'config', 'profiles.json');
const OUTPUT_DIR = path.join(ROOT, 'output');

function loadProfiles(): ProfilesConfig {
  if (!fs.existsSync(PROFILES_PATH)) {
    console.error(`No config/profiles.json found. Run \`npm run setup\` first.`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(PROFILES_PATH, 'utf-8'));
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  const scrapeOnly = args.has('--scrape-only');
  const analyzeOnly = args.has('--analyze-only');

  const cfg = loadProfiles();
  const dateStr = todayStr();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const rawPath = path.join(OUTPUT_DIR, `raw-posts-${dateStr}.json`);

  let posts: LinkedInPost[] = [];

  if (analyzeOnly) {
    if (!fs.existsSync(rawPath)) {
      console.error(`No raw posts for today (${rawPath}). Run a full scrape first.`);
      process.exit(1);
    }
    posts = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
    console.log(`Loaded ${posts.length} cached posts.`);
  } else {
    posts = await scrapeAll(
      cfg.you,
      cfg.competitors,
      cfg.settings.yourPostsToFetch,
      cfg.settings.competitorPostsToFetch,
    );
    fs.writeFileSync(rawPath, JSON.stringify(posts, null, 2));
    console.log(`\nSaved raw posts → ${rawPath}`);
  }

  if (scrapeOnly) {
    console.log('Scrape-only mode. Done.');
    return;
  }

  const baselines = buildBaselines(posts);
  const { working, underperforming } = classifyWhatsWorking(posts, baselines);
  const { reportPath, dataPath } = writeReport(
    OUTPUT_DIR,
    dateStr,
    baselines,
    working,
    underperforming,
    posts,
  );

  console.log(`\n✓ Report written to: ${reportPath}`);
  console.log(`✓ Data written to:   ${dataPath}`);
  console.log(`\nTip: open the report in Claude Code and ask "what themes are working for me vs. my competitors?"`);
}

main().catch((err) => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
