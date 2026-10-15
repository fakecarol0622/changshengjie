// ===== 境界 / 数值公式 / 九层灵脉 =====
import { rnd } from '../core/rng'

export const MAJOR = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫', '仙人']
export const MINOR = ['初期', '中期', '后期', '圆满']
export const LIFE_YEARS = [100, 160, 320, 800, 1600, 3200, 6400, 12800, 32000, 64000, 999999]

export function lvIndex(major: number, minor: number): number {
  return major * 4 + minor
}
export function realmName(major: number, minor: number): string {
  if (major === 0 && minor === 0) return '凡人'
  return MAJOR[Math.min(major, 10)] + MINOR[Math.min(minor, 3)]
}
export function realmShort(major: number, minor: number): string {
  return realmName(major, minor)
}

// —— 数值公式 ——
// 长线平衡：修为需求增速 1.42 且越往后越难——按大境界分段额外膨胀
// （金丹+20% → 炼虚+50% → 渡劫+90%，越到后面每级越肝）
export function cultReq(lv: number): number {
  const major = Math.floor(lv / 4)
  const seg = major <= 2 ? 1 : major <= 5 ? 1.2 : major <= 8 ? 1.5 : 1.9
  return Math.round(60 * Math.pow(1.42, lv) * seg)
}
export function baseHp(lv: number): number {
  return Math.round(120 * Math.pow(1.52, lv))
}
export function baseAtk(lv: number): number {
  return Math.round(12 * Math.pow(1.48, lv))
}
export function baseDef(lv: number): number {
  return Math.round(8 * Math.pow(1.48, lv))
}
export function cultRate(lv: number, wuXing: number, mult: number): number {
  return 0.45 * Math.pow(1.24, lv) * (1 + wuXing / 20) * mult
}
export function idleLingshi(lv: number, qiYun: number, mult: number): number {
  return 0.18 * Math.pow(1.2, lv) * (1 + qiYun / 35) * mult
}
export function idleLingmai(lv: number, mult: number): number {
  return 0.04 * Math.pow(1.165, lv) * mult
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
// 当前等级可挖出的装备等级区间
export function veinEqRange(lv: number): { min: number; max: number } {
  const base = Math.min(42, 1 + Math.floor((lv - 1) * 0.64))
  return { min: Math.max(1, base - 1), max: Math.min(42, base + 2) }
}
// 当前等级可挖出的品质区间
export function veinQRange(lv: number): { min: number; max: number } {
  const qmax = Math.min(16, 2 + Math.floor(lv / 4))
  const qmin = Math.max(1, qmax - 5 + Math.floor(lv / 15))
  return { min: Math.min(qmin, qmax), max: qmax }
}
// 每级加成：挖掘出货率 +0.6%/级
export function veinLuck(lv: number): number { return Math.round(lv * 0.6 * 10) / 10 }
// 每级加成：灵脉石收益 +1.5%/级
export function veinLingmaiP(lv: number): number { return Math.round(lv * 1.5 * 10) / 10 }
// 单次挖掘消耗灵脉石
export function veinDigCost(lv: number): number { return 1 + Math.floor(lv * lv / 48) }
// 疏通消耗（灵石）与耗时（毫秒）——后期陡增
export function veinUpCost(lv: number): number { return Math.round(1000 * Math.pow(1.36, lv)) }
export function veinUpTime(lv: number): number { return Math.round(25000 * Math.pow(1.16, lv)) }
// 每级疏通前需先在本境完成的挖掘次数（先开采后疏通）
export function veinDigReq(lv: number): number { return 5 + Math.ceil(lv * 0.8) }

// 品质概率衰减系数：区间内偏向低品（底部常见、顶部稀有）；龙脉越深衰减越弱
export function veinFalloff(lv: number): number {
  return Math.min(0.9, 0.52 + lv * 0.004)
}

// 按龙脉等级掷出装备等级（出货率使等级向上倾斜）
export function veinEquipLevel(lv: number, luck = 0): number {
  const r = veinEqRange(lv)
  const t = Math.pow(rnd(), 1.25 / (1 + luck / 150))
  return Math.max(1, Math.round(r.min + t * (r.max - r.min)))
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

// 突破基础成功率（长线平衡：整体下调，属性加成收敛，封顶 92%）
export function breakChance(major: number, minor: number, wuXing: number, daoXin: number, yeLi: number, jieQi: number, bonus: number): number {
  const base = major >= 9 ? 0.17 : major >= 6 ? 0.25 : major >= 3 ? 0.33 : 0.42
  let p = base + wuXing * 0.005 + daoXin * 0.008 + bonus * 0.01 - yeLi * 0.002 - jieQi * 0.0012
  if (minor < 3) p += 0.12 // 小境界更易
  if (major <= 1) p += 0.1 // 新手期庇佑
  return Math.max(0.05, Math.min(0.92, p))
}
