# Nowoslawski LinkedIn Post Writer/Learner

Scrape your own LinkedIn posts plus your competitors', rank them by engagement, and learn what's working vs. what isn't — all saved as local Markdown + JSON files. No database, no AI keys, no servers.

Designed to be opened inside Claude Code: after the local files are generated, ask Claude to read the report and surface themes, hooks, and post ideas.

---

## What you need

- **Node.js 20+** (`node -v` to check)
- A **RapidAPI key** (free — instructions below)
- Your LinkedIn URL + 3–25 competitor LinkedIn URLs

---

## Step 1 — Get a RapidAPI key (free, ~3 minutes)

This tool uses the **LinkedIn Bulk Data Scraper** API on RapidAPI's marketplace.

1. Go to **https://rapidapi.com/auth/sign-up** and create a free account (Google or email).
2. Open the API page: **https://rapidapi.com/freshdata-freshdata-default/api/linkedin-bulk-data-scraper**
3. Click the blue **"Subscribe to Test"** button at the top right.
4. Pick the **Basic** plan (free tier — typically 50–100 requests/month for free; upgrade if you have many competitors).
5. Once subscribed, click the **"Endpoints"** tab on the left, then click any endpoint (e.g. `Person Updates`).
6. On the right-hand **"Code Snippets"** panel, you'll see a value labeled **`X-RapidAPI-Key`** — copy that long string. **That's your key.**

> **Pricing note:** 1 RapidAPI request = 1 page of ~25 posts. With 10 competitors at 25 posts each + 100 of your posts, that's ~14 requests per run. The free tier covers a few runs per month. Bump to the next paid tier (~$10/mo) if you want daily runs or more profiles.

---

## Step 2 — Install

```bash
git clone https://github.com/growthenginenowoslawski/nowoslawski-linkedin-writer-learner.git
cd nowoslawski-linkedin-writer-learner
npm install
```

---

## Step 3 — Setup wizard

```bash
npm run setup
```

This will ask you for:
- Your RapidAPI key (paste it in)
- Your LinkedIn URL (or just your handle, e.g. `eric-nowoslawski`)
- Each competitor's name + LinkedIn URL (press Enter on a blank name to finish)
- How many of your posts to fetch (default 100) and how many per competitor (default 25)

The wizard writes `.env` (with your key) and `config/profiles.json`. Both are gitignored.

---

## Step 4 — Run

```bash
npm run run
```

This scrapes everyone, ranks posts by engagement, and writes two files into `output/`:

- `report-YYYY-MM-DD.md` — human-readable report with **your baseline**, **competitor baselines**, **what's working** (posts above 2× their author's median), and **what's underperforming** (below 0.5×).
- `linkedin-posts-YYYY-MM-DD.json` — full structured data for further analysis.

Re-run any day — each run is timestamped and never overwrites prior reports.

### Other commands

```bash
npm run scrape     # just scrape, don't generate the report
npm run analyze    # re-run analysis from today's cached raw posts (no API calls)
```

---

## Step 5 — Ask Claude what it means

Open the project in Claude Code and try:

> "Read `output/report-2026-05-22.md` and tell me the 5 hooks, themes, or post formats that are consistently winning for me vs. for my competitors. For each, give me 3 new post ideas in my voice."

Or run it through the SKILL: in Claude Code, type `/linkedin-writer-learner`.

---

## How "what's working" is decided

For each author independently, we compute the **median engagement** (likes + comments + reposts) across their scraped posts. Then:

- **Working** = engagement ≥ 2× that author's own median (and > 5 engagements absolute, to filter noise)
- **Underperforming** = engagement < 0.5× that author's median

This is per-author so a small creator's hit doesn't get drowned out by a big creator's misses.

---

## File layout

```
config/
  profiles.example.json    # template
  profiles.json            # your real config (gitignored)
src/
  setup.ts                 # interactive wizard
  index.ts                 # CLI entry
  scraper.ts               # RapidAPI client
  analyzer.ts              # engagement baselines + classification
  report.ts                # Markdown + JSON writer
  types.ts
output/                    # gitignored — reports and raw data land here
.claude/
  skills/
    linkedin-writer-learner/SKILL.md
.env                       # gitignored
.env.example
```

---

## Troubleshooting

- **401 / 403 from RapidAPI** — your key is wrong, or you haven't subscribed to the LinkedIn Bulk Data Scraper API. Re-check Step 1.
- **429 rate limit** — you've burned through your free-tier quota for the month. Upgrade or wait.
- **0 posts returned for a profile** — profile may be private, or the URL is wrong. Verify by pasting the URL into a private browser window.
- **`tsx: command not found`** — run `npm install` first.

---

## License

MIT.
