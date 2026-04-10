const test = require('node:test');
const assert = require('node:assert/strict');
const {
  decodeXml,
  extractTag,
  scoreItem,
  isJunkLine,
  uniqueBy,
  fetchRssSignals,
  getAINews,
} = require('../src');

test('decodeXml decodes common entities and CDATA', () => {
  assert.equal(decodeXml('<![CDATA[OpenAI &amp; Anthropic]]>'), 'OpenAI & Anthropic');
});

test('extractTag extracts rss fields', () => {
  const block = '<item><title>Hello</title><link>https://example.com</link></item>';
  assert.equal(extractTag(block, 'title'), 'Hello');
  assert.equal(extractTag(block, 'link'), 'https://example.com');
});

test('scoreItem prefers x and substantive release language', () => {
  const xScore = scoreItem({ sourceType: 'x', title: 'OpenAI releases new model', description: '', published: 'today', priority: 10 });
  const webScore = scoreItem({ sourceType: 'web', title: 'General AI discussion', description: '', published: 'today', priority: 1 });
  assert.ok(xScore > webScore);
});

test('isJunkLine filters known search-wrapper garbage', () => {
  assert.equal(isJunkLine('Title: https://www.google.com/search?q=test'), true);
  assert.equal(isJunkLine('A real headline about OpenAI releasing a new API for enterprise agents'), false);
});

test('uniqueBy deduplicates items', () => {
  const items = uniqueBy([{ id: 1 }, { id: 1 }, { id: 2 }], item => item.id);
  assert.equal(items.length, 2);
});

test('fetchRssSignals parses feed items', async () => {
  const xml = `<?xml version="1.0"?><rss><channel><item><title>OpenAI releases model</title><link>https://example.com/a</link><description>New release</description><pubDate>Fri, 10 Apr 2026 08:00:00 GMT</pubDate></item></channel></rss>`;
  const fetchImpl = async () => ({ status: 200, ok: true, text: async () => xml });
  const items = await fetchRssSignals({ fetchImpl });
  assert.ok(items.length >= 1);
  assert.equal(items[0].title, 'OpenAI releases model');
});

test('getAINews returns ranked items and source metadata', async () => {
  const xml = `<?xml version="1.0"?><rss><channel><item><title>Anthropic announces new API</title><link>https://example.com/b</link><description>API launch</description><pubDate>Fri, 10 Apr 2026 08:00:00 GMT</pubDate></item></channel></rss>`;
  const fetchImpl = async (url) => {
    if (String(url).includes('rss') || String(url).includes('feed.xml')) {
      return { status: 200, ok: true, text: async () => xml };
    }
    return { status: 200, ok: true, text: async () => 'Title: https://www.google.com/search?q=junk' };
  };
  const data = await getAINews({ fetchImpl, limit: 5 });
  assert.equal(data.source, 'x-watchlist-configured+rss+web-fallback');
  assert.ok(Array.isArray(data.items));
  assert.ok(data.items.length >= 1);
});
