# AI News Pipeline

Data backbone for collecting and ranking AI-news signals.

## Design goal

This repo is **not** the final briefing writer.
It gathers structured signals so a separate assistant layer can apply judgment and produce a short executive briefing.

## What it does

- Maintains a curated watchlist of major AI labs and notable people on X
- Supports a **pluggable X adapter layer**
- Falls back to official RSS/blog feeds when direct X extraction is unreliable
- Returns structured, ranked items plus source-health metadata

## X watchlist

Includes official labs and notable people such as:
- OpenAI / Sam Altman / Greg Brockman
- Anthropic / Dario Amodei
- Google DeepMind / Demis Hassabis / Logan Kilpatrick
- Meta AI / Yann LeCun
- xAI / Elon Musk
- Mistral / Arthur Mensch
- Hugging Face / Clem Delangue
- Andrej Karpathy
- Theo Browne (`@theo`)
- Nathan Lambert
- Andrew Ng

## Pluggable X layer

Current default adapter is a noop adapter.
That means the architecture is ready for a real X source, but the package does not pretend to have reliable X retrieval when it doesn't.

You can inject an adapter through `getAINews({ xAdapter })`.

Expected adapter contract:

```js
{
  async fetchSignals(account) {
    return [
      {
        title: 'OpenAI announces new API',
        description: '...',
        url: 'https://x.com/...',
        published: 'today',
        priority: 10
      }
    ];
  }
}
```

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
