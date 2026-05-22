import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const ROOT = path.resolve(import.meta.dirname, '..');
const PROFILES_PATH = path.join(ROOT, 'config', 'profiles.json');
const ENV_PATH = path.join(ROOT, '.env');

async function ask(rl: readline.Interface, q: string, fallback = ''): Promise<string> {
  const answer = (await rl.question(q)).trim();
  return answer || fallback;
}

function normalizeLi(url: string): string {
  let u = url.trim();
  if (!u.startsWith('http')) u = `https://www.linkedin.com/in/${u.replace(/^\/+|\/+$/g, '')}`;
  if (!u.endsWith('/')) u += '/';
  return u;
}

async function main(): Promise<void> {
  const rl = readline.createInterface({ input, output });

  console.log('\n=== Nowoslawski LinkedIn Writer/Learner — setup ===\n');

  console.log('STEP 1 — RapidAPI key');
  console.log('  Get one for free at:');
  console.log('    1) Sign up at https://rapidapi.com/auth/sign-up');
  console.log('    2) Open https://rapidapi.com/freshdata-freshdata-default/api/linkedin-bulk-data-scraper');
  console.log('    3) Click "Subscribe to Test" → pick the Basic (free) plan');
  console.log('    4) Copy the "X-RapidAPI-Key" shown on any endpoint page (Code Snippets panel)\n');

  const key = await ask(rl, 'Paste your RapidAPI key: ');
  if (!key) {
    console.error('No key entered. Aborting.');
    rl.close();
    process.exit(1);
  }

  console.log('\nSTEP 2 — Your LinkedIn profile');
  const yourName = await ask(rl, 'Your name: ');
  const yourUrl = normalizeLi(await ask(rl, 'Your LinkedIn URL (or just the handle, e.g. "eric-nowoslawski"): '));

  console.log('\nSTEP 3 — Competitors');
  console.log('  Add 3–25 LinkedIn profiles you want to learn from. Press Enter on a blank name to finish.\n');
  const competitors: { name: string; linkedinUrl: string }[] = [];
  while (true) {
    const cName = await ask(rl, `Competitor ${competitors.length + 1} name (blank to finish): `);
    if (!cName) break;
    const cUrl = normalizeLi(await ask(rl, `  LinkedIn URL/handle for ${cName}: `));
    competitors.push({ name: cName, linkedinUrl: cUrl });
  }

  if (competitors.length === 0) {
    console.warn('\nNo competitors added — you can still analyze your own posts. Add competitors later by editing config/profiles.json.');
  }

  console.log('\nSTEP 4 — Volume');
  const yourPosts = parseInt(await ask(rl, 'How many of YOUR recent posts to fetch? [100]: ', '100'), 10) || 100;
  const compPosts = parseInt(await ask(rl, 'How many recent posts to fetch per competitor? [25]: ', '25'), 10) || 25;

  const profiles = {
    you: { name: yourName, linkedinUrl: yourUrl },
    competitors,
    settings: { yourPostsToFetch: yourPosts, competitorPostsToFetch: compPosts },
  };
  fs.writeFileSync(PROFILES_PATH, JSON.stringify(profiles, null, 2));

  const envContent = `RAPIDAPI_KEY=${key}\nRAPIDAPI_HOST=linkedin-bulk-data-scraper.p.rapidapi.com\n`;
  fs.writeFileSync(ENV_PATH, envContent);

  console.log('\nSaved:');
  console.log(`  ${PROFILES_PATH}`);
  console.log(`  ${ENV_PATH}`);
  console.log('\nNext: `npm run run` to scrape and generate a report in output/.');
  rl.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
