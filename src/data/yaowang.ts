// ===== 妖王殿（参考寻道大千「挑战妖王」） =====
import type { Stats } from '../types'

export const YAO_NAMES = ['赤炎妖王', '玄冰妖王', '噬魂妖王', '青木妖王', '金甲妖王', '血河妖王', '雷吼妖王', '幽影妖王']

export interface YaoTrait { n: string; d: string; apply: (s: Stats) => void }

// 妖王「凶威」词条：每日随妖王轮换（两两组合），实战生效并在界面预告
export const YAO_TRAITS: YaoTrait[] = [
  { n: '震岳凶威', d: '击晕率+15%', apply: s => { s.stun += 15 } },
  { n: '汲血凶威', d: '吸血+20%', apply: s => { s.lifesteal += 20 } },
  { n: '反骨凶威', d: '反震+30%', apply: s => { s.reflect += 30 } },
  { n: '铁壁凶威', d: '伤害减免+25%', apply: s => { s.dmgReduce += 25 } },
  { n: '狂暴凶威', d: '暴击率+30%', apply: s => { s.crit += 30 } },
  { n: '疾影凶威', d: '速度+40', apply: s => { s.spd += 40 } },
  { n: '妖灵护体', d: '开局护盾30%', apply: s => { s.startShieldPct += 30 } },
  { n: '蚀骨凶威', d: '破甲+20%', apply: s => { s.armorPen += 20 } },
]

// 名号与凶威按天数确定性轮换（世界妖王每日一换）
export function yaoName(dayKey: number): string {
  return YAO_NAMES[((dayKey % YAO_NAMES.length) + YAO_NAMES.length) % YAO_NAMES.length]
}
export function yaoTraitIdx(dayKey: number): [number, number] {
  const h = (((dayKey * 31) % YAO_TRAITS.length) + YAO_TRAITS.length) % YAO_TRAITS.length
  return [h, (h + 3) % YAO_TRAITS.length]
}

// —— 伤害榜：NPC 单日伤害 = 战力 × K × 日抖动（确定性，同一天稳定可预览/可结算） ——
export const YAO_NPC_K = 2.5 // 折算系数（校准：三次打满的累计伤害 ≈ 同战力 NPC 水平的 0.76 倍，月末多一次可反超）
export function yaoNpcJitter(id: number, dayKey: number): number {
  const x = Math.sin((id * 131 + dayKey * 17) * 12.9898) * 43758.5453
  return 0.7 + (x - Math.floor(x)) * 0.6
}

// —— 每日排名奖励档位 ——
export interface YaoTier { upTo: number; xianyu: number; yaozhu: number; shouhun: number; gacha: number; gaiming: number }
export const YAO_TIERS: YaoTier[] = [
  { upTo: 1, xianyu: 20, yaozhu: 10, shouhun: 10, gacha: 1, gaiming: 1 },
  { upTo: 3, xianyu: 12, yaozhu: 7, shouhun: 7, gacha: 1, gaiming: 0 },
  { upTo: 10, xianyu: 8, yaozhu: 5, shouhun: 5, gacha: 0, gaiming: 0 },
  { upTo: 30, xianyu: 5, yaozhu: 3, shouhun: 3, gacha: 0, gaiming: 0 },
  { upTo: 9999, xianyu: 3, yaozhu: 2, shouhun: 2, gacha: 0, gaiming: 0 },
]
export function yaoTierOf(rank: number): YaoTier {
  return YAO_TIERS.find(t => rank <= t.upTo) || YAO_TIERS[YAO_TIERS.length - 1]
}
