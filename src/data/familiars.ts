// ===== 精怪系统（参考寻道大千：碎片凝形 → 收服 → 出战位被动加成 → 升级/升星） =====
import type { Mods } from '../types'
import { pick, weighted } from '../core/rng'

export interface FamiliarDef {
  id: string
  n: string
  r: 1 | 2 | 3 | 4 | 5 // 妖灵/灵胎/玄妖/地妖/天妖
  desc: string
  mods: Mods
}

export const FAM_RARITY = ['', '妖灵', '灵胎', '玄妖', '地妖', '天妖']

export const FAMILIARS: FamiliarDef[] = [
  // 妖灵（凡）
  { id: 'huyao', n: '小狐妖', r: 1, desc: '修行尚浅的狐妖，灵动狡黠', mods: { atkP: 4 } },
  { id: 'dengxin', n: '灯芯鬼', r: 1, desc: '古灯灯芯化形，夜深人静时窃窃私语', mods: { hpP: 4 } },
  { id: 'tianluo', n: '田螺精', r: 1, desc: '田螺成精，壳中藏着小楼阁', mods: { defP: 4 } },
  { id: 'zhiren', n: '纸人偶', r: 1, desc: '剪纸上生了灵性，翩跹如活物', mods: { dodgeAdd: 3 } },
  // 灵胎（良）
  { id: 'shanxiao', n: '山魈', r: 2, desc: '深山老魈，蛮力慑人', mods: { atkP: 7 } },
  { id: 'zaowang', n: '灶王爷', r: 2, desc: '受了人间香火的小神，护宅安宅', mods: { hpP: 7 } },
  { id: 'xuenv', n: '雪女', r: 2, desc: '雪夜遇人，呵气成霜', mods: { defP: 7, dmgReduceAdd: 2 } },
  { id: 'yinghuo', n: '萤火虫群', r: 2, desc: '万千萤点结成妖身，如梦似幻', mods: { spdP: 6 } },
  // 玄妖（珍）
  { id: 'yecha', n: '夜叉', r: 3, desc: '夜叉一族，爪利如刃，专破护体罡气', mods: { atkP: 5, armorPenAdd: 5 } },
  { id: 'yaoseng', n: '妖僧', r: 3, desc: '披着袈裟的千年老妖，皮糙肉厚', mods: { hpP: 10, reflectAdd: 3 } },
  { id: 'huoshu', n: '火鼠', r: 3, desc: '火山口生出的火精，灼热难当', mods: { dmgP: 4, critAdd: 2 } },
  { id: 'shigandang', n: '石敢当', r: 3, desc: '镇宅石生了灵，镇鬼辟邪', mods: { defP: 10, dmgReduceAdd: 3 } },
  // 地妖（极）
  { id: 'shuyao', n: '千年树妖', r: 4, desc: '参天古木成精，根须盘结如龙', mods: { hpP: 12, dmgReduceAdd: 4 } },
  { id: 'guiche', n: '鬼车', r: 4, desc: '九头夜行之妖，啼声裂胆', mods: { atkP: 12, critDmgAdd: 8 } },
  { id: 'fengbo', n: '风伯', r: 4, desc: '御风而行，来去无踪', mods: { spdP: 12, comboAdd: 4 } },
  // 天妖（传）
  { id: 'jiuwei', n: '九尾天狐', r: 5, desc: '九尾如扇，一顾倾人城，再顾倾人国', mods: { allP: 7 } },
  { id: 'mozun', n: '魔尊残魂', r: 5, desc: '陨落魔尊的一缕残魂，煞气冲霄', mods: { allP: 9, dmgP: 6 } },
  { id: 'guolong', n: '山海古龙', r: 5, desc: '上古真龙遗脉，蛰伏于山海之间', mods: { atkP: 15, hpP: 10 } },
]

export const FAM_MAP: Record<string, FamiliarDef> = Object.fromEntries(FAMILIARS.map(f => [f.id, f]))

// 凝形稀有度权重（bonus 由气运/轮回提升高位概率）
export function catchRoll(bonus = 0): FamiliarDef {
  const b = Math.min(6, Math.max(0, bonus))
  const weights = [
    { w: 44 - b, v: 1 }, { w: 27, v: 2 }, { w: 17 + b * 0.4, v: 3 },
    { w: 9 + b, v: 4 }, { w: 3 + b * 0.5, v: 5 },
  ]
  const r = weighted(weights)
  return pick(FAMILIARS.filter(f => f.r === r))
}

// 精怪加成总倍率：等级 +8%/级，星级 +25%/星
export function famScale(level: number, stars: number): number {
  return (1 + 0.08 * (level - 1)) * (1 + 0.25 * (stars - 1))
}
