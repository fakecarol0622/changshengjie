// ===== 20 种核心共鸣 + 6 种宗门共鸣（第18批：仅保留高级共鸣）=====
// 旧的“基础属性堆叠型/双属性组合型”共鸣已废止（太易达成且强度过高）；
// 新增 M 铭纹共鸣：品质 10+ 装备自带铭纹（炎/寒/雷/风/岩/幽/星/龙），铭纹之间互相共鸣。
import type { Eff, Equip, Proc, Stats } from '../types'

export interface ResCtx {
  cnt: Record<string, number> // 词条 key → 装备件数计数
  topCount: number // 顶级词条总条目数
  distinctTop: number // 不同顶级词条种类数
  equipped: Equip[]
  elems: Set<string>
  flavor: Record<string, number>
  tags: Record<string, number> // 铭纹 id → 装备件数计数
  sect: string
  yeLi: number
  gongDe: number
  hasBeast: boolean
  hasTreasure: boolean
}

export interface ResDef {
  id: string
  name: string
  cls: 'M' | 'E' | '宗'
  req: string
  desc: string
  check: (c: ResCtx) => boolean
  apply: (s: Stats, procs: Proc[], c: ResCtx) => void
}

const P = (id: string, name: string, trigger: Proc['trigger'], chance: number, eff: Eff, desc: string, once = false): Proc =>
  ({ id, name, trigger, chance, eff, desc, once })

const mul = (s: Stats, f: number) => { s.atk *= f; s.def *= f; s.hp *= f }

export const RESONANCES: ResDef[] = [
  // ===== M 类 · 铭纹共鸣（品质10+装备携带铭纹，同纹 3 件或双纹各 2 件触发）=====
  {
    id: 'm_thunder', name: '震雷·鸣', cls: 'M', req: '铭·雷 ≥3件',
    desc: '连击率+8%，攻击12%概率降下惊雷（击晕1回合）',
    check: c => (c.tags['thunder'] || 0) >= 3,
    apply: (s, pr) => {
      s.combo += 8
      pr.push(P('res_mthunder', '震雷·鸣', 'attack', 0.12, { t: 'stun', rounds: 1 }, '惊雷降下，目标麻痹'))
    },
  },
  {
    id: 'm_wind', name: '御风·行', cls: 'M', req: '铭·风 ≥3件',
    desc: '闪避+8%，速度+15%',
    check: c => (c.tags['wind'] || 0) >= 3,
    apply: s => { s.dodge += 8; s.spd *= 1.15 },
  },
  {
    id: 'm_flame', name: '焚炎·灼', cls: 'M', req: '铭·炎 ≥3件',
    desc: '劫火+8%，攻击15%概率附加灼烧（3回合）',
    check: c => (c.tags['flame'] || 0) >= 3,
    apply: (s, pr) => {
      s.kalpaFire += 8
      pr.push(P('res_mflame', '焚炎·灼', 'attack', 0.15, { t: 'dot', pct: 0.4, rounds: 3, name: '灼烧' }, '烈焰缠身，持续灼烧'))
    },
  },
  {
    id: 'm_frost', name: '玄冰·封', cls: 'M', req: '铭·寒 ≥3件',
    desc: '攻击12%概率冻结（击晕1回合），20%概率冰裂破防-20%',
    check: c => (c.tags['frost'] || 0) >= 3,
    apply: (s, pr) => {
      pr.push(P('res_mfrost', '玄冰·封', 'attack', 0.12, { t: 'stun', rounds: 1 }, '寒霜冻结目标'))
      pr.push(P('res_mfrost2', '玄冰·封(破防)', 'attack', 0.2, { t: 'defDown', pct: 20, rounds: 2 }, '坚冰崩裂，目标防御受损'))
    },
  },
  {
    id: 'm_stone', name: '磐岩·镇', cls: 'M', req: '铭·岩 ≥3件',
    desc: '防御+25%，反震+15%',
    check: c => (c.tags['stone'] || 0) >= 3,
    apply: s => { s.def *= 1.25; s.reflect += 15 },
  },
  {
    id: 'm_shadow', name: '幽影·噬', cls: 'M', req: '铭·幽 ≥3件',
    desc: '吸血+12%，对残血目标伤害+20%',
    check: c => (c.tags['shadow'] || 0) >= 3,
    apply: s => { s.lifesteal += 12; s.vsLowP += 20 },
  },
  {
    id: 'm_star', name: '星辉·耀', cls: 'M', req: '铭·星 ≥3件',
    desc: '暴击伤害+25%，道韵+6',
    check: c => (c.tags['star'] || 0) >= 3,
    apply: s => { s.critDmg += 25; s.daoyun += 6 },
  },
  {
    id: 'm_dragon', name: '龙威·压', cls: 'M', req: '铭·龙 ≥3件（稀有）',
    desc: '全属性+18%，击晕率+3%',
    check: c => (c.tags['dragon'] || 0) >= 3,
    apply: s => { mul(s, 1.18); s.stun += 3 },
  },
  // —— 双纹交辉：两种铭纹各≥2件 ——
  {
    id: 'm_thunder_wind', name: '风雷·引', cls: 'M', req: '铭·雷 ≥2 + 铭·风 ≥2',
    desc: '连击率+10%，攻击18%概率追加风刃（80%攻击）',
    check: c => (c.tags['thunder'] || 0) >= 2 && (c.tags['wind'] || 0) >= 2,
    apply: (s, pr) => {
      s.combo += 10
      pr.push(P('res_mtw', '风雷·引', 'attack', 0.18, { t: 'extraHit', mult: 0.8 }, '风雷相济，追加一击'))
    },
  },
  {
    id: 'm_flame_star', name: '星炎·燎', cls: 'M', req: '铭·炎 ≥2 + 铭·星 ≥2',
    desc: '劫火+10%，暴击伤害+20%',
    check: c => (c.tags['flame'] || 0) >= 2 && (c.tags['star'] || 0) >= 2,
    apply: s => { s.kalpaFire += 10; s.critDmg += 20 },
  },
  {
    id: 'm_frost_shadow', name: '寒幽·锁', cls: 'M', req: '铭·寒 ≥2 + 铭·幽 ≥2',
    desc: '吸血+10%，攻击10%概率冰锁目标（击晕1回合）',
    check: c => (c.tags['frost'] || 0) >= 2 && (c.tags['shadow'] || 0) >= 2,
    apply: (s, pr) => {
      s.lifesteal += 10
      pr.push(P('res_mfs', '寒幽·锁', 'attack', 0.1, { t: 'stun', rounds: 1 }, '寒幽锁魂，目标僵滞'))
    },
  },
  {
    id: 'm_stone_dragon', name: '山龙·峙', cls: 'M', req: '铭·岩 ≥2 + 铭·龙 ≥2',
    desc: '全属性+15%，反震+25%，伤害减免+8%',
    check: c => (c.tags['stone'] || 0) >= 2 && (c.tags['dragon'] || 0) >= 2,
    apply: s => { mul(s, 1.15); s.reflect += 25; s.dmgReduce += 8 },
  },
  {
    id: 'm_wind_shadow', name: '魅影·随', cls: 'M', req: '铭·风 ≥2 + 铭·幽 ≥2',
    desc: '闪避+10%，反击率+8%',
    check: c => (c.tags['wind'] || 0) >= 2 && (c.tags['shadow'] || 0) >= 2,
    apply: s => { s.dodge += 10; s.counter += 8 },
  },
  // ===== E 类 · 隐藏/彩蛋型 =====
  {
    id: 'hundun', name: '混沌·源', cls: 'E', req: '五行（金木水火土）各≥1',
    desc: '全属性+50%，免疫五行克制',
    check: c => ['金', '木', '水', '火', '土'].every(e => c.elems.has(e)),
    apply: s => { mul(s, 1.5); s.dmgP += 10 },
  },
  {
    id: 'yinyang', name: '阴阳·衡', cls: 'E', req: '仙系≥2 + 魔系≥2',
    desc: '伤害+50%，每回合随机损失或回复气血（天机难测）',
    check: c => (c.flavor['仙系'] || 0) >= 2 && (c.flavor['魔系'] || 0) >= 2,
    apply: (s, pr) => {
      s.dmgP += 50
      pr.push(P('res_yinyang', '阴阳·衡', 'round', 0.6, { t: 'selfHp', pct: 3 }, '阴阳流转，福祸相依'))
    },
  },
  {
    id: 'lunhui_zhu', name: '轮回·主', cls: 'E', req: '轮回≥3 + 气血≥6',
    desc: '每场战斗可复活2次',
    check: c => (c.cnt['reincarnate'] || 0) >= 3 && (c.cnt['hp'] || 0) >= 6,
    apply: s => { s.reviveCount += 2; s.revivePct = Math.max(s.revivePct, 50) },
  },
  {
    id: 'tiandao_qin', name: '天道·勤', cls: 'E', req: '全身装备皆为摇得且未洗练',
    desc: '全属性+30%，摇落出货率+15%',
    check: c => c.equipped.length >= 6 && c.equipped.every(e => e.selfMined && !e.enchanted),
    apply: s => { mul(s, 1.3); s.dropLuck += 15 },
  },
  {
    id: 'sanxiu_hun', name: '散修·魂', cls: 'E', req: '全身品质≤地品(4) 且星级≥4',
    desc: '全属性+35%，摇落必出高星',
    check: c => c.equipped.length >= 1 && c.equipped.every(e => e.q <= 4 && e.stars >= 4),
    apply: s => { mul(s, 1.35); s.starFloor = Math.max(s.starFloor, 4) },
  },
  {
    id: 'wanfa', name: '万法·一', cls: 'E', req: '集齐5种顶级词条',
    desc: '万法归一，全属性+40%',
    check: c => c.distinctTop >= 5,
    apply: s => mul(s, 1.4),
  },
  {
    id: 'gudu', name: '孤独·败', cls: 'E', req: '不装备灵兽与法宝',
    desc: '孑然一身，战力+60%',
    check: c => !c.hasBeast && !c.hasTreasure,
    apply: s => { s.dmgP += 60 },
  },
  // ===== 宗门专属共鸣 =====
  {
    id: 'zong_jian', name: '剑宗·锋', cls: '宗', req: '剑类≥3 + 青霄剑宗',
    desc: '攻击+25%，概率额外一剑',
    check: c => c.sect === '青霄剑宗' && (c.flavor['剑类'] || 0) >= 3,
    apply: (s, pr) => {
      s.atk *= 1.25
      pr.push(P('res_zongjian', '剑宗·锋', 'attack', 0.25, { t: 'extraHit', mult: 0.9 }, '宗门剑诀，剑气纵横'))
    },
  },
  {
    id: 'zong_dan', name: '丹道·恒', cls: '宗', req: '灵气回复≥3 + 丹霞谷',
    desc: '每回合回3%，丹药效果+30%',
    check: c => c.sect === '丹霞谷' && (c.cnt['qiRegen'] || 0) >= 3,
    apply: s => { s.regenPct += 3; s.pillBonus += 30 },
  },
  {
    id: 'zong_qi', name: '器道·固', cls: '宗', req: '护盾≥3 + 天工阁',
    desc: '护盾+40%，法宝效果+25%',
    check: c => c.sect === '天工阁' && (c.cnt['shieldPow'] || 0) >= 3,
    apply: s => { s.shield += 40; s.treasureBonus += 25 },
  },
  {
    id: 'zong_shou', name: '兽道·伴', cls: '宗', req: '出战灵兽 + 万兽山',
    desc: '灵兽伤害+50%，冷却-20%',
    check: c => c.sect === '万兽山' && c.hasBeast,
    apply: s => { s.beastBonus += 50; s.cdr += 20 },
  },
  {
    id: 'zong_mo', name: '魔道·噬', cls: '宗', req: '吸血≥3 + 幽冥宗',
    desc: '吸血+50%，击杀回复10%气血',
    check: c => c.sect === '幽冥宗' && (c.cnt['lifesteal'] || 0) >= 3,
    apply: s => { s.lifesteal *= 1.5; s.killHealPct += 10 },
  },
  {
    id: 'zong_zhen', name: '阵道·御', cls: '宗', req: '减伤≥3 + 太虚观',
    desc: '减伤+20%，开局获得阵法护盾',
    check: c => c.sect === '太虚观' && (c.cnt['dmgReduce'] || 0) >= 3,
    apply: s => { s.dmgReduce += 20; s.startShieldPct += 15 },
  },
]

export const RES_MAP: Record<string, ResDef> = Object.fromEntries(RESONANCES.map(r => [r.id, r]))
export const CORE_RES = RESONANCES.filter(r => r.cls !== '宗')
export const SECT_RES = RESONANCES.filter(r => r.cls === '宗')
