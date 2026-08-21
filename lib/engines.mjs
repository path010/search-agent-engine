/* ============================================================
   意外引擎 · 六种意外生成模式（离线规则版，零依赖）
   统一契约：generate(query, deviation, memory) -> {
     engine, original_query, generated_query, search_queries,
     bridge_concept, rationale, chain, avoid_topics
   }
   A.G.E.N.T. 模式在 server 里有 API 时改走 LLM，无 API 时降级到本模块。
   ============================================================ */
import {
  STRANGE_DOMAINS, ANTONYMS, INVERSION_TEMPLATES, HOMOPHONES, RADICALS,
} from './lexicon.mjs';

export const ENGINE_META = {
  '沙之海': { desc: '交给随机的远方', priority: 'high' },
  '反命题': { desc: '把问题翻到背面', priority: 'high' },
  '魔音': { desc: '让声音误导意义', priority: 'high' },
  '字根岔路': { desc: '从部首重新生长', priority: 'mid' },
  '语义远眺': { desc: '望向较远的意义邻域', priority: 'mid' },
  'A.G.E.N.T.': { desc: '让模型替你误会', priority: 'high' },
};

/* 稳定伪随机：同一 query+deviation 得到同一结果，方便"同题两答"对照 */
function seededPick(arr, seedStr, offset = 0) {
  if (!arr.length) return null;
  let h = (2166136261 ^ offset) >>> 0;
  for (const ch of seedStr) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return arr[Math.abs(h) % arr.length];
}

/* 粗分词：中文按单字，英文/数字连续成词 */
const CJK = '一-鿿';
const TOKEN_RE = new RegExp('[a-zA-Z0-9]+|[' + CJK + ']', 'g');
function tokenize(q) { return q.match(TOKEN_RE) || []; }

function bannedBy(memory, category) {
  const bl = (memory && memory.blacklist ? memory.blacklist : []).filter(b => b.active !== false);
  return bl.some(b => category.includes(b.category) || b.category.includes(category));
}

/* ---------- 沙之海：从陌生领域池抽远方，与原问题拼接 ---------- */
function shaZhiHai(query, deviation, memory) {
  let pool = STRANGE_DOMAINS.filter(d => !bannedBy(memory, d.bridge) && !bannedBy(memory, d.name));
  if (!pool.length) pool = STRANGE_DOMAINS;
  const d = seededPick(pool, query + deviation, Math.floor(deviation * 7)) || pool[0];
  return {
    generated_query: `${d.name}如何解释「${query}」`,
    search_queries: [`${query} ${d.name}`, d.name],
    bridge_concept: d.bridge,
    rationale: `把「${query}」丢进「${d.name}」的世界：${d.hint}。`,
    chain: `${query} —[随机抽取]→ ${d.name} —[隐喻映射]→ ${d.bridge}`,
    avoid_topics: [`${query} 教程`, `${query} 是什么`],
  };
}

/* ---------- 反命题：分词取反 / 目的取反，生成背面问题 ---------- */
function fanMingTi(query, deviation, memory) {
  const tokens = tokenize(query);
  const flipped = tokens.map(t => ANTONYMS[t] || t);
  const changed = flipped.some((t, i) => t !== tokens[i]);
  let generated, bridge;
  if (changed) {
    generated = flipped.join('');
    bridge = '反面也是一种答案';
  } else {
    const tpl = seededPick(INVERSION_TEMPLATES, query + deviation, 3);
    generated = tpl(query);
    bridge = '被回避的对立面';
  }
  return {
    generated_query: generated,
    search_queries: [generated, `${generated} 价值 意义`],
    bridge_concept: bridge,
    rationale: `不追问「${query}」怎样做到，而是问它的背面被谁忽略了。`,
    chain: `${query} —[问题倒置]→ ${generated} —[约束相似]→ ${bridge}`,
    avoid_topics: [`如何${query}`, `${query} 方法`],
  };
}

/* ---------- 魔音：谐音 / 近音 / 形近，把严肃词转成荒诞意象 ---------- */
function moYin(query, deviation, memory) {
  const chars = [...query];
  const out = [];
  let hit = null;
  for (const c of chars) {
    const alt = HOMOPHONES[c];
    if (alt && !hit) { const rep = seededPick(alt, query + c, 5); out.push(rep); hit = { from: c, to: rep }; }
    else out.push(c);
  }
  const misheard = out.join('');
  const generated = hit ? `被误听的「${misheard}」` : `${query}的回声`;
  return {
    generated_query: generated,
    search_queries: [misheard, `${misheard} 隐喻 意象`],
    bridge_concept: hit ? `${hit.from}→${hit.to} 的误听` : '声音的歧义',
    rationale: hit
      ? `「${hit.from}」被听成「${hit.to}」——顺着这个走音，去看一个荒诞但能解释的方向。`
      : `让「${query}」在耳朵里走音，看它落在哪个陌生词上。`,
    chain: `${query} —[谐音误听]→ ${misheard} —[隐喻映射]→ 新意象`,
    avoid_topics: [`${query} 定义`, `${query} 原理`],
  };
}

/* ---------- 字根岔路：拆解汉字部件，从部首字义重新联想 ---------- */
function ziGenChaLu(query, deviation, memory) {
  const chars = [...query].filter(c => RADICALS[c]);
  const pick = chars.length ? seededPick(chars, query + deviation, 7) : null;
  if (!pick) {
    const fb = shaZhiHai(query, deviation, memory);
    return { ...fb, bridge_concept: fb.bridge_concept + '（字根未命中，改走远方）' };
  }
  const r = RADICALS[pick];
  const image = seededPick(r.images, query + pick, 9);
  return {
    generated_query: `${r.parts.join(' / ')}：从「${pick}」拆出的${image}`,
    search_queries: [`${image} ${r.images[0]}`, r.images.join(' ')],
    bridge_concept: `${pick} = ${r.parts.join('+')}`,
    rationale: `把「${pick}」拆成 ${r.parts.join('、')}，顺着「${image}」这条字源支路重新生长。`,
    chain: `${pick} —[部首拆解]→ ${r.parts.join('+')} —[历史渊源]→ ${image}`,
    avoid_topics: [`${query} 教程`],
  };
}

/* ---------- 语义远眺：用偏离度切分领域池的"远近带"，模拟语义距离 ---------- */
function yuYiYuanTiao(query, deviation, memory) {
  let pool = STRANGE_DOMAINS.filter(d => !bannedBy(memory, d.bridge));
  if (!pool.length) pool = STRANGE_DOMAINS;
  const band = Math.min(pool.length - 1, Math.floor(deviation * (pool.length - 1)));
  const d = pool[(band + (Math.floor(deviation * 100) % 3)) % pool.length];
  const candidates = [d, pool[(band + 5) % pool.length], pool[(band + 11) % pool.length]].map(x => x.name);
  return {
    generated_query: `${d.name}如何解释「${query}」`,
    search_queries: [`${query} ${d.name}`, d.name],
    bridge_concept: d.bridge,
    rationale: `在候选（${candidates.join(' / ')}）里，按当前偏离度望向「${d.name}」——远，但仍有一条桥。`,
    chain: `${query} —[语义距离]→ ${candidates.join(' · ')} —[结构同构]→ ${d.bridge}`,
    avoid_topics: [`${query} 入门`],
  };
}

/* ---------- 分发 ---------- */
const ENGINE_FNS = {
  '沙之海': shaZhiHai,
  '反命题': fanMingTi,
  '魔音': moYin,
  '字根岔路': ziGenChaLu,
  '语义远眺': yuYiYuanTiao,
  'A.G.E.N.T.': shaZhiHai, // 无 API 时的降级实现；有 API 时 server 覆盖
};

export function generate(engine, query, deviation, memory) {
  const dev = Math.max(0, Math.min(1, deviation));
  // 偏离度 = 0（近路到底）：直接检索原词，不绕路
  if (dev < 0.05) {
    return {
      engine, original_query: query, deviation: dev,
      generated_query: query,
      search_queries: [query, `${query} 是什么`],
      bridge_concept: '直接检索',
      rationale: '偏离度为 0，本轮不绕路，直接给你最匹配的结果。',
      chain: `${query} —[直接检索]→ ${query}`,
      avoid_topics: [],
      direct: true,
    };
  }
  const fn = ENGINE_FNS[engine] || shaZhiHai;
  const out = fn(query, dev, memory || {});
  return { engine, original_query: query, deviation: dev, ...out };
}


