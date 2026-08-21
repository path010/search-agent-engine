/* 冒烟测试：直连本地服务，验证六引擎 + 搜索 + 反馈 + 同题两答记忆 */
const BASE = 'http://127.0.0.1:8791';
const post = (p, b) => fetch(BASE + p, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b),
}).then(r => r.json());
const get = p => fetch(BASE + p).then(r => r.json());
const line = (k, v) => console.log('  ' + k.padEnd(10) + ': ' + v);

let pass = 0, fail = 0;
const check = (cond, msg) => { if (cond) { pass++; console.log('  OK  ' + msg); } else { fail++; console.log('  XX  ' + msg); } };

async function main() {
  console.log('\n=== meta ===');
  const meta = await get('/api/meta');
  check(Object.keys(meta.engines).length === 6, '六个意外引擎已注册');
  line('search_mode', meta.search_mode);

  console.log('\n=== suggest ===');
  const sg = await get('/api/suggest?q=' + encodeURIComponent('如何提高学习效率'));
  check(sg.suggestions.length >= 4, '猜你不想搜返回候选');
  sg.suggestions.slice(0, 3).forEach(s => console.log('    - ' + s));

  console.log('\n=== 各引擎生成 ===');
  const cases = [['大模型', '魔音'], ['如何提高效率', '反命题'], ['搜索', '字根岔路'], ['信息流推荐', '沙之海'], ['代码优化', '语义远眺']];
  for (const [q, eng] of cases) {
    const r = await post('/api/search', { query: q, engine: eng, deviation: 0.7 });
    check(r.engine === eng, eng + '：引擎匹配');
    check(!!(r.generated_query && r.bridge_concept && r.results.length > 0), eng + '：有生成词/桥梁/结果');
    line(eng, r.generated_query + '  <' + r.bridge_concept + '>');
  }

  console.log('\n=== 魔音谐音换字 ===');
  const my = await post('/api/search', { query: '大模型', engine: '魔音', deviation: 0.6 });
  check(/磨|摩|膜|莫|星|形|醒/.test(my.generated_query + my.search_queries.join('')), '魔音产生谐音替换');
  line('魔音输出', my.generated_query + ' / ' + my.search_queries.join(' '));

  console.log('\n=== 卡片 ===');
  const c = my.cards;
  check(!!(c.poem && c.inspiration && c.oracle.text && c.escapes.length && c.misreading.text), '五张卡片齐全');
  line('双盲诗', c.poem.replace(/\n/g, ' / '));
  line('答案之书', '第' + c.oracle.page + '页 ' + c.oracle.text);

  console.log('\n=== 同题两答：反馈改变结果 ===');
  await fetch(BASE + '/api/memory', { method: 'DELETE' }); // 清空记忆，干净起点
  const first = await post('/api/search', { query: 'AI 大模型', engine: '沙之海', deviation: 0.4 });
  line('第一次', first.generated_query + '  偏离度=' + first.deviation.toFixed(2));

  const fb1 = await post('/api/feedback', { quick: '不够偏', deviation: first.deviation });
  check(fb1.deviation > first.deviation, '"不够偏"抬高了偏离度');
  line('反馈后', fb1.confirm + '  偏离度=' + fb1.deviation.toFixed(2));

  const fb2 = await post('/api/feedback', { quick: '避开此类', deviation: fb1.deviation, lastBridge: first.bridge_concept });
  check(fb2.memory.blacklist.some(b => b.active !== false), '"避开此类"写入了黑名单');
  line('黑名单', fb2.memory.blacklist.map(b => b.category).join('、'));

  const second = await post('/api/search', { query: 'AI 大模型', engine: '沙之海', deviation: fb2.deviation });
  check(second.deviation > first.deviation, '第二次偏离度更高');
  check(!!second.memory_citation, '第二次带出记忆引用（同题两答）');
  check(second.bridge_concept !== first.bridge_concept, '第二次桥梁避开了上次方向');
  line('第二次', second.generated_query + '  偏离度=' + second.deviation.toFixed(2));
  line('记忆引用', second.memory_citation);

  console.log('\n=== 无 API 时自然语言反馈规则解析 ===');
  const rf = await post('/api/feedback', { text: '再偏一点，不想看纯技术内容', deviation: 0.5 });
  check(rf.applied.some(a => a.type === 'ADJUST_DEV') && rf.applied.some(a => a.type === 'BLACKLIST_ADD'), '一句话解析出两个动作');
  line('确认', rf.confirm);

  console.log('\n=== 直答模式 (dev=0) ===');
  const direct = await post('/api/search', { query: '什么是TCP', engine: '沙之海', deviation: 0 });
  line('dev=0', direct.generated_query + '  band=' + direct.band);

  console.log('\n======================================');
  console.log('  通过 ' + pass + ' ，失败 ' + fail);
  console.log('======================================');
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error('测试异常', e); process.exit(1); });
