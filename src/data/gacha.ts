// ===== 寻仙问道（抽卡）：常驻阁 + 限时阁（轮换）+ 保底 =====
import { weighted } from '../core/rng'

export type GachaGrant =
  | { t: 'res'; id: string; n: number }
  | { t: 'dynres'; id: 'lingshi' | 'lingmai' } // 数量随境界
  | { t: 'pill'; id: string; n: number; q?: number }
  | { t: 'equip'; qmin: number; qmax: number; rune?: string | 'random' }
  | { t: 'egg'; qmin: number; qmax: number }
  | { t: 'fam'; fid?: string; rmin: number; rmax: number }
  | { t: 'treasure'; qmin: number; qmax: number }

export interface GachaResult { r: 1 | 2 | 3 | 4; n: string; d: string; grant: GachaGrant }

export const GACHA_PITY = 60
export const GACHA_COST_1 = 30
export const GACHA_COST_10 = 280

interface PoolEntry { w: number; n: string; d: string; grant: GachaGrant }

// 常驻池各档奖励
const STD: Record<number, PoolEntry[]> = {
  1: [
    { w: 1, n: '灵石袋', d: '大量灵石（随境界）', grant: { t: 'dynres', id: 'lingshi' } },
    { w: 1, n: '灵脉石 ×10', d: '灵脉挖掘消耗', grant: { t: 'res', id: 'lingmai', n: 10 } },
    { w: 1, n: '洗练石 ×2', d: '重铸词条数值', grant: { t: 'res', id: 'xilian', n: 2 } },
    { w: 1, n: '共鸣石 ×2', d: '重铸词条类型', grant: { t: 'res', id: 'gongming', n: 2 } },
  ],
  2: [
    { w: 1, n: '灵兽蛋', d: '可孵化灵兽', grant: { t: 'egg', qmin: 4, qmax: 8 } },
    { w: 1, n: '破障丹 ×1', d: '突破成功率 +12%', grant: { t: 'pill', id: 'podan', q: 2, n: 1 } },
    { w: 1, n: '培元丹 ×1', d: '立即获得 1 小时挂机修为', grant: { t: 'pill', id: 'zengshou', q: 2, n: 1 } },
    { w: 1, n: '缘分精怪', d: '随机收服一只精怪', grant: { t: 'fam', rmin: 1, rmax: 3 } },
    { w: 1, n: '精品装备', d: '品质 7~9 装备', grant: { t: 'equip', qmin: 7, qmax: 9 } },
    { w: 1, n: '仙玉 ×15', d: '稀有货币', grant: { t: 'res', id: 'xianyu', n: 15 } },
  ],
  3: [
    { w: 1, n: '灵纹装备', d: '品质 10~13 且携带灵纹', grant: { t: 'equip', qmin: 10, qmax: 13, rune: 'random' } },
    { w: 1, n: '玄妖精怪', d: '玄妖~地妖级精怪', grant: { t: 'fam', rmin: 3, rmax: 4 } },
    { w: 1, n: '珍稀灵兽蛋', d: '可孵化高品灵兽', grant: { t: 'egg', qmin: 9, qmax: 12 } },
    { w: 1, n: '仙玉 ×40', d: '稀有货币', grant: { t: 'res', id: 'xianyu', n: 40 } },
    { w: 1, n: '洗髓丹 ×1', d: '随机属性 +1', grant: { t: 'pill', id: 'xisui', q: 3, n: 1 } },
  ],
  4: [
    { w: 1, n: '混沌仙兵', d: '16 品装备，必带灵纹', grant: { t: 'equip', qmin: 16, qmax: 16, rune: 'random' } },
    { w: 1, n: '天妖精怪', d: '天妖级精怪', grant: { t: 'fam', rmin: 5, rmax: 5 } },
    { w: 1, n: '上古法宝', d: '法宝（10~13 品）', grant: { t: 'treasure', qmin: 10, qmax: 13 } },
    { w: 1, n: '仙玉 ×120', d: '稀有货币', grant: { t: 'res', id: 'xianyu', n: 120 } },
  ],
}

// 限时阁（每 3 天轮换一次，保底跨轮换继承）
export interface LimBanner {
  id: string
  n: string
  sub: string
  legend: GachaResult
}
export const LIM_BANNERS: LimBanner[] = [
  {
    id: 'hongmeng', n: '仙缘·鸿蒙', sub: '限定灵纹「鸿蒙」仙兵',
    legend: { r: 4, n: '限定·鸿蒙仙兵', d: '16 品装备，必带灵纹「鸿蒙」（全属性+15%）', grant: { t: 'equip', qmin: 16, qmax: 16, rune: 'hongmeng' } },
  },
  {
    id: 'wanyao', n: '仙缘·万妖', sub: '限定精怪「九尾天狐」',
    legend: { r: 4, n: '限定·九尾天狐', d: '天妖级精怪，全属性+7%，吸收同类可升星', grant: { t: 'fam', fid: 'jiuwei', rmin: 5, rmax: 5 } },
  },
  {
    id: 'xinghui', n: '仙缘·星辉', sub: '限定法宝 + 仙玉豪礼',
    legend: { r: 4, n: '限定·星辉宝鉴', d: '法宝（12~15 品）+ 仙玉×200', grant: { t: 'treasure', qmin: 12, qmax: 15 } },
  },
]

const ROTATE_MS = 3 * 86400000
export function bannerIndex(now = Date.now()): number {
  return Math.floor(now / ROTATE_MS) % LIM_BANNERS.length
}
export function nextRotateAt(now = Date.now()): number {
  return (Math.floor(now / ROTATE_MS) + 1) * ROTATE_MS
}

// 单抽（pool: std/lim；force 强制某档：4=传说保底，3=十连保底）
function tierEntries(pool: 'std' | 'lim', r: number): PoolEntry[] {
  if (pool === 'lim') {
    const banner = LIM_BANNERS[bannerIndex()]
    if (r === 4) return [{ w: 3, n: banner.legend.n, d: banner.legend.d, grant: banner.legend.grant }, { w: 1, ...STD[4][0] }, { w: 1, ...STD[4][1] }]
    if (r === 3) return [...STD[3], { w: 0.6, n: banner.sub, d: '限定主题奖励（仙玉×60）', grant: { t: 'res', id: 'xianyu', n: 60 } }]
  }
  return STD[r]
}

export function rollGacha(pool: 'std' | 'lim', force?: 3 | 4): GachaResult {
  const r = force ?? weighted([
    { w: 600, v: 1 }, { w: 270, v: 2 }, { w: 107, v: 3 }, { w: 23, v: 4 },
  ])
  const entries = tierEntries(pool, r)
  const total = entries.reduce((s, e) => s + e.w, 0)
  const e = weighted(entries.map(x => ({ w: x.w / total, v: x })))
  return { r: r as 1 | 2 | 3 | 4, n: e.n, d: e.d, grant: e.grant }
}

// 奖池概率明细（展示用，与 rollGacha 同一套数据）
export function gachaBreakdown(pool: 'std' | 'lim'): { tier: number; pct: number; items: { n: string; pct: number }[] }[] {
  const tierPct = { 1: 60, 2: 27, 3: 10.7, 4: 2.3 } as Record<number, number>
  return [1, 2, 3, 4].map(r => {
    const entries = tierEntries(pool, r)
    const total = entries.reduce((s, e) => s + e.w, 0)
    return {
      tier: r,
      pct: tierPct[r],
      items: entries.map(e => ({ n: e.n, pct: Math.round((tierPct[r] * e.w / total) * 100) / 100 })),
    }
  })
}
