/* ============================================================
   Anti-Cocoon Engine · 前后端一体本地服务（纯 Node.js，零依赖）
   启动：node server.mjs   然后打开 http://127.0.0.1:8787
   - 四个规则引擎 + 精选结果库：无需任何配置，开箱即用
   - SearXNG：设置环境变量 SEARXNG_URL 后自动启用真实全网搜索
   - A.G.E.N.T. + 自然语言反馈：在登录页配置 OpenAI 兼容 API 后启用
   ============================================================ */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ENGINE_META, generate } from './lib/engines.mjs';
import { runSearch, SEARCH_MODE } from './lib/search.mjs';
import { buildCards } from './lib/cards.mjs';
import { createMemoryStore, recordRound, applyActions, quickAction } from './lib/memory.mjs';
import * as llm from './lib/llm.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '127.0.0.1';
const PUBLIC = path.join(__dirname, 'public');
const mem = createMemoryStore(path.join(__dirname, 'data'));

const devBand = d =>
  d < 0.05 ? '直答' : d < 0.25 ? '近路' : d < 0.5 ? '邻域' : d < 0.75 ? '跨界' : '远方';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
};
const sendJSON = (res, code, data) => {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
};
const readBody = req => new Promise((resolve, reject) => {
  let b = '', size = 0;
  req.on('data', c => { size += c.length; if (size > 1e6) { reject(new Error('请求体过大')); req.destroy(); } b += c; });
  req.on('end', () => { try { resolve(b ? JSON.parse(b) : {}); } catch { reject(new Error('请求体不是合法 JSON')); } });
  req.on('error', reject);
});

/* ---- "猜你不想搜"反补全：本地规则，快速生成 ---- */
function buildSuggestions(q) {
  if (!q) return ['如何认真浪费时间', '慢速阅读的必要性', '为什么遗忘是一种整理', '古代书房如何安排注意力'];
  return [
    `如何认真地不做「${q}」`,
    `「${q}」最慢的那个部分是什么`,
    `不追求「${q}」的人怎么生活`,
    `用手工艺的方式重新问「${q}」`,
    `「${q}」的反面藏着什么价值`,
  ];
}

/* 无 API 时：规则解析自然语言反馈 */
function ruleFeedback(text, lastBridge) {
  const t = text || '';
  const strong = /很多|使劲|大幅|放飞|多一点点|狠狠|远一点/.test(t);
  const step = strong ? 0.3 : 0.15;
  const actions = [];
  let confirm = '';
  if (/再偏|更偏|不够偏|远一?点|大胆|放飞/.test(t)) {
    actions.push({ type: 'ADJUST_DEV', delta: step, quote: t });
    confirm = `收到——偏离度 +${step}，下次走得更远。`;
  } else if (/拉回|太偏|近一?点|收一?点|保守|靠谱/.test(t)) {
    actions.push({ type: 'ADJUST_DEV', delta: -step, quote: t });
    confirm = `收到——偏离度 -${step}，往回拨一点。`;
  }
  const avoid = t.match(/不想看|别给我看|避开|不要(.{1,10}?)(内容|类|的)/);
  if (avoid) {
    const cat = (avoid[2] || lastBridge || '这类内容').trim();
    actions.push({ type: 'BLACKLIST_ADD', category: cat, quote: t });
    confirm += `${confirm ? '并且' : '收到——'}以后避开「${cat}」。`;
  }
  if (!actions.length) {
    return { actions: [], confirm: '这条反馈有点模糊，可以说"再偏一点/拉回来一点/不想看XX"。', need_clarify: true };
  }
  return { actions, confirm, need_clarify: false };
}

async function handleAPI(req, res, url) {
  const p = url.pathname;

  if (p === '/api/meta') {
    return sendJSON(res, 200, {
      engines: ENGINE_META, providers: llm.PROVIDERS,
      search_mode: SEARCH_MODE, connected: llm.isConnected(),
    });
  }
  if (p === '/api/state') {
    const memory = await mem.load();
    return sendJSON(res, 200, {
      connected: llm.isConnected(), model: llm.getSession()?.model || null,
      search_mode: SEARCH_MODE, deviation: memory.preferred_deviation, memory,
    });
  }
  if (p === '/api/suggest') {
    const q = (url.searchParams.get('q') || '').trim();
    return sendJSON(res, 200, { suggestions: buildSuggestions(q) });
  }

  if (p === '/api/login' && req.method === 'POST') {
    const b = await readBody(req);
    const baseURL = String(b.baseURL || '').trim();
    const model = String(b.model || '').trim();
    const apiKey = String(b.apiKey || '').trim();
    if (!baseURL || !model) return sendJSON(res, 400, { error: '请填写 baseURL 与 model' });
    if (!/^https?:\/\//i.test(baseURL)) return sendJSON(res, 400, { error: 'baseURL 必须以 http(s):// 开头' });
    const isLocal = /127\.0\.0\.1|localhost/i.test(baseURL);
    if (!apiKey && !isLocal) return sendJSON(res, 400, { error: '请填写 API Key（仅本地 Ollama 可留空）' });
    const prev = llm.getSession();
    llm.setSession({ baseURL, model, apiKey, temperature: Number(b.temperature) || 0.85 });
    try {
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), 45000);
      const echo = await llm.ping(ac.signal);
      clearTimeout(timer);
      return sendJSON(res, 200, { ok: true, model, echo: echo.trim().slice(0, 40) });
    } catch (e) {
      llm.setSession(prev);
      const msg = e.name === 'AbortError' ? '连接超时（45s）——检查网络或 baseURL' : e.message;
      return sendJSON(res, 400, { error: msg });
    }
  }
  if (p === '/api/logout' && req.method === 'POST') {
    llm.clearSession();
    return sendJSON(res, 200, { ok: true });
  }
  if (p === '/api/memory' && req.method === 'DELETE') {
    const fresh = await mem.reset();
    return sendJSON(res, 200, { ok: true, memory: fresh });
  }

  if (p === '/api/search' && req.method === 'POST') {
    const b = await readBody(req);
    const query = String(b.query || '').trim();
    if (!query) return sendJSON(res, 400, { error: '请输入问题' });
    const engine = ENGINE_META[b.engine] ? b.engine : '沙之海';
    const memory = await mem.load();
    const deviation = b.deviation != null
      ? Math.max(0, Math.min(1, Number(b.deviation)))
      : memory.preferred_deviation;

    const t0 = Date.now();

    // A.G.E.N.T. 有 API 时走 LLM，否则降级到规则引擎
    let gen;
    if (engine === 'A.G.E.N.T.' && llm.isConnected()) {
      try {
        const out = await llm.agentGenerate({ query, deviation, memory, signal: null });
        gen = { engine, original_query: query, deviation, ...out };
      } catch (e) {
        gen = generate('沙之海', query, deviation, memory);
        gen.engine = 'A.G.E.N.T.';
        gen.rationale = '（模型不可用，已降级到规则引擎）' + gen.rationale;
      }
    } else {
      gen = generate(engine, query, deviation, memory);
    }

    // 记忆引用：命中黑名单 / 上次反馈时说明
    const activeBl = memory.blacklist.filter(x => x.active !== false);
    const memory_citation = activeBl.length
      ? `因为你说过想避开「${activeBl.map(x => x.category).join('、')}」，本轮已绕开这些方向。`
      : '';

    const { mode, results } = await runSearch({
      searchQueries: gen.search_queries, bridge: gen.bridge_concept, limit: 6,
    });
    const cards = buildCards(query, gen);

    recordRound(memory, { query, engine: gen.engine, bridge: gen.bridge_concept, deviation });
    await mem.save(memory);

    return sendJSON(res, 200, {
      ...gen, memory_citation,
      search_mode: mode, results, cards,
      round: memory.round_counter, band: devBand(deviation),
      elapsed_ms: Date.now() - t0, memory,
    });
  }

  if (p === '/api/feedback' && req.method === 'POST') {
    const b = await readBody(req);
    const text = String(b.text || '').trim();
    const quick = String(b.quick || '').trim();
    const lastBridge = String(b.lastBridge || '').trim();
    const memory = await mem.load();
    const deviation = b.deviation != null ? Number(b.deviation) : memory.preferred_deviation;

    let parsed;
    if (quick) {
      parsed = quickAction(quick, memory, lastBridge);   // 离线快捷反馈
    } else if (!text) {
      return sendJSON(res, 400, { error: '请输入反馈' });
    } else if (llm.isConnected()) {
      parsed = await llm.parseFeedback({ text, deviation, memory, signal: null }); // LLM 解析自然语言
    } else {
      parsed = ruleFeedback(text, lastBridge);           // 无 API 时的规则解析
    }

    const { deviation: newDev, applied } = applyActions({ actions: parsed.actions, deviation, memory });
    if (memory.bridge_log.length) memory.bridge_log[memory.bridge_log.length - 1].feedback = text || quick;
    await mem.save(memory);
    await mem.logFeedback({ text: text || quick, applied, deviation: newDev });

    return sendJSON(res, 200, {
      applied, confirm: parsed.confirm || '', need_clarify: !!parsed.need_clarify,
      deviation: newDev, band: devBand(newDev), memory,
    });
  }

  return sendJSON(res, 404, { error: 'unknown api: ' + p });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = url.pathname;
  try {
    if (p.startsWith('/api/')) return await handleAPI(req, res, url);
    // 静态文件
    let file = p === '/' ? '/index.html' : p;
    if (file.includes('..')) return sendJSON(res, 400, { error: 'bad path' });
    const full = path.join(PUBLIC, file);
    if (!existsSync(full)) return sendJSON(res, 404, { error: 'not found: ' + file });
    const buf = await readFile(full);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    return res.end(buf);
  } catch (e) {
    const code = e.code === 'NO_SESSION' ? 401 : 500;
    return sendJSON(res, code, { error: e.message || String(e) });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n  ✦ Anti-Cocoon Engine 已启动`);
  console.log(`  → http://${HOST}:${PORT}\n`);
  console.log(`  搜索后端：${SEARCH_MODE === 'searxng' ? 'SearXNG（真实全网）' : '精选库（离线开箱即用）'}`);
  console.log(`  A.G.E.N.T.：${llm.isConnected() ? '已连接模型' : '未配置（可在页面右上角连接，或直接用规则引擎）'}`);
  console.log(`  记忆文件：data/memory.json ｜ Ctrl+C 退出\n`);
});
