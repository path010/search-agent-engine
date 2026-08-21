/* ============================================================
   首页逻辑：引擎菜单、反补全候选、偏离度、跳转结果页、可选登录
   ============================================================ */
import { api, toast, initDrift, fillEngines } from '/common.js';

const $ = id => document.getElementById(id);
const q = $('q'), engine = $('engine'), dev = $('dev'), devVal = $('devVal');
const suggest = $('suggest'), engineNote = $('engineNote');
let META = null;

const devLabel = v => {
  const d = v / 100;
  const band = d < 0.05 ? '直答' : d < 0.25 ? '近路' : d < 0.5 ? '邻域' : d < 0.75 ? '跨界' : '远方';
  return `${d.toFixed(2)} · ${band}`;
};

async function boot() {
  initDrift();
  try {
    META = await api.get('/api/meta');
    fillEngines(engine, META.engines, '沙之海');
    $('searchChip').textContent = META.search_mode === 'searxng' ? '搜索源：SearXNG' : '搜索源：精选库（离线）';
    updateConn(META.connected);
    fillProviders();
    updateEngineNote();
  } catch (e) { toast('初始化失败：' + e.message); }
}

function updateConn(connected) {
  const chip = $('connChip'), btn = $('connBtn');
  if (connected) { chip.textContent = 'A.G.E.N.T. 已连接'; chip.classList.add('on'); btn.textContent = '切换配置'; }
  else { chip.textContent = 'A.G.E.N.T. 未连接'; chip.classList.remove('on'); btn.textContent = '连接模型'; }
}

function updateEngineNote() {
  const info = META?.engines?.[engine.value];
  let note = info ? `「${engine.value}」：${info.desc}` : '';
  if (engine.value === 'A.G.E.N.T.' && !META?.connected) note += '（未连接模型，将自动降级到规则引擎）';
  engineNote.textContent = note;
}

/* ---- 反补全候选："猜你不想搜"，本地即时 + 服务端兜底 ---- */
let suggestTimer = null;
function showSuggest(items, aiHint) {
  if (!items?.length) { suggest.hidden = true; return; }
  suggest.innerHTML = '<div class="lead">猜你不想搜' + (aiHint ? '<span class="ai-hint">按 Tab 接受 AI 接话</span>' : '') + '</div>';
  for (const s of items) {
    const b = document.createElement('button');
    b.textContent = s;
    b.onclick = () => { q.value = s; suggest.hidden = true; q.focus(); };
    suggest.appendChild(b);
  }
  suggest.hidden = false;
}

q.addEventListener('input', () => {
  const v = q.value.trim();
  clearTimeout(suggestTimer);
  if (!v) { suggest.hidden = true; return; }
  suggestTimer = setTimeout(async () => {
    try { const d = await api.get('/api/suggest?q=' + encodeURIComponent(v)); showSuggest(d.suggestions); }
    catch { suggest.hidden = true; }
  }, 180);
});
q.addEventListener('blur', () => setTimeout(() => { suggest.hidden = true; }, 150));

/* ---- 偏离度 ---- */
dev.addEventListener('input', () => { devVal.textContent = devLabel(Number(dev.value)); });
devVal.textContent = devLabel(Number(dev.value));

/* ---- 引擎切换 ---- */
engine.addEventListener('change', updateEngineNote);

/* ---- 预设词 ---- */
document.querySelectorAll('.presets button').forEach(b => {
  b.onclick = () => { q.value = b.dataset.q; go(); };
});

/* ---- 出发 ---- */
function go() {
  const query = q.value.trim();
  if (!query) { q.focus(); toast('输入一个问题'); return; }
  const params = new URLSearchParams({ q: query, engine: engine.value, dev: dev.value });
  location.href = '/results.html?' + params.toString();
}
$('go').addEventListener('click', go);
q.addEventListener('keydown', e => { if (e.key === 'Enter') { suggest.hidden = true; go(); } });

/* ---- 可选登录：连接 OpenAI 兼容模型 ---- */
const modal = $('loginModal'), provider = $('provider');
function fillProviders() {
  if (!META?.providers) return;
  provider.innerHTML = '';
  for (const [key, p] of Object.entries(META.providers)) {
    const opt = document.createElement('option');
    opt.value = key; opt.textContent = p.label;
    provider.appendChild(opt);
  }
  applyProvider();
}
function applyProvider() {
  const p = META.providers[provider.value];
  if (p && p.baseURL) { $('baseURL').value = p.baseURL; $('model').value = p.model; }
  else { $('baseURL').value = ''; $('model').value = ''; }
}
provider.addEventListener('change', applyProvider);

$('connBtn').addEventListener('click', () => { modal.classList.add('show'); });
$('skipLogin').addEventListener('click', () => { modal.classList.remove('show'); });
modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('show'); });

$('loginBtn').addEventListener('click', async () => {
  const msg = $('loginMsg');
  msg.className = 'msg'; msg.textContent = '连接中……';
  try {
    const d = await api.post('/api/login', {
      provider: provider.value,
      baseURL: $('baseURL').value.trim(),
      model: $('model').value.trim(),
      apiKey: $('apiKey').value.trim(),
    });
    msg.className = 'msg ok'; msg.textContent = `已连接 ${d.model}（模型回声：${d.echo || '就绪'}）`;
    META.connected = true;
    updateConn(true);
    fillEngines(engine, META.engines, engine.value);
    updateEngineNote();
    setTimeout(() => modal.classList.remove('show'), 900);
  } catch (e) {
    msg.className = 'msg err'; msg.textContent = e.message;
  }
});

boot();
