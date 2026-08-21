/* ============================================================
   右侧卡片 · 一组小型意外发生器（离线规则版）
   双盲诗 / 灵感卡 / 答案之书 / 别人也在逃离 / 今日误读
   ============================================================ */
import {
  POEM_TEMPLATES, INSPIRATION_CARDS, ORACLE_PAGES,
  ESCAPE_FROM, ESCAPE_TO,
} from './lexicon.mjs';

function seed(str, offset = 0) {
  let h = (2166136261 ^ offset) >>> 0;
  for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}
const pick = (arr, str, off) => arr[seed(str, off) % arr.length];

/* 今日误读：每天给一个普通概念一次庄严误读（按日期稳定） */
const MISREADINGS = [
  ['效率', '不是更快完成，而是更少留下痕迹。'],
  ['专注', '不是排除一切，而是允许一件事变得很大。'],
  ['记忆', '不是保存过去，而是决定遗忘的顺序。'],
  ['搜索', '不是找到答案，而是被一个更好的问题绊倒。'],
  ['学习', '不是装满，而是学会给未知留出空位。'],
  ['进步', '不是走得更远，而是记得回头的路。'],
  ['答案', '不是终点，而是下一个问题的入口。'],
];

export function buildCards(query, engineOutput) {
  const today = new Date().toISOString().slice(0, 10);
  const mis = MISREADINGS[seed(today) % MISREADINGS.length];
  const from = pick(ESCAPE_FROM, query, 1);
  const to = pick(ESCAPE_TO, query, 2);
  const to2 = pick(ESCAPE_TO, query, 8);

  return {
    poem: pick(POEM_TEMPLATES, query, 3)(query),
    inspiration: pick(INSPIRATION_CARDS, query, 4)(query),
    oracle: {
      page: (seed(query, 5) % 88) + 1,
      text: pick(ORACLE_PAGES, query, 6),
    },
    escapes: [
      `有人从「${from}」逃向「${to}」`,
      `有人从「${query}」逃向「${to2}」`,
      `有人把「${query}」改写成一个手工艺问题`,
    ],
    misreading: { concept: mis[0], text: `「${mis[0]}」${mis[1]}` },
  };
}
