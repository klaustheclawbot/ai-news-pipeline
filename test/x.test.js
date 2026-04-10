const test = require('node:test');
const assert = require('node:assert/strict');
const { fetchXSignals, normalizeXItem } = require('../src/x');
const { getAINews } = require('../src');

test('normalizeXItem fills defaults from account', () => {
  const item = normalizeXItem({ title: 'OpenAI releases a new model' }, { lab: 'OpenAI', handle: 'OpenAI', priority: 10, kind: 'lab' });
  assert.equal(item.sourceType, 'x');
  assert.equal(item.lab, 'OpenAI');
  assert.equal(item.handle, 'OpenAI');
  assert.equal(item.url, 'https://x.com/OpenAI');
});

test('fetchXSignals uses adapter contract', async () => {
  const adapter = {
    async fetchSignals(account) {
      return [{ title: `Update from ${account.handle}`, published: 'today' }];
    }
  };
  const items = await fetchXSignals({
    accounts: [{ kind: 'person', person: 'Theo Browne', lab: 'Independent', handle: 'theo', priority: 6 }],
    adapter,
  });
  assert.equal(items.length, 1);
  assert.equal(items[0].handle, 'theo');
  assert.equal(items[0].kind, 'person');
});

test('getAINews ranks x adapter results above rss when substantive', async () => {
  const xAdapter = {
    async fetchSignals(account) {
      if (account.handle === 'OpenAI') {
        return [{ title: 'OpenAI announces new model API', description: 'model release', published: 'today' }];
      }
      return [];
    }
  };

  const xml = `<?xml version="1.0"?><rss><channel><item><title>OpenAI enterprise update</title><link>https://example.com/a</link><description>general update</description><pubDate>Fri, 10 Apr 2026 08:00:00 GMT</pubDate></item></channel></rss>`;
  const fetchImpl = async (url) => {
    if (String(url).includes('rss') || String(url).includes('feed.xml')) {
      return { status: 200, ok: true, text: async () => xml };
    }
    return { status: 200, ok: true, text: async () => '' };
  };

  const data = await getAINews({ fetchImpl, xAdapter, limit: 5 });
  assert.ok(data.xSignals >= 1);
  assert.equal(data.items[0].sourceType, 'x');
  assert.match(data.items[0].title, /OpenAI announces new model API/);
});
