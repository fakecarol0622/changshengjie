// ===== 镇妖塔 · 肉鸽爬塔增幅（本日爬塔生效，每日 0 点重置） =====
import type { Stats } from '../types'
import { rnd } from '../core/rng'

export interface TowerBuff { id: string; n: string; d: string; tier: 1 | 2 | 3; apply: (s: Stats) => void }

export const TB_TIER_NAMES: Record<number, string> = { 1: '凡品', 2: '良品', 3: '珍品' }

export const TOWER_BUFFS: TowerBuff[] = [
  // —— 凡品 ——
  { id: 'tb_atk', n: '淬锋', d: '攻击 +10%', tier: 1, apply: s => { s.atk = Math.round(s.atk * 1.1) } },
  { id: 'tb_def', n: '磐石', d: '防御 +12%', tier: 1, apply: s => { s.def = Math.round(s.def * 1.12) } },
  { id: 'tb_hp', n: '血勇', d: '气血 +15%', tier: 1, apply: s => { s.hp = Math.round(s.hp * 1.15) } },
  { id: 'tb_spd', n: '疾风', d: '速度 +6', tier: 1, apply: s => { s.spd += 6 } },
  { id: 'tb_dodge', n: '灵动', d: '闪避 +4%', tier: 1, apply: s => { s.dodge += 4 } },
  { id: 'tb_hit', n: '精准', d: '命中 +6%', tier: 1, apply: s => { s.hit += 6 } },
  // —— 良品 ——
  { id: 'tb_crit', n: '锋芒', d: '暴击率 +7%', tier: 2, apply: s => { s.crit += 7 } },
  { id: 'tb_combo', n: '连舞', d: '连击率 +7%', tier: 2, apply: s => { s.combo += 7 } },
  { id: 'tb_ls', n: '嗜血', d: '吸血 +6%', tier: 2, apply: s => { s.lifesteal += 6 } },
  { id: 'tb_pen', n: '破阵', d: '破甲 +8%', tier: 2, apply: s => { s.armorPen += 8 } },
  { id: 'tb_dr', n: '坚韧', d: '伤害减免 +8%', tier: 2, apply: s => { s.dmgReduce += 8 } },
  { id: 'tb_cd', n: '锐意', d: '暴击伤害 +15%', tier: 2, apply: s => { s.critDmg += 15 } },
  { id: 'tb_shield', n: '灵盾', d: '护盾强度 +10%', tier: 2, apply: s => { s.shield += 10 } },
  // —— 珍品 ——
  { id: 'tb_stun', n: '震慑', d: '击晕率 +4%', tier: 3, apply: s => { s.stun += 4 } },
  { id: 'tb_ctr', n: '反制', d: '反击率 +6%', tier: 3, apply: s => { s.counter += 6 } },
  { id: 'tb_start', n: '金刚', d: '开局护盾 +20%', tier: 3, apply: s => { s.startShieldPct += 20 } },
  { id: 'tb_kill', n: '汲取', d: '击杀回复 +10%', tier: 3, apply: s => { s.killHealPct += 10 } },
  { id: 'tb_daoyun', n: '道韵', d: '道韵 +10%', tier: 3, apply: s => { s.daoyun += 10 } },
  { id: 'tb_kalpa', n: '劫火', d: '劫火 +6%', tier: 3, apply: s => { s.kalpaFire += 6 } },
]

export const TOWER_BUFF_MAP: Record<string, TowerBuff> = Object.fromEntries(TOWER_BUFFS.map(b => [b.id, b]))

// 三选一抽取：品质权重 凡品60% / 良品30% / 珍品10%，三项不重复
export function rollTowerOffer(): string[] {
  const out: string[] = []
  let guard = 0
  while (out.length < 3 && guard++ < 80) {
    const r = rnd() * 100
    const tier = r < 10 ? 3 : r < 40 ? 2 : 1
    const pool = TOWER_BUFFS.filter(b => b.tier === tier)
    const b = pool[Math.floor(rnd() * pool.length)]
    if (b && !out.includes(b.id)) out.push(b.id)
  }
  for (const b of TOWER_BUFFS) {
    if (out.length >= 3) break
    if (!out.includes(b.id)) out.push(b.id)
  }
  return out
}
