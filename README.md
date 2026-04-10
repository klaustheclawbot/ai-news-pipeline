# AI News Pipeline

Data backbone for collecting and ranking AI-news signals.

## Design goal

This repo is **not** the final briefing writer.
It gathers structured signals so a separate assistant layer can apply judgment and produce a short executive briefing.

## What it does

- Maintains a curated watchlist of major AI lab accounts on X
- Prefers first-party sources conceptually
- Falls back to official RSS/blog feeds when direct X extraction is unreliable
- Returns structured, ranked items plus source-health metadata

## What it should be used for

- Daily AI news collection
- Signal ranking
- Source monitoring
- Feeding a higher-level briefing agent

## What it should not do

- Write the final executive briefing text
- Mix market, portfolio, crypto, and AI summarization into one script
- Pretend low-quality/noisy retrieval is trustworthy

## API

### `getAINews(options?)`
Returns:
- source metadata
- counts by signal type
- watchlist config
- ranked `items`
- note about source quality / degradation

## CLI

```bash
npm run news
```

## Tests

```bash
npm test
```

## Current limitation

Direct X extraction is not reliable in the current environment, so the pipeline currently uses official feeds as the trustworthy fallback instead of returning junk.

## Planned next step

Add a robust X ingestion adapter so the assistant can reason over first-party posts before blog/news coverage.
