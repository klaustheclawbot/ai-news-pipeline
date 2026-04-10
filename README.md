# AI News Pipeline

X-first AI news pipeline for daily market briefings.

## What it does

- Maintains a curated watchlist of major AI lab accounts on X
- Attempts to prioritize first-party signals
- Falls back to official RSS/blog feeds when direct X extraction is unreliable
- Produces structured AI-news items for a morning briefing

## Included files

- `ai-news.js` — main news aggregation logic
- `ai-news-sources.json` — watchlist + feed configuration
- `market-briefing.js` — example integration into a 7am market brief

## Current architecture

1. X watchlist configured for:
   - OpenAI
   - Anthropic
   - Google DeepMind
   - Meta AI
   - xAI
   - Mistral AI
   - DeepSeek
   - Qwen
   - Moonshot AI
   - MiniMax
   - Zhipu AI
   - and adjacent ecosystem accounts
2. Official RSS/blog fallback
3. Graceful degradation when X extraction is unavailable

## Current limitation

Direct X extraction is **not reliable in the current environment**, so the pipeline currently uses official feeds as the trustworthy fallback instead of returning noisy junk.

## Run

```bash
node ai-news.js
node market-briefing.js
```

## Next steps

- Add robust X ingestion (API or reliable scraper)
- Deduplicate X posts against blog/news coverage
- Rank material updates over generic marketing posts
- Group output by lab
