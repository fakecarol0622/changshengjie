// ===== 境界 / 数值公式 / 烛龙脉 =====
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
// 长线平衡（第19批重定）：440 级标尺（11 境 × 4 小境 × 10 阶），曲线指数按 ⁴√ 收拢，
// 保证同一相对进度所需修为与第18批等价（单阶需求不缩水，只是台阶更密）
export function cultReq(lv: number): number {
  const major = Math.floor(lv / PER_REALM)
  const seg = major <= 2 ? 1 : major <= 5 ? 1.15 : major <= 8 ? 1.35 : 1.6
  return Math.round(150 * Math.pow(1.03443, lv) * seg)
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

// —— 烛龙脉：一脉贯地，逐级疏通（时间+灵石升级，龙髓可加速）——
export const VEIN_NAME = '烛龙脉'
export const VEIN_FLAVOR = '沉眠地底的远古龙脉，疏其经络，天地灵气皆循此脉而来'
export const VEIN_MAX = 66
export const VEIN_TIERS: { from: number; n: string }[] = [
  { from: 1, n: '凡脉' },
  { from: 10, n: '灵脉' },
  { from: 18, n: '玄脉' },
  { from: 26, n: '宝脉' },
  { from: 34, n: '仙脉' },
  { from: 44, n: '神脉' },
  { from: 54, n: '祖龙脉' },
]
export function veinTier(lv: number): string {
  let n = VEIN_TIERS[0].n
  for (const t of VEIN_TIERS) if (lv >= t.from) n = t.n
  return n
}
// 当前等级可挖出的品质区间（随龙脉等级）
export function veinQRange(lv: number): { min: number; max: number } {
  const qmax = Math.min(16, 2 + Math.floor(lv / 4))
  const qmin = Math.max(1, qmax - 5 + Math.floor(lv / 15))
  return { min: Math.min(qmin, qmax), max: qmax }
}
// 每级加成：挖掘出货率 +0.6%/级
export function veinLuck(lv: number): number { return Math.round(lv * 0.6 * 10) / 10 }
// 每级加成：开脉石收益 +1.5%/级
export function veinLingmaiP(lv: number): number { return Math.round(lv * 1.5 * 10) / 10 }
// 单次挖掘消耗开脉石（随龙脉加深，是开脉石的主要去处，挖掘本身不再产出开脉石）
export function veinDigCost(lv: number): number { return Math.round(1 + lv * lv / 25 + lv * 0.4) }
// 疏通消耗（灵石）与耗时（毫秒）——后期渐增（1.30^lv，卡点保留但更友好）
export function veinUpCost(lv: number): number { return Math.round(1000 * Math.pow(1.3, lv)) }
export function veinUpTime(lv: number): number { return Math.round(25000 * Math.pow(1.16, lv)) }
// 每级疏通前需先在本境完成的挖掘次数（先开采后疏通）
export function veinDigReq(lv: number): number { return 5 + Math.ceil(lv * 0.8) }

// 品质概率衰减系数：区间内偏向低品（底部常见、顶部稀有）；龙脉越深衰减越弱
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

// 当前龙脉等级的各品质概率（用于界面展示，与实际掉落一致，出货率参与计算）
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

// 突破基础成功率（平滑长线：开局最高，随总进度指数衰减，越往后越低）
// 基础值 0.85 → 0.85*0.996^lv：lv0≈85%，lv120≈53%，lv240≈33%，lv360≈20%，lv439≈15%
// 悟性/道心/丹药/秘宝可补足；每小境界前三阶更易、新手期有庇佑；封顶 92%
export function breakChance(major: number, phase: number, minor: number, wuXing: number, daoXin: number, yeLi: number, jieQi: number, bonus: number): number {
  const lv = major * PER_REALM + phase * MINOR_PER + minor
  const base = 0.85 * Math.pow(0.996, lv)
  let p = base + wuXing * 0.005 + daoXin * 0.008 + bonus * 0.01 - yeLi * 0.002 - jieQi * 0.0012
  if (minor < 3) p += 0.12 // 每小境界前三阶更易
  if (major <= 1) p += 0.1 // 新手期庇佑
  return Math.max(0.05, Math.min(0.92, p))
}
