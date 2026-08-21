/* ============================================================
   反信息茧房记忆层 · JSON/JSONL 落盘
   记录偏离度偏好、黑名单、兴趣信号、桥梁日志。
   反馈会真正影响下一次搜索 —— 支撑"同题两答"。
   ============================================================ */
import { readFile, writeFile, mkdir, appendFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

export const DEFAULT_MEM = {
  schema_version: '1.0',
  round_counter: 0,
  preferred_deviation: 0.5,
  blacklist: [],        // {category, user_quote, round, active}
  interest_signals: [], // {category, user_quote, round}
  bridge_log: [],       // {round, query, engine, bridge, deviation, feedback}
};

export function createMemoryStore(dataDir) {
  const MEM_FILE = path.join(dataDir, 'memory.json');
  const FB_FILE = path.join(dataDir, 'feedback.jsonl');

  async function ensure() { if (!existsSync(dataDir)) await mkdir(dataDir, { recursive: true }); }
  async function load() {
    await ensure();
    try { return { ...DEFAULT_MEM, ...JSON.parse(await readFile(MEM_FILE, 'utf8')) }; }
    catch { return structuredClone(DEFAULT_MEM); }
  }
  async function save(m) { await ensure(); await writeFile(MEM_FILE, JSON.stringify(m, null, 2), 'utf8'); }
  async function reset() { const f = structuredClone(DEFAULT_MEM); await save(f); return f; }
  async function logFeedback(rec) {
    await ensure();
    await appendFile(FB_FILE, JSON.stringify({ ts: Date.now(), ...rec }) + '\n', 'utf8');
  }
  return { load, save, reset, logFeedback, MEM_FILE, FB_FILE };
}

/* 记录一轮搜索到 bridge_log */
export function recordRound(memory, { query, engine, bridge, deviation }) {
  memory.round_counter += 1;
  memory.preferred_deviation = deviation;
  memory.bridge_log.push({ round: memory.round_counter, query, engine, bridge, deviation, feedback: null });
  if (memory.bridge_log.length > 40) memory.bridge_log = memory.bridge_log.slice(-40);
  return memory;
}

/* 把解析出的反馈动作应用到真实状态与记忆 */
export function applyActions({ actions, deviation, memory }) {
  let dev = deviation;
  const applied = [];
  const round = memory.round_counter;
  for (const a of actions || []) {
    const type = String(a.type || '').toUpperCase();
    const quote = String(a.quote || '');
    if (type === 'ADJUST_DEV') {
      const d = Number(a.delta) || 0.15;
      const before = dev; dev = Math.max(0, Math.min(1, dev + d));
      applied.push({ type, quote, before, after: dev, explain: a.explain || '' });
    } else if (type === 'SET_DEV') {
      const before = dev; dev = Math.max(0, Math.min(1, Number(a.value) ?? dev));
      applied.push({ type, quote, before, after: dev, explain: a.explain || '' });
    } else if (type === 'BLACKLIST_ADD') {
      const category = String(a.category || quote || '').slice(0, 60);
      if (category) {
        const hit = memory.blacklist.find(b => b.category === category);
        if (hit) hit.active = true;
        else memory.blacklist.push({ category, user_quote: quote, round, active: true });
        applied.push({ type, quote, category, explain: a.explain || '' });
      }
    } else if (type === 'BLACKLIST_REMOVE') {
      const category = String(a.category || '');
      const hit = memory.blacklist.find(b => b.category === category || category.includes(b.category));
      if (hit) { hit.active = false; applied.push({ type, quote, category: hit.category }); }
    } else if (type === 'INTEREST_ADD') {
      const category = String(a.category || '').slice(0, 60);
      if (category) {
        memory.interest_signals.push({ category, user_quote: quote, round });
        applied.push({ type, quote, category, explain: a.explain || '' });
      }
    } else if (type === 'RESET') {
      memory.blacklist = []; memory.interest_signals = []; memory.bridge_log = [];
      memory.round_counter = 0; dev = 0.5;
      applied.push({ type, quote, explain: '记忆已清空' });
    }
  }
  memory.preferred_deviation = dev;
  return { deviation: dev, applied };
}

/* 快捷反馈按钮 → 结构化动作（无需 LLM，离线即用） */
export function quickAction(kind, memory, lastBridge) {
  switch (kind) {
    case '太偏了': return { actions: [{ type: 'ADJUST_DEV', delta: -0.15, quote: '太偏了' }], confirm: '收到——把偏离度往回拨一点。' };
    case '不够偏': return { actions: [{ type: 'ADJUST_DEV', delta: 0.15, quote: '不够偏' }], confirm: '收到——下次走得更远。' };
    case '满意': return { actions: [{ type: 'INTEREST_ADD', category: lastBridge || '当前方向', quote: '满意' }], confirm: '记下了——这个方向你喜欢。' };
    case '避开此类': return { actions: [{ type: 'BLACKLIST_ADD', category: lastBridge || '当前方向', quote: '避开此类' }], confirm: `收到——以后避开「${lastBridge || '这类'}」。` };
    case '再来一次': return { actions: [], confirm: '换一批意外方向。' };
    default: return { actions: [], confirm: '' };
  }
}

