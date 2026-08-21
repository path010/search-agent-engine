/* ============================================================
   精选结果库 · 离线可用的真实链接（按桥梁概念归档）
   无 SearXNG / 无网络时，搜索适配器从这里取真实网页，保证 demo 有料。
   全部为公开、稳定、主题相关的权威站点。
   ============================================================ */
export const CURATED = {
  '隐藏的基础设施': [
    { title: 'Submarine Cable Map · 全球海底电缆地图', url: 'https://www.submarinecablemap.com/', snippet: '可视化连接全球互联网的海底光缆与登陆点。' },
    { title: '99% Invisible · 海底电缆的故事', url: 'https://99percentinvisible.org/episode/episode-70-the-great-undersea-cable/', snippet: '从设计与历史理解隐藏在海底的通信基础设施。' },
  ],
  '陌生的定位系统': [
    { title: 'National Geographic · 候鸟如何导航', url: 'https://education.nationalgeographic.org/resource/bird-migration/', snippet: '候鸟依靠地磁、星象与地标完成跨洲迁徙。' },
    { title: 'Cornell Lab of Ornithology · 康奈尔鸟类学实验室', url: 'https://www.birds.cornell.edu/home/', snippet: '用数据追踪鸟类迁徙路线与季节节律。' },
  ],
  '缓慢的秩序': [
    { title: 'iFixit · 手工装订与修复指南', url: 'https://www.ifixit.com/', snippet: '把零散部件重新组织成可用整体的拆装知识。' },
    { title: 'Internet Archive · 书籍数字馆藏', url: 'https://archive.org/details/texts', snippet: '海量公共领域书籍，观察纸页如何被装订与保存。' },
  ],
  '误差与耐心': [
    { title: 'Horology · 钟表结构与修复', url: 'https://www.horology.org/', snippet: '了解机械钟表、计时结构与精密维修背后的知识。' },
    { title: 'The Public Domain Review · 时间的历史', url: 'https://publicdomainreview.org/', snippet: '重新发现计时、机械与思想史中的冷门材料。' },
  ],
  '空间与边界': [
    { title: 'Japanese Gardening · 日本庭园的空间原则', url: 'https://www.japanesegardening.org/', snippet: '从路径、借景、留白理解空间如何引导注意力。' },
    { title: 'ArchDaily · 景观与庭院设计', url: 'https://www.archdaily.com/search/projects/categories/landscape-architecture', snippet: '浏览世界各地景观项目，观察空间与动线的关系。' },
  ],
  '分布式选择': [
    { title: 'Stanford Encyclopedia · 集体决策', url: 'https://plato.stanford.edu/', snippet: '没有中央指挥的群体如何形成一致选择。' },
    { title: 'Santa Fe Institute · 复杂系统', url: 'https://www.santafe.edu/', snippet: '研究群体、网络与涌现行为的跨学科机构。' },
  ],
  '__DEFAULT__': [
    { title: 'Internet Archive · 互联网公共档案馆', url: 'https://archive.org/', snippet: '浏览网页、书籍、录音、影像与软件的公共馆藏。' },
    { title: 'The Public Domain Review · 冷门历史', url: 'https://publicdomainreview.org/', snippet: '以专题重新发现艺术、科学与思想史中的边缘材料。' },
    { title: 'Marginalia Search · 独立网络搜索', url: 'https://search.marginalia.nu/', snippet: '偏向非商业、文本导向的小众网页搜索引擎。' },
    { title: 'Wikipedia · 中文百科', url: 'https://zh.wikipedia.org/', snippet: '从概念定义与关联条目建立主题的整体认识。' },
  ],
};

/* 从库中取结果：优先命中桥梁概念，否则回落到通用池 */
export function curatedFor(bridge, limit = 6) {
  const pool = [];
  if (bridge && CURATED[bridge]) pool.push(...CURATED[bridge]);
  pool.push(...CURATED.__DEFAULT__);
  const seen = new Set();
  const out = [];
  for (const item of pool) {
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}
