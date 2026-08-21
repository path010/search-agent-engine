/* ============================================================
   结果页逻辑：意外过场动画 → 搜索 → 瀑布流 + 解释链 + 右侧卡片 → 反馈 → 记忆
   ============================================================ */
import { api, toast, initDrift, fillEngines, escapeHTML } from '/common.js';

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
let META = null, LAST = null;
let query = (params.get('q') || '').trim();
let engineName = params.get('engine') || '沙之海';
let deviation = Math.max(0, Math.min(1, Number(params.get('dev') || 50) / 100));
let retryNonce = Math.max(0, Number(params.get('retry') || 0));
let currentPage = 0;
let loadedUrls = [];

async function boot() {
  initDrift();
  if (!query) { location.href = '/'; return; }
  try {
    META = await api.get('/api/meta');
    fillEngines($('engine'), META.engines, engineName);
    $('q').value = query;
    $('connChip').textContent = META.connected ? 'A.G.E.N.T. 已连接'
      : '搜索源：' + (META.search_mode === 'searxng' ? 'SearXNG' : '精选库');
    if (META.connected) $('connChip').classList.add('on');
  } catch (e) { toast('初始化失败：' + e.message); }
  runSearch(true);
}

/* ---- 重搜 / 引擎切换 ---- */
$('go').addEventListener('click', () => {
  query = $('q').value.trim();
  engineName = $('engine').value;
  if (!query) return;
  runSearch(true);
});
$('q').addEventListener('keydown', e => { if (e.key === 'Enter') $('go').click(); });
$('engine').addEventListener('change', () => { engineName = $('engine').value; });

/* ---- 意外过场：按引擎变化的字词拆解/替换动画 ---- */
const STAGE_CAP = {
  '反命题': '原词逐个翻面……',
  '魔音': '字词发散出近音……',
  '字根岔路': '汉字拆成部首……',
  '沙之海': '陌生领域词涌现……',
  '语义远眺': '丈量意义的距离……',
  'A.G.E.N.T.': '生成误读草稿……',
};
const POOL = ['扌', '索', '磨', '星', '云', '桥', '误', '岔', '音', '海', '沙', '绕', '远', '境', '根', '疑'];

function animateStage(gen) {
  return new Promise(resolve => {
    const stage = $('stage'), glyphs = $('glyphs'), caption = $('caption'), reveal = $('reveal');
    stage.classList.add('show');
    reveal.classList.remove('in');
    caption.textContent = STAGE_CAP[engineName] || STAGE_CAP['沙之海'];
    const dst = [...(gen.generated_query || query)].filter(c => c.trim()).slice(0, 9);
    let frame = 0;
    const total = 20;
    const timer = setInterval(() => {
      frame++;
      const ratio = frame / total;
      const out = dst.map((ch, i) => {
        const settled = (i / dst.length) < ratio;
        if (settled) return `<span class="lit">${escapeHTML(ch)}</span>`;
        return escapeHTML(POOL[(frame + i * 3) % POOL.length]);
      });
      glyphs.innerHTML = out.join('');
      if (frame >= total) {
        clearInterval(timer);
        glyphs.innerHTML = dst.map(c => `<span class="lit">${escapeHTML(c)}</span>`).join('');
        $('rvIn').textContent = query;
        $('rvGen').textContent = gen.generated_query || '';
        $('rvReal').textContent = (gen.search_queries || []).join(' ');
        reveal.classList.add('in');
        setTimeout(() => { stage.classList.remove('show'); resolve(); }, 1400);
      }
    }, 55);

    // 点击跳过
    stage.onclick = () => {
      clearInterval(timer);
      stage.classList.remove('show');
      resolve();
    };
  });
}

/* ---- 搜索：先跑过场，拿到结果后渲染 ---- */
let searching = false;
async function runSearch(updateUrl) {
  if (searching) return;
  searching = true;
  loadedUrls = [];
  currentPage = 0;
  if (updateUrl) {
    const p = new URLSearchParams({ q: query, engine: engineName, dev: Math.round(deviation * 100), retry: retryNonce });
    history.replaceState(null, '', '/results.html?' + p.toString());
  }
  const stage = $('stage'), glyphs = $('glyphs'), caption = $('caption');
  stage.classList.add('show');
  caption.textContent = STAGE_CAP[engineName] || '意外正在发生……';
  glyphs.innerHTML = POOL.slice(0, 6).join('');

  try {
    const data = await api.post('/api/search', { query, engine: engineName, deviation, retry: retryNonce, page: 0, exclude_urls: [] });
    await animateStage(data);
    LAST = data;
    deviation = data.deviation;
    retryNonce = Number(data.retry || retryNonce);
    render(data, false);
    // 同题两答：命中记忆时弹胶囊
    if (data.memory_citation && data.round > 1) showMemoryPop(data.memory_citation);
  } catch (e) {
    stage.classList.remove('show');
    toast('搜索失败：' + e.message);
  } finally {
    searching = false;
  }
}

function showMemoryPop(text) {
  $('memText').textContent = text;
  $('memPop').classList.add('show');
}
$('memClose').addEventListener('click', () => $('memPop').classList.remove('show'));
$('memPop').addEventListener('click', e => { if (e.target === $('memPop')) $('memPop').classList.remove('show'); });

/* ---- 渲染结果 ---- */
function render(d, append = false) {
  $('layout').hidden = false;
  const srcLabel = d.search_mode === 'searxng' ? 'SearXNG 实时' : '精选库';

  // 顶部信息条
  $('metaStrip').innerHTML =
    `<span>原始问题：<b>${escapeHTML(d.original_query)}</b></span>` +
    `<span>真实检索词：<span class="real">${escapeHTML((d.search_queries || []).join(' '))}</span></span>` +
    `<span class="badge">引擎：${escapeHTML(d.engine)}</span>` +
    `<span class="badge">偏离度 ${d.deviation.toFixed(2)} · ${escapeHTML(d.band)}</span>` +
    `<span class="badge">第 ${d.round} 轮</span>` +
    `<span class="badge">${srcLabel}</span>` +
    `<span class="badge">第 ${Number(d.page || 0) + 1} 页</span>` +
    (d.memory_citation ? `<span class="cite">💊 ${escapeHTML(d.memory_citation)}</span>` : '');

  // 结果瀑布流
  const stream = $('stream');
  if (!append) stream.innerHTML = '';
  (d.results || []).forEach((r, i) => stream.appendChild(resultCard(r, d, i)));
  if (!d.results?.length && !append) stream.innerHTML = '<div class="card">这次没有取到结果，换个引擎或降低偏离度再试。</div>';
  for (const r of d.results || []) if (r.url && !loadedUrls.includes(r.url)) loadedUrls.push(r.url);
  currentPage = Number(d.page || 0);
  $('moreWrap').hidden = !d.has_more;
  $('moreBtn').disabled = false;
  $('moreStatus').textContent = d.has_more ? '还可以继续绕路' : '已经到达当前搜索源的末尾';

  // 右侧灵感卡片
  renderCards(d.cards, d.original_query);
}

async function loadMore() {
  if (searching || !$('moreWrap') || $('moreWrap').hidden) return;
  searching = true;
  $('moreBtn').disabled = true;
  $('moreStatus').textContent = '正在寻找下一页……';
  try {
    const data = await api.post('/api/search', {
      query, engine: engineName, deviation, retry: retryNonce,
      page: currentPage + 1, exclude_urls: loadedUrls,
    });
    LAST = data;
    render(data, true);
  } catch (e) {
    $('moreBtn').disabled = false;
    $('moreStatus').textContent = '加载失败，请再试一次';
    toast('加载更多失败：' + e.message);
  } finally {
    searching = false;
  }
}

$('moreBtn').addEventListener('click', loadMore);

function resultCard(r, d, i) {
  const el = document.createElement('article');
  el.className = 'card';
  el.style.animationDelay = (i * 0.06) + 's';
  const dist = Math.round(d.deviation * 100);
  el.innerHTML =
    `<div class="type"><span>${d.search_mode === 'searxng' ? '网页' : '资料入口'}</span>` +
    `<span>桥梁：${escapeHTML(d.bridge_concept)}</span>` +
    `<span class="dist">偏离 ${dist}</span></div>` +
    `<h3><a href="${escapeHTML(r.url)}" target="_blank" rel="noopener">${escapeHTML(r.title)}</a></h3>` +
    `<p class="snippet">${escapeHTML(r.snippet)}</p>` +
    `<div class="src">${escapeHTML(r.source)}</div>` +
    `<div class="foot">` +
    `<button class="why-btn">🧍 为什么会看到它</button>` +
    `<span class="fb">` +
    `<button data-fb="太偏了">太偏了</button>` +
    `<button data-fb="满意">满意</button>` +
    `<button data-fb="不够偏">不够偏</button>` +
    `</span></div>` +
    chainHTML(d, r);
  // 解释链展开
  el.querySelector('.why-btn').addEventListener('click', () => {
    el.querySelector('.chain').classList.toggle('open');
  });
  // 卡片内快捷反馈
  el.querySelectorAll('.fb button').forEach(b => {
    b.addEventListener('click', () => sendQuick(b.dataset.fb));
  });
  return el;
}

function chainHTML(d, r = {}) {
  const chain = escapeHTML(d.chain || `${d.original_query} → ${d.bridge_concept} → ${(d.search_queries || [])[0] || ''}`);
  return `<div class="chain">` +
    `<div class="step"><span class="k">原始问题</span>${escapeHTML(d.original_query)}</div>` +
    `<div class="arr">↓ ${escapeHTML(d.engine)}</div>` +
    `<div class="step"><span class="k">桥梁概念</span><span class="bridge">${escapeHTML(d.bridge_concept)}</span></div>` +
    `<div class="arr">↓ 生成真实检索词</div>` +
    `<div class="step"><span class="k">检索词</span>${escapeHTML((d.search_queries || []).join(' '))}</div>` +
    `<div class="arr">↓ 为什么是它</div>` +
    `<div class="step"><span class="k">连接逻辑</span>${chain}</div>` +
    (r.connection ? `<div class="step"><span class="k">网页关联</span>${escapeHTML(r.connection)}</div>` : '') +
    (r.why ? `<div class="step"><span class="k">为什么是这页</span>${escapeHTML(r.why)}</div>` : '') +
    (d.rationale ? `<div class="step"><span class="k">方向理由</span>${escapeHTML(d.rationale)}</div>` : '') +
    `</div>`;
}

function renderCards(cards, q) {
  const aside = $('aside');
  if (!cards) { aside.innerHTML = ''; return; }
  const esc = escapeHTML;
  aside.innerHTML =
    `<div class="icard"><div class="head"><span class="dot"></span>双盲诗</div><div class="poem">${esc(cards.poem)}</div></div>` +
    `<div class="icard azure"><div class="head"><span class="dot"></span>灵感卡片</div><div class="body">${esc(cards.inspiration)}</div></div>` +
    `<div class="icard gold"><div class="head"><span class="dot"></span>答案之书</div><div class="oracle-page">第 ${cards.oracle.page} 页</div><div class="body">${esc(cards.oracle.text)}</div></div>` +
    `<div class="icard moss"><div class="head"><span class="dot"></span>别人也在逃离</div><ul>${(cards.escapes || []).map(e => `<li>${esc(e)}</li>`).join('')}</ul></div>` +
    `<div class="icard"><div class="head"><span class="dot"></span>今日误读</div><div class="body">${esc(cards.misreading.text)}</div></div>`;
}

/* ---- 反馈：快捷按钮（离线）+ 自然语言（有 API 时 LLM 解析）---- */
async function applyFeedback(payload) {
  try {
    const lastBridge = LAST?.bridge_concept || '';
    const d = await api.post('/api/feedback', { ...payload, deviation, lastBridge });
    deviation = d.deviation;
    $('fbConfirm').textContent = d.confirm || (d.need_clarify ? '这条反馈有点模糊，换个说法？' : '已记住。');
    toast(`偏离度 → ${d.deviation.toFixed(2)} · ${d.band}`);
    return d;
  } catch (e) { toast('反馈失败：' + e.message); return null; }
}

async function sendQuick(kind) {
  const d = await applyFeedback({ quick: kind });
  if (!d) return;
  retryNonce += 1;
  // "再来一次" / 调整后：重搜同题，演示"同题两答"
  await runSearch(true);
}

$('fbSend').addEventListener('click', async () => {
  const text = $('fbInput').value.trim();
  if (!text) { toast('写一句反馈'); return; }
  const d = await applyFeedback({ text });
  if (!d) return;
  $('fbInput').value = '';
  if (!d.need_clarify) { retryNonce += 1; await runSearch(true); }
});
$('fbInput').addEventListener('keydown', e => { if (e.key === 'Enter') $('fbSend').click(); });

document.querySelectorAll('.feedback .quick button').forEach(b => {
  b.addEventListener('click', () => sendQuick(b.dataset.fb));
});

boot();
