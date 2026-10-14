// ===== 灵兽展示助手：资质等级 / 给主人的属性加成明细 =====
import type { Beast, Mods } from '../types'
import { BEAST_MAP } from '../data/items'
import { modLines } from './mods'

// 资质等级（由四维资质均值决定；吞食同类可逐步提升）
export const BEAST_GRADES = ['凡品', '良品', '上品', '极品', '仙品', '神品']

export function beastAvgQual(b: Beast): number {
  const q = b.qual
  if (!q) return 50
  return Math.round((q.atk + q.def + q.hp + q.spd) / 4)
}

export function beastGrade(b: Beast): { idx: number; n: string } {
  const avg = beastAvgQual(b)
  const idx = avg < 45 ? 0 : avg < 55 ? 1 : avg < 65 ? 2 : avg < 75 ? 3 : avg < 87 ? 4 : 5
  return { idx, n: BEAST_GRADES[idx] }
}

// 与 derive() 同口径的灵兽总倍率
export function beastScale(b: Beast, beastBonus = 0): number {
  return (1 + (b.q - 1) * 0.06) * (1 + (b.level - 1) * 0.05) * (1 + (b.stage || 0) * 0.2) * (b.growth ?? 1) * (1 + beastBonus / 100)
}

// 灵兽给主人加的属性明细（种类加成 × 倍率 + 四维资质加成）
export function beastOwnerBonus(b: Beast, beastBonus = 0): string[] {
  const def = BEAST_MAP[b.kind]
  const s = beastScale(b, beastBonus)
  const merged: Mods = {}
  if (def?.mods) {
    for (const [k, v] of Object.entries(def.mods)) {
      if (v) (merged as Record<string, number>)[k] = ((merged as Record<string, number>)[k] || 0) + v * s
    }
  }
  const q = b.qual
  if (q) {
    merged.atkP = (merged.atkP || 0) + q.atk * 0.12
    merged.defP = (merged.defP || 0) + q.def * 0.12
    merged.hpP = (merged.hpP || 0) + q.hp * 0.12
    merged.spdP = (merged.spdP || 0) + q.spd * 0.1
  }
  return modLines(merged)
}
