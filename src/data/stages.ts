// ===== 问道长阶：寻道大千式小关卡（90 阶 · 6 大段 · 剧情嵌入里程碑） =====
import type { RewardItem } from './rewards'

export const STAGE_MAX = 90

export interface StageSeg { n: string; from: number; to: number; enemies: string[]; desc: string }

export const STAGE_SEGS: StageSeg[] = [
  { n: '青云阶', from: 1, to: 15, enemies: ['山魈小妖', '青狼', '拦路散修', '毒瘴灵蛛'], desc: '入门试炼，斩妖除魔' },
  { n: '紫府阶', from: 16, to: 30, enemies: ['紫雾妖狐', '筑基邪修', '石傀守卫', '噬灵藤'], desc: '筑基之后，锋芒初露' },
  { n: '金丹阶', from: 31, to: 45, enemies: ['金甲尸魈', '血河修士', '三首妖蟒', '古墓尸王'], desc: '金丹之道，生死一线' },
  { n: '元婴阶', from: 46, to: 60, enemies: ['婴变魔影', '万魂幡主', '雷泽蛟龙', '幽冥鬼将'], desc: '元婴出窍，问鼎一方' },
  { n: '化神阶', from: 61, to: 75, enemies: ['化神老怪', '虚空异兽', '上古凶魂', '无面神像'], desc: '化神之域，半步通天' },
  { n: '问仙阶', from: 76, to: 90, enemies: ['仙墟守灵', '天外魔君', '劫云之灵', '混沌遗种'], desc: '问仙路上，再无退路' },
]

// 剧情章节嵌入特定关卡（通关即触发阅卷）
export const STAGE_STORY: Record<number, string> = {
  5: 'sc1', 12: 'sc2', 20: 'sc3', 28: 'sc4', 36: 'sc5', 44: 'sc6', 52: 'sc7', 60: 'sc8',
}

export function stageSeg(n: number): StageSeg {
  return STAGE_SEGS.find(s => n >= s.from && n <= s.to) || STAGE_SEGS[STAGE_SEGS.length - 1]
}

export function stageEnemy(n: number): { name: string; lv: number; mult: number; boss: boolean } {
  const seg = stageSeg(n)
  const lv = Math.max(0, Math.min(42, Math.round((n - 1) * 0.47)))
  const mult = Math.round((1 + (n - 1) * 0.045) * 100) / 100
  const boss = n % 10 === 0
  const name = boss ? `守关·${seg.enemies[seg.enemies.length - 1]}` : seg.enemies[(n * 7) % seg.enemies.length] + (n % 5 === 0 ? '·精英' : '')
  return { name, lv, mult: boss ? mult * 1.5 : mult, boss }
}

// 首通奖励：基础 + 每 5 阶 + 每 10 阶 + 每 15 阶
export function stageRewards(n: number): RewardItem[] {
  const out: RewardItem[] = [
    { t: 'res', id: 'lingshi', n: Math.round(300 * Math.pow(1.3, n)) },
    { t: 'res', id: 'xianyu', n: 1 + Math.floor(n / 12) },
  ]
  if (n % 3 === 0) out.push({ t: 'mat', id: 'shouhun', n: 2 + Math.floor(n / 10) })
  if (n % 5 === 0) out.push({ t: 'res', id: 'xilian', n: 2 }, { t: 'mat', id: 'yaozhu', n: 2 })
  if (n % 10 === 0) out.push({ t: 'res', id: 'pvpTicket', n: 1 }, { t: 'res', id: 'gaiming', n: 1 }, { t: 'res', id: 'gachaTicket', n: 1 }, { t: 'mat', id: 'longsui', n: 3 })
  if (n % 15 === 0) out.push({ t: 'egg', qmin: Math.max(1, Math.floor(n / 6)), qmax: Math.min(16, Math.floor(n / 6) + 4) }, { t: 'res', id: 'lingmai', n: 10 + n })
  if (n === 45) out.push({ t: 'res', id: 'gaiming', n: 3 })
  if (n === STAGE_MAX) out.push({ t: 'equip', qmin: 15, qmax: 16 }, { t: 'res', id: 'xianyu', n: 500 })
  return out
}

// 里程碑永久加成：每 10 阶全属性 +1%（上限 +9%）
export function stageBonus(cleared: number): number {
  return Math.min(9, Math.floor(cleared / 10))
}
