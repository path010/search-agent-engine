/* ============================================================
   前端共用工具：API 封装、引擎菜单、漂移背景、toast
   ============================================================ */
export const api = {
  async get(path) {
    const r = await fetch(path);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || ('HTTP ' + r.status));
    return d;
  },
  async post(path, body) {
    const r = await fetch(path, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || ('HTTP ' + r.status));
    return d;
  },
  async del(path) {
    const r = await fetch(path, { method: 'DELETE' });
    return r.json();
  },
};

let toastTimer = null;
export function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

/* 极轻的部首/字词漂移背景 */
const DRIFT_GLYPHS = ['扌', '索', '云', '偏', '误', '桥', '远', '岔', '音', '海', '沙', '字', '根', '绕', '疑', '境'];
export function initDrift() {
  const box = document.getElementById('drift');
  if (!box) return;
  const n = 14;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.textContent = DRIFT_GLYPHS[i % DRIFT_GLYPHS.length];
    s.style.left = Math.random() * 100 + '%';
    s.style.fontSize = (28 + Math.random() * 64) + 'px';
    s.style.animationDuration = (18 + Math.random() * 22) + 's';
    s.style.animationDelay = (-Math.random() * 30) + 's';
    box.appendChild(s);
  }
}

/* 填充意外引擎下拉菜单 */
export function fillEngines(selectEl, meta, selected) {
  selectEl.innerHTML = '';
  for (const [name, info] of Object.entries(meta)) {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = `${name} · ${info.desc}`;
    if (name === selected) opt.selected = true;
    selectEl.appendChild(opt);
  }
}

export const escapeHTML = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');
