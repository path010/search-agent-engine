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

async function searxngOnce(query, signal) {
  const params = new URLSearchParams({
    q: query, format: 'json', language: SEARXNG_LANG,
    safesearch: '1', categories: 'general',
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
  })).filter(r => r.title && /^https?:\/\//i.test(r.url));
}

/* 统一搜索入口：返回 { mode, results:[{title,url,snippet,source}] } */
export async function runSearch({ searchQueries, bridge, limit = 6 }) {
  const queries = (searchQueries || []).filter(Boolean).slice(0, 3);

  if (SEARXNG_URL && queries.length) {
    try {
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), SEARXNG_TIMEOUT);
      const batches = await Promise.allSettled(queries.map(q => searxngOnce(q, ac.signal)));
      clearTimeout(timer);
      const seen = new Set();
      const merged = [];
      for (const b of batches) {
        if (b.status !== 'fulfilled') continue;
        for (const r of b.value) {
          const key = r.url.replace(/[#?].*$/, '').replace(/\/$/, '');
          if (seen.has(key)) continue;
          seen.add(key);
          merged.push(r);
          if (merged.length >= limit) break;
        }
        if (merged.length >= limit) break;
      }
      if (merged.length) return { mode: 'searxng', results: merged };
    } catch { /* fall through to curated */ }
  }

  // 离线 / 无 SearXNG：精选库
  return { mode: 'curated', results: curatedFor(bridge, limit) };
}

export const SEARCH_MODE = SEARXNG_URL ? 'searxng' : 'curated';
