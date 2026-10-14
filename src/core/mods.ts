// ===== Mods 文本化（用于详情展示：命格/灵兽/精怪/功法等） =====
import type { Mods } from '../types'

const MOD_NAMES: Record<string, string> = {
  allP: '全属性', atkP: '攻击', defP: '防御', hpP: '气血', spdP: '速度', cultP: '修炼速度',
  critAdd: '暴击率', critDmgAdd: '暴击伤害', comboAdd: '连击率', dodgeAdd: '闪避率', hitAdd: '命中率',
  lifestealAdd: '吸血', reflectAdd: '反震', armorPenAdd: '破甲', dmgReduceAdd: '伤害减免',
  qiRegenAdd: '灵气回复', cdrAdd: '冷却缩减', dmgP: '最终伤害',
  dropLuck: '出货率', starFloor: '星级保底', pillBonus: '丹药效果', treasureBonus: '法宝效果', beastBonus: '灵兽效果',
}
const PCT_KEYS = new Set(['allP', 'atkP', 'defP', 'hpP', 'spdP', 'cultP', 'dmgP', 'dropLuck', 'pillBonus', 'treasureBonus', 'beastBonus'])

export function modLines(m: Mods, scale = 1): string[] {
  const out: string[] = []
  for (const [k, v] of Object.entries(m)) {
    if (!v) continue
    const name = MOD_NAMES[k] || k
    const val = Math.round(v * scale * 10) / 10
    out.push(`${name} ${val > 0 ? '+' : ''}${val}${PCT_KEYS.has(k) ? '%' : ''}`)
  }
  return out
}
