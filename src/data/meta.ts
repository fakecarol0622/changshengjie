// ===== 运营层：在线奖励 / 新手目标 / 收集奖励 / 修行战令 / 仙武商店 / 周结算 =====
import type { Mods } from '../types'
import type { RewardItem } from './rewards'

// —— 在线奖励（挂机满时长领取，每日重置） ——
export interface OnlineDef { sec: number; n: string; grant: RewardItem[] }
export const ONLINE_REWARDS: OnlineDef[] = [
  { sec: 300, n: '5 分钟', grant: [{ t: 'res', id: 'lingshi', n: 1500 }, { t: 'res', id: 'xianyu', n: 1 }] },
  { sec: 900, n: '15 分钟', grant: [{ t: 'dynres', id: 'lingshi' }, { t: 'res', id: 'lingmai', n: 10 }] },
  { sec: 1800, n: '30 分钟', grant: [{ t: 'res', id: 'xianyu', n: 5 }, { t: 'res', id: 'xilian', n: 2 }, { t: 'res', id: 'gachaTicket', n: 1 }] },
  { sec: 3600, n: '60 分钟', grant: [{ t: 'res', id: 'xianyu', n: 10 }, { t: 'res', id: 'gongming', n: 2 }] },
  { sec: 7200, n: '120 分钟', grant: [{ t: 'res', id: 'xianyu', n: 20 }, { t: 'res', id: 'gachaTicket', n: 2 }, { t: 'pill', id: 'podan', n: 1, q: 2 }] },
]

// —— 新手目标链（达成自动发放） ——
export interface GoalCtx {
  major: number
  power: number
  pulls: number
  equippedCount: number
  cleared: Record<string, boolean>
  famCount: number
  maxEnh: number
  sect: boolean
  reinc: number
  towerFloor: number
}
export interface GoalDef { id: string; n: string; desc: string; grant: RewardItem[]; ok: (c: GoalCtx) => boolean }
export const GOALS: GoalDef[] = [
  { id: 'g1', n: '初入仙途', desc: '突破至炼气期', grant: [{ t: 'res', id: 'lingshi', n: 3000 }, { t: 'res', id: 'xianyu', n: 5 }], ok: c => c.major >= 1 },
  { id: 'g2', n: '小试身手', desc: '挖掘灵脉 5 次', grant: [{ t: 'res', id: 'lingmai', n: 10 }, { t: 'res', id: 'xianyu', n: 3 }], ok: c => c.pulls >= 5 },
  { id: 'g3', n: '披挂上阵', desc: '穿戴齐六件装备', grant: [{ t: 'res', id: 'xilian', n: 3 }], ok: c => c.equippedCount >= 6 },
  { id: 'g4', n: '站稳脚跟', desc: '战力达到 5000', grant: [{ t: 'res', id: 'xianyu', n: 10 }], ok: c => c.power >= 5000 },
  { id: 'g5', n: '副本初探', desc: '通关浮尘矿窟（普通）', grant: [{ t: 'res', id: 'sweep', n: 2 }, { t: 'res', id: 'xianyu', n: 5 }], ok: c => !!c.cleared['kuangku_0'] },
  { id: 'g6', n: '降妖之人', desc: '收服第一只精怪', grant: [{ t: 'mat', id: 'shouhun', n: 10 }, { t: 'res', id: 'xianyu', n: 5 }], ok: c => c.famCount >= 1 },
  { id: 'g7', n: '百炼成钢', desc: '把装备强化到 +5', grant: [{ t: 'res', id: 'lingshi', n: 10000 }], ok: c => c.maxEnh >= 5 },
  { id: 'g8', n: '筑基问道', desc: '突破至筑基期', grant: [{ t: 'res', id: 'xianyu', n: 20 }], ok: c => c.major >= 2 },
  { id: 'g9', n: '寻个靠山', desc: '加入任意宗门', grant: [{ t: 'res', id: 'contrib', n: 50 }, { t: 'res', id: 'xianyu', n: 10 }], ok: c => c.sect },
  { id: 'g10', n: '剑冢扬名', desc: '通关万剑冢（普通）', grant: [{ t: 'egg', qmin: 4, qmax: 8 }], ok: c => !!c.cleared['jianzhong_0'] },
  { id: 'g11', n: '名动一方', desc: '战力达到 10000', grant: [{ t: 'res', id: 'xianyu', n: 15 }], ok: c => c.power >= 1e4 },
  { id: 'g12', n: '登塔试炼', desc: '镇妖塔达到第 10 层', grant: [{ t: 'res', id: 'gongming', n: 5 }], ok: c => c.towerFloor >= 10 },
  { id: 'g13', n: '金丹大道', desc: '突破至金丹期', grant: [{ t: 'res', id: 'xianyu', n: 30 }, { t: 'pill', id: 'podan', n: 1, q: 2 }], ok: c => c.major >= 3 },
  { id: 'g14', n: '轮回之路', desc: '首次转世', grant: [{ t: 'res', id: 'xianyu', n: 50 }], ok: c => c.reinc >= 1 },
]

// —— 收集奖励（达成后永久加成，计入派生属性） ——
export interface CollectCtx { famKinds: number; codexCount: number; bestQ: number; treasures: number; beasts: number }
export interface CollectDef { id: string; n: string; desc: string; mods: Mods; ok: (c: CollectCtx) => boolean }
export const COLLECTS: CollectDef[] = [
  { id: 'cf6', n: '妖灵初谱', desc: '收服 6 种精怪', mods: { allP: 2 }, ok: c => c.famKinds >= 6 },
  { id: 'cf12', n: '百妖名录', desc: '收服 12 种精怪', mods: { allP: 3 }, ok: c => c.famKinds >= 12 },
  { id: 'cf18', n: '万妖之主', desc: '收服全部 18 种精怪', mods: { allP: 5 }, ok: c => c.famKinds >= 18 },
  { id: 'ce60', n: '藏器于身', desc: '装备图鉴收录 60 件', mods: { hpP: 3 }, ok: c => c.codexCount >= 60 },
  { id: 'ce120', n: '博古通今', desc: '装备图鉴收录 120 件', mods: { hpP: 5 }, ok: c => c.codexCount >= 120 },
  { id: 'cq14', n: '得窥天机', desc: '获得过 14 品装备', mods: { atkP: 3 }, ok: c => c.bestQ >= 14 },
  { id: 'ct4', n: '多宝道人', desc: '拥有 4 件法宝', mods: { treasureBonus: 5 }, ok: c => c.treasures >= 4 },
  { id: 'cb4', n: '兽苑之主', desc: '拥有 4 只灵兽', mods: { beastBonus: 5 }, ok: c => c.beasts >= 4 },
]
export const COLLECT_MAP: Record<string, CollectDef> = Object.fromEntries(COLLECTS.map(c => [c.id, c]))

// —— 修行战令（活跃度产生经验，100 XP / 级，30 级；10 天一赛季） ——
export const PASS_XP_PER = 100
export const PASS_MAX = 30
export function passSeason(now = Date.now()): number { return Math.floor(now / (10 * 86400000)) }
export function passSeasonEnd(now = Date.now()): number { return (Math.floor(now / (10 * 86400000)) + 1) * 10 * 86400000 }
export function passFree(lvl: number): RewardItem[] {
  const out: RewardItem[] = [{ t: 'res', id: 'lingshi', n: Math.round(800 * Math.pow(1.28, lvl)) }]
  if (lvl % 5 === 0) out.push({ t: 'res', id: 'xilian', n: 2 })
  return out
}
export function passPrem(lvl: number): RewardItem[] {
  // 豪华线：奖励随等级逐级递增，且品类丰富（仙玉/灵脉石/洗练石为基础，里程碑加稀有物）
  const out: RewardItem[] = [
    { t: 'res', id: 'xianyu', n: 20 + lvl * 3 }, // 23 → 110 仙玉/级，越往后越多
    { t: 'res', id: 'lingmai', n: 4 + lvl * 2 }, // 6 → 64 灵脉石
    { t: 'res', id: 'xilian', n: 1 + Math.floor(lvl / 3) }, // 1 → 11 洗练石
  ]
  if (lvl % 5 === 0) {
    out.push(
      { t: 'res', id: 'gongming', n: 4 + lvl }, // 9 → 34 共鸣石
      { t: 'res', id: 'gaiming', n: 1 + Math.floor(lvl / 10) }, // 改命石
      { t: 'res', id: 'pvpTicket', n: 2 }, // 论道帖
    )
  }
  if (lvl % 10 === 0) out.push({ t: 'res', id: 'gachaTicket', n: lvl / 10 }) // 寻仙令 1/2/3
  if (lvl === 5) out.push({ t: 'res', id: 'sweep', n: 3 })
  if (lvl === 10) out.push({ t: 'egg', qmin: 6, qmax: 10 })
  if (lvl === 15) out.push({ t: 'res', id: 'sweep', n: 5 }, { t: 'mat', id: 'longsui', n: 6 })
  if (lvl === 20) out.push({ t: 'egg', qmin: 10, qmax: 14 }, { t: 'mat', id: 'longsui', n: 12 })
  if (lvl === 25) out.push({ t: 'mat', id: 'shouhun', n: 20 }, { t: 'mat', id: 'yaozhu', n: 10 })
  if (lvl === PASS_MAX) {
    out.push(
      { t: 'equip', qmin: 15, qmax: 16 },
      { t: 'res', id: 'xianyu', n: 1288 },
      { t: 'egg', qmin: 13, qmax: 16 },
      { t: 'res', id: 'gaiming', n: 8 },
      { t: 'res', id: 'gachaTicket', n: 3 },
      { t: 'res', id: 'sweep', n: 10 },
      { t: 'res', id: 'auction', n: 1 },
    )
  }
  return out
}

// —— 仙武商店（周限购，压缩周刷新） ——
export interface PvpSku { id: string; n: string; desc: string; cost: number; weekly: number; grant: RewardItem[] }
export const PVP_SHOP: PvpSku[] = [
  { id: 'sw_gacha', n: '寻仙令 ×2', desc: '寻仙问道抽卡券', cost: 70, weekly: 2, grant: [{ t: 'res', id: 'gachaTicket', n: 2 }] },
  { id: 'sw_ticket', n: '论道帖 ×2', desc: '论道台入场券', cost: 60, weekly: 3, grant: [{ t: 'res', id: 'pvpTicket', n: 2 }] },
  { id: 'sw_xilian', n: '洗练石 ×5', desc: '重铸词条数值', cost: 60, weekly: 2, grant: [{ t: 'res', id: 'xilian', n: 5 }] },
  { id: 'sw_gaiming', n: '改命石 ×2', desc: '重铸词条类型', cost: 90, weekly: 2, grant: [{ t: 'res', id: 'gaiming', n: 2 }] },
  { id: 'sw_lingmai', n: '灵脉石 ×30', desc: '灵脉挖掘', cost: 80, weekly: 3, grant: [{ t: 'res', id: 'lingmai', n: 30 }] },
  { id: 'sw_sweep', n: '扫荡券 ×3', desc: '副本扫荡', cost: 50, weekly: 2, grant: [{ t: 'res', id: 'sweep', n: 3 }] },
  { id: 'sw_podan', n: '破障丹 ×1', desc: '突破成功率 +12%', cost: 100, weekly: 2, grant: [{ t: 'pill', id: 'podan', n: 1, q: 2 }] },
  { id: 'sw_egg', n: '灵兽蛋（4~10 品）', desc: '孵化灵兽', cost: 150, weekly: 1, grant: [{ t: 'egg', qmin: 4, qmax: 10 }] },
  { id: 'sw_fam', n: '妖珠碎片 ×15', desc: '凝形精怪的材料', cost: 180, weekly: 1, grant: [{ t: 'mat', id: 'yaozhu', n: 15 }] },
  { id: 'sw_xianyu', n: '仙玉 ×30', desc: '稀有货币', cost: 150, weekly: 2, grant: [{ t: 'res', id: 'xianyu', n: 30 }] },
]

// —— 论道天梯（寻道大千式排名 PV P）——
export interface PvpTier { n: string; min: number }
export const PVP_TIERS: PvpTier[] = [
  { n: '照胆', min: 0 }, { n: '听涛', min: 80 }, { n: '凌云', min: 200 }, { n: '摘星', min: 400 },
  { n: '揽月', min: 700 }, { n: '问天', min: 1100 }, { n: '无极', min: 1600 },
]
export function pvpTierIdx(points: number): number {
  let idx = 0
  for (let i = 0; i < PVP_TIERS.length; i++) if (points >= PVP_TIERS[i].min) idx = i
  return idx
}
// 全服（模拟）排名：积分越高名次越靠前
// 500 × 0.35^x = 1 → x ≈ 5.98 → 每 267 分进一档
// rank = max(1, floor(500 * 0.35^(points / 500)))
export function pvpRank(points: number): number {
  return Math.max(1, Math.round(500 * Math.pow(0.35, points / 500)))
}

// —— 天骄榜每周结算 ——
export function weekSettle(rank: number): { xianyu: number; xianwu: number } {
  if (rank <= 1) return { xianyu: 120, xianwu: 250 }
  if (rank <= 3) return { xianyu: 80, xianwu: 180 }
  if (rank <= 10) return { xianyu: 40, xianwu: 100 }
  if (rank <= 30) return { xianyu: 15, xianwu: 50 }
  return { xianyu: 5, xianwu: 20 }
}

// —— 月卡 ——
export const MONTH_CARD = { days: 30, dailyXianyu: 100, bonusXianyu: 300 }
