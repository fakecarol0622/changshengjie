// ===== 奖励体系：月度签到 / 新手 7 日 / 境界大礼包 / 仙玉阁商品 =====
import { fmt } from '../core/format'
import { qName } from './qualities'
import { MAT_MAP } from './items'
import { PREMIUM_REWARDS, realmXianyu } from './premium'
import { realmLingshiReward } from './lingshi'

// —— 通用奖励条目（由 store 的 grant() 执行） ——
export type RewardItem =
  | { t: 'res'; id: string; n: number }
  | { t: 'dynres'; id: 'lingshi' | 'lingmai'; minutes?: number; minimum?: number } // 数量随境界
  | { t: 'mat'; id: string; n: number }
  | { t: 'pill'; id: string; n: number; q?: number }
  | { t: 'egg'; qmin: number; qmax: number }
  | { t: 'fam'; fid?: string; rmin: number; rmax: number }
  | { t: 'equip'; qmin: number; qmax: number }

export const RES_LABEL: Record<string, string> = {
  lingshi: '灵石', lingmai: '灵露', xianyu: '仙玉', xilian: '洗练石',
  gongming: '共鸣石', sweep: '扫荡券', auction: '拍卖令', qihun: '器魂', contrib: '贡献',
  pvpTicket: '论道帖', gaiming: '改命石', jianling: '剑冢令', xingyun: '星陨石', xianwu: '仙武积分',
  gachaTicket: '寻仙令',
}

// —— 月度签到（30 天一轮，满月后从第 1 天重新开始） ——
export const MONTH_DAYS = 30
const MONTH_BASE: RewardItem[] = [
  { t: 'dynres', id: 'lingshi', minutes: 60, minimum: 2000 },
  { t: 'res', id: 'lingmai', n: 5 },
  { t: 'res', id: 'xianyu', n: PREMIUM_REWARDS.dailySign },
]
const MONTH_EXTRA: Record<number, RewardItem[]> = {
  3: [{ t: 'res', id: 'xilian', n: 5 }],
  5: [{ t: 'res', id: 'gongming', n: 5 }],
  6: [{ t: 'res', id: 'xianyu', n: 10 }, { t: 'res', id: 'gachaTicket', n: 1 }],
  7: [{ t: 'equip', qmin: 7, qmax: 9 }],
  10: [{ t: 'res', id: 'lingmai', n: 20 }, { t: 'dynres', id: 'lingshi', minutes: 240, minimum: 8000 }],
  12: [{ t: 'res', id: 'xianyu', n: 15 }, { t: 'res', id: 'gachaTicket', n: 1 }],
  14: [{ t: 'pill', id: 'podan', n: 2, q: 2 }],
  15: [{ t: 'res', id: 'sweep', n: 3 }],
  18: [{ t: 'res', id: 'xilian', n: 8 }, { t: 'res', id: 'gachaTicket', n: 1 }],
  21: [{ t: 'res', id: 'gongming', n: 8 }, { t: 'res', id: 'xianyu', n: 20 }],
  24: [{ t: 'res', id: 'lingmai', n: 30 }, { t: 'res', id: 'auction', n: 1 }, { t: 'res', id: 'gachaTicket', n: 1 }],
  25: [{ t: 'equip', qmin: 9, qmax: 11 }],
  27: [{ t: 'res', id: 'xianyu', n: 30 }],
  30: [{ t: 'equip', qmin: 11, qmax: 13 }, { t: 'res', id: 'xianyu', n: 50 }, { t: 'res', id: 'gachaTicket', n: 2 }],
}
export function monthReward(day: number): RewardItem[] {
  return [...MONTH_BASE, ...(MONTH_EXTRA[day] || [])]
}

// —— 新手 7 日签到（随每日签到自动推进） ——
const NEWBIE: RewardItem[][] = [
  [{ t: 'res', id: 'lingshi', n: 3000 }, { t: 'res', id: 'lingmai', n: 10 }],
  [{ t: 'res', id: 'xilian', n: 5 }],
  [{ t: 'res', id: 'xianyu', n: 60 }],
  [{ t: 'res', id: 'gongming', n: 5 }, { t: 'res', id: 'lingmai', n: 15 }],
  [{ t: 'pill', id: 'podan', n: 2, q: 2 }],
  [{ t: 'res', id: 'xianyu', n: 100 }],
  [{ t: 'equip', qmin: 7, qmax: 9 }, { t: 'res', id: 'xianyu', n: 180 }],
]
export function newbieReward(day: number): RewardItem[] {
  return NEWBIE[day - 1] || []
}

// —— 境界大礼包（修为达到第 n 个大境界可领，n=1 炼气 … 10 仙人） ——
export function realmGift(n: number): RewardItem[] {
  const out: RewardItem[] = [
    { t: 'res', id: 'xianyu', n: realmXianyu(n) },
    { t: 'res', id: 'lingshi', n: realmLingshiReward(n) },
    { t: 'res', id: 'lingmai', n: 10 * Math.pow(2, n - 1) },
    { t: 'res', id: 'xilian', n: 4 * n },
    { t: 'res', id: 'gongming', n: 4 * n },
  ]
  if (n % 3 === 0) out.push({ t: 'equip', qmin: n + 2, qmax: Math.min(16, n + 4) })
  if (n === 10) out.push({ t: 'res', id: 'sweep', n: 10 }, { t: 'res', id: 'auction', n: 2 })
  return out
}

// —— 奖励短标签（月历格子 / 礼包预览用） ——
function short(r: RewardItem): string {
  if (r.t === 'res') return `${RES_LABEL[r.id] || r.id}×${fmt(r.n)}`
  if (r.t === 'dynres') return `${RES_LABEL[r.id]}袋`
  if (r.t === 'mat') return `${MAT_MAP[r.id]?.n || '材料'}×${fmt(r.n)}`
  if (r.t === 'pill') return '丹药'
  if (r.t === 'egg') return `${qName(r.qmin)}~${qName(r.qmax)}灵兽蛋`
  if (r.t === 'fam') return '精怪'
  return r.qmin === r.qmax ? `${qName(r.qmin)}装` : `${qName(r.qmin)}~${qName(r.qmax)}装`
}
function isBase(r: RewardItem): boolean {
  return r.t === 'res' && ((r.id === 'lingshi' && r.n === 1000) || (r.id === 'lingmai' && r.n === 5))
}
export function rewardBrief(list: RewardItem[], max = 2): string {
  const extra = list.filter(r => !isBase(r))
  const show = (extra.length ? extra : list).slice(0, max)
  return show.map(short).join('·')
}
// 完整奖励列表（战令 1~30 级一览等）
export function rewardFull(list: RewardItem[]): string {
  return list.map(short).join('·')
}

// —— 仙玉阁商品（坊市 · 仙玉阁） ——
export interface XianyuSku {
  id: string; n: string; desc: string; cost: number; limit: number
  resId?: string; amount?: number        // 固定资源
  dynRes?: 'lingshi' | 'lingmai'         // 随境界成长的资源袋
  pillId?: string; pillQ?: number
}
export const XY_SKUS: XianyuSku[] = [
  { id: 'lingshi_bag', n: '灵石袋', desc: '大量灵石，随境界提升', cost: 10, limit: 5, dynRes: 'lingshi' },
  { id: 'lingmai_bag', n: '灵露瓶', desc: '灵露，随境界提升', cost: 15, limit: 3, dynRes: 'lingmai' },
  { id: 'sweep5', n: '扫荡券 ×5', desc: '副本扫荡消耗', cost: 20, limit: 3, resId: 'sweep', amount: 5 },
  { id: 'xilian5', n: '洗练石 ×5', desc: '重铸装备词条数值', cost: 15, limit: 3, resId: 'xilian', amount: 5 },
  { id: 'gongming5', n: '共鸣石 ×5', desc: '重铸词条类型', cost: 15, limit: 3, resId: 'gongming', amount: 5 },
  { id: 'podan1', n: '破障丹 ×1（中品）', desc: '突破成功率 +12%', cost: 30, limit: 2, pillId: 'podan', pillQ: 2 },
  { id: 'auction1', n: '拍卖令 ×1', desc: '在拍卖会发起拍卖', cost: 40, limit: 1, resId: 'auction', amount: 1 },
]
export const XY_DYN: Record<string, (lv: number) => number> = {
  lingshi: lv => Math.round(2500 * Math.pow(1.02782, lv)),
  lingmai: lv => Math.round(300 * Math.pow(1.01467, lv)),
}

// —— 模拟充值礼包（单机演示：点击即模拟支付成功，无真实扣费） ——
export interface PayPack {
  id: string; rmb: number; n: number; first?: boolean
  kind?: 'xianyu' | 'month' | 'pass' // 礼包类型：仙玉/月卡/战令豪华版
  bonus?: string // 非仙玉礼包的说明文案
}
export const PAY_PACKS: PayPack[] = [
  { id: 'mk', rmb: 30, n: 300, kind: 'month', bonus: '月卡：立即得 300 仙玉，30 天内每日可领 100 仙玉' },
  { id: 'prem', rmb: 68, n: 0, kind: 'pass', bonus: '解锁修行战令「豪华奖励线」（本赛季有效）· 每级仙玉/灵露/洗练石逐级递增、逢5级加共鸣石/改命石/论道帖、逢10级加寻仙令，送灵兽蛋/龙髓/兽魂/妖珠，30级送 15~16 品装备 + 仙玉×1288 + 太古兽卵' },
  { id: 'p6', rmb: 6, n: 60, first: true },
  { id: 'p30', rmb: 30, n: 330, first: true },
  { id: 'p98', rmb: 98, n: 1180, first: true },
  { id: 'p198', rmb: 198, n: 2480, first: true },
  { id: 'p328', rmb: 328, n: 4280, first: true },
  { id: 'p648', rmb: 648, n: 8880, first: true },
]
