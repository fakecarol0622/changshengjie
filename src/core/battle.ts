// ===== 回合制文字战斗模拟 =====
import type { BattleResult, Combatant, Eff, LogLine, Proc, Stats } from '../types'
import { fmt } from './format'
import { chance, pick, rf, rnd } from './rng'
import { baseAtk, baseDef, baseHp } from '../data/realms'
import { emptyStats } from './equip'

interface SideState {
  c: Combatant
  s: Stats
  hp: number
  shield: number
  stun: number
  buffAtk: { pct: number; rounds: number }[]
  dot: { pct: number; rounds: number; name: string; from: number }[]
  defDown: number
  defDownRounds: number
  reviveLeft: number
  lowHpTriggered: boolean
  firstHitDone: boolean
}

function mkSide(c: Combatant): SideState {
  const s = { ...c.stats }
  const st: SideState = {
    c, s, hp: s.hp, shield: 0, stun: 0, buffAtk: [], dot: [],
    defDown: 0, defDownRounds: 0, reviveLeft: s.reviveCount, lowHpTriggered: false, firstHitDone: false,
  }
  if (s.startShieldPct > 0) {
    st.shield = Math.round(s.hp * s.startShieldPct / 100 * (1 + s.shield / 100))
  }
  return st
}

function atkOf(st: SideState): number {
  let a = st.s.atk
  for (const b of st.buffAtk) a *= 1 + b.pct / 100
  return a
}

function applyEff(src: SideState, dst: SideState, eff: Eff, log: LogLine[], procName: string) {
  switch (eff.t) {
    case 'dmg': {
      const dmg = Math.round(atkOf(src) * eff.mult)
      hitDirect(dst, dmg, log)
      log.push({ t: `  ${procName}：造成 ${fmt(dmg)} 伤害`, c: 'l-proc' })
      break
    }
    case 'true': {
      const dmg = Math.round(atkOf(src) * eff.mult)
      hitDirect(dst, dmg, log, true)
      log.push({ t: `  ${procName}：真实伤害 ${fmt(dmg)}`, c: 'l-crit' })
      break
    }
    case 'heal': {
      const amt = Math.round(src.s.hp * eff.pct / 100)
      src.hp = Math.min(src.s.hp, src.hp + amt)
      log.push({ t: `  ${procName}：回复 ${fmt(amt)} 气血`, c: 'l-heal' })
      break
    }
    case 'selfHp': {
      if (eff.pct >= 0) {
        if (chance(0.5)) {
          const amt = Math.round(src.s.hp * eff.pct / 100)
          src.hp = Math.min(src.s.hp, src.hp + amt)
          log.push({ t: `  ${procName}：阴阳相济，回复 ${fmt(amt)} 气血`, c: 'l-heal' })
        } else {
          const amt = Math.round(src.s.hp * eff.pct / 100)
          src.hp -= amt
          log.push({ t: `  ${procName}：阴阳反噬，损失 ${fmt(amt)} 气血`, c: 'l-bad' })
        }
      } else {
        const amt = Math.round(src.s.hp * Math.abs(eff.pct) / 100)
        src.hp -= amt
        log.push({ t: `  ${procName}`, c: 'l-bad' })
      }
      break
    }
    case 'shield': {
      const amt = Math.round(src.s.hp * eff.pct / 100 * (1 + src.s.shield / 100))
      src.shield += amt
      log.push({ t: `  ${procName}：获得 ${fmt(amt)} 护盾`, c: 'l-proc' })
      break
    }
    case 'dot': {
      const amt = Math.round(atkOf(src) * eff.pct)
      dst.dot.push({ pct: 0, rounds: eff.rounds, name: eff.name, from: amt })
      log.push({ t: `  ${procName}：${eff.name}缠身（${eff.rounds}回合，每回合${fmt(amt)}）`, c: 'l-proc' })
      break
    }
    case 'stun': {
      // 抗击晕：概率直接抵抗禁锢
      if (dst.s.resistStun > 0 && chance(Math.min(0.6, dst.s.resistStun / 120))) {
        log.push({ t: `  ${procName}：${dst.c.name} 道基稳固，抵抗了禁锢`, c: 'l-sys' })
        break
      }
      dst.stun = Math.max(dst.stun, eff.rounds)
      log.push({ t: `  ${procName}：${dst.c.name} 被禁锢，无法行动！`, c: 'l-proc' })
      break
    }
    case 'atkBuff': {
      src.buffAtk.push({ pct: eff.pct, rounds: eff.rounds })
      log.push({ t: `  ${procName}：攻击提升 ${eff.pct}%`, c: 'l-proc' })
      break
    }
    case 'defDown': {
      dst.defDown = Math.max(dst.defDown, eff.pct)
      dst.defDownRounds = Math.max(dst.defDownRounds, eff.rounds)
      log.push({ t: `  ${procName}：${dst.c.name} 防御崩解 ${eff.pct}%`, c: 'l-proc' })
      break
    }
    case 'immune': {
      log.push({ t: `  ${procName}：万法不侵`, c: 'l-proc' })
      break
    }
    case 'revive': {
      src.reviveLeft += 1
      src.s.revivePct = Math.max(src.s.revivePct, eff.pct)
      log.push({ t: `  ${procName}：一线生机傍身`, c: 'l-proc' })
      break
    }
    case 'extraHit': {
      const dmg = Math.round(atkOf(src) * eff.mult)
      hitDirect(dst, dmg, log)
      log.push({ t: `  ${procName}：追伤 ${fmt(dmg)}`, c: 'l-proc' })
      break
    }
    case 'lord': {
      const roll = Math.floor(rnd() * 5)
      if (roll === 0) applyEff(src, dst, { t: 'true', mult: 0.8 }, log, `${procName}·道韵`)
      else if (roll === 1) applyEff(src, dst, { t: 'heal', pct: 6 }, log, `${procName}·轮回`)
      else if (roll === 2) applyEff(src, dst, { t: 'dot', pct: 0.5, rounds: 2, name: '劫火', from: 0 } as Eff, log, `${procName}·劫火`)
      else if (roll === 3) applyEff(src, dst, { t: 'shield', pct: 8 }, log, `${procName}·吞噬`)
      else applyEff(src, dst, { t: 'dmg', mult: 1.2 }, log, `${procName}·斩杀`)
      break
    }
  }
}

function hitDirect(dst: SideState, dmg: number, log: LogLine[], trueDmg = false) {
  let remain = dmg
  if (!trueDmg && dst.shield > 0) {
    const absorbed = Math.min(dst.shield, remain)
    dst.shield -= absorbed
    remain -= absorbed
    if (absorbed > 0) log.push({ t: `  护盾抵消 ${fmt(absorbed)} 伤害`, c: 'l-sys' })
  }
  dst.hp -= remain
}

export function simulate(a: Combatant, b: Combatant, opts: { boss?: boolean; maxRounds?: number } = {}): BattleResult {
  const log: LogLine[] = []
  const A = mkSide(a)
  const B = mkSide(b)
  const maxR = opts.maxRounds ?? 40
  log.push({ t: `【${a.name}】 对阵 【${b.name}】`, c: 'l-sys' })

  const runProcs = (st: SideState, enemy: SideState, trigger: Proc['trigger']) => {
    for (const p of st.c.procs) {
      if (p.trigger !== trigger) continue
      if (p.bossOnly && !opts.boss) continue
      const ch = Math.min(1, p.chance * (1 + st.s.cdr / 100))
      if (trigger !== 'start' && trigger !== 'round' && !chance(ch)) continue
      if (trigger === 'round' && !chance(ch)) continue
      if (trigger === 'start' && !chance(ch)) continue
      applyEff(st, enemy, p.eff, log, `「${p.name}」`)
    }
  }

  runProcs(A, B, 'start')
  runProcs(B, A, 'start')

  const hit = (atk: SideState, def: SideState, nested = false): boolean => {
    // 命中/闪避
    const effDodge = Math.max(0, def.s.dodge - atk.s.hit * 0.5)
    if (chance(Math.min(0.6, effDodge / 100))) {
      log.push({ t: `${def.c.name} 身形一晃，避开了攻击`, c: 'l-sys' })
      return false
    }
    // 暴击（受抗暴击抵消）
    const effCrit = Math.max(0, atk.s.crit - def.s.resistCrit)
    const isCrit = chance(Math.min(0.75, effCrit / 100))
    let dmg = atkOf(atk)
    // 首击加成
    if (!atk.firstHitDone && atk.s.firstHitP > 0) dmg *= 1 + atk.s.firstHitP / 100
    atk.firstHitDone = true
    // 暴击
    if (isCrit) dmg *= 1.5 + atk.s.critDmg / 100
    // 连击（受抗连击抵消）
    let combo = false
    const effCombo = Math.max(0, atk.s.combo - def.s.resistCombo)
    if (chance(Math.min(0.6, effCombo / 100))) { dmg *= 1.5; combo = true }
    // 斩杀/对低血/BOSS
    let tag = ''
    if (def.hp / def.s.hp < 0.35 && atk.s.execute > 0) { dmg *= 1 + atk.s.execute / 100; tag += '·斩杀' }
    if (def.hp / def.s.hp < 0.3 && atk.s.vsLowP > 0) dmg *= 1 + atk.s.vsLowP / 100
    if (opts.boss && atk.s.vsBossP > 0 && def.c.name === b.name) dmg *= 1 + atk.s.vsBossP / 100
    // 防御减伤
    let defEff = def.s.def
    if (atk.s.armorPen > 0) defEff *= Math.max(0.2, 1 - atk.s.armorPen / 200)
    if (atk.s.ignoreDefP > 0) defEff *= 1 - atk.s.ignoreDefP / 100
    if (def.defDownRounds > 0) defEff *= 1 - def.defDown / 100
    const mitig = Math.min(0.75, defEff / (defEff + atkOf(atk) * 2.2 + 80))
    dmg *= 1 - mitig
    // 伤害减免
    dmg *= 1 - Math.min(0.8, def.s.dmgReduce / 100)
    dmg *= 1 + atk.s.dmgP / 100
    // 完全免疫
    if (def.s.immuneChance > 0 && chance(def.s.immuneChance / 100)) {
      log.push({ t: `「龟息·御」${def.c.name} 完全免疫了这次伤害`, c: 'l-proc' })
      return true
    }
    const isTrue = isCrit && atk.s.critTrue > 0 && chance(atk.s.critTrue / 100)
    const final = Math.max(1, Math.round(dmg))
    hitDirect(def, final, log, isTrue)
    log.push({
      t: `${atk.c.name} 出手${combo ? '（连击！）' : ''}，对 ${def.c.name} 造成 ${fmt(final)} 伤害${isCrit ? '（暴击！）' : ''}${tag}${isTrue ? '（真实伤害）' : ''}`,
      c: isCrit ? 'l-crit' : 'l-dmg',
    })
    // 吸血（受抗吸血减免）
    if (atk.s.lifesteal > 0) {
      const lsRes = Math.min(0.8, def.s.resistLifesteal / 100)
      const heal = Math.round(final * Math.min(0.6, atk.s.lifesteal / 100) * (1 - lsRes))
      atk.hp = Math.min(atk.s.hp, atk.hp + heal)
      if (heal > 0) log.push({ t: `${atk.c.name} 汲取气血 ${fmt(heal)}`, c: 'l-heal' })
    }
    // 道韵真伤
    if (atk.s.daoyun > 0) {
      const dy = Math.round(atkOf(atk) * atk.s.daoyun / 100)
      hitDirect(def, dy, log, true)
      log.push({ t: `道韵流转，追加真伤 ${fmt(dy)}`, c: 'l-proc' })
    }
    // 劫火附伤
    if (atk.s.kalpaFire > 0 && chance(0.5)) {
      const kf = Math.round(atkOf(atk) * atk.s.kalpaFire / 100)
      hitDirect(def, kf, log, true)
      log.push({ t: `劫火焚烧，追加 ${fmt(kf)} 真实伤害`, c: 'l-proc' })
    }
    // 吞噬化盾
    if (atk.s.devour > 0) {
      atk.shield += Math.round(final * atk.s.devour / 100 * (1 + atk.s.shield / 100))
    }
    // 反伤
    if (def.s.reflect > 0) {
      const rfDmg = Math.round(final * Math.min(1, def.s.reflect / 100))
      atk.hp -= rfDmg
      log.push({ t: `${def.c.name} 反震 ${fmt(rfDmg)} 伤害`, c: 'l-proc' })
    }
    // 暴击触发
    if (isCrit) runProcs(atk, def, 'crit')
    runProcs(atk, def, 'attack')
    runProcs(def, atk, 'hit')
    // 反击（受击者反击；反击不连锁触发反击/击晕）
    if (!nested && def.hp > 0) {
      const effCounter = Math.max(0, def.s.counter - atk.s.resistCounter)
      if (effCounter > 0 && chance(Math.min(0.45, effCounter / 100))) {
        log.push({ t: `${def.c.name} 拨开来势，趁隙反击！`, c: 'l-proc' })
        hit(def, atk, true)
      }
    }
    // 击晕（受抗击晕抵消；仅主动出击可震慑）
    if (!nested && def.hp > 0) {
      const effStun = Math.max(0, atk.s.stun - def.s.resistStun)
      if (effStun > 0 && chance(Math.min(0.45, effStun / 100))) {
        def.stun = Math.max(def.stun, 1)
        log.push({ t: `「震慑」${atk.c.name} 气机锁定 ${def.c.name}，下回合无法行动！`, c: 'l-proc' })
      }
    }
    return true
  }

  const checkDeath = (st: SideState): boolean => {
    if (st.hp > 0) return false
    if (st.reviveLeft > 0) {
      st.reviveLeft--
      const pct = st.s.revivePct > 0 ? st.s.revivePct : 50
      st.hp = Math.round(st.s.hp * pct / 100)
      log.push({ t: `☯ ${st.c.name} 于死境中复活（${pct}%气血）！`, c: 'l-rainbow' })
      return false
    }
    return true
  }

  let round = 1
  let winner: 'a' | 'b' | 'draw' = 'draw'
  const aFirst = A.s.spd + rf(-1, 1) >= B.s.spd
  outer: for (round = 1; round <= maxR; round++) {
    log.push({ t: `—— 第 ${round} 回合 ——`, c: 'l-sys' })
    const order = aFirst ? [A, B] : [B, A]
    for (const st of order) {
      const enemy = st === A ? B : A
      if (st.hp <= 0) continue
      if (st.stun > 0) {
        st.stun--
        log.push({ t: `${st.c.name} 被禁锢，无法行动`, c: 'l-sys' })
        continue
      }
      hit(st, enemy)
      if (hit === null) break
      if (checkDeath(enemy)) {
        winner = st === A ? 'a' : 'b'
        // 击杀特效
        const killer = st
        if (killer.s.killHealPct > 0) {
          const heal = Math.round(killer.s.hp * killer.s.killHealPct / 100)
          const before = killer.hp
          killer.hp = Math.min(killer.s.hp, killer.hp + heal)
          const real = killer.hp - before
          if (real > 0) log.push({ t: `${killer.c.name} 吞噬生命，回复 ${fmt(real)} 气血`, c: 'l-heal' })
          if (killer.hp >= killer.s.hp && heal - real > 0) killer.shield += Math.round((heal - real) * (1 + killer.s.shield / 100))
        }
        runProcs(st, enemy, 'kill')
        log.push({ t: `${enemy.c.name} 气血归零，${st.c.name} 获胜！`, c: 'l-crit' })
        break outer
      }
    }
    // 回合结算：DoT、回复、buff 衰减
    for (const st of [A, B]) {
      const enemy = st === A ? B : A
      for (const d of st.dot) {
        if (d.rounds > 0) {
          st.hp -= d.from
          log.push({ t: `${st.c.name} 受到${d.name}侵蚀 ${fmt(d.from)} 伤害`, c: 'l-bad' })
          d.rounds--
        }
      }
      st.dot = st.dot.filter(d => d.rounds > 0)
      if (st.s.regenPct > 0) {
        const heal = Math.round(st.s.hp * st.s.regenPct / 100)
        if (st.hp < st.s.hp) {
          st.hp = Math.min(st.s.hp, st.hp + heal)
          log.push({ t: `${st.c.name} 生生不息，回复 ${fmt(heal)} 气血`, c: 'l-heal' })
        }
      }
      if (st.s.qiRegen > 0) {
        const heal = Math.round(st.s.hp * st.s.qiRegen * 0.004)
        if (st.hp < st.s.hp) st.hp = Math.min(st.s.hp, st.hp + heal)
      }
      st.buffAtk = st.buffAtk.filter(b => --b.rounds > 0)
      if (st.defDownRounds > 0) st.defDownRounds--
      // 低血触发
      if (!st.lowHpTriggered && st.hp > 0 && st.hp / st.s.hp < 0.3) {
        st.lowHpTriggered = true
        runProcs(st, enemy, 'lowhp')
      }
      checkDeath(st)
      if (st.hp <= 0) {
        winner = st === A ? 'b' : 'a'
        break outer
      }
    }
    runProcs(A, B, 'round')
    runProcs(B, A, 'round')
    if (checkDeath(A)) { winner = 'b'; break }
    if (checkDeath(B)) { winner = 'a'; break }
  }
  if (winner === 'draw') log.push({ t: '大战三百回合，未分胜负……', c: 'l-sys' })
  return {
    log,
    win: winner,
    aHpPct: Math.max(0, Math.round(A.hp / A.s.hp * 100)),
    bHpPct: Math.max(0, Math.round(B.hp / B.s.hp * 100)),
    aHpLeft: Math.max(0, Math.round(A.hp)),
    bHpLeft: Math.max(0, Math.round(B.hp)),
  }
}

// ===== 敌人构造 =====
export function makeEnemy(lv: number, mult: number, name: string, opts: { boss?: boolean; proc?: boolean } = {}): Combatant {
  const s = emptyStats()
  const boss = !!opts.boss
  s.hp = Math.round(baseHp(lv) * mult * (boss ? 2.4 : 1))
  s.atk = Math.round(baseAtk(lv) * mult * (boss ? 1.35 : 1) * rf(0.9, 1.15))
  s.def = Math.round(baseDef(lv) * mult * rf(0.85, 1.2))
  s.spd = 10 + lv * 0.4
  s.crit = 8 + lv * 0.15
  s.dmgReduce = 5 + lv * 0.1
  // BOSS 具备一定抗性（抗击晕/抗暴击/抗连击/抗反击/抗吸血）
  if (boss) { s.resistStun = 15; s.resistCrit = 8; s.resistCombo = 8; s.resistCounter = 5; s.resistLifesteal = 10 }
  const procs: Proc[] = []
  if (opts.proc !== false && chance(0.55 + (boss ? 0.3 : 0))) {
    const pool: Proc[] = [
      { id: 'e1', name: '凶戾一击', trigger: 'attack', chance: 0.25, desc: '', eff: { t: 'dmg', mult: 0.5 } },
      { id: 'e2', name: '血口撕咬', trigger: 'attack', chance: 0.2, desc: '', eff: { t: 'dot', pct: 0.3, rounds: 3, name: '撕裂' } },
      { id: 'e3', name: '妖气冲撞', trigger: 'attack', chance: 0.18, desc: '', eff: { t: 'stun', rounds: 1 } },
      { id: 'e4', name: '浊气护体', trigger: 'start', chance: 1, desc: '', eff: { t: 'shield', pct: 15 } },
      { id: 'e5', name: '血煞淬体', trigger: 'attack', chance: 0.2, desc: '', eff: { t: 'atkBuff', pct: 20, rounds: 3 } },
    ]
    procs.push(pick(pool))
    if (boss) procs.push(pick(pool))
  }
  return { name, stats: s, procs, hp: s.hp }
}

// 由 NPC 构造战斗对象
export function npcCombatant(name: string, level: number, mult = 1): Combatant {
  return makeEnemy(level, mult, name, { proc: true })
}
