// ===== 先天气运（命格）：开局随机 3 条，鬼谷八荒式的开局随机性 =====
import type { Mods } from '../types'
import { weighted } from '../core/rng'

export interface TraitDef {
  id: string
  n: string
  r: 1 | 2 | 3 // 1 杂（凡）/ 2 良 / 3 佳
  desc: string
  mods: Mods
}

export const TRAIT_RARITY = ['', '杂', '良', '佳']

export const TRAITS: TraitDef[] = [
  // 杂（凡命）
  { id: 'duochuan', n: '命途多舛', r: 1, desc: '早年坎坷，后半生否极泰来', mods: { dropLuck: -3, cultP: 3 } },
  { id: 'guxing', n: '天煞孤星', r: 1, desc: '亲缘淡薄，却锻出傲骨', mods: { hpP: -5, atkP: 6 } },
  { id: 'qiaose', n: '灵窍滞塞', r: 1, desc: '灵根蒙尘，但体魄强健', mods: { cultP: -6, hpP: 8 } },
  { id: 'poqai', n: '破财之相', r: 1, desc: '留不住俗财，偏有奇遇', mods: { dropLuck: -5, critAdd: 3 } },
  { id: 'fangu', n: '凡骨天成', r: 1, desc: '肉身凡胎，胜在踏实', mods: { atkP: -3, hpP: 7 } },
  { id: 'zaie', n: '灾厄缠身', r: 1, desc: '厄运连连，却磨出狠劲', mods: { dropLuck: -6, critDmgAdd: 8 } },
  { id: 'shili', n: '势利之眼', r: 1, desc: '见钱眼开，修行上却少了灵气', mods: { dropLuck: 4, cultP: -4 } },
  { id: 'wangu', n: '顽骨不化', r: 1, desc: '倔强倔强，百毒不侵', mods: { dmgReduceAdd: 2, spdP: -4 } },
  // 良命
  { id: 'huigen', n: '慧根早发', r: 2, desc: '幼时即通经义，修炼事半功倍', mods: { cultP: 5 } },
  { id: 'jingu', n: '筋骨清奇', r: 2, desc: '天生一副好骨架，是练武的材料', mods: { atkP: 5 } },
  { id: 'xinkuan', n: '心宽体胖', r: 2, desc: '心宽者，气血自旺', mods: { hpP: 6 } },
  { id: 'fuyuan', n: '福缘深厚', r: 2, desc: '走路都能踢到灵草', mods: { dropLuck: 5 } },
  { id: 'shenzu', n: '身轻如燕', r: 2, desc: '步履生风，身法灵动', mods: { spdP: 6 } },
  { id: 'zifu', n: '紫府温养', r: 2, desc: '紫府天生温润，灵气自生', mods: { qiRegenAdd: 2 } },
  { id: 'shenli', n: '天生神力', r: 2, desc: '一举一动皆有千钧之力', mods: { atkP: 4, comboAdd: 3 } },
  { id: 'guomu', n: '过目不忘', r: 2, desc: '经义一读便通，悟性过人', mods: { cultP: 6 } },
  { id: 'lingxi', n: '灵犀之心', r: 2, desc: '心有灵犀，出手刁钻', mods: { critAdd: 4 } },
  { id: 'yugu', n: '玉骨冰肌', r: 2, desc: '骨骼如玉，身法飘逸', mods: { dodgeAdd: 5 } },
  { id: 'fuyun', n: '福运绵长', r: 2, desc: '好运如影随形，绵延不绝', mods: { dropLuck: 6 } },
  { id: 'baizhe', n: '百折不挠', r: 2, desc: '百炼成钢，越挫越强', mods: { dmgReduceAdd: 3, hpP: 3 } },
  { id: 'qiyu', n: '器宇轩昂', r: 2, desc: '风姿出众，步履生辉', mods: { spdP: 4, dodgeAdd: 3 } },
  // 佳命
  { id: 'tianling', n: '天灵圣体', r: 3, desc: '万中无一的修炼胚子', mods: { allP: 5 } },
  { id: 'qiyun', n: '气运加身', r: 3, desc: '冥冥之中如有神灵庇佑', mods: { dropLuck: 10 } },
  { id: 'daozhong', n: '道种天成', r: 3, desc: '生而知之，坐忘即悟', mods: { cultP: 10 } },
  { id: 'zhangu', n: '战骨天成', r: 3, desc: '为战而生，拳脚生风', mods: { atkP: 8, critAdd: 2 } },
  { id: 'wanfa', n: '万法不侵', r: 3, desc: '皮肉如铁，邪法难沾', mods: { dmgReduceAdd: 3 } },
  { id: 'jianbao', n: '见宝眼开', r: 3, desc: '一眼便知宝物品阶', mods: { starFloor: 1, dropLuck: 3 } },
  { id: 'daoti', n: '天生道体', r: 3, desc: '先天道体，万道亲近', mods: { cultP: 8, allP: 3 } },
  { id: 'caishen', n: '财神眷顾', r: 3, desc: '财运亨通，出宝率奇高', mods: { dropLuck: 8 } },
  { id: 'zhanyi', n: '战意滔天', r: 3, desc: '战意如潮，愈战愈勇', mods: { dmgP: 6, atkP: 5 } },
  { id: 'xuangui', n: '玄龟命格', r: 3, desc: '命如玄龟，坚不可摧', mods: { hpP: 10, dmgReduceAdd: 4 } },
  { id: 'kunpeng', n: '鲲鹏之姿', r: 3, desc: '扶摇直上，身快如风', mods: { spdP: 10, comboAdd: 4 } },
  { id: 'shennong', n: '神农之裔', r: 3, desc: '药石入体，事半功倍', mods: { pillBonus: 20, qiRegenAdd: 1 } },
]

export const TRAIT_MAP: Record<string, TraitDef> = Object.fromEntries(TRAITS.map(t => [t.id, t]))

// 掷出 3 条先天气运（保证不重复）
export function rollTraits(): string[] {
  const out: string[] = []
  const pool = [...TRAITS]
  for (let i = 0; i < 3; i++) {
    const t = weighted(pool.map(x => ({ w: x.r === 1 ? 50 : x.r === 2 ? 35 : 15, v: x })))
    out.push(t.id)
    pool.splice(pool.indexOf(t), 1)
  }
  return out
}
