/* ============================================================
   LLM 层 · 可选增强（OpenAI 兼容 /chat/completions）
   - 配置了 API 时：A.G.E.N.T. 引擎与自然语言反馈解析走真实模型
   - 未配置时：server 自动降级到规则引擎，网站照常可用
   API Key 仅存内存，不落盘。
   ============================================================ */

export const PROVIDERS = {
  deepseek: { label: 'DeepSeek', baseURL: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  moonshot: { label: 'Kimi / 月之暗面', baseURL: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
  dashscope: { label: '通义千问', baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
  zhipu: { label: '智谱 GLM', baseURL: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-plus' },
  siliconflow: { label: '硅基流动', baseURL: 'https://api.siliconflow.cn/v1', model: 'deepseek-ai/DeepSeek-V3' },
  ollama: { label: '本地 Ollama', baseURL: 'http://127.0.0.1:11434/v1', model: 'qwen2.5:7b' },
  custom: { label: '自定义端点', baseURL: '', model: '' },
};

let session = null; // {baseURL, model, apiKey, temperature}
export const getSession = () => session;
export const isConnected = () => !!session;
export function setSession(s) { session = s; }
export function clearSession() { session = null; }

async function callLLM({ system, user, json = false, temperature = 0.85, maxTokens = 2000, signal }) {
  if (!session) throw Object.assign(new Error('未配置 API'), { code: 'NO_SESSION' });
  const url = session.baseURL.replace(/\/+$/, '') + '/chat/completions';
  const body = {
    model: session.model,
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    temperature, max_tokens: maxTokens, stream: false,
  };
  if (json) body.response_format = { type: 'json_object' };
  const headers = { 'Content-Type': 'application/json' };
  if (session.apiKey) headers.Authorization = 'Bearer ' + session.apiKey;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal });
  const text = await res.text();
  if (!res.ok) {
    let detail = text.slice(0, 400);
    try { const j = JSON.parse(text); detail = j.error?.message || detail; } catch {}
    throw new Error(`模型返回 ${res.status}：${detail}`);
  }
  const data = JSON.parse(text);
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('模型返回为空');
  return content;
}

function extractJSON(s) {
  let t = String(s || '').trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a === -1 || b <= a) throw new Error('无 JSON');
  return JSON.parse(t.slice(a, b + 1));
}

/* 连通性测试 */
export async function ping(signal) {
  return callLLM({ system: '你是连通性测试器。', user: '只回复两个字：就绪', maxTokens: 16, temperature: 0, signal });
}

/* A.G.E.N.T. 引擎：让模型结合记忆生成意外检索词 */
const AGENT_SYS = `你是"反信息茧房引擎"。用户给你一个问题，你不给最匹配的答案，而是找到一个陌生但有价值的绕路方向。必须：偏，但不能断；怪，但能解释。全部中文。`;
export async function agentGenerate({ query, deviation, memory, signal }) {
  const user = `【用户问题】${query}
【偏离度】${deviation.toFixed(2)}（0=直答，1=最远）
【避开类别】${JSON.stringify((memory?.blacklist || []).filter(b => b.active !== false).map(b => b.category))}
以 JSON 返回（不要额外文字）：
{"generated_query":"一个意外的、可继续搜索的检索方向","search_queries":["真实可搜的词1","词2"],"bridge_concept":"桥梁概念(4-10字)","rationale":"2-3句说明为什么绕这条路","chain":"起点 —[关系]→ 桥 —[关系]→ 落点"}`;
  const raw = await callLLM({ system: AGENT_SYS, user, json: true, temperature: 0.9, signal });
  const o = extractJSON(raw);
  return {
    generated_query: String(o.generated_query || query),
    search_queries: Array.isArray(o.search_queries) ? o.search_queries.slice(0, 3).map(String) : [query],
    bridge_concept: String(o.bridge_concept || '意外方向'),
    rationale: String(o.rationale || ''),
    chain: String(o.chain || ''),
    avoid_topics: [`${query} 教程`],
  };
}

/* 自然语言反馈解析 → 结构化动作 */
export async function parseFeedback({ text, deviation, memory, signal }) {
  const user = `【反馈原话】${text}
【当前偏离度】${deviation.toFixed(2)}
以 JSON 返回：{"actions":[{"type":"ADJUST_DEV|SET_DEV|BLACKLIST_ADD|INTEREST_ADD|RESET","delta":0.15,"value":0.7,"category":"语义类别","quote":"用户原话片段"}],"confirm":"一句自然语言确认","need_clarify":false}
规则：一点/稍微=±0.15，很多/放飞=±0.30；"不想看XX"→BLACKLIST_ADD 且 category 泛化成语义类别；模糊反馈只返回 need_clarify=true。全部中文。`;
  const raw = await callLLM({ system: AGENT_SYS, user, json: true, temperature: 0.3, maxTokens: 900, signal });
  const o = extractJSON(raw);
  return {
    actions: Array.isArray(o.actions) ? o.actions : [],
    confirm: String(o.confirm || ''),
    need_clarify: !!o.need_clarify,
  };
}
