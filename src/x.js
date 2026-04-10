const noopAdapter = require('./x-adapters/noop');

function normalizeXItem(item, account) {
  return {
    sourceType: 'x',
    lab: item.lab || account?.lab || null,
    person: item.person || account?.person || null,
    handle: item.handle || account?.handle || null,
    title: item.title,
    description: item.description || null,
    url: item.url || (account?.handle ? `https://x.com/${account.handle}` : null),
    published: item.published || null,
    priority: item.priority ?? account?.priority ?? 0,
    kind: item.kind || account?.kind || 'lab',
  };
}

async function fetchXSignals({ accounts = [], adapter = noopAdapter } = {}) {
  const results = [];
  for (const account of accounts) {
    try {
      const items = await adapter.fetchSignals(account);
      if (!Array.isArray(items)) continue;
      items.forEach(item => {
        if (!item || !item.title) return;
        results.push(normalizeXItem(item, account));
      });
    } catch (_) {}
  }
  return results;
}

module.exports = {
  normalizeXItem,
  fetchXSignals,
  noopAdapter,
};
