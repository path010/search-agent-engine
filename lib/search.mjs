/* ============================================================
   搜索适配器 · 把 generated_query / search_queries 换成真实网页结果
   1) 若配置了 SEARXNG_URL 且可达 → 走 SearXNG JSON 接口
   2) 否则（默认）→ 从精选库 curated 取真实链接，保证离线即用
   纯 Node 内置 fetch，零依赖。
   ============================================================ */
import { curatedFor } from './curated.mjs';

const SEARXNG_URL = (process.env.SEARXNG_URL || '').trim().replace(/\/+$/, '');
const SEARXNG_LANG = process.env.SEARXNG_LANGUAGE || 'zh-CN';
const SEARXNG_TIMEOUT = Number(process.env.SEARXNG_TIMEOUT || 8000);

function clean(s) {
  return String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
function hostOf(url) {
  try { return new URL(url).host.replace(/^www\./, ''); } catch { return '网页'; }
}

function termsOf(query = '') {
  return String(query).split(/\s+/).map(x => x.trim()).filter(x => x.length >= 2).slice(0, 8);
}

function normalizedUrl(url = '') {
  return String(url).replace(/[#?].*$/, '').replace(/\/$/, '').toLowerCase();
}

function qualityScore(result, query = '') {
  const haystack = `${result.title || ''} ${result.snippet || ''}`.toLowerCase();
  const terms = termsOf(query);
  const hits = terms.reduce((n, term) => n + (haystack.includes(term.toLowerCase()) ? 1 : 0), 0);
  const authority = /\.gov$|\.edu$|\.org$/.test(hostOf(result.url)) ? 0.15 : 0;
  return Math.min(1, Number(result.relevance || 0.35) + (terms.length ? hits / terms.length * 0.45 : 0) + authority);
}

function explainResult(result, { originalQuery = '', generatedQuery = '', bridge = '' } = {}) {
  const haystack = `${result.title || ''} ${result.snippet || ''}`.toLowerCase();
  const terms = termsOf(generatedQuery).filter(term => haystack.includes(term.toLowerCase()));
  const evidence = terms.length ? `页面出现了「${terms.slice(0, 3).join('、')}」相关线索` : `它属于「${bridge || '这个意外方向'}」的资料入口`;
  return {
    ...result,
    match_terms: terms,
    why: `你从「${originalQuery}」绕到「${bridge || generatedQuery}」，而这页${evidence}。`,
    connection: `${bridge || '意外方向'} → ${result.title}`,
  };
}

async function searxngOnce(query, page, signal) {
  const params = new URLSearchParams({
    q: query, format: 'json', language: SEARXNG_LANG,
    safesearch: '1', categories: 'general', pageno: String(page + 1),
  });
  const res = await fetch(`${SEARXNG_URL}/search?${params}`, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'AntiCocoonEngine/1.0' },
    signal,
  });
  if (!res.ok) throw new Error('searxng ' + res.status);
  const data = await res.json();
  const items = Array.isArray(data.results) ? data.results : [];
  return items.map(it => ({
    title: clean(it.title),
    url: clean(it.url),
    snippet: clean(it.content || it.snippet || ''),
    source: hostOf(it.url),
    relevance: Number(it.score || 0.35),
  })).filter(r => r.title && /^https?:\/\//i.test(r.url));
}

/* 统一搜索入口：返回 { mode, results:[{title,url,snippet,source}] } */
export async function runSearch({ searchQueries, bridge, originalQuery = '', generatedQuery = '', limit = 6, page = 0, retry = 0, excludeUrls = [] }) {
  const queries = (searchQueries || []).filter(Boolean).slice(0, 3);
  const safePage = Math.max(0, Math.floor(Number(page) || 0));
  const target = limit + 1;
  const excluded = new Set(excludeUrls.map(normalizedUrl));

  if (SEARXNG_URL && queries.length) {
    try {
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), SEARXNG_TIMEOUT);
      const batches = await Promise.allSettled(queries.map(q => searxngOnce(q, safePage, ac.signal)));
      clearTimeout(timer);
      const seen = new Set(excluded);
      const merged = [];
      for (const b of batches) {
        if (b.status !== 'fulfilled') continue;
        for (const r of b.value) {
          const key = normalizedUrl(r.url);
          if (seen.has(key)) continue;
          seen.add(key);
          merged.push(r);
          if (merged.length >= target) break;
        }
        if (merged.length >= target) break;
      }
      if (merged.length) {
        const scored = merged
          .map((r, i) => ({ ...r, _order: i, _quality: qualityScore(r, generatedQuery || originalQuery) }))
          .sort((a, b) => b._quality - a._quality || a._order - b._order)
          .slice(0, target);
        return {
          mode: 'searxng',
          results: scored.slice(0, limit).map(({ _order, _quality, ...r }) => explainResult({ ...r, relevance: _quality }, { originalQuery, generatedQuery, bridge })),
          has_more: scored.length > limit,
          page: safePage,
          next_page: scored.length > limit ? safePage + 1 : null,
        };
      }
    } catch { /* fall through to curated */ }
  }

  // 离线 / 无 SearXNG：精选库
  const queryHash = String(generatedQuery || searchQueries?.[0] || '').split('').reduce((h, c) => (Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0), 2166136261);
  const results = curatedFor(bridge, target, {
    offset: retry * 2 + safePage * limit + (queryHash % 8),
    excludeUrls,
    originalQuery,
  });
  const scored = results
    .map((r, i) => ({ ...r, _order: i, _quality: qualityScore(r, generatedQuery || originalQuery) }))
    .sort((a, b) => b._quality - a._quality || a._order - b._order);
  return {
    mode: 'curated',
    results: scored.slice(0, limit).map(({ _order, _quality, ...r }) => explainResult({ ...r, relevance: _quality }, { originalQuery, generatedQuery, bridge })),
    has_more: scored.length > limit,
    page: safePage,
    next_page: scored.length > limit ? safePage + 1 : null,
  };
}

export const SEARCH_MODE = SEARXNG_URL ? 'searxng' : 'curated';
