/*
 * 从 search-engine 项目移植的“主题分面”层。
 * 意外引擎负责制造绕路方向，本模块负责保证搜索仍然围绕原始问题展开：
 * 直答 → 邻近概念 → 跨域概念，并把这些分面交给 SearXNG 或离线精选库。
 */

const PROFILES = [
  {
    test: /^(人|人类|human|humanity)$/i,
    direct: ['人类', '人类 是什么', '人类 分类 类型', '人类 原理 结构'],
    adjacent: ['智人 人类演化 起源', '文化人类学 亲属 社会', '意识 自我 心灵哲学'],
    cross: ['尼安德特人 考古 基因', '动物文化 黑猩猩 工具', '人工智能 人格 道德地位', '人口迁徙 语言地图'],
  },
  {
    test: /电|电力|电气|电能|电流|electric/i,
    direct: ['电', '电 是什么', '电场 电流 电磁学', '电力系统 储能 电网'],
    adjacent: ['电的产生 电场 电流 电磁学', '电网 储能 峰谷调度 可再生能源', '电气安全 接地 漏电保护'],
    cross: ['神经元 动作电位 生物电', '闪电 雷暴 大气放电', '电鳗 电器官 电感知 仿生', '有线电报 莫尔斯 电信史'],
  },
  {
    test: /代码|编程|软件|程序|开发|算法|性能|debug|coding/i,
    direct: ['代码优化', '代码优化 是什么', '代码优化 原理 结构', '代码优化 方法 实践'],
    adjacent: ['软件架构 复杂度控制', '认知负荷 工具设计', '排队论 系统吞吐 瓶颈'],
    cross: ['极简主义 少即是多 设计', '园林设计 留白 路径 边界', '城市慢行系统 减少拥堵', '钟表修复 机械诊断'],
  },
  {
    test: /学习|考试|复习|课程|教育|知识|论文|study/i,
    direct: ['学习', '学习 是什么', '学习 记忆规律', '学习 注意力 认知科学'],
    adjacent: ['间隔重复 学习科学', '知识地图 概念关系', '注意力恢复 认知科学'],
    cross: ['中世纪修道院 时间表', '博物馆策展 如何组织知识', '候鸟导航 地球磁场', '树木物候观察 日记'],
  },
  {
    test: /工作|效率|团队|管理|项目|会议|职场|productivity/i,
    direct: ['工作效率', '工作效率 是什么', '团队协作 组织行为', '工作流 瓶颈 等待'],
    adjacent: ['组织行为 团队协作', '排队论 工作流 瓶颈', '心理安全 团队'],
    cross: ['管弦乐团 排练 协作', '传统木船 建造 分工', '蜂群 决策 机制', '城市交通 信号 调度'],
  },
];

const GENERIC = {
  direct: q => [q, `${q} 是什么`, `${q} 分类 类型`, `${q} 原理 结构`],
  adjacent: q => [`${q} 历史 演变`, `${q} 设计 原理`, `${q} 社会影响`],
  cross: q => [`${q} 博物馆 馆藏 历史`, `${q} 修复 维护 方法`, `${q} 自然界 仿生`, `${q} 地图 地理 分布`],
};

function profileFor(query) {
  return PROFILES.find(profile => profile.test.test(String(query).trim())) || null;
}

function unique(items) {
  return [...new Set(items.map(x => String(x).trim()).filter(Boolean))];
}

export function buildSearchQueries({ originalQuery, generatedQuery = '', deviation = 0 } = {}) {
  const q = String(originalQuery || '').trim();
  if (!q) return unique([generatedQuery]);
  const profile = profileFor(q);
  const direct = profile?.direct || GENERIC.direct(q);
  const adjacent = profile?.adjacent || GENERIC.adjacent(q);
  const cross = profile?.cross || GENERIC.cross(q);
  const dev = Math.max(0, Math.min(1, Number(deviation) || 0));
  const detour = generatedQuery && generatedQuery !== q ? [generatedQuery] : [];

  let queries;
  if (dev <= 0.1) queries = [direct[0], direct[1], direct[2]];
  else if (dev <= 0.3) queries = [direct[0], direct[1], ...detour, adjacent[0]];
  else if (dev <= 0.6) queries = [direct[0], ...detour, adjacent[0], adjacent[1], cross[0]];
  else if (dev <= 0.8) queries = [generatedQuery, direct[0], cross[0], cross[1]];
  else queries = [generatedQuery, cross[0], cross[1], cross[2]];

  return unique(queries).slice(0, 6);
}

export function topicFamily(query = '') {
  const profile = profileFor(query);
  if (!profile) return null;
  if (/^(人|人类|human|humanity)$/i.test(query.trim())) return '人类概念';
  if (/电|电力|电气|电能|电流|electric/i.test(query)) return '电磁现象';
  if (/代码|编程|软件|程序|开发|算法|性能|debug|coding/i.test(query)) return '复杂度控制';
  if (/学习|考试|复习|课程|教育|知识|论文|study/i.test(query)) return '记忆规律';
  if (/工作|效率|团队|管理|项目|会议|职场|productivity/i.test(query)) return '组织行为';
  return null;
}
