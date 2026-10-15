// ===== 装备品质 / 前缀 / 词条 / 灵纹 数据 =====
import type { Equip, Mods, SlotKey } from '../types'
import { chance, pick, rnd } from '../core/rng'
import { baseAtk, baseDef, baseHp } from './realms'

export const SLOTS: SlotKey[] = ['weapon', 'armor', 'helm', 'wrist', 'belt', 'boots']
export const SLOT_NAMES: Record<SlotKey, string> = {
  weapon: '兵器', armor: '法袍', helm: '冠冕', wrist: '护腕', belt: '束带', boots: '灵靴',
}

export interface QualityDef { n: string; c: string; aff: number }
// 词条数已整体上调（原 GDD：0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8）
export const QUALITIES: QualityDef[] = [
  { n: '凡品', c: '#9E9E9E', aff: 0 },
  { n: '灵品', c: '#B0BEC5', aff: 2 },
  { n: '玄品', c: '#4CAF50', aff: 3 },
  { n: '地品', c: '#00897B', aff: 4 },
  { n: '天品', c: '#2196F3', aff: 5 },
  { n: '王品', c: '#3F51B5', aff: 6 },
  { n: '皇品', c: '#9C27B0', aff: 7 },
  { n: '帝品', c: '#E91E63', aff: 8 },
  { n: '仙品', c: '#FF9800', aff: 9 },
  { n: '神品', c: '#F44336', aff: 10 },
  { n: '圣品', c: '#D32F2F', aff: 11 },
  { n: '道品', c: '#FFD700', aff: 12 },
  { n: '造化', c: '#C9A227', aff: 13 },
  { n: '鸿蒙', c: '#00E5FF', aff: 14 },
  { n: '太初', c: '#AA00FF', aff: 15 },
  { n: '混沌', c: '#FF6EC7', aff: 16 },
]
export function qName(q: number): string { return QUALITIES[Math.max(0, Math.min(15, q - 1))].n }
export function qColor(q: number): string { return QUALITIES[Math.max(0, Math.min(15, q - 1))].c }
export function qClass(q: number): string { return 'qc' + Math.max(1, Math.min(16, q)) }

// 星级权重 1..5
export const STAR_W = [40, 30, 18, 9, 3]

// 各部位基础名池（第23批重构：按部位语义严选，杜绝「法袍叫铅盾」这类跨语义乱搭）
export const SLOT_BASES: Record<SlotKey, string[]> = {
  weapon: ['剑', '刀', '枪', '戟', '矛', '槊', '斧', '钺', '锤', '锏', '鞭', '锋', '刃', '罡'],
  armor: ['袍', '衣', '甲', '铠', '裳', '氅', '衫'],
  helm: ['冠', '冕', '巾', '簪', '箍', '盔'],
  wrist: ['镯', '钏', '环', '腕', '珠', '符', '印'],
  belt: ['带', '绦', '幡', '旗', '印', '玺', '缨'],
  boots: ['靴', '履', '屐'],
}
export const SWORD_BASES = ['剑', '锋', '刃', '罡']
export const BODY_BASES = ['甲', '铠']

// 前缀池（168 个，分四段）
export const PREFIX_SEGS: string[][] = [
  ['钝', '锈', '裂', '残', '粗', '拙', '朴', '旧', '暗', '灰', '白', '青', '黑', '铁', '石', '木', '骨', '皮', '麻', '布', '铜', '锡', '铅', '尘', '土', '藤', '竹', '草', '叶', '根', '角', '牙', '爪', '羽', '鳞'],
  ['蕴灵', '聚气', '引灵', '通玄', '幽光', '寒铁', '陨铁', '玄光', '青锋', '紫电', '赤炎', '冰魄', '风灵', '雷印', '土元', '金锋', '木灵', '水寒', '火舞', '云隐', '雾幻', '霞光', '星辉', '月华', '日精', '霜华', '露华', '雪魄', '雨霖', '虹霓', '流萤', '飞星', '落霞', '孤云', '野鹤', '清泉', '幽兰', '寒梅', '劲松', '修竹'],
  ['地藏', '山岳', '厚土', '天工', '星辰', '日月', '造化', '天罚', '神工', '仙蜕', '羽化', '登仙', '天罡', '地煞', '玄天', '紫霄', '青冥', '碧落', '黄泉', '幽冥', '血煞', '赤霄', '金阙', '玉京', '琼华', '瑶光', '璇玑', '太虚', '无极', '两仪', '四象', '五行', '六合', '七星', '八卦', '九宫', '混天', '乾坤', '阴阳', '太乙'],
  ['道韵', '无为', '太一', '混元', '太极', '道极', '圣辉', '光明', '神圣', '圣域', '天国', '神国', '混沌', '鸿蒙', '弑仙', '灭世', '斩道', '诛天', '开天', '辟地', '轮回', '因果', '永恒', '刹那', '须弥', '芥子', '光阴', '岁月', '命运', '天机', '玄黄', '宇宙', '洪荒', '亘古', '不朽', '长生', '不死', '超脱', '逍遥', '无始', '无终', '太初', '太素', '太易', '太始', '太清', '上清', '玉清'],
]

// 按品质段抽取前缀（对应 GDD 抽取规则）
export function drawPrefix(q: number): string {
  if (q <= 4) return pick(PREFIX_SEGS[0])
  if (q <= 8) return chance(0.85) ? pick(PREFIX_SEGS[1]) : pick(PREFIX_SEGS[0])
  if (q <= 12) return chance(0.8) ? pick(PREFIX_SEGS[2]) : pick(PREFIX_SEGS[1])
  return chance(0.75) ? pick(PREFIX_SEGS[3]) : pick(PREFIX_SEGS[2])
}

export function nameFor(q: number, base: string, prefix: string | null): string {
  if (!prefix) return base
  if (q <= 4) return prefix + base
  return prefix + '·' + base
}

// 前缀 → 流派 / 五行 标签
export const PREFIX_TAGS: Record<string, { f?: string[]; e?: string[] }> = {
  紫电: { f: ['雷系'] }, 雷印: { f: ['雷系'] }, 天罚: { f: ['雷系'] }, 紫霄: { f: ['雷系'] }, 赤霄: { f: ['火系'] },
  冰魄: { f: ['冰系'], e: ['水'] }, 霜华: { f: ['冰系'] }, 雪魄: { f: ['冰系'] }, 水寒: { f: ['冰系'], e: ['水'] },
  赤炎: { f: ['火系'], e: ['火'] }, 火舞: { f: ['火系'], e: ['火'] }, 日精: { f: ['火系'], e: ['火'] },
  青锋: { f: ['剑类'] }, 天罡: { f: ['剑类'] },
  地煞: { f: ['魔系'] }, 血煞: { f: ['魔系'] }, 幽冥: { f: ['魔系'] }, 黄泉: { f: ['魔系'], e: ['水'] },
  弑仙: { f: ['魔系'] }, 灭世: { f: ['魔系'] }, 斩道: { f: ['魔系'] }, 诛天: { f: ['魔系'] },
  仙蜕: { f: ['仙系'] }, 羽化: { f: ['仙系'] }, 登仙: { f: ['仙系'] }, 金阙: { f: ['仙系'], e: ['金'] },
  玉京: { f: ['仙系'] }, 神圣: { f: ['仙系'] }, 圣辉: { f: ['仙系'] }, 圣域: { f: ['仙系'] },
  天国: { f: ['仙系'] }, 神国: { f: ['仙系'] }, 光明: { f: ['仙系'] }, 道韵: { f: ['仙系'] },
  金锋: { e: ['金'] }, 太乙: { e: ['金'] }, 混元: { e: ['金'] },
  木灵: { e: ['木'] }, 劲松: { e: ['木'] }, 修竹: { e: ['木'] }, 幽兰: { e: ['木'] }, 寒梅: { e: ['木'] }, 琼华: { e: ['木'] }, 长生: { e: ['木'] },
  清泉: { e: ['水'] }, 雨霖: { e: ['水'] }, 露华: { e: ['水'] }, 碧落: { e: ['水'] }, 光阴: { e: ['水'] }, 命运: { e: ['水'] },
  土元: { e: ['土'] }, 山岳: { e: ['土'] }, 厚土: { e: ['土'] }, 地藏: { e: ['土'] }, 玄黄: { e: ['土'] }, 洪荒: { e: ['土'] },
}

// ===== 词条池 =====
export interface AffixDef {
  k: string; n: string; tier: 1 | 2 | 3
  min: number; max: number
  pct: boolean
  flat?: 'atk' | 'def' | 'hp' | 'spd'
}
export const AFFIXES: AffixDef[] = [
  { k: 'atk', n: '攻击', tier: 1, min: 4, max: 9, pct: false, flat: 'atk' },
  { k: 'def', n: '防御', tier: 1, min: 3, max: 7, pct: false, flat: 'def' },
  { k: 'hp', n: '气血', tier: 1, min: 25, max: 60, pct: false, flat: 'hp' },
  { k: 'crit', n: '暴击率', tier: 1, min: 2, max: 5, pct: true },
  { k: 'combo', n: '连击率', tier: 1, min: 2, max: 5, pct: true },
  { k: 'dodge', n: '闪避率', tier: 1, min: 1.5, max: 4, pct: true },
  { k: 'hit', n: '命中率', tier: 1, min: 2, max: 4, pct: true },
  { k: 'spd', n: '速度', tier: 1, min: 2, max: 6, pct: false, flat: 'spd' },
  { k: 'critDmg', n: '暴击伤害', tier: 2, min: 8, max: 18, pct: true },
  { k: 'lifesteal', n: '吸血', tier: 2, min: 2.5, max: 5, pct: true },
  { k: 'reflect', n: '反伤', tier: 2, min: 3, max: 7, pct: true },
  { k: 'armorPen', n: '破甲', tier: 2, min: 4, max: 9, pct: true },
  { k: 'shieldPow', n: '护盾强度', tier: 2, min: 5, max: 12, pct: true },
  { k: 'dmgReduce', n: '伤害减免', tier: 2, min: 2.5, max: 6, pct: true },
  { k: 'qiRegen', n: '灵气回复', tier: 2, min: 1.5, max: 4, pct: false },
  { k: 'cdr', n: '冷却缩减', tier: 2, min: 3, max: 8, pct: true },
  { k: 'execute', n: '斩杀', tier: 3, min: 6, max: 14, pct: true },
  { k: 'daoyun', n: '道韵', tier: 3, min: 10, max: 25, pct: true },
  { k: 'kalpaFire', n: '劫火', tier: 3, min: 6, max: 15, pct: true },
  { k: 'devour', n: '吞噬', tier: 3, min: 5, max: 12, pct: true },
  { k: 'reincarnate', n: '轮回', tier: 3, min: 1, max: 3, pct: false },
  // —— 控制与反制（参考寻道大千） ——
  { k: 'stun', n: '击晕率', tier: 2, min: 1.5, max: 3.5, pct: true },
  { k: 'counter', n: '反击率', tier: 2, min: 2, max: 4.5, pct: true },
  { k: 'resistStun', n: '抗击晕', tier: 2, min: 3, max: 7, pct: true },
  { k: 'resistCrit', n: '抗暴击', tier: 2, min: 3, max: 7, pct: true },
  { k: 'resistCombo', n: '抗连击', tier: 2, min: 3, max: 7, pct: true },
  { k: 'resistCounter', n: '抗反击', tier: 2, min: 3, max: 7, pct: true },
  { k: 'resistLifesteal', n: '抗吸血', tier: 2, min: 4, max: 9, pct: true },
  // —— 增伤 / 治疗 / 灵兽体系（参考寻道大千） ——
  { k: 'dmgBoost', n: '增伤', tier: 2, min: 1.5, max: 3.5, pct: true },
  { k: 'healBoost', n: '强化治疗', tier: 2, min: 3, max: 8, pct: true },
  { k: 'healCut', n: '弱化治疗', tier: 2, min: 3, max: 8, pct: true },
  { k: 'beastBoost', n: '强化灵兽', tier: 2, min: 3, max: 8, pct: true },
  { k: 'beastCut', n: '弱化灵兽', tier: 2, min: 3, max: 8, pct: true },
]
export const AFFIX_MAP: Record<string, AffixDef> = Object.fromEntries(AFFIXES.map(a => [a.k, a]))
export const TOP_KEYS = AFFIXES.filter(a => a.tier === 3).map(a => a.k)

// 按品质可出现的词条档位（weighted 约定：w 权重 / v 值）
export function affixPoolFor(q: number): { v: string; w: number }[] {
  const basic = AFFIXES.filter(a => a.tier === 1).map(a => ({ v: a.k, w: 1 }))
  const adv = AFFIXES.filter(a => a.tier === 2).map(a => ({ v: a.k, w: 1 }))
  const top = AFFIXES.filter(a => a.tier === 3).map(a => ({ v: a.k, w: 1 }))
  if (q <= 4) return basic
  if (q <= 6) return [...basic, ...adv.map(x => ({ ...x, w: 0.35 }))]
  if (q <= 10) return [...adv, ...basic.map(x => ({ ...x, w: 0.7 })), ...top.map(x => ({ ...x, w: 0.18 }))]
  return [...adv, ...top.map(x => ({ ...x, w: 0.55 })), ...basic.map(x => ({ ...x, w: 0.35 }))]
}

// ===== 灵纹（品质≥12 装备掉落携带） =====
export interface RuneDef { id: string; n: string; desc: string; mods: Mods }
export const RUNES: RuneDef[] = [
  { id: 'pojun', n: '破军', desc: '攻击+12%', mods: { atkP: 12 } },
  { id: 'jianbi', n: '坚壁', desc: '防御+12%', mods: { defP: 12 } },
  { id: 'changsheng', n: '长生', desc: '气血+12%', mods: { hpP: 12 } },
  { id: 'tianyan', n: '天眼', desc: '命中+10%、暴击+4%', mods: { hitAdd: 10, critAdd: 4 } },
  { id: 'zhuifeng', n: '追风', desc: '速度+15%', mods: { spdP: 15 } },
  { id: 'yin' + 'xue', n: '饮血', desc: '吸血+6%', mods: { lifestealAdd: 6 } },
  { id: 'jingji', n: '荆棘', desc: '反伤+10%', mods: { reflectAdd: 10 } },
  { id: 'qingxin', n: '清心', desc: '伤害减免+6%', mods: { dmgReduceAdd: 6 } },
  { id: 'leiting', n: '雷霆', desc: '攻击+8%、连击+6%', mods: { atkP: 8, comboAdd: 6 } },
  { id: 'youming', n: '幽冥', desc: '破甲+12%', mods: { armorPenAdd: 12 } },
  { id: 'xingchen', n: '星辰', desc: '全属性+8%', mods: { allP: 8 } },
  { id: 'hongmeng', n: '鸿蒙', desc: '全属性+15%', mods: { allP: 15 } },
]
export const RUNE_MAP: Record<string, RuneDef> = Object.fromEntries(RUNES.map(r => [r.id, r]))

// ===== 装备评分 =====
// 评分口径 = 「在当前装备等级下，这件装备对面板战力的边际贡献」（与 calcPower 同口径）。
// 第23批修正：百分比词条曾被多乘一次均值系数 M（1.5×）——现统一为：
//   固定值词条 × 战力乘区均值 M（会被乘区放大）；百分比词条 × 基准面板 raw（不受乘区放大）。
export function scoreCoefs(lv: number) {
  const Ratk = baseAtk(lv), Rdef = baseDef(lv), Rhp = baseHp(lv)
  const M = 1.5 // 典型战斗系数（暴击/吸血等乘区的经验均值）
  const core = (Ratk * 10 + Rdef * 6 + Rhp * 0.9 + 360) * M
  return { Ratk, Rdef, Rhp, M, core }
}
export function affixCoef(k: string, lv: number): number {
  const c = scoreCoefs(lv)
  const raw = c.core / c.M // 不含百分比乘区的基准面板
  switch (k) {
    case 'atk': return 10 * c.M
    case 'def': return 6 * c.M
    case 'hp': return 0.9 * c.M
    case 'spd': return 6 * c.M
    case 'crit': case 'combo': case 'critDmg': return raw / 150
    case 'lifesteal': return raw / 80
    case 'dmgP': case 'dmgReduce': return raw / 120
    case 'armorPen': return raw / 150
    case 'execute': return raw / 180
    case 'dodge': case 'shieldPow': case 'devour': return raw / 250
    case 'reflect': case 'qiRegen': case 'cdr': return raw / 300
    case 'hit': return raw / 400
    case 'stun': case 'counter': return raw / 240
    case 'resistStun': case 'resistCrit': case 'resistCombo': case 'resistCounter': case 'resistLifesteal': return raw / 320
    case 'dmgBoost': return raw / 130
    case 'healBoost': case 'healCut': return raw / 300
    case 'beastBoost': case 'beastCut': return raw / 320
    case 'daoyun': return raw / 80
    case 'kalpaFire': return raw / 130
    case 'reincarnate': return raw / 25 // 额外一条命
    default: return raw / 300
  }
}
export function runeScore(m: Mods, lv: number): number {
  const c = scoreCoefs(lv)
  let s = 0
  if (m.allP) s += m.allP * 0.01 * (c.Ratk * 10 + c.Rdef * 6 + c.Rhp * 0.9) * c.M
  if (m.atkP) s += m.atkP * 0.01 * c.Ratk * 10 * c.M
  if (m.defP) s += m.defP * 0.01 * c.Rdef * 6 * c.M
  if (m.hpP) s += m.hpP * 0.01 * c.Rhp * 0.9 * c.M
  if (m.spdP) s += m.spdP * 0.01 * 60 * 6 * c.M
  const adds: [number | undefined, string][] = [
    [m.critAdd, 'crit'], [m.critDmgAdd, 'critDmg'], [m.comboAdd, 'combo'], [m.dodgeAdd, 'dodge'],
    [m.hitAdd, 'hit'], [m.lifestealAdd, 'lifesteal'], [m.reflectAdd, 'reflect'], [m.armorPenAdd, 'armorPen'],
    [m.dmgReduceAdd, 'dmgReduce'], [m.cdrAdd, 'cdr'], [m.qiRegenAdd, 'qiRegen'],
  ]
  for (const [v, k] of adds) if (v) s += v * affixCoef(k, lv)
  return s
}
export function scoreEquip(e: Equip): number {
  const em = 1 + (e.enh || 0) * 0.05 // 强化：词条效果 +5%/级
  let s = 0
  for (const a of e.affixes) s += a.v * affixCoef(a.k, e.level) * em
  if (e.rune) {
    const r = RUNE_MAP[e.rune]
    if (r) s += runeScore(r.mods, e.level)
  }
  return Math.max(1, Math.round(s))
}
// 装备（含灵纹）→ 属性贡献表，供详情页与穿戴装备对比展示
export function equipContrib(e: Equip): Record<string, number> {
  const m: Record<string, number> = {}
  for (const a of e.affixes) m[a.k] = (m[a.k] || 0) + a.v
  if (e.rune) {
    const r = RUNE_MAP[e.rune]
    if (r) {
      const md: [number | undefined, string][] = [
        [r.mods.allP, 'allP'], [r.mods.atkP, 'atkP'], [r.mods.defP, 'defP'], [r.mods.hpP, 'hpP'], [r.mods.spdP, 'spdP'],
        [r.mods.critAdd, 'crit'], [r.mods.critDmgAdd, 'critDmg'], [r.mods.comboAdd, 'combo'], [r.mods.dodgeAdd, 'dodge'],
        [r.mods.hitAdd, 'hit'], [r.mods.lifestealAdd, 'lifesteal'], [r.mods.reflectAdd, 'reflect'], [r.mods.armorPenAdd, 'armorPen'],
        [r.mods.dmgReduceAdd, 'dmgReduce'], [r.mods.cdrAdd, 'cdr'], [r.mods.qiRegenAdd, 'qiRegen'],
      ]
      for (const [v, key] of md) if (v) m[key] = (m[key] || 0) + v
    }
  }
  return m
}
