// ===== 境界 / 数值公式 / 宝树 =====
import { rnd } from '../core/rng'

export const MAJOR = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫', '仙人']
// 每个大境界：前/中/后/圆满 四小境界，各 10 阶（一阶~十阶）
export const PHASES = ['前期', '中期', '后期', '圆满']
export const STAGES = ['一阶', '二阶', '三阶', '四阶', '五阶', '六阶', '七阶', '八阶', '九阶', '十阶']
export const MINOR_PER = 10 // 每个小境界十阶
export const PER_REALM = 40 // 每个大境界 4 小境界 × 10 阶
export const LV_MAX = 439 // 11 大境界 × 40 阶 - 1

export function lvIndex(major: number, phase: number, minor: number): number {
  return major * PER_REALM + phase * MINOR_PER + minor
}
export function realmName(major: number, phase: number, minor: number): string {
  if (major === 0 && phase === 0 && minor === 0) return '凡人'
  return MAJOR[Math.min(major, 10)] + PHASES[Math.min(phase, 3)] + '·' + STAGES[Math.min(minor, 9)]
}
export function realmShort(major: number, phase: number, minor: number): string {
  if (major === 0 && phase === 0 && minor === 0) return '凡人'
  return MAJOR[Math.min(major, 10)] + PHASES[Math.min(phase, 3)]
}

// —— 数值公式 ——
// 长线平衡（第31批：慢放为长期游戏）：单阶耗时前缀分钟级、中段小时级、终局以「天」计，
// 总进程以月计（基线档含突破失败期望约 100 天；配置更优的强号约 2 个月）。
// seg 按大境界：凡人~筑基 1 / 金丹~炼虚 1.28 / 合体~渡劫 1.58 / 仙人 1.9
export function cultReq(lv: number): number {
  const major = Math.floor(lv / PER_REALM)
  const seg = major <= 2 ? 1 : major <= 5 ? 1.28 : major <= 8 ? 1.58 : 1.9
  return Math.round(150 * Math.pow(1.0385, lv) * seg)
}
export function baseHp(lv: number): number {
  return Math.round(120 * Math.pow(1.04225, lv))
}
export function baseAtk(lv: number): number {
  return Math.round(12 * Math.pow(1.03936, lv))
}
export function baseDef(lv: number): number {
  return Math.round(8 * Math.pow(1.03936, lv))
}
export function cultRate(lv: number, wuXing: number, mult: number): number {
  return 0.45 * Math.pow(1.02154, lv) * (1 + wuXing / 20) * mult
}
export function idleLingshi(lv: number, qiYun: number, mult: number): number {
  return 0.18 * Math.pow(1.01824, lv) * (1 + qiYun / 35) * mult
}
export function idleLingmai(lv: number, mult: number): number {
  return 0.04 * Math.pow(1.01515, lv) * mult
}

// —— 太初宝树：根扎龙脉，摇落得宝（时间+灵石培育，龙髓可加速）——
export const VEIN_NAME = '太初宝树'
export const VEIN_FLAVOR = '根须扎在烛龙的脉上，一摇一落，皆是从它梦里取来的宝物'
export const VEIN_MAX = 66
export const VEIN_TIERS: { from: number; n: string }[] = [
  { from: 1, n: '嫩芽' },
  { from: 10, n: '幼苗' },
  { from: 18, n: '青枝' },
  { from: 26, n: '华盖' },
  { from: 34, n: '参天' },
  { from: 44, n: '擎天' },
  { from: 54, n: '通天' },
]
export function veinTier(lv: number): string {
  let n = VEIN_TIERS[0].n
  for (const t of VEIN_TIERS) if (lv >= t.from) n = t.n
  return n
}
// 当前等级可摇出的品质区间（随宝树重数）
export function veinQRange(lv: number): { min: number; max: number } {
  const qmax = Math.min(16, 2 + Math.floor(lv / 4))
  const qmin = Math.max(1, qmax - 5 + Math.floor(lv / 15))
  return { min: Math.min(qmin, qmax), max: qmax }
}
// 每重加成：摇落出货率 +0.6%/重
export function veinLuck(lv: number): number { return Math.round(lv * 0.6 * 10) / 10 }
// 每重加成：灵露收益 +1.5%/重
export function veinLingmaiP(lv: number): number { return Math.round(lv * 1.5 * 10) / 10 }
// 单次摇落消耗灵露（随宝树加深，是灵露的主要去处，摇落本身不再产出灵露）
export function veinDigCost(lv: number): number { return Math.round(1 + lv * lv / 25 + lv * 0.4) }
// 培育消耗与耗时平滑增长，单次等待最多12小时。
export function veinUpCost(lv: number): number { return Math.round(1300 * Math.pow(1.16, lv - 1)) }
export function veinUpTime(lv: number): number { return Math.round(Math.min(12 * 3600000, 25000 * Math.pow(1.12, lv))) }
// 满品质后的成长目标：摇落星级保底，数值在装备生成前应用。
export function veinStarFloor(lv: number): number { return lv >= 66 ? 4 : lv >= 61 ? 3 : lv >= 56 ? 2 : 1 }
export function veinAcceleration(remainingMs: number): number { return Math.min(remainingMs, Math.max(600000, Math.ceil(remainingMs * 0.2))) }
// 每重培育前需先在本重完成的摇落次数（先摇落后培育）
export function veinDigReq(lv: number): number { return 5 + Math.ceil(lv * 0.8) }

// 品质概率衰减系数：区间内偏向低品（底部常见、顶部稀有）；宝树越深衰减越弱
export function veinFalloff(lv: number): number {
  return Math.min(0.9, 0.52 + lv * 0.004)
}

// —— 装备等级：与主角等级同步（第19批：1..460 标尺，随境界对应等级）——
export const EQ_LV_MAX = 460
export function eqLevelRange(playerLv: number): { min: number; max: number } {
  const base = Math.max(1, Math.min(EQ_LV_MAX, playerLv))
  return { min: Math.max(1, base - 2), max: Math.min(EQ_LV_MAX, base + 6) }
}
// 按主角境界掷出装备等级（出货率使等级向上倾斜）
export function mineEquipLevel(playerLv: number, luck = 0): number {
  const r = eqLevelRange(playerLv)
  const t = Math.pow(rnd(), 1.25 / (1 + luck / 150))
  return Math.max(1, Math.min(EQ_LV_MAX, Math.round(r.min + t * (r.max - r.min))))
}

// 当前宝树重数的各品质概率（用于界面展示，与实际掉落一致，出货率参与计算）
export function veinQualityDist(lv: number, luck = 0): { q: number; pct: number }[] {
  const r = veinQRange(lv)
  const falloff = veinFalloff(lv)
  const arr: { q: number; w: number }[] = []
  let sum = 0
  for (let q = r.min; q <= r.max; q++) {
    let w = Math.pow(falloff, q - r.min)
    w *= 1 + (luck / 100) * ((q - r.min) / Math.max(1, r.max - r.min))
    arr.push({ q, w })
    sum += w
  }
  return arr.map(i => ({ q: i.q, pct: Math.round((i.w / sum) * 1000) / 10 }))
}

// 所有进阶（大小境界一视同仁）都按突破率一搏；随总进度平滑衰减，
// 悟性上限10个百分点，道心递减收益、上限16个百分点；丹药与失败补偿另计，最终10%～92%。
export function breakChance(major: number, phase: number, minor: number, wuXing: number, daoXin: number, yeLi: number, jieQi: number, bonus: number): number {
  const lv = major * PER_REALM + phase * MINOR_PER + minor
  const base = 0.9 * Math.pow(0.9982, lv)
  const insight = Math.min(0.1, Math.max(0, wuXing) * 0.005)
  const resolve = 0.16 * (1 - Math.exp(-Math.max(0, daoXin) / 20))
  const p = base + insight + resolve + bonus * 0.01 - yeLi * 0.002 - jieQi * 0.0012
  return Math.max(0.1, Math.min(0.92, p))
}
