// ===== 长生劫 · 全局类型定义 =====

export type SlotKey = 'weapon' | 'armor' | 'helm' | 'wrist' | 'belt' | 'boots'

export interface AffixRoll {
  k: string // 词条 key（如 攻击/暴击率）
  tier: 1 | 2 | 3
  v: number // 数值
}

export interface Equip {
  id: number
  slot: SlotKey
  q: number // 品质 1..16
  stars: number // 星级 1..5
  base: string
  prefix: string | null
  name: string
  affixes: AffixRoll[]
  rune?: string // 灵纹 id
  selfMined: boolean // 自己挖出（未交易过）
  enchanted: boolean // 是否洗练过
  elements: string[] // 五行标签
  flavors: string[] // 流派标签（剑类/雷系/冰系/火系/炼体/魔系/仙系）
  tags?: string[] // 铭纹标签（品质10+携带，如 flame/frost/thunder…，铭纹之间可共鸣）
  score: number
  level: number // 产出时境界级别
  enh?: number // 强化等级 0..15（词条效果 +5%/级）
  locks?: number[] // 洗练锁定的词条索引（锁定后重铸消耗更高，但该词条不变）
}

export interface Stats {
  hp: number; atk: number; def: number; spd: number
  crit: number; critDmg: number; combo: number; dodge: number; hit: number
  lifesteal: number; reflect: number; armorPen: number; dmgReduce: number; shield: number
  qiRegen: number; cdr: number
  execute: number; daoyun: number; kalpaFire: number; devour: number; reviveExtra: number
  // 共鸣/功法派生
  dmgP: number; vsBossP: number; vsLowP: number; firstHitP: number
  ignoreDefP: number; critTrue: number; immuneChance: number
  startShieldPct: number; killHealPct: number; regenPct: number; losePerHitPct: number
  reviveCount: number; revivePct: number; tribBonus: number
  // 控制与反制（参考寻道大千）
  stun: number // 击晕率
  counter: number // 反击率
  resistStun: number // 抗击晕
  resistCrit: number // 抗暴击
  resistCombo: number // 抗连击
  resistCounter: number // 抗反击
  resistLifesteal: number // 抗吸血
  // 挖掘 / 生活类加成
  dropLuck: number // 出货率 %（影响品质权重与星级）
  starFloor: number // 星级保底（>0 时至少该星）
  pillBonus: number // 丹药效果 %
  treasureBonus: number // 法宝效果 %
  beastBonus: number // 灵兽效果 %
}

// 通用加成片段（功体/功法/灵纹/体质 等）
export interface Mods {
  allP?: number; atkP?: number; defP?: number; hpP?: number; spdP?: number; cultP?: number
  critAdd?: number; critDmgAdd?: number; comboAdd?: number; dodgeAdd?: number; hitAdd?: number
  lifestealAdd?: number; reflectAdd?: number; armorPenAdd?: number; dmgReduceAdd?: number
  qiRegenAdd?: number; cdrAdd?: number; dmgP?: number
  dropLuck?: number; starFloor?: number; pillBonus?: number; treasureBonus?: number; beastBonus?: number
  stunAdd?: number; counterAdd?: number; resistAllAdd?: number
}

export type Eff =
  | { t: 'dmg'; mult: number }
  | { t: 'true'; mult: number }
  | { t: 'heal'; pct: number }
  | { t: 'shield'; pct: number }
  | { t: 'dot'; pct: number; rounds: number; name: string }
  | { t: 'stun'; rounds: number }
  | { t: 'atkBuff'; pct: number; rounds: number }
  | { t: 'defDown'; pct: number; rounds: number }
  | { t: 'immune' }
  | { t: 'revive'; pct: number }
  | { t: 'extraHit'; mult: number }
  | { t: 'lord' } // 无相：随机顶级词条
  | { t: 'selfHp'; pct: number } // 自损/自愈（正为回血，负为扣血）

export interface Proc {
  id: string
  name: string
  trigger: 'start' | 'attack' | 'crit' | 'hit' | 'kill' | 'round' | 'lowhp' | 'firstHit'
  chance: number // 0..1
  desc: string
  eff: Eff
  once?: boolean
  bossOnly?: boolean
}

export interface LogLine { t: string; c?: string }

export interface Combatant {
  name: string
  stats: Stats
  procs: Proc[]
  hp: number
  isPlayer?: boolean
}

export interface BattleResult {
  log: LogLine[]
  win: 'a' | 'b' | 'draw'
  aHpPct: number
  bHpPct: number
  aHpLeft: number // 战后剩余血量（原始值，供伤害结算用）
  bHpLeft: number
}

export interface Beast {
  id: number
  name: string
  kind: string // 种类（火鸦/冰狐…）
  q: number
  level: number
  exp: number
  stage?: number // 阶位 0..4（幼年/成长/成熟/统领/太古），每阶属性+20%并解锁助战技
  qual?: { atk: number; def: number; hp: number; spd: number } // 随机资质（40~100，喂同种灵兽提升）
  growth?: number // 成长率 0.9~1.25（天生随机，吞食同类微增）
}

export interface Familiar {
  id: number
  fid: string // 精怪定义 id
  level: number // 1..30
  stars: number // 1..5
}

export interface Treasure {
  id: number
  name: string
  q: number
  level: number
  stars: number
}

export interface Technique {
  id: string
  level: number // 熟练度等级 1..10
}

export interface Plot {
  idx: number
  seed: string
  at: number
  ready: number
}

export interface Npc {
  id: number
  real: string // 本名（如 李沧澜）
  name: string // 道号（如 青云散人）
  sect: string
  align: '正' | '魔' | '中'
  flavor: string
  level: number
  growth: number // 隐藏修炼速度系数
  favor: number
  hate: number
  rel: 'none' | 'rival' | 'friend' | 'lover' | 'master' | 'disciple' | 'enemy'
  mateAt: number // 最近互动时间（道侣维系）
  power?: number
}

export interface StallItem {
  kind: 'equip' | 'pill' | 'material' | 'fragment' | 'egg' | 'page' | 'res'
  payload: unknown
  price: number
  haggled: 0 | 1 | 2 // 0 未议价 1 失败 2 成功
}

export interface Stall { id: number; name: string; items: StallItem[] }

export interface AuctionLot {
  payload: unknown
  kind: string
  name: string
  q: number
  price: number // 当前价
  npcMax: number // NPC 心理价
  sold: boolean
  shill: number // 托儿抬价次数
}

export interface ConsignListing {
  id: number
  payload: unknown
  kind: string
  name: string
  q: number
  price: number
  mine: boolean // 玩家寄售
}

export interface BarterOffer {
  id: number
  wantDesc: string
  wantCount: number
  wantFilter: { type: 'equip'; minQ?: number; slot?: SlotKey } | { type: 'material'; id: string }
  giveDesc: string
  give: { kind: string; payload: unknown }
  done: boolean
}

export interface ModalReq { kind: string; data?: unknown }

export interface WorldLine { t: string; at: number }
