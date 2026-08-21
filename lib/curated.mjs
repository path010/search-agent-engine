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
    { title: 'Project Gutenberg · 公共领域书库', url: 'https://www.gutenberg.org/', snippet: '免费阅读和检索公共领域书籍，适合从历史材料绕路。' },
    { title: 'Openverse · 开放媒体搜索', url: 'https://openverse.org/', snippet: '搜索可公开使用的图像、音频和其他创作素材。' },
    { title: 'Encyclopaedia Britannica · 知识入口', url: 'https://www.britannica.com/', snippet: '从经过编辑的百科条目建立跨学科背景。' },
    { title: 'Stanford Encyclopedia of Philosophy · 哲学百科', url: 'https://plato.stanford.edu/', snippet: '通过严谨的哲学条目观察概念、价值和推理。' },
  ],
};

// 第二层精选池：每个桥梁至少有一组独立入口，避免所有意外方向都落回同一组默认网站。
// 这些链接都是公开的专题站、机构站或长期维护的知识入口，离线模式也能保持结果差异。
const BRIDGE_RESULTS = {
  '选择与排列': [
    { title: 'Cooper Hewitt · 设计与策展', url: 'https://www.cooperhewitt.org/', snippet: '通过物件、档案与展览研究人如何选择和排列意义。' },
    { title: 'The Metropolitan Museum of Art · 馆藏', url: 'https://www.metmuseum.org/art/collection', snippet: '从跨时代馆藏观察材料如何被分类、陈列与重新解释。' },
  ],
  '无光的生命': [
    { title: 'Woods Hole Oceanographic Institution · 深海热泉', url: 'https://www.whoi.edu/know-your-ocean/ocean-topics/geology/hydrothermal-vents/', snippet: '深海热泉生态在没有阳光的环境中形成另一套生命秩序。' },
    { title: 'NOAA Ocean Exploration · 深海探索', url: 'https://oceanexplorer.noaa.gov/', snippet: '记录极端海洋环境、化学能和陌生生态系统。' },
  ],
  '空间的表达': [
    { title: 'David Rumsey Map Collection · 古地图', url: 'https://www.davidrumsey.com/', snippet: '通过历史地图观察世界如何被测量、想象和绘制。' },
    { title: 'Library of Congress Maps · 地图馆藏', url: 'https://www.loc.gov/maps/', snippet: '美国国会图书馆的地图与地理资料入口。' },
  ],
  '节律与专注': [
    { title: 'The Rule of Saint Benedict · 修道院规则', url: 'https://www.osb.org/rb/', snippet: '以古老的作息、劳动与祈祷安排注意力。' },
    { title: 'Monastery of Christ in the Desert · 修道院生活', url: 'https://christdesert.org/', snippet: '从修道院日常理解时间、沉默与持续专注。' },
  ],
  '慢速的记录': [
    { title: 'USA National Phenology Network · 物候记录', url: 'https://www.usanpn.org/', snippet: '用长期观测记录植物、动物与季节变化。' },
    { title: 'Nature’s Notebook · 公民物候观测', url: 'https://www.usanpn.org/nn', snippet: '把一整年的微小变化变成可检索的公共资料。' },
  ],
  '看不见的调度': [
    { title: 'USGS Water Resources · 水循环资料', url: 'https://www.usgs.gov/mission-areas/water-resources', snippet: '观察地下水、降雨和城市洪流如何被持续监测。' },
    { title: 'EPA Stormwater · 城市雨洪管理', url: 'https://www.epa.gov/npdes/stormwater-discharges-municipal-sources', snippet: '理解城市排水系统如何默默处理复杂流量。' },
  ],
  '共同的节奏': [
    { title: 'New York Philharmonic · 乐团档案', url: 'https://archives.nyphil.org/', snippet: '从乐团排练和演出档案观察复杂协作如何形成共同节奏。' },
    { title: 'The Orchestra · 管弦乐入门', url: 'https://www.laphil.com/learn-and-discover/musical-terms/orchestra', snippet: '理解不同声部如何依靠倾听共同完成作品。' },
  ],
  '手工的分工': [
    { title: 'Boatbuilding Academy · 传统造船', url: 'https://boatbuildingacademy.com/', snippet: '从木船建造理解经验、材料与手工分工。' },
    { title: 'Smithsonian Maritime Collections · 海事馆藏', url: 'https://americanhistory.si.edu/collections/subjects/maritime-history', snippet: '记录船舶、航海技术与工匠协作的历史。' },
  ],
  '生物的电': [
    { title: 'Smithsonian Ocean · 电鳗', url: 'https://ocean.si.edu/ocean-life/fish/electric-eel', snippet: '介绍电鳗如何演化出发电和感知电场的能力。' },
    { title: 'Encyclopaedia Britannica · Electric eel', url: 'https://www.britannica.com/animal/electric-eel', snippet: '从生物学角度理解生命如何产生和使用电。' },
  ],
  '记忆的结构': [
    { title: 'International Council on Archives · 档案学', url: 'https://www.ica.org/', snippet: '研究档案如何被组织、保存并服务于未来检索。' },
    { title: 'Society of American Archivists · 档案资源', url: 'https://www2.archivists.org/', snippet: '从档案编目和保存理解记忆的结构。' },
  ],
  '孤独的坚持': [
    { title: 'National Lighthouse Museum · 灯塔史', url: 'https://lighthousemuseum.org/', snippet: '记录灯塔、守夜人和海上导航的历史。' },
    { title: 'United States Lighthouse Society · 灯塔档案', url: 'https://uslhs.org/', snippet: '保存灯塔建筑、航海信号和守护者的资料。' },
  ],
  '微小的尺度': [
    { title: 'British Bryological Society · 苔藓研究', url: 'https://www.britishbryologicalsociety.org.uk/', snippet: '从苔藓的微观结构观察一个微小但完整的生态世界。' },
    { title: 'Royal Botanic Gardens, Kew · 植物知识', url: 'https://www.kew.org/science', snippet: '以植物学研究连接微小尺度与完整生态系统。' },
  ],
  '稀缺的智慧': [
    { title: 'FAO Water · 水资源与农业', url: 'https://www.fao.org/land-water/water/en/', snippet: '研究匮乏环境中的水资源管理和农业策略。' },
    { title: 'Permaculture Association · 朴门永续设计', url: 'https://www.permaculture.org.uk/', snippet: '从限制条件中设计节约资源、可持续的生活系统。' },
  ],
  '同步的物理': [
    { title: 'NIST Time and Frequency · 时间与频率', url: 'https://www.nist.gov/pml/time-and-frequency-division', snippet: '研究时钟、振动和同步如何保持精确。' },
    { title: 'Physics World · Pendulum and resonance', url: 'https://physicsworld.com/', snippet: '从摆和共振理解独立振动如何走向同步。' },
  ],
  '模→膜 的误听': [
    { title: 'American Society for Microbiology · 膜与生命', url: 'https://asm.org/Topics/Cell-Biology', snippet: '从细胞膜和边界理解“模型”误听后产生的生物学方向。' },
    { title: 'Nature Portfolio · 膜科学', url: 'https://www.nature.com/subjects/membranes', snippet: '探索膜、边界和信息交换的研究入口。' },
  ],
  '声音的歧义': [
    { title: 'International Phonetic Association · 语音学', url: 'https://www.internationalphoneticassociation.org/', snippet: '从发音、听觉和音位差异理解误听如何发生。' },
    { title: 'Linguistic Society of America · 语言学', url: 'https://www.lsadc.org/', snippet: '研究声音、意义与语境之间的错位。' },
  ],
  '反面也是一种答案': [
    { title: 'Stanford Encyclopedia of Philosophy · 反事实推理', url: 'https://plato.stanford.edu/entries/causation-counterfactual/', snippet: '通过反事实问题观察一个命题被翻到背面后会发生什么。' },
    { title: 'Internet Encyclopedia of Philosophy · 价值与否定', url: 'https://iep.utm.edu/value/', snippet: '从哲学角度检视目标、价值和它们被否定后的意义。' },
  ],
  '被回避的对立面': [
    { title: 'The School of Life · 失败与反面', url: 'https://www.theschooloflife.com/', snippet: '从被忽略的代价和失败经验重新理解一个问题。' },
    { title: 'Aeon Essays · 观念的另一面', url: 'https://aeon.co/essays', snippet: '跨学科文章帮助我们从熟悉命题的背面看问题。' },
  ],
  '直接检索': [
    { title: 'Wikipedia · 中文百科', url: 'https://zh.wikipedia.org/', snippet: '从概念定义和关联条目建立主题的基础认识。' },
    { title: 'Internet Archive · 互联网公共档案馆', url: 'https://archive.org/', snippet: '浏览网页、书籍、录音、影像与软件的公共馆藏。' },
  ],
};

// 从原 search-engine 的 CURATED_LIBRARY 提取的高召回主题入口。
// 直答词（如“人类”“电”“代码”）优先从这里取，不再用无关的通用网站凑数。
const TOPIC_RESULTS = {
  '人类概念': [
    { title: 'Wikipedia · 人', url: 'https://zh.wikipedia.org/wiki/%E4%BA%BA', snippet: '从生物分类、社会关系、语言与文化等角度梳理“人”的基本含义。' },
    { title: 'Smithsonian Human Origins · 人类起源', url: 'https://humanorigins.si.edu/', snippet: '以化石、遗传、工具和行为证据探索数百万年人类演化史。' },
    { title: 'Natural History Museum · 人类演化', url: 'https://www.nhm.ac.uk/discover/human-evolution.html', snippet: '从化石和基因证据了解现代人如何形成并走向全球。' },
    { title: 'OpenStax · 人体解剖与生理', url: 'https://openstax.org/details/books/anatomy-and-physiology-2e', snippet: '免费的系统教材，覆盖细胞、组织、器官与人体各大系统。' },
    { title: 'Stanford Encyclopedia · 人的本性', url: 'https://plato.stanford.edu/entries/human-nature/', snippet: '从哲学、生物学和社会科学讨论共同的人的本性。' },
    { title: 'SAPIENS · 人类学杂志', url: 'https://www.sapiens.org/', snippet: '以考古、文化、生物和语言人类学理解人类经验。' },
    { title: 'Our World in Data · 人口', url: 'https://ourworldindata.org/population-growth', snippet: '用长期数据理解世界人口增长、年龄结构和地区差异。' },
    { title: 'UNESCO · 文化多样性', url: 'https://www.unesco.org/en/cultural-diversity', snippet: '理解文化表达、身份、交流与人类共同遗产。' },
  ],
  '人类演化': [
    { title: 'Wikipedia · 智人', url: 'https://zh.wikipedia.org/wiki/%E6%99%BA%E4%BA%BA', snippet: '了解智人的形态、演化、迁徙和与其他古人类的关系。' },
    { title: 'Human Origins Timeline · 人类演化时间线', url: 'https://humanorigins.si.edu/evidence/human-evolution-interactive-timeline', snippet: '交互查看不同古人类、气候变化与行为证据出现的时间。' },
    { title: 'The Leakey Foundation · 人类起源研究', url: 'https://leakeyfoundation.org/', snippet: '聚合古人类学、灵长类学与人类演化研究。' },
    { title: 'Max Planck Institute · 演化人类学', url: 'https://www.eva.mpg.de/', snippet: '研究人类基因、语言、文化、行为和灵长类近亲。' },
  ],
  '电磁现象': [
    { title: 'Wikipedia · 电', url: 'https://zh.wikipedia.org/wiki/%E7%94%B5', snippet: '介绍电荷、电场、电流和电磁现象的基本概念。' },
    { title: 'OpenStax Physics · 电磁学', url: 'https://openstax.org/details/books/college-physics-2e', snippet: '从电场、电势、电路和磁场系统学习电磁学。' },
    { title: 'Khan Academy · 电与磁', url: 'https://www.khanacademy.org/science/physics/electric-charge-electric-force', snippet: '用课程和练习理解电荷、电场与电路。' },
    { title: 'NIST · 电与测量', url: 'https://www.nist.gov/topics/electricity', snippet: '从测量、标准和工程角度认识电力系统。' },
    { title: 'NOAA · 闪电与大气放电', url: 'https://www.noaa.gov/jetstream/lightning', snippet: '观察自然界大尺度放电和雷暴系统。' },
    { title: 'Smithsonian Ocean · 电鳗', url: 'https://ocean.si.edu/ocean-life/fish/electric-eel', snippet: '介绍生命如何演化出发电和感知电场的能力。' },
    { title: 'IEEE · 电气工程知识', url: 'https://www.ieee.org/', snippet: '连接电气工程、能源、通信和计算技术的专业入口。' },
    { title: 'Our World in Data · 能源', url: 'https://ourworldindata.org/energy', snippet: '用数据观察发电、能源转型与全球用电结构。' },
  ],
  '复杂度控制': [
    { title: 'MDN Web Docs · Web 技术文档', url: 'https://developer.mozilla.org/zh-CN/', snippet: '面向 Web 开发者的开放技术文档。' },
    { title: 'Martin Fowler · 软件设计与重构', url: 'https://martinfowler.com/', snippet: '关于软件架构、重构、持续交付和长期维护的文章。' },
    { title: 'Refactoring.Guru · 重构与设计模式', url: 'https://refactoring.guru/', snippet: '通过图解学习重构、设计模式和代码结构改善。' },
    { title: 'Software Engineering at Google', url: 'https://abseil.io/resources/swe-book', snippet: '讨论软件如何跨越时间与规模持续演化。' },
    { title: 'Architecture of Open Source Applications', url: 'https://aosabook.org/', snippet: '由开源项目作者解释真实软件系统背后的架构选择。' },
    { title: 'web.dev · Web 性能', url: 'https://web.dev/learn/performance', snippet: '提供 Web 性能、可访问性和用户体验指南。' },
  ],
  '记忆规律': [
    { title: 'Learning Scientists · 学习科学', url: 'https://www.learningscientists.org/', snippet: '介绍提取练习、间隔学习和交错练习等方法。' },
    { title: 'OpenStax Psychology · 记忆与学习', url: 'https://openstax.org/details/books/psychology-2e', snippet: '从认知心理学角度学习记忆编码、存储和提取。' },
    { title: 'Stanford Encyclopedia · 记忆', url: 'https://plato.stanford.edu/entries/memory/', snippet: '从哲学和认知科学讨论记忆的结构与可靠性。' },
    { title: 'UNESCO · 教育与学习', url: 'https://www.unesco.org/en/education', snippet: '从全球教育、知识和学习机会观察学习的社会背景。' },
  ],
  '组织行为': [
    { title: 'MIT Sloan Management Review · 组织与管理', url: 'https://sloanreview.mit.edu/', snippet: '研究团队、组织、技术和管理实践之间的关系。' },
    { title: 'Google re:Work · 团队实践', url: 'https://rework.withgoogle.com/', snippet: '分享团队协作、心理安全和组织管理的研究。' },
    { title: 'Santa Fe Institute · 复杂系统', url: 'https://www.santafe.edu/', snippet: '从网络、群体与涌现行为理解组织协作。' },
    { title: 'New York Philharmonic Archives · 乐团协作', url: 'https://archives.nyphil.org/', snippet: '从乐团排练和演出档案观察复杂协作。' },
  ],
};

function bridgeFamily(bridge = '') {
  if (BRIDGE_RESULTS[bridge]) return bridge;
  if (bridge.includes('模') || bridge.includes('膜')) return '模→膜 的误听';
  if (bridge.includes('声音') || bridge.includes('误听')) return '声音的歧义';
  if (bridge.includes('反面')) return '反面也是一种答案';
  if (bridge.includes('回避') || bridge.includes('对立')) return '被回避的对立面';
  if (bridge.includes('糸') || bridge.includes('部首') || bridge.includes('字根')) return '选择与排列';
  return null;
}

function topicBridge(query = '') {
  const q = String(query).trim();
  if (/^(人|人类|human|humanity)$/i.test(q)) return '人类概念';
  if (/电|电力|电气|电能|电流|electric/i.test(q)) return '电磁现象';
  if (/代码|编程|软件|程序|开发|算法|性能|debug|coding/i.test(q)) return '复杂度控制';
  if (/学习|考试|复习|课程|教育|知识|论文|study/i.test(q)) return '记忆规律';
  if (/工作|效率|团队|管理|项目|会议|职场|productivity/i.test(q)) return '组织行为';
  return null;
}

/* 从库中取结果：优先命中桥梁概念，否则回落到通用池 */
export function curatedFor(bridge, limit = 6, { offset = 0, excludeUrls = [], originalQuery = '' } = {}) {
  const pool = [];
  const directTopic = bridge === '直接检索' ? topicBridge(originalQuery) : null;
  const family = directTopic || bridgeFamily(bridge);
  if (family && BRIDGE_RESULTS[family]) pool.push(...BRIDGE_RESULTS[family]);
  if (family && TOPIC_RESULTS[family]) pool.push(...TOPIC_RESULTS[family]);
  const topic = topicBridge(originalQuery);
  if (topic && topic !== family && TOPIC_RESULTS[topic]) pool.push(...TOPIC_RESULTS[topic]);
  if (bridge && CURATED[bridge]) pool.push(...CURATED[bridge]);
  // 主题精选池足够长时不混入无关通用站点；只有候选不足一页才用默认池补齐。
  const fallback = CURATED.__DEFAULT__;
  if (pool.length < limit) {
    for (let i = 0; i < fallback.length; i++) pool.push(fallback[(i + Math.max(0, offset)) % fallback.length]);
  }
  const seen = new Set();
  const excluded = new Set(excludeUrls);
  const out = [];
  for (const item of pool) {
    if (excluded.has(item.url)) continue;
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}
