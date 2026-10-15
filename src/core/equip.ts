// ===== 装备生成 / 属性推导 / 共鸣判定 =====
import type { AffixRoll, Beast, Eff, Equip, Familiar, Mods, Proc, SlotKey, Stats, Technique, Treasure } from '../types'
import {
  AFFIX_MAP, affixPoolFor, BODY_BASES, PREFIX_TAGS, QUALITIES, RUNES, SLOT_BASES, SLOTS,
  STAR_W, SWORD_BASES, drawPrefix, nameFor, scoreEquip,
} from '../data/qualities'
import { baseAtk, baseDef, baseHp, lvIndex } from '../data/realms'
import { BEAST_MAP, BEAST_KINDS, BEAST_STAGE_SKILLS, TECH_MAP, TREASURE_COMBOS, TREASURE_MAP } from '../data/items'
import { FAM_MAP, famScale } from '../data/familiars'
import { COLLECT_MAP } from '../data/meta'
import { TRAIT_MAP } from '../data/traits'
import { PHYSIQUES } from '../data/world'
import { RESONANCES, type ResCtx } from '../data/resonances'
import { rollEquipTags } from '../data/tags'
import { chance, pick, rf, ri, rnd, uid, weighted } from './rng'

export function emptyStats(): Stats {
  return {
    hp: 0, atk: 0, def: 0, spd: 10,
    crit: 5, critDmg: 0, combo: 5, dodge: 5, hit: 5,
    lifesteal: 0, reflect: 0, armorPen: 0, dmgReduce: 0, shield: 0,
    qiRegen: 0, cdr: 0, execute: 0, daoyun: 0, kalpaFire: 0, devour: 0, reviveExtra: 0,
    dmgP: 0, vsBossP: 0, vsLowP: 0, firstHitP: 0,
    ignoreDefP: 0, critTrue: 0, immuneChance: 0,
    startShieldPct: 0, killHealPct: 0, regenPct: 0, losePerHitPct: 0,
    reviveCount: 0, revivePct: 0, tribBonus: 0,
    dropLuck: 0, starFloor: 0, pillBonus: 0, treasureBonus: 0, beastBonus: 0,
    stun: 0, counter: 0, resistStun: 0, resistCrit: 0, resistCombo: 0, resistCounter: 0, resistLifesteal: 0,
    dmgBoost: 0, healBoost: 0, healCut: 0, beastBoost: 0, beastCut: 0,
  }
}

export function applyMods(s: Stats, m: Mods, scale = 1): void {
  const f = (v?: number) => (v || 0) * scale
  if (m.allP) { const k = 1 + f(m.allP) / 100; s.atk *= k; s.def *= k; s.hp *= k }
  if (m.atkP) s.atk *= 1 + f(m.atkP) / 100
  if (m.defP) s.def *= 1 + f(m.defP) / 100
  if (m.hpP) s.hp *= 1 + f(m.hpP) / 100
  if (m.spdP) s.spd *= 1 + f(m.spdP) / 100
  if (m.critAdd) s.crit += f(m.critAdd)
  if (m.critDmgAdd) s.critDmg += f(m.critDmgAdd)
  if (m.comboAdd) s.combo += f(m.comboAdd)
  if (m.dodgeAdd) s.dodge += f(m.dodgeAdd)
  if (m.hitAdd) s.hit += f(m.hitAdd)
  if (m.lifestealAdd) s.lifesteal += f(m.lifestealAdd)
  if (m.reflectAdd) s.reflect += f(m.reflectAdd)
  if (m.armorPenAdd) s.armorPen += f(m.armorPenAdd)
  if (m.dmgReduceAdd) s.dmgReduce += f(m.dmgReduceAdd)
  if (m.qiRegenAdd) s.qiRegen += f(m.qiRegenAdd)
  if (m.cdrAdd) s.cdr += f(m.cdrAdd)
  if (m.dmgP) s.dmgP += f(m.dmgP)
  if (m.dropLuck) s.dropLuck += f(m.dropLuck)
  if (m.starFloor) s.starFloor = Math.max(s.starFloor, m.starFloor)
  if (m.pillBonus) s.pillBonus += f(m.pillBonus)
  if (m.treasureBonus) s.treasureBonus += f(m.treasureBonus)
  if (m.beastBonus) s.beastBonus += f(m.beastBonus)
  if (m.stunAdd) s.stun += f(m.stunAdd)
  if (m.counterAdd) s.counter += f(m.counterAdd)
  if (m.resistAllAdd) {
    const v = f(m.resistAllAdd)
    s.resistStun += v; s.resistCrit += v; s.resistCombo += v; s.resistCounter += v; s.resistLifesteal += v
  }
  if (m.dmgBoostAdd) s.dmgBoost += f(m.dmgBoostAdd)
  if (m.healBoostAdd) s.healBoost += f(m.healBoostAdd)
  if (m.healCutAdd) s.healCut += f(m.healCutAdd)
  if (m.beastBoostAdd) s.beastBoost += f(m.beastBoostAdd)
  if (m.beastCutAdd) s.beastCut += f(m.beastCutAdd)
}

// ===== 装备生成 =====
export function rollAffixValue(k: string, q: number, stars: number, lv: number): number {
  const def = AFFIX_MAP[k]
  const roll = rf(def.min, def.max)
  if (def.pct) {
    return Math.round(roll * (1 + 0.06 * (q - 1)) * (1 + 0.04 * (stars - 1)) * 10) / 10
  }
  if (k === 'reincarnate') return ri(1, 3)
  const qm = 1 + 0.38 * (q - 1)
  const sm = 1 + 0.3 * (stars - 1)
  if (def.flat === 'atk') return Math.max(1, Math.round(roll * 0.55 * Math.pow(1.03644, lv) * qm * sm))
  if (def.flat === 'def') return Math.max(1, Math.round(roll * 0.48 * Math.pow(1.03644, lv) * qm * sm))
  if (def.flat === 'hp') return Math.max(1, Math.round(roll * 0.7 * Math.pow(1.03897, lv) * qm * sm))
  if (def.flat === 'spd') return Math.max(1, Math.round(roll * (1 + lv * 0.00457) * (1 + 0.08 * (q - 1))))
  return Math.round(roll * (1 + 0.06 * (q - 1)) * 10) / 10
}

// 档位权重 w=f^i（i 从最低档起）；f<1 低品常见、f>1 高品为王；出货率进一步提升倾斜度。
export function rollQuality(qmin: number, qmax: number, luck = 0, falloff = 0.55): number {
  const f = falloff * Math.exp(luck * 0.0015)
  const items: { w: number; v: number }[] = []
  for (let q = qmin; q <= qmax; q++) {
    items.push({ w: Math.pow(f, q - qmin), v: q })
  }
  return weighted(items)
}

export function genEquip(lv: number, qmin: number, qmax: number, opts: { slot?: SlotKey; q?: number; forceRune?: boolean; selfMined?: boolean; name?: string; starFloor?: number } = {}): Equip {
  const q = opts.q ?? rollQuality(qmin, qmax)
  const slot = opts.slot ?? pick(SLOTS)
  const stars = Math.min(5, Math.max(weighted(STAR_W.map((w, i) => ({ w, v: i + 1 }))), opts.starFloor || 1))
  let base = pick(SLOT_BASES[slot])
  const prefix = drawPrefix(q)
  // 避免「青锋·锋」「天罡·罡」这类同名尾字撞车
  if (prefix.endsWith(base)) {
    const alt = SLOT_BASES[slot].filter(b => !prefix.endsWith(b))
    if (alt.length) base = pick(alt)
  }
  const name = opts.name ?? nameFor(q, base, prefix)
  const nAff = QUALITIES[q - 1].aff
  const pool = affixPoolFor(q).slice()
  const affixes: AffixRoll[] = []
  const used = new Set<string>()
  for (let i = 0; i < nAff; i++) {
    const before = affixes.length
    let guard = 0
    while (guard++ < 80) {
      const k = weighted(pool) // weighted 直接返回值本身（v）
      if (!k || used.has(k)) continue
      used.add(k)
      const def = AFFIX_MAP[k]
      affixes.push({ k, tier: def.tier, v: rollAffixValue(k, q, stars, lv) })
      break
    }
    // 兜底：若加权抽取反复撞车，直接取一个未使用的词条，保证数量达标
    if (affixes.length === before) {
      const fb = pool.find(p => !used.has(p.v))
      if (fb) {
        used.add(fb.v)
        const def = AFFIX_MAP[fb.v]
        affixes.push({ k: fb.v, tier: def.tier, v: rollAffixValue(fb.v, q, stars, lv) })
      }
    }
  }
  // 流派/五行标签
  const flavors = new Set<string>()
  const elements = new Set<string>()
  if (SWORD_BASES.includes(base)) flavors.add('剑类')
  if (BODY_BASES.includes(base)) flavors.add('炼体')
  const tags = PREFIX_TAGS[prefix]
  if (tags?.f) tags.f.forEach(f => flavors.add(f))
  if (tags?.e) tags.e.forEach(e => elements.add(e))
  else if (chance(0.12)) elements.add(pick(['金', '木', '水', '火', '土']))
  const rune = q >= 12 || opts.forceRune ? pick(RUNES).id : undefined
  const equ: Equip = {
    id: uid(), slot, q, stars, base, prefix, name, affixes,
    rune, selfMined: opts.selfMined ?? true, enchanted: false,
    elements: [...elements], flavors: [...flavors], tags: rollEquipTags(q),
    score: 0, level: lv,
  }
  equ.score = scoreEquip(equ)
  return equ
}

// 缩放 proc 效果数值（精怪战斗技随成长）
function scaleProcEff(eff: Eff, f: number): Eff {
  if (f === 1) return eff
  const e = { ...eff } as { mult?: number; pct?: number } & Eff
  if (typeof e.mult === 'number') e.mult = Math.round(e.mult * f * 100) / 100
  if (typeof e.pct === 'number') e.pct = Math.round(e.pct * f * 10) / 10
  return e
}

// 技能效果文字（供 UI 展示具体作用）
export function procEffectText(p: Proc): string {
  const e = p.eff as { t: string; mult?: number; pct?: number; rounds?: number; name?: string }
  switch (e.t) {
    case 'dmg': return `造成 ${Math.round((e.mult || 1) * 100)}% 攻击伤害`
    case 'true': return `造成 ${Math.round((e.mult || 1) * 100)}% 攻击真实伤害`
    case 'heal': return `回复 ${e.pct}% 气血`
    case 'shield': return `获得 ${e.pct}% 气血护盾`
    case 'dot': return `${e.name || '持续伤害'}（${e.rounds}回合·每回合${Math.round((e.pct || 0) * 100)}%攻击伤害）`
    case 'stun': return `击晕目标 ${e.rounds} 回合`
    case 'atkBuff': return `攻击 +${e.pct}%（${e.rounds}回合）`
    case 'defDown': return `破防 ${e.pct}%（${e.rounds}回合）`
    case 'immune': return '免疫下一次负面效果'
    case 'revive': return `阵亡后以 ${e.pct}% 气血复活`
    case 'extraHit': return `追加一击（${Math.round((e.mult || 1) * 100)}% 攻击）`
    case 'lord': return '随机获得一项顶级词条效果'
    case 'selfHp': return (e.pct || 0) < 0 ? `自损 ${-(e.pct || 0)}% 气血` : `回复 ${e.pct}% 气血`
    default: return p.desc
  }
}

// ===== 推导上下文与总属性 =====
export interface DeriveCtx {
  major: number
  phase: number
  minor: number
  attrs: Record<string, number>
  equipped: Equip[]
  techniques: Technique[] // 已装备
  beast: Beast | null
  fams: Familiar[] // 出战精怪
  collects: string[] // 已达成收集
  traits: string[] // 先天气运
  treasures: Treasure[]
  physique: string | null
  sect: string
  caveCultP: number // 洞府修炼加成 %
  buffCultP: number // 丹药/打坐临时加成 %
  sectMods: Mods
  rootMult: number
  stageBonus: Mods // 问道长阶里程碑永久加成
}

export interface Derived {
  stats: Stats
  procs: Proc[]
  active: string[]
  cultMult: number
  power: number
}

export function calcPower(s: Stats, activeCount: number): number {
  let p = s.atk * 10 + s.def * 6 + s.hp * 0.9 + s.spd * 6
  p *= 1 + (s.crit + s.critDmg + s.combo) / 150 + s.lifesteal / 80 + s.dmgReduce / 120 + s.armorPen / 150 + s.dmgP / 120
    + (s.stun + s.counter) / 250
    + (s.dodge || 0) / 250 + (s.execute || 0) / 180
    + (s.resistStun + s.resistCrit + s.resistCombo + s.resistCounter + s.resistLifesteal) / 600
    + ((s.dmgBoost || 0) + (s.healBoost || 0) + (s.beastBoost || 0)) / 220
    + ((s.healCut || 0) + (s.beastCut || 0)) / 280
    // 第23批：补齐原先不计入战力的词条（闪避/命中/斩杀/道韵/劫火/护盾/吞噬/反伤/冷却/灵气回复），与评分口径对齐
    + (s.shield || 0) / 250 + (s.devour || 0) / 250 + (s.reflect || 0) / 300 + (s.cdr || 0) / 300 + (s.qiRegen || 0) / 300 + (s.hit || 0) / 400
    + (s.daoyun || 0) / 80 + (s.kalpaFire || 0) / 130
  p *= 1 + activeCount * 0.04
  return Math.round(p)
}

export function derive(ctx: DeriveCtx): Derived {
  const s = emptyStats()
  const lv = lvIndex(ctx.major, ctx.phase, ctx.minor)
  s.hp = baseHp(lv)
  s.atk = baseAtk(lv)
  s.def = baseDef(lv)
  s.spd = 10 + lv * 0.4

  const A = ctx.attrs
  s.hp *= 1 + (A.genGu || 0) * 0.015
  s.def *= 1 + (A.genGu || 0) * 0.01
  s.atk *= 1 + (A.shenShi || 0) * 0.012
  // 悟性影响修为（在 cultMult 中体现）

  // —— 装备 ——
  const cnt: Record<string, number> = {}
  let topCount = 0
  const topSet = new Set<string>()
  for (const e of ctx.equipped) {
    const em = 1 + (e.enh || 0) * 0.05 // 装备强化：词条效果 +5%/级
    for (const a of e.affixes) {
      cnt[a.k] = (cnt[a.k] || 0) + 1
      if (a.tier === 3) { topCount++; topSet.add(a.k) }
      const av = a.v * em
      switch (a.k) {
        case 'atk': s.atk += av; break
        case 'def': s.def += av; break
        case 'hp': s.hp += av; break
        case 'spd': s.spd += av; break
        case 'crit': s.crit += av; break
        case 'combo': s.combo += av; break
        case 'dodge': s.dodge += av; break
        case 'hit': s.hit += av; break
        case 'critDmg': s.critDmg += av; break
        case 'lifesteal': s.lifesteal += av; break
        case 'reflect': s.reflect += av; break
        case 'armorPen': s.armorPen += av; break
        case 'shieldPow': s.shield += av; break
        case 'dmgReduce': s.dmgReduce += av; break
        case 'qiRegen': s.qiRegen += av; break
        case 'cdr': s.cdr += av; break
        case 'execute': s.execute += av; break
        case 'daoyun': s.daoyun += av; break
        case 'kalpaFire': s.kalpaFire += av; break
        case 'devour': s.devour += av; break
        case 'reincarnate': s.reviveExtra += Math.round(av); break
        case 'stun': s.stun += av; break
        case 'counter': s.counter += av; break
        case 'resistStun': s.resistStun += av; break
        case 'resistCrit': s.resistCrit += av; break
        case 'resistCombo': s.resistCombo += av; break
        case 'resistCounter': s.resistCounter += av; break
        case 'resistLifesteal': s.resistLifesteal += av; break
        case 'dmgBoost': s.dmgBoost += av; break
        case 'healBoost': s.healBoost += av; break
        case 'healCut': s.healCut += av; break
        case 'beastBoost': s.beastBoost += av; break
        case 'beastCut': s.beastCut += av; break
      }
    }
    if (e.rune) {
      const r = RUNES.find(x => x.id === e.rune)
      if (r) applyMods(s, r.mods)
    }
  }
  s.reviveCount += Math.round(s.reviveExtra)

  // —— 功法 ——
  let cultP = 0
  const procs: Proc[] = []
  for (const t of ctx.techniques) {
    const def = TECH_MAP[t.id]
    if (!def) continue
    const scale = 1 + 0.08 * (t.level - 1)
    if (def.mods) {
      applyMods(s, def.mods, scale)
      cultP += (def.mods.cultP || 0) * scale
    }
    if (def.procs) for (const p of def.procs) procs.push({ ...p, chance: Math.min(1, p.chance * scale) })
  }

  // —— 灵兽 ——
  if (ctx.beast) {
    const bd = BEAST_MAP[ctx.beast.name.replace(/^[幼小灰白灵玄幽天仙造圣混沌鸿蒙]+/, '')] || BEAST_KINDS.find(b => ctx.beast!.name.includes(b.n))
    if (bd) {
      const stage = ctx.beast.stage || 0
      const growth = ctx.beast.growth ?? 1
      const scale = (1 + (ctx.beast.q - 1) * 0.06) * (1 + (ctx.beast.level - 1) * 0.05) * (1 + stage * 0.2) * (1 + s.beastBonus / 100) * growth
      if (bd.mods) applyMods(s, bd.mods, scale)
      if (bd.procs) for (const p of bd.procs) procs.push({ ...p, src: 'pet', chance: Math.min(1, p.chance * Math.min(2, scale)) })
      // 随机资质：攻击/防御/气血/速度 资质各 +0.12%/点
      const q = ctx.beast.qual
      if (q) {
        applyMods(s, {
          atkP: q.atk * 0.12, defP: q.def * 0.12, hpP: q.hp * 0.12, spdP: q.spd * 0.1,
        })
      }
      // 阶位解锁助战技
      for (let i = 0; i < stage && i < BEAST_STAGE_SKILLS.length; i++) {
        const sk = BEAST_STAGE_SKILLS[i]
        procs.push({ ...sk, src: 'pet', chance: Math.min(1, sk.chance * Math.min(2, scale)) })
      }
    }
  }

  // —— 法宝 ——
  const tq: number[] = []
  for (const t of ctx.treasures) {
    const def = TREASURE_MAP[t.name] || TREASURE_MAP[ctx.treasures.find(x => x.id === t.id) ? t.name : '']
    const realDef = TREASURE_MAP[t.name]
    void def
    if (!realDef) continue
    tq.push(t.q)
    const scale = (1 + (t.level - 1) * 0.06) * (1 + (t.stars - 1) * 0.12) * (1 + s.treasureBonus / 100)
    if (realDef.mods) applyMods(s, realDef.mods, scale)
    if (realDef.procs) for (const p of realDef.procs) procs.push({ ...p, chance: Math.min(1, p.chance * Math.min(2, scale)) })
  }
  for (const combo of TREASURE_COMBOS) {
    if (ctx.treasures.some(t => t.name === TREASURE_MAP[combo.ids[0]]?.n) && ctx.treasures.some(t => t.name === TREASURE_MAP[combo.ids[1]]?.n)) {
      applyMods(s, combo.mods)
      procs.push({ id: 'combo_' + combo.n, name: combo.n, trigger: 'start', chance: 1, desc: combo.desc, eff: { t: 'heal', pct: 0 } })
    }
  }
  if (ctx.treasures.length >= 3 && new Set(tq).size === 1) {
    applyMods(s, { allP: 20 })
    procs.push({ id: 'sancai', name: '三才共鸣', trigger: 'start', chance: 1, desc: '三件同品质法宝，全属性+20%', eff: { t: 'heal', pct: 0 } })
  }

  // —— 精怪（出战位被动加成 + 战斗技自动触发） ——
  for (const f of ctx.fams) {
    const fd = FAM_MAP[f.fid]
    if (!fd) continue
    const fsc = famScale(f.level, f.stars)
    if (fd.mods) applyMods(s, fd.mods, fsc)
    if (fd.proc) {
      const pf = 1 + (Math.min(2, fsc) - 1) * 0.5 // 战斗技强度随等级/星级温和成长
      procs.push({
        ...fd.proc,
        chance: Math.min(0.85, fd.proc.chance * Math.min(1.5, fsc)),
        eff: scaleProcEff(fd.proc.eff, pf),
      })
    }
  }

  // —— 收集达成加成（图鉴收集永久增益） ——
  for (const cid of ctx.collects) {
    const cd = COLLECT_MAP[cid]
    if (cd) applyMods(s, cd.mods)
  }

  // —— 体质 ——
  const phy = PHYSIQUES.find(p => p.n === ctx.physique)
  if (phy) {
    applyMods(s, phy.mods)
    cultP += phy.mods.cultP || 0
  }

  // —— 先天气运 ——
  for (const tid of ctx.traits) {
    const td = TRAIT_MAP[tid]
    if (!td) continue
    applyMods(s, td.mods)
    cultP += td.mods.cultP || 0
  }

  // —— 宗门被动 ——
  if (ctx.sect) applyMods(s, ctx.sectMods)

  // —— 问道长阶里程碑（永久） ——
  applyMods(s, ctx.stageBonus)

  // —— 共鸣 ——
  const resCtx: ResCtx = {
    cnt, topCount, distinctTop: topSet.size,
    equipped: ctx.equipped,
    elems: new Set(ctx.equipped.flatMap(e => e.elements)),
    flavor: ctx.equipped.reduce<Record<string, number>>((acc, e) => {
      e.flavors.forEach(f => { acc[f] = (acc[f] || 0) + 1 })
      return acc
    }, {}),
    tags: ctx.equipped.reduce<Record<string, number>>((acc, e) => {
      ;(e.tags || []).forEach(t => { acc[t] = (acc[t] || 0) + 1 })
      return acc
    }, {}),
    sect: ctx.sect,
    yeLi: ctx.attrs.yeLi || 0,
    gongDe: ctx.attrs.gongDe || 0,
    hasBeast: !!ctx.beast,
    hasTreasure: ctx.treasures.length > 0,
  }
  const active: string[] = []
  for (const r of RESONANCES) {
    if (r.check(resCtx)) {
      active.push(r.id)
      r.apply(s, procs, resCtx)
    }
  }

  // 兜底：气血至少 1
  s.hp = Math.max(1, Math.round(s.hp))
  s.atk = Math.max(1, Math.round(s.atk))
  s.def = Math.max(0, Math.round(s.def))

  // 悟性已由 cultRate 计算一次。
  const cultMult = ctx.rootMult * (1 + (cultP + ctx.caveCultP + ctx.buffCultP) / 100)
  const power = calcPower(s, active.length)
  return { stats: s, procs, active, cultMult, power }
}

// 交易/掉落物品时重算评分（与战力口径一致）
export function refreshScore(e: Equip): void {
  e.score = scoreEquip(e)
}

// ===== 装备强化 =====
export const ENH_MAX = 15
export const ENH_STEP = 5 // 每级词条效果 +5%
export function salvageLingshi(e: Equip): number { return Math.max(5, Math.round(e.score * 0.2)) }
export function enhanceCost(e: Equip): { lingshi: number; lingmai: number } {
  const enh = e.enh || 0
  return { lingshi: Math.round(e.score * 0.06 * Math.pow(1.25, enh)), lingmai: 3 + enh * 2 }
}
