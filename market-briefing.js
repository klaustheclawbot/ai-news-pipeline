#!/usr/bin/env node
/**
 * Morning Market Briefing v3 (T212 + Crypto + AI News)
 * Runs at 7:00 AM — Fetches T212 stocks, crypto prices, AI news
 * Fallback: Browser scraping if APIs rate-limited
 */

// Load .env file for T212 credentials
function loadEnv() {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '.env');
  
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value && !process.env[key]) {
        process.env[key] = value;
      }
    });
  }
}

loadEnv();
const { getAINews } = require('./ai-news.js');

// T212 Client
class T212 {
  constructor() {
    const apiKey = process.env.T212_API_KEY;
    const apiSecret = process.env.T212_API_SECRET;
    
    if (!apiKey || !apiSecret) {
      throw new Error('T212 credentials not found');
    }
    
    this.baseUrl = process.env.T212_BASE_URL || 'https://live.trading212.com/api/v0';
    this.credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  }

  async request(endpoint) {
    const url = this.baseUrl + endpoint;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${this.credentials}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`T212 HTTP ${response.status}`);
    }

    return await response.json();
  }

  async getPortfolio() {
    return this.request('/equity/portfolio');
  }
}

// Node 22+ has fetch built-in globally
const TIMEOUT = 10000;

async function fetchWithTimeout(url, timeout = TIMEOUT) {
  const controller = new AbortController();
  const timeout_id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return { status: response.status, ok: response.ok, data: await response.text() };
  } finally {
    clearTimeout(timeout_id);
  }
}

async function fetchMarketData() {
  console.log('[7:00 AM] Starting Market Briefing...');
  
  const result = {
    stocks: null,
    crypto: null,
    aiNews: null,
    fallback: false
  };

  // T212 Portfolio (live stocks)
  try {
    console.log('[T212] Fetching live portfolio...');
    const t212 = new T212();
    const portfolio = await t212.getPortfolio();
    
    const sortedByPL = portfolio
      .sort((a, b) => Math.abs(b.ppl || 0) - Math.abs(a.ppl || 0))
      .slice(0, 5);
    
    result.stocks = {
      source: 't212',
      holdings: portfolio.length,
      topHoldings: sortedByPL.map(h => ({
        ticker: h.ticker,
        quantity: h.quantity,
        currentPrice: h.currentPrice,
        ppl: h.ppl,
        fxPpl: h.fxPpl
      }))
    };
    console.log(`✓ T212 Portfolio: ${portfolio.length} holdings`);
  } catch (error) {
    console.error('[T212] Error:', error.message);
    result.stocks = { error: `T212 fetch failed: ${error.message}` };
  }

  // Crypto: BTC, ETH, SOL
  try {
    console.log('Fetching crypto prices...');
    const cryptoUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true';
    const cryptoRes = await fetchWithTimeout(cryptoUrl);
    result.crypto = JSON.parse(cryptoRes.data || '{}');
  } catch (error) {
    console.log('Crypto fetch failed:', error.message);
    result.crypto = { error: 'Could not fetch crypto' };
  }

  // AI News: X-first lab watchlist + web fallback
  try {
    console.log('Fetching AI news (X-first watchlist + web fallback)...');
    result.aiNews = await getAINews();
    if (!result.aiNews.items || result.aiNews.items.length === 0) {
      result.fallback = true;
      result.aiNews.note = 'No strong AI news items found from watchlist/web sources';
    }
  } catch (error) {
    console.error('AI news error:', error.message);
    result.fallback = true;
    result.aiNews = { error: 'Could not fetch AI news', details: error.message };
  }

  console.log('\n=== BRIEFING COMPLETE ===');
  console.log('Status:', result.fallback ? '⚠️ Partial (API fallback used)' : '✅ Complete');
  console.log('Output:');
  console.log(JSON.stringify(result, null, 2));

  return result;
}

// Run
fetchMarketData().catch(console.error);
