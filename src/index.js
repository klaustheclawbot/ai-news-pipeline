const SOURCES = require('../ai-news-sources.json');

const DEFAULT_TIMEOUT = 10000;

async function fetchWithTimeout(url, timeout = DEFAULT_TIMEOUT, fetchImpl = fetch) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetchImpl(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    return { status: response.status, ok: response.ok, text: await response.text() };
  } finally {
    clearTimeout(timeoutId);
  }
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  return items.filter(item => {
    const key = keyFn(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function decodeXml(str = '') {
  return str
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? decodeXml(match[1].trim()) : null;
}

function scoreItem(item) {
  let score = 0;
  const text = `${item.title || ''} ${item.description || ''}`.toLowerCase();
  if (item.sourceType === 'x') score += 20;
  if (/(launch|release|introduc|announce|api|model|open[- ]source|weights|funding|raises|acquire|partnership)/.test(text)) score += 10;
  if (/(openai|anthropic|deepmind|google|meta|xai|mistral|deepseek|qwen|moonshot|minimax|zhipu)/.test(text)) score += 8;
  if (item.published && /(hour|minute|just now|today)/i.test(item.published)) score += 6;
  score += item.priority || 0;
  return score;
}

function isJunkLine(line) {
  const lower = line.toLowerCase();
  return !line ||
    line.length < 50 ||
    lower.startsWith('title:') ||
    lower.startsWith('url source:') ||
    lower.startsWith('markdown content:') ||
    lower.startsWith('warning:') ||
    lower.includes('google.com/search?q=') ||
    lower.includes('tbm=nws') ||
    lower.includes('site:x.com/');
}

async function fetchXSignals() {
  return [];
}

async function fetchRssSignals({ fetchImpl = fetch } = {}) {
  const results = [];
  for (const feed of SOURCES.rssFeeds || []) {
    try {
      const res = await fetchWithTimeout(feed.url, 8000, fetchImpl);
      if (!res.ok) continue;
      const xml = res.text;
      const blocks = [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)].map(m => m[0]);
      blocks.slice(0, 4).forEach(block => {
        const title = extractTag(block, 'title');
        const url = extractTag(block, 'link');
        const description = extractTag(block, 'description');
        const published = extractTag(block, 'pubDate');
        if (!title) return;
        results.push({
          sourceType: 'rss',
          lab: feed.lab,
          title,
          url,
          description,
          published,
          priority: feed.priority
        });
      });
    } catch (_) {}
  }
  return results;
}

async function fetchWebSignals({ fetchImpl = fetch } = {}) {
  const results = [];
  for (const queryText of SOURCES.webQueries || []) {
    const url = `https://r.jina.ai/http://www.google.com/search?q=${encodeURIComponent(queryText)}&tbm=nws&tbs=qdr:d`;
    try {
      const res = await fetchWithTimeout(url, 8000, fetchImpl);
      if (!res.ok) continue;
      const lines = res.text.split('\n').map(line => line.trim()).filter(Boolean);
      for (const line of lines.slice(0, 60)) {
        if (isJunkLine(line)) continue;
        results.push({
          sourceType: 'web',
          title: line.slice(0, 220),
          description: line,
          url: null,
          published: 'recent',
          priority: 1
        });
      }
    } catch (_) {}
  }
  return results;
}

async function getAINews(options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const [xSignals, rssSignals, webSignals] = await Promise.all([
    fetchXSignals(),
    fetchRssSignals({ fetchImpl }),
    fetchWebSignals({ fetchImpl })
  ]);

  const items = uniqueBy([...xSignals, ...rssSignals, ...webSignals], item => `${item.sourceType}:${item.lab || ''}:${item.title}`)
    .map(item => ({ ...item, score: scoreItem(item) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, options.limit || 8);

  return {
    source: 'x-watchlist-configured+rss+web-fallback',
    xSignals: xSignals.length,
    rssSignals: rssSignals.length,
    webSignals: webSignals.length,
    watchlist: SOURCES.xAccounts,
    note: xSignals.length === 0 ? 'X-first watchlist is configured, but direct X extraction is not reliable in the current environment; using official RSS/blog sources plus web fallback for now.' : undefined,
    items
  };
}

module.exports = {
  SOURCES,
  fetchWithTimeout,
  uniqueBy,
  decodeXml,
  extractTag,
  scoreItem,
  isJunkLine,
  fetchXSignals,
  fetchRssSignals,
  fetchWebSignals,
  getAINews,
};
