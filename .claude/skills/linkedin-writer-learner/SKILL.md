---
name: linkedin-writer-learner
description: Scrape your own LinkedIn + competitors' LinkedIn posts via RapidAPI, rank by engagement per-author, and learn what's working. Saves local Markdown + JSON report. Use when the user wants to study what's resonating on LinkedIn or generate post ideas grounded in real engagement data.
user_invocable: true
---

# LinkedIn Writer/Learner

Run the local LinkedIn analysis pipeline: scrape the user's profile + competitors via RapidAPI's LinkedIn Bulk Data Scraper, rank each post against the author's own median engagement, and write a local Markdown + JSON report. Then read the report and present insights to the user.

## Steps

1. **Check setup.** Is `config/profiles.json` and `.env` present in the repo root?

   - If **NO** → walk the user through setup:
     1. Tell them they need a RapidAPI key. Walk them through getting one:
        - Sign up at https://rapidapi.com/auth/sign-up (free)
        - Open https://rapidapi.com/freshdata-freshdata-default/api/linkedin-bulk-data-scraper
        - Click "Subscribe to Test" → pick the free **Basic** plan
        - Click any endpoint → copy the `X-RapidAPI-Key` shown in the right-side "Code Snippets" panel
     2. Then run: `npm install && npm run setup`
     3. The wizard prompts for the key, the user's own LinkedIn URL, and each competitor.

   - If **YES** → continue.

2. **Run the pipeline:**
   ```bash
   npm run run
   ```
   This produces:
   - `output/report-YYYY-MM-DD.md` — readable report
   - `output/linkedin-posts-YYYY-MM-DD.json` — raw data

3. **Read the report** (`output/report-YYYY-MM-DD.md` for today's date) and surface:
   - The user's median engagement and top/bottom posts
   - Top competitors by median engagement
   - The 5–8 strongest **"what's working"** posts across the dataset
   - Recurring themes, hooks, formats, or post types in the working set
   - Things that are consistently underperforming (so the user can stop doing them)

4. **Offer follow-up:**
   - "Want me to draft 3 new post ideas in your voice based on the strongest themes?"
   - "Want me to dig into a specific competitor?"
   - "Want me to compare what works for you vs. them?"

## Notes

- The classifier is **per-author**: a post counts as "working" if it's ≥ 2× that author's own median engagement. This avoids drowning small creators in big creators' raw numbers.
- Each daily run is timestamped — never overwrites prior reports. Trend over time.
- If the user wants to re-analyze without burning RapidAPI quota, use `npm run analyze` (uses today's cached raw posts).
- RapidAPI free tier covers ~5–10 runs/month with ~10 competitors. Upgrade for daily runs.
