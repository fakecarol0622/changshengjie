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
export function baseHp(lv: number, raw = false): number {
  const v = 120 * Math.pow(1.04225, lv)
  return raw ? v : Math.round(v)
}
export function baseAtk(lv: number, raw = false): number {
  const v = 12 * Math.pow(1.03936, lv)
  return raw ? v : Math.round(v)
}
export function baseDef(lv: number, raw = false): number {
  const v = 8 * Math.pow(1.03936, lv)
  return raw ? v : Math.round(v)
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
export const VEIN_MAX = 88
export const VEIN_TIERS: { from: number; n: string }[] = [
  { from: 1, n: '嫩芽' },
  { from: 14, n: '幼苗' },
  { from: 27, n: '青枝' },
  { from: 40, n: '华盖' },
  { from: 53, n: '参天' },
  { from: 66, n: '擎天' },
  { from: 79, n: '通天' },
]
export function veinTier(lv: number): string {
  let n = VEIN_TIERS[0].n
  for (const t of VEIN_TIERS) if (lv >= t.from) n = t.n
  return n
}
// 当前等级可摇出的品质区间（恒宽 5 档，每 6 重整体上滑 1 档：1-5 → 12-16）
export function veinQRange(lv: number): { min: number; max: number } {
  const qmin = Math.min(12, 1 + Math.floor(Math.max(0, lv - 1) / 6))
  return { min: qmin, max: qmin + 4 }
}
// 每重加成：摇落出货率 +2%/重
export function veinLuck(lv: number): number { return Math.round(lv * 2 * 10) / 10 }
// 每重加成：灵露收益 +2%/重
export function veinLingmaiP(lv: number): number { return Math.round(lv * 2 * 10) / 10 }
// 单次摇落消耗灵露（随宝树加深，是灵露的主要去处，摇落本身不再产出灵露）
export function veinDigCost(lv: number): number { return Math.round(1 + lv * lv / 25 + lv * 0.4) }
// 培育消耗与耗时平滑增长，单次等待最多12小时。
export function veinUpCost(lv: number): number { return Math.round(1300 * Math.pow(1.16, lv - 1)) }
export function veinUpTime(lv: number): number { return Math.round(Math.min(12 * 3600000, 25000 * Math.pow(1.12, lv))) }
// 满品质后的成长目标：摇落星级保底，数值在装备生成前应用。
export function veinStarFloor(lv: number): number { return lv >= 88 ? 4 : lv >= 81 ? 3 : lv >= 75 ? 2 : 1 }
export function veinAcceleration(remainingMs: number): number { return Math.min(remainingMs, Math.max(600000, Math.ceil(remainingMs * 0.2))) }
// 每重培育前需先在本重完成的摇落次数（先摇落后培育）
export function veinDigReq(lv: number): number { return 5 + Math.ceil(lv * 0.8) }

// 品质倾斜系数：档位权重 w=f^i（i 从最低档起）——f<1 低品常见，f≈1 各档趋平，f>1 高品为王。
// 随重数前快后慢地从 0.26 升到 ~2.3：前期每重低品大幅下降（每重约 -3~5%），后期高品概率反超。
export function veinFalloff(lv: number): number {
  const t = Math.min(1, Math.max(0, lv) / VEIN_MAX)
  return Math.exp(-1.35 + 2.2 * Math.pow(t, 0.34))
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

// 当前宝树重数的各品质概率（用于界面展示，与实际掉落同口径）
// 权重 = f^i（i 为从最低档起的档位序）；出货率进一步提升倾斜度（f × e^(luck×0.0015)）。
export function veinQualityDist(lv: number, luck = 0): { q: number; pct: number }[] {
  const r = veinQRange(lv)
  const f = veinFalloff(lv) * Math.exp(luck * 0.0015)
  const arr: { q: number; w: number }[] = []
  let sum = 0
  for (let q = r.min; q <= r.max; q++) {
    const w = Math.pow(f, q - r.min)
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
