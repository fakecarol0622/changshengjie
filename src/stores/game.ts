// ===== 长生劫 · 主状态中枢 =====
import { defineStore } from 'pinia'
import type {
  AuctionLot, BattleResult, Beast, BarterOffer, Combatant, ConsignListing, Equip, Familiar, LogLine,
  ModalReq, Npc, Plot, SlotKey, Stall, StallItem, Technique, Treasure, WorldLine,
} from '../types'
import { chance, getSeed, pick, pickN, rf, ri, rnd, setSeed, setUidSeq, shuffle, uid, weighted } from '../core/rng'
import { clamp, fmt, fmtTime } from '../core/format'
import { sfx, setAudio, setMusic } from '../core/sfx'
import { calcPower, derive, emptyStats, genEquip, refreshScore, rollQuality, ENH_MAX, enhanceCost, type DeriveCtx, type Derived } from '../core/equip'
import { makeEnemy, simulate } from '../core/battle'
import { growNpcs, makeNpcs, makeRival, npcPower, npcRealm, rivalName } from '../core/npc'
import { AFFIX_MAP, PREFIX_SEGS, QUALITIES, RUNE_MAP, SLOTS, SLOT_NAMES, affixPoolFor, qName } from '../data/qualities'
import { MAJOR, VEIN_MAX, baseHp, breakChance, cultRate, cultReq, idleLingmai, idleLingshi, lvIndex, mineEquipLevel, realmName, veinDigCost, veinDigReq, veinFalloff, veinLingmaiP, veinLuck, veinQRange, veinTier, veinUpCost, veinUpTime } from '../data/realms'
import { BEAST_KINDS, BEAST_MAP, BEAST_STAGES, BEAST_STAGE_SKILLS, MATERIALS, MAT_MAP, PILL_MAP, PILL_QMULT, PILL_QNAMES, RECIPES, RECIPE_MAP, SEEDS, SEED_MAP, TECH_MAP, TECHNIQUES, TECH_TIERS, TREASURE_MAP, TREASURES, beastName } from '../data/items'
import { ACTIVITIES, CYCLE_DAYS, DUNGEONS, DIFFS, ENCOUNTERS, ENC_NAMES, PHYS_CHANCE, PHYSIQUES, SPIRIT_ROOTS, WORLD_MSGS, activeActivity, chaosOpen, cycleIndex, type ActivityDef } from '../data/world'
import { EVT_TYPES, eventFor, type EvtDef, type EvtType } from '../data/events'
import { RANKS, SECTS, SECT_DAILY_TASKS, SECT_MAP, SECT_SHOP, SECT_WEEKLY_TASKS } from '../data/sects'
import { MONTH_DAYS, RES_LABEL, XY_DYN, XY_SKUS, monthReward, newbieReward, realmGift, PAY_PACKS, type RewardItem } from '../data/rewards'
import { NPC_DEFS } from '../data/npcs'
import { TITLES, TITLE_RARITY, type TitleDef } from '../data/titles'
import { FAM_MAP, FAM_RARITY, catchRoll } from '../data/familiars'
import { GACHA_COST_10, GACHA_COST_1, GACHA_PITY, rollGacha, type GachaResult } from '../data/gacha'
import { COLLECTS, GOALS, MONTH_CARD, ONLINE_REWARDS, PASS_MAX, PASS_XP_PER, PVP_SHOP, PVP_TIERS, passFree, passPrem, passSeason, pvpRank, pvpTierIdx, weekSettle } from '../data/meta'
import { ALL_STORY, STORY_MAP, storyAtStage, storyChapterReady, type StoryChapter, type StoryCtx } from '../data/mainstory'
import { STAGE_MAX, stageBonus, stageEnemy, stageRewards, stageSeg } from '../data/stages'
import { GIFTS, GIFT_MAP, giftFavor, npcLikes } from '../data/gifts'
import { rollTraits } from '../data/traits'
import { pushRecord, loadAccount, type AccountData } from '../core/account'
import { REDEEM_CODES } from '../data/codes'
import { RESONANCES, CORE_RES, RES_MAP } from '../data/resonances'
import { TAG_LABEL, rollEquipTags } from '../data/tags'
import { YAO_TRAITS, yaoName, yaoTraitIdx, yaoNpcJitter, yaoTierOf, YAO_NPC_K } from '../data/yaowang'
import { TOWER_BUFF_MAP, rollTowerOffer } from '../data/towerbuffs'

const SAVE_KEY = 'changshengjie_v1'
const DAY = 86400000
const WEEK = DAY * 3 // 压缩周（3 真实天）
const MAX_INV = 240
const OFFLINE_CAP = 12 * 3600

// 镇妖塔：关序 ↔ 层/关 换算（每层十关，关十为层妖王）
const tLayerOf = (f: number) => Math.ceil(f / 10)
const tStageOf = (f: number) => ((f - 1) % 10) + 1

// 妖王殿：NPC 单日伤害榜（确定性：同一天稳定，可预览也可结算）
function yaoNpcBoard(npcs: Npc[], dayKey: number): { n: string; dmg: number }[] {
  return [...npcs]
    .sort((a, b) => npcPower(b) - npcPower(a))
    .map(n => ({ n: n.name, dmg: Math.max(1, Math.round(npcPower(n) * YAO_NPC_K * yaoNpcJitter(n.id, dayKey))) }))
}

const DEMON_SCENES = [
  { text: '心魔化作当年被你夺宝而死的散修，血泪满面地质问你：「还我命来！」', options: [{ l: '堂堂正正，坦承己过', d: 6, t: '你直面罪业，心魔如烟消散。' }, { l: '嗤之以鼻，弱肉强食', d: -6, y: 5, t: '你以魔念碾碎心魔，道心却蒙上阴影。' }] },
  { text: '心魔幻作你抛弃的旧人，轻声问：「你修道，是为了什么？」', options: [{ l: '为护所爱，为证大道', d: 8, t: '道心澄澈，心魔消散。' }, { l: '长生而已，何须多言', d: -3, t: '心魔冷笑而去，你隐隐不安。' }] },
  { text: '心魔显出你未来渡劫失败、形神俱灭的景象，嘲讽道：「修什么道？不过是自寻死路！」', options: [{ l: '道之所在，虽千万劫吾往矣', d: 10, t: '大勇无惧，心魔退散！' }, { l: '迟疑动摇', d: -10, t: '道心动摇，心魔趁虚而入，气血紊乱。' }] },
  { text: '心魔是你自己的影子，问：「杀了那么多人，你可曾后悔？」', options: [{ l: '剑下无愧，皆为道争', d: 4, y: 2, t: '你斩断犹疑，剑心通明。' }, { l: '沉默良久', d: -2, t: '心魔叹息而去，留下淡淡的怅然。' }] },
  { text: '心魔化作师尊模样，厉声道：「你背叛师门，罪该万死！」', options: [{ l: '跪地叩首，长跪不起', d: 8, y: -3, t: '心诚则灵，师尊虚影化作清风。' }, { l: '拂袖而起，师徒缘尽', d: -8, y: 6, t: '你斩断最后的羁绊，魔念愈发深重。' }] },
]

// 每日任务定义
export const DAILY_TASKS = [
  { k: 'mine', l: '挖掘灵脉 5 次', target: 5, pt: 10 },
  { k: 'dungeon', l: '通关副本 3 次', target: 3, pt: 10 },
  { k: 'sweep', l: '扫荡 1 次', target: 1, pt: 5 },
  { k: 'feed', l: '培养灵兽 1 次', target: 1, pt: 5 },
  { k: 'reforge', l: '洗练装备 1 次', target: 1, pt: 10 },
  { k: 'pvp', l: '论道台对决 1 次', target: 1, pt: 15 },
  { k: 'online', l: '在线 30 分钟', target: 1800, pt: 10 },
  { k: 'meditate', l: '打坐冥想 1 次', target: 1, pt: 5 },
]

interface TribState {
  bolts: number
  cur: number
  hpPct: number
  log: LogLine[]
  treasureUses: number
  dujieLeft: number
  arrayUsed: boolean
  companionUsed: boolean
  sectUsed: boolean
  done: boolean
  success: boolean
  awaiting: boolean
}

interface DemonState { scene: number; done: boolean; result: string }

// 共鸣溯源表：告诉玩家每条共鸣由哪些词条/流派/品质装备/铭纹产生
const RES_TRACK: Record<string, { keys?: string[]; flav?: string; qmin?: number; special?: string; tag?: string; tags?: string[] }> = {
  m_thunder: { tag: 'thunder' }, m_wind: { tag: 'wind' }, m_flame: { tag: 'flame' }, m_frost: { tag: 'frost' },
  m_stone: { tag: 'stone' }, m_shadow: { tag: 'shadow' }, m_star: { tag: 'star' }, m_dragon: { tag: 'dragon' },
  m_thunder_wind: { tags: ['thunder', 'wind'] }, m_flame_star: { tags: ['flame', 'star'] },
  m_frost_shadow: { tags: ['frost', 'shadow'] }, m_stone_dragon: { tags: ['stone', 'dragon'] },
  m_wind_shadow: { tags: ['wind', 'shadow'] },
  hundun: { special: '需五行（金木水火土）各≥1（装备五行标签）' },
  yinyang: { special: '需仙系≥2 且魔系≥2' },
  lunhui_zhu: { keys: ['reincarnate', 'hp'] },
  tiandao_qin: { special: '全身自挖且未洗练（洗练或购买会破坏）' },
  sanxiu_hun: { special: '全身品质≤4 且星级≥4' },
  wanfa: { special: '6 件不同顶级词条' }, gudu: { special: '不装备灵兽与法宝' },
  zong_jian: { flav: '剑类' }, zong_dan: { keys: ['qiRegen'] }, zong_qi: { keys: ['shieldPow'] },
  zong_shou: { special: '出战灵兽即可' }, zong_mo: { keys: ['lifesteal'] }, zong_zhen: { keys: ['dmgReduce'] },
}

interface EncState { id: string; resolved: string; options: { label: string; resText: string; done: boolean }[] }

// NPC 日常叙话（战力更高则「请教」，更低则「指点」）
const ASK_LINES = [
  '「道无高下，心有明暗。你卡的从来不是境界，是那口咽不下的气。」',
  '「剑要养，心更要养。一个急字，头上是把刀。」',
  '「劫来之前先问自己：怕的是雷，还是没了退路？」',
  '「修行如登山，莫看山顶，看脚下三步。」',
  '「机缘是借的，因果是要还的。出手前想清楚拿什么还。」',
]
const TEACH_LINES = [
  '你点破他卡了半年的关隘，他怔了半晌，长揖到地。',
  '你以自身经历解他之惑，他眼中迷雾散了大半。',
  '你把压箱底的一句心得说与他听，他反复咀嚼，忽而抚掌大笑。',
  '你随手演练一遍拿手招法，他看得目不转睛，连称受教。',
  '你为他梳理经脉关窍，他凝滞的气机豁然贯通。',
]

interface BattleView { title: string; log: LogLine[]; win: boolean; rewards: string[] }

// 初始道基随机掷点（每点影响：根骨血量/防御，神识攻击，悟性修炼，气运掉落，道心突破，魅力议价）
function rollAttrs() {
  return {
    genGu: ri(3, 8), wuXing: ri(3, 8), shenShi: ri(3, 8), qiYun: ri(3, 8),
    daoXin: ri(4, 9), meiLi: ri(3, 8), yeLi: 0, jieQi: 0, gongDe: 0,
  }
}

// 初始灵根（不含转世加成，开局展示用）
function bootRoot() {
  const r = weighted(SPIRIT_ROOTS.map(s => ({ w: s.w, v: s })))
  const els = pickN(['金', '木', '水', '火', '土'], r.elems)
  const label = r.elems === 5 ? r.n : els.join('') + r.n
  return { root: { n: label, mult: r.mult, desc: r.desc }, elems: els }
}

// 灵兽随机资质
function rollBeastQual(q: number) {
  const base = Math.min(88, 36 + q * 3)
  const r1 = () => clamp(base + ri(-10, 14), 30, 100)
  return { atk: r1(), def: r1(), hp: r1(), spd: r1() }
}

export const useGame = defineStore('game', {
  state: () => {
    const br = bootRoot()
    return {
    version: 1,
    seed: (Date.now() >>> 0),
    lastTick: Date.now(),
    lastSave: Date.now(),
    name: '无名散修',
    realName: '' as string,
    started: false,
    root: br.root,
    rootElems: br.elems as string[],
    physique: null as string | null,
    align: '正' as '正' | '魔' | '中',
    attrs: rollAttrs(),
    major: 0,
    phase: 0,
    minor: 0,
    cultivation: 0,
    injured: 0,
    res: { lingshi: 300, lingmai: 12, xianyu: 0, xilian: 0, gongming: 0, qihun: 0, jianling: 0, xingyun: 0, auction: 1, sweep: 1, contrib: 0, xianwu: 0, pvpTicket: 3, gaiming: 0, gachaTicket: 5 },
    mats: {} as Record<string, number>,
    pills: {} as Record<string, number>,
    eggs: [] as { id: number; q: number }[],
    inventory: [] as Equip[],
    equipped: {} as Partial<Record<SlotKey, number>>,
    // 分身系统（化神期解锁）：本体 / 阳神 / 阴身，各自独立装备栏与共鸣
    clones: {
      active: 'main' as 'main' | 'yang' | 'yin',
      yangOpen: false,
      yinOpen: false,
      yangEquip: {} as Partial<Record<SlotKey, number>>,
      yinEquip: {} as Partial<Record<SlotKey, number>>,
    },
    beasts: [] as Beast[],
    beastActive: null as number | null,
    treasures: [] as Treasure[],
    treasureEquipped: [] as number[],
    treasureSlots: 3,
    techs: [] as Technique[],
    equippedTechs: [] as string[],
    equippedSkills: [] as string[],
    sect: '',
    sectRank: 0,
    sectRankAt: 0, // 当前职位上任日（任期门槛）
    sectTasks: { daily: [] as number[], weekly: -1, lastDaily: 0, lastWeekly: 0, dailyDone: [] as boolean[], weeklyDone: false },
    cave: { level: 1, cult: 0, alchemy: 0, forge: 0, field: 0, spring: 0 },
    plots: [] as Plot[],
    springAcc: 0,
    julingUntil: 0,
    meditateUntil: 0,
    mine: { depth: 0, auto: false, pulls: {} as Record<string, number>, pity100: {} as Record<string, number>, pity500: {} as Record<string, number>, recent: [] as Equip[], purpleCnt: {} as Record<string, number> },
    // 烛龙脉：单线升级（疏通=时间+灵石，upgUntil 为完成时间戳，0=未在疏通）
    vein: { lv: 1, upgUntil: 0, digs: 0 },
    npcs: makeNpcs() as Npc[],
    daily: { day: 0, monthCount: 0, newbieDay: 0, realmGifts: [] as number[], daySigned: false, makeup: 3, giftTaken: false, chestTaken: false, progress: {} as Record<string, number>, taskClaimed: [] as boolean[] },
    xyu: { counts: {} as Record<string, number> },
    travel: { n: 10, rec: Date.now() },
    titles: { owned: [] as string[], eq: null as string | null },
    fam: { list: [] as Familiar[], equipped: [] as number[], catches: 0, seen: [] as string[], dupes: {} as Record<string, number> },
    gacha: { stdPity: 0, limPity: 0, total: 0, legends: 0, freeDay: 0 },
    shop: { first: [] as string[], total: 0, monthUntil: 0, monthClaimDay: 0 },
    online: { sec: 0, day: 0, got: [] as number[] },
    goals: { done: [] as string[] },
    collect: { done: [] as string[] },
    pass: { season: passSeason(), xp: 0, freeGot: [] as number[], premGot: [] as number[], premium: false },
    pvpShop: { week: 0, counts: {} as Record<string, number> },
    shuangxiuUntil: 0,
    sxDay: 0,
    npcEvtCd: 90,
    lastOffline: { cult: 0, ls: 0, lm: 0 },
    traits: rollTraits(),
    story: { done: [] as string[] },
    codesUsed: [] as string[],
    stage: { cleared: 0 },
    pvp: { points: 0, wins: 0, losses: 0 },
    npcDaily: { day: 0, gift: {} as Record<number, number>, teach: {} as Record<number, number>, chat: {} as Record<number, number> },
    tower: { floor: 1, best: 1, swept: 0, buffs: [] as string[], offer: null as null | { layer: number; ids: string[] }, dailyCounts: {} as Record<string, number>, weeklyCounts: {} as Record<string, number>, dayKey: 0, weekKey: 0, cleared: {} as Record<string, boolean> },
    // 妖王殿（世界妖王 · 伤害榜）：dmg=今日累计伤害，last=昨日结算结果
    yao: { dayKey: 0, used: 0, dmg: 0, last: null as null | { rank: number; total: number; summary: string } },
    market: {
      dayKey: 0, stalls: [] as Stall[], consign: [] as ConsignListing[],
      myConsign: [] as ConsignListing[], barter: [] as BarterOffer[],
      auctionKey: -1, lots: [] as AuctionLot[], auctionDone: false,
      bmKey: 0, bmGoods: [] as { kind: string; payload: unknown; price: number; fake: boolean; name: string }[],
    },
    codex: { items: {} as Record<string, Equip>, prefixes: [] as string[], resSeen: [] as string[], maxRealm: 0, deaths: 0, pulls: 0, bestScore: 0, treasuresSeen: [] as string[] },
    reinc: { count: 0, points: 0 },
    ascended: false,
    sectWarKey: -1,
    world: [] as WorldLine[],
    log: [] as LogLine[],
    toasts: [] as { id: number; t: string; c?: string }[],
    modals: [] as ModalReq[],
    battle: null as BattleView | null,
    trib: null as TribState | null,
    demon: null as DemonState | null,
    enc: null as EncState | null,
    fx: { flash: 0, burst: 0, shake: 0 },
    settings: { audio: true, fx: true, music: true },
    worldTimer: 0,
    playSec: 0,
    lastAutoMine: 0,
    // 手动挖掘进度（不落盘）：未完成时显示进度，完成后退回产出供玩家查看
    mineBusy: null as null | { t0: number; dur: number; count: number; cost: number; done: boolean; eqs: Equip[] },
    chaosDoneKey: -1,
    dead: false,
    tab: 'cultivate',
    socialTab: 'rank',
    // 限时活动状态：key = 周期:N 段 id，切换即重置
    evt: { key: '', coins: {} as Record<string, number>, counts: {} as Record<string, number>, claimed: [] as string[], bought: {} as Record<string, number> },
    ver: 3,
    }
  },

  getters: {
    myName(): string { return this.name },
    lv(): number { return lvIndex(this.major, this.phase, this.minor) },
    realmText(): string { return realmName(this.major, this.phase, this.minor) },
    nextReq(): number {
      return cultReq(this.lv)
    },
    // 装备等级基准：与主角等级同步（1..460 标尺）
    eqLvBase(): number {
      return Math.max(1, this.lv)
    },
    equippedItems(): Equip[] {
      const out: Equip[] = []
      const map = this.equipMap
      for (const s of SLOTS) {
        const id = map[s]
        if (id != null) {
          const it = this.inventory.find(e => e.id === id)
          if (it) out.push(it)
        }
      }
      return out
    },
    // 当前出战分身的装备栏（本体 / 阳神 / 阴身）
    equipMap(): Partial<Record<SlotKey, number>> {
      if (this.clones.active === 'yang' && this.clones.yangOpen) return this.clones.yangEquip
      if (this.clones.active === 'yin' && this.clones.yinOpen) return this.clones.yinEquip
      return this.equipped
    },
    activeBodyName(): string {
      return this.clones.active === 'yang' ? '阳神' : this.clones.active === 'yin' ? '阴身' : '本体'
    },
    // 全部分身身上的装备 id（禁止出售/分解/寄售/熔炼）
    wornByAll(): Set<number> {
      const s = new Set<number>()
      for (const m of [this.equipped, this.clones.yangEquip, this.clones.yinEquip]) {
        for (const v of Object.values(m)) if (v != null) s.add(v)
      }
      return s
    },
    beast(): Beast | null {
      if (this.beastActive == null) return null
      return this.beasts.find(b => b.id === this.beastActive) || null
    },
    derived(): Derived {
      // Pinia 类型推断限制：getter 内 this 不含 actions，这里显式取 deriveCtx
      const ctx = (this as unknown as { deriveCtx(eq: Equip[]): DeriveCtx }).deriveCtx(this.equippedItems)
      return derive(ctx)
    },
    cultPerSec(): number {
      const injury = this.injured > 0 ? 0.7 : 1
      return cultRate(this.lv, this.attrs.wuXing, this.derived.cultMult) * injury
    },
    lingshiPerSec(): number { return idleLingshi(this.lv, this.attrs.qiYun, 1 + this.cave.level * 0.1) },
    lingmaiPerSec(): number { return idleLingmai(this.lv, (1 + this.cave.level * 0.08) * (1 + veinLingmaiP(this.vein.lv) / 100)) },
    activity() { return activeActivity(Date.now()) },
    // 限时活动：当前活动线上的活动定义（与天象轮转同周期）
    currentEvt(): EvtDef | null { return eventFor((this as unknown as { activity: ActivityDef | null }).activity?.id) },
    // 限时活动实例键：周期编号 + 活动段 id（变化即重置进度）
    evtKey(): string { const a = (this as unknown as { activity: ActivityDef | null }).activity; return a ? `${(this as unknown as { cycleKey: number }).cycleKey}:${a.id}` : '' },
    // 已领取的任务 / 已购的商店条目（带活动实例前缀）
    evtCoins(): number { const e = (this as unknown as { currentEvt: EvtDef | null }).currentEvt; return e ? (this.evt.coins[e.id] || 0) : 0 },
    chaosOpen(): boolean { return chaosOpen(Date.now()) },
    dayKey(): number { return Math.floor(Date.now() / DAY) },
    weekKey(): number { return Math.floor(Date.now() / WEEK) },
    cycleKey(): number { return cycleIndex(Date.now()) },
    seasonText(): string {
      const a = activeActivity(Date.now())
      return a ? a.n : '风平浪静'
    },
    activityDesc(): string {
      const a = this.activity
      return a ? `${a.n}：${a.desc}` : '风平浪静：当前无异象，各玩法照常'
    },
    sectName(): string { return this.sect || '散修' },
    // 是否自创宗门（非六大门派之一），自创后方可延揽门人
    ownSect(): boolean { return !!this.sect && !SECTS.some(s => s.n === this.sect) },
    // 已受邀入门的门人
    sectMembers(): Npc[] { return this.npcs.filter(n => n.inSect) },
    rankName(): string { return this.sect ? RANKS[this.sectRank].n : '散修' },
    // —— 仙途纪事（主线《长生劫》正卷 + 隐藏卷） ——
    storyCtx(): StoryCtx {
      return { stage: this.stage.cleared, yeLi: this.attrs.yeLi, lovers: this.npcs.filter(n => n.rel === 'lover').length, reinc: this.reinc.count, gongDe: this.attrs.gongDe, daoXin: this.attrs.daoXin }
    },
    storyList(): StoryChapter[] { return ALL_STORY },
    storyReadyAny(): boolean {
      const list = (this as unknown as { storyList: StoryChapter[] }).storyList
      const ctx = (this as unknown as { storyCtx: StoryCtx }).storyCtx
      return list.some(c => !this.story.done.includes(c.id) && storyChapterReady(c, ctx))
    },
    // 某阶解锁的剧情章节 id（已读则空）
    storyIdAt(): (n: number) => string | null {
      const list = (this as unknown as { storyList: StoryChapter[] }).storyList
      const ctx = (this as unknown as { storyCtx: StoryCtx }).storyCtx
      const done = this.story.done
      return (n: number) => {
        const c = list.find(x => x.stage === n)
        return c && !done.includes(c.id) && storyChapterReady(c, ctx) ? c.id : null
      }
    },
    // 长阶上带「有未读剧情」标记的阶数（仅已可就绪的卷）
    storyMarkSet(): Set<number> {
      const list = (this as unknown as { storyList: StoryChapter[] }).storyList
      const ctx = (this as unknown as { storyCtx: StoryCtx }).storyCtx
      const done = this.story.done
      return new Set(list.filter(c => !done.includes(c.id) && storyChapterReady(c, ctx)).map(c => c.stage))
    },
    invCount(): number { return this.inventory.length },
    topPower(): number { return this.derived.power },
    worldTop20(): { n: string; power: number; realm: string; me: boolean }[] {
      const list = this.npcs.map(n => ({ n: n.name, power: npcPower(n), realm: npcRealm(n).name, me: false }))
      list.push({ n: this.name, power: this.derived.power, realm: this.realmText, me: true })
      list.sort((a, b) => b.power - a.power)
      return list.slice(0, 20)
    },
    myRank(): number {
      const me = this.derived.power
      let rank = 1
      for (const n of this.npcs) if (npcPower(n) > me) rank++
      return rank
    },
    travelMax(): number { return 10 + Math.min(10, this.major) },
    // —— 月卡权益（shop.monthUntil 有效期内生效） ——
    monthActive(): boolean { return this.shop.monthUntil > Date.now() },
    giftMax(): number { return 5 + (this.monthActive ? 5 : 0) },
    towerSweepMax(): number { return 1 + (this.monthActive ? 1 : 0) },
    // —— 妖王殿：世界妖王与伤害榜 ——
    yaoTriesMax(): number { return 3 + (this.monthActive ? 1 : 0) },
    yaoBoardList(): { n: string; dmg: number }[] { return yaoNpcBoard(this.npcs, this.dayKey) },
    yaoTop(): { r: number; n: string; dmg: number; me: boolean }[] {
      const list = [
        ...this.yaoBoardList.map(b => ({ n: b.n, dmg: b.dmg, me: false })),
        { n: this.name, dmg: this.yao.dmg, me: true },
      ]
      list.sort((a, b) => b.dmg - a.dmg)
      return list.map((x, i) => ({ r: i + 1, n: x.n, dmg: x.dmg, me: x.me }))
    },
    yaoRank(): number {
      const i = this.yaoTop.findIndex(x => x.me)
      return i < 0 ? this.yaoTop.length : i + 1
    },
    titleEqDef(): TitleDef | null {
      return this.titles.eq ? TITLES.find(t => t.id === this.titles.eq) || null : null
    },
    famSlots(): number { return 2 + (this.major >= 3 ? 1 : 0) + (this.major >= 6 ? 1 : 0) },
    famEquipped(): Familiar[] {
      return this.fam.equipped.map(id => this.fam.list.find(f => f.id === id)).filter((f): f is Familiar => !!f)
    },
    passLevel(): number { return Math.min(PASS_MAX, Math.floor(this.pass.xp / PASS_XP_PER)) },
    accountData(): AccountData { return loadAccount() },
    demonScene(): { text: string; options: { l: string; d: number; t: string; y?: number }[] } | null {
      if (!this.demon) return null
      return DEMON_SCENES[this.demon.scene] || null
    },
    breakChanceBase(): number {
      return breakChance(this.major, this.phase, this.minor, this.attrs.wuXing, this.attrs.daoXin, this.attrs.yeLi, this.attrs.jieQi, this.derived.stats.tribBonus)
    },
    // 灵根品阶颜色（按名字后缀匹配最长的灵根定义，稀有度越高越亮）
    rootColor(): string {
      const n = this.root?.n || ''
      let c = '#3f9e7a'
      let len = 0
      for (const s of SPIRIT_ROOTS) { if (s.n.length > len && n.endsWith(s.n)) { c = s.c; len = s.n.length } }
      return c
    },
    // 洞府·炼器房：强化灵石折扣（每级 +4%，上限 50%）
    enhanceDiscount(): number {
      return Math.min(0.5, this.cave.forge * 0.04)
    },
    // 洞府·炼器房：洗炼数值上限（每级 +2%，上限 30%）
    reforgeUp(): number {
      return 1.42 + Math.min(0.3, this.cave.forge * 0.02)
    },
    // 共鸣详情：每条共鸣的来源与进度
    resonanceInfo(): { id: string; name: string; cls: string; req: string; desc: string; active: boolean; progress: string; contributors: string[] }[] {
      const eq = this.equippedItems
      const act = this.derived.active
      const cnt: Record<string, number> = {}
      for (const e of eq) for (const a of e.affixes) cnt[a.k] = (cnt[a.k] || 0) + 1
      const flav: Record<string, number> = {}
      for (const e of eq) for (const f of e.flavors) flav[f] = (flav[f] || 0) + 1
      const tagCnt: Record<string, number> = {}
      for (const e of eq) for (const t of e.tags || []) tagCnt[t] = (tagCnt[t] || 0) + 1
      return RESONANCES.map(r => {
        const t = RES_TRACK[r.id] || {}
        let progress = r.req
        let contributors: string[] = []
        if (t.tag) {
          progress = `${TAG_LABEL(t.tag)} 装备 ${tagCnt[t.tag] || 0} 件`
          contributors = eq.filter(e => (e.tags || []).includes(t.tag!)).map(e => `${e.name}（${TAG_LABEL(t.tag!)}）`)
        } else if (t.tags) {
          progress = t.tags.map(k => `${TAG_LABEL(k)} ${tagCnt[k] || 0}`).join(' · ')
          contributors = eq.filter(e => (e.tags || []).some(k => t.tags!.includes(k))).map(e => e.name)
        } else if (t.keys) {
          progress = t.keys.map(k => `${AFFIX_MAP[k]?.n || k} ${cnt[k] || 0}`).join(' · ')
          contributors = eq.filter(e => e.affixes.some(a => t.keys!.includes(a.k))).map(e => e.name)
        } else if (t.flav) {
          progress = `${t.flav}装备 ${flav[t.flav] || 0} 件`
          contributors = eq.filter(e => e.flavors.includes(t.flav!)).map(e => e.name)
        } else if (t.qmin) {
          const n = eq.filter(e => e.q >= t.qmin!).length
          progress = `品质≥${t.qmin} 装备 ${n} 件`
          contributors = eq.filter(e => e.q >= t.qmin!).map(e => `${e.name}（${qName(e.q)}）`)
        } else if (t.special) {
          progress = t.special
        }
        return { id: r.id, name: r.name, cls: r.cls, req: r.req, desc: r.desc, active: act.includes(r.id), progress, contributors: contributors.slice(0, 8) }
      })
    },
    auctionOpen(): boolean {
      const d = (Date.now() / DAY) % CYCLE_DAYS
      return d >= 0 && d < 2.5
    },
  },

  actions: {
    // ================= 基础工具 =================
    toast(t: string, c?: string) {
      this.toasts.push({ id: uid(), t, c })
      if (this.toasts.length > 4) this.toasts.shift()
      setTimeout(() => { this.toasts = this.toasts.filter(x => x.t !== t || x.c !== c) }, 3600)
    },
    pushLog(t: string, c?: string) {
      this.log.push({ t, c })
      if (this.log.length > 80) this.log.shift()
    },
    pushWorld(t: string) {
      this.world.push({ t, at: Date.now() })
      if (this.world.length > 60) this.world.shift()
    },
    flash() { this.fx.flash++; if (this.settings.fx) {} },
    burst() { this.fx.burst++ },
    shake() { this.fx.shake++ },
    pushModal(kind: string, data?: unknown) {
      // 全局唯一弹窗：避免同类堆叠（如连续战斗）
      if (['battle', 'trib', 'demon', 'encounter', 'offline', 'death', 'ascend', 'item', 'pay', 'gacha', 'story', 'towerpick', 'dig'].includes(kind)) {
        this.modals = this.modals.filter(m => m.kind !== kind)
      }
      this.modals.push({ kind, data })
    },
    closeModal() { this.modals.shift() },
    pushBattleView(b: BattleView) { this.battle = b },

    // ================= 资源 =================
    addRes(key: string, n: number) {
      const r = this.res as Record<string, number>
      r[key] = (r[key] || 0) + n
    },
    addMat(id: string, n: number) {
      this.mats[id] = (this.mats[id] || 0) + n
    },
    addPill(id: string, q: number, n = 1) {
      const key = `${id}:${q}`
      this.pills[key] = (this.pills[key] || 0) + n
    },
    acquire(e: Equip, silent = false) {
      refreshScore(e)
      this.inventory.push(e)
      // 图鉴
      const ck = e.name
      if (!this.codex.items[ck] || this.codex.items[ck].score < e.score) this.codex.items[ck] = JSON.parse(JSON.stringify(e))
      if (e.prefix && !this.codex.prefixes.includes(e.prefix)) this.codex.prefixes.push(e.prefix)
      if (e.score > this.codex.bestScore) this.codex.bestScore = e.score
      // 背包上限：自动丢弃分最低的未装备物品
      if (this.inventory.length > MAX_INV) {
        const worn = this.wornByAll
        const sorted = [...this.inventory].sort((a, b) => a.score - b.score)
        for (const it of sorted) {
          if (this.inventory.length <= MAX_INV) break
          if (worn.has(it.id)) continue
          this.inventory = this.inventory.filter(x => x.id !== it.id)
        }
        if (!silent) this.toast('背包已满，自动清出低阶装备', 'dim')
      }
      if (!silent && e.q >= 12) { sfx.epic(); this.flash(); }
      else if (!silent && e.q >= 9) { sfx.rare(); this.burst() }
      return e
    },
    discardItem(id: number) {
      if (this.wornByAll.has(id)) { this.toast('请先卸下装备', 'red'); return }
      this.inventory = this.inventory.filter(e => e.id !== id)
    },
    discardJunk(maxQ = 4) {
      const worn = this.wornByAll
      const junk = this.inventory.filter(e => !worn.has(e.id) && e.q <= maxQ)
      if (!junk.length) { this.toast('没有符合条件的装备', 'dim'); return }
      const refund = junk.reduce((s, e) => s + Math.round(e.score * 0.2), 0)
      let gm = 0
      for (const e of junk) if (this.discardJunkDropGaiming(e)) gm++
      const ids = new Set(junk.map(e => e.id))
      this.inventory = this.inventory.filter(e => !ids.has(e.id))
      this.addRes('lingshi', refund)
      this.toast(`分解 ${junk.length} 件 ≤${maxQ} 品装备，回收灵石×${fmt(refund)}${gm ? `、改命石×${gm}` : ''}`, 'jade')
      sfx.coin()
    },
    usePill(key: string) {
      const [id, qs] = key.split(':')
      const q = Number(qs)
      if (!this.pills[key]) return
      const mult = PILL_QMULT[q]
      const pb = 1 + this.derived.stats.pillBonus / 100 // 丹药效果加成
      switch (id) {
        case 'juling': {
          const mins = Math.max(10, Math.round(30 * (mult / PILL_QMULT[3]) * pb))
          this.julingUntil = Math.max(this.julingUntil, Date.now()) + mins * 60 * 1000
          this.toast(`聚灵丹（${PILL_QNAMES[q]}）生效，修炼速度提升，效力 ${mins} 分钟`, 'jade')
          break
        }
        case 'liaoshang': this.injured = 0; this.toast('伤痛尽去，神清气爽', 'jade'); break
        case 'zengshou': {
          const amt = Math.round(this.cultPerSec * 3600 * (mult / PILL_QMULT[3]) * pb)
          this.cultivation = Math.min(this.nextReq, this.cultivation + amt)
          this.toast(`培元丹（${PILL_QNAMES[q]}）化开：获得 1 小时挂机修为 +${fmt(amt)}`, 'jade')
          break
        }
        case 'xisui': {
          this.traits = rollTraits()
          this.attrs.jieQi += 2
          this.toast('洗髓伐骨：先天气运重新觉醒 ×3（天劫值 +2）', 'gold')
          break
        }
        default: this.toast('此丹需在对应场景使用', 'dim'); return
      }
      this.pills[key]--
      if (this.pills[key] <= 0) delete this.pills[key]
      sfx.coin()
    },

    // ================= 开局 =================
    rollRoot(): { n: string; mult: number; desc: string; elems: string[] } {
      const bonus = this.reinc.count * 6 // 转世提升稀有灵根概率
      const r = weighted(SPIRIT_ROOTS.map((s, i) => ({ w: s.w + (i >= 4 ? bonus : 0), v: s })))
      const els = pickN(['金', '木', '水', '火', '土'], r.elems)
      const label = r.elems === 5 ? r.n : els.join('') + r.n
      return { n: label, mult: r.mult, desc: r.desc, elems: els }
    },
    startGame(name: string, realName = '', seedVal?: number) {
      if (seedVal && typeof seedVal === 'number') setSeed(seedVal)
      this.seed = getSeed()
      this.name = name || '无名散修'
      this.realName = realName || ''
      if (!this.traits.length) this.traits = rollTraits()
      // 沿用开局界面所展示的灵根（不再重掷，避免「进去就变了」）
      if (!this.root || !this.root.n) {
        const r = this.rollRoot()
        this.root = { n: r.n, mult: r.mult, desc: r.desc }
        this.rootElems = r.elems
      }
      if (chance(PHYS_CHANCE + this.reinc.count * 0.02)) {
        const p = weighted(PHYSIQUES.map(x => ({ w: x.w, v: x })))
        this.physique = p.n
      }
      // 初始装备
      this.acquire(genEquip(1, 1, 2, { slot: 'weapon', selfMined: true }), true)
      this.acquire(genEquip(1, 1, 2, { slot: 'armor', selfMined: true }), true)
      const [w, a] = this.inventory
      if (w) this.equipItem(w.id)
      if (a) this.equipItem(a.id)
      // 转世加成
      if (this.reinc.points > 0) {
        const keys = ['genGu', 'wuXing', 'shenShi', 'qiYun', 'daoXin', 'meiLi']
        for (let i = 0; i < Math.min(30, Math.floor(this.reinc.points / 2)); i++) {
          ;(this.attrs as unknown as Record<string, number>)[pick(keys)] += 1
        }
      }
      this.started = true
      this.lastTick = Date.now()
      this.pushWorld(`新的传说开始了：${this.name}（${this.root.n}）踏上仙途`)
      this.save()
    },
    rerollRoot() {
      const r = this.rollRoot()
      this.root = { n: r.n, mult: r.mult, desc: r.desc }
      this.rootElems = r.elems
      sfx.success()
    },
    rerollTraits() {
      this.traits = rollTraits()
      sfx.success()
    },
    rerollAttrs() {
      const r = rollAttrs()
      for (const [k, v] of Object.entries(r)) (this.attrs as unknown as Record<string, number>)[k] = v
      sfx.success()
    },

    // ================= 挂机主循环 =================
    tick(now: number) {
      if (!this.started || this.dead) { this.lastTick = now; return }
      const dt = Math.min(60, (now - this.lastTick) / 1000)
      this.lastTick = now
      if (dt <= 0) return
      this.playSec += dt
      // 修为
      const req = this.nextReq
      if (this.cultivation < req) this.cultivation = Math.min(req, this.cultivation + this.cultPerSec * dt)
      if (this.major === 10 && this.phase === 3 && this.minor === 9 && this.cultivation >= req && !this.ascended) {
        this.ascended = true
        this.pushModal('ascend')
      }
      // 灵石 / 开脉石
      this.addRes('lingshi', this.lingshiPerSec * dt)
      this.addRes('lingmai', this.lingmaiPerSec * dt)
      // 受伤恢复
      if (this.injured > 0) this.injured = Math.max(0, this.injured - dt)
      // 打坐完成
      if (this.meditateUntil > 0 && now >= this.meditateUntil) {
        this.meditateUntil = 0
        this.addTaskProgress('meditate', 1)
        this.addRes('lingmai', 10)
        this.addRes('lingshi', 2000)
        this.addRes('xianyu', 2)
        this.toast('打坐圆满，领取双倍礼包：开脉石×10、灵石×2000、仙玉×2', 'jade')
        sfx.success()
      }
      // 游历次数恢复（每 5 分钟 +1，上限随境界提升）
      const tmax = this.travelMax
      if (this.travel.n < tmax) {
        const need = 300000
        while (now - this.travel.rec >= need && this.travel.n < tmax) { this.travel.n++; this.travel.rec += need }
        if (this.travel.n >= tmax) this.travel.rec = now
      }
      // 在线奖励计时（每日重置）
      this.online.sec += dt
      // NPC 主动事件（每 100~200 秒一次，江湖更热闹）
      this.npcEvtCd -= dt
      if (this.npcEvtCd <= 0) {
        this.npcEvtCd = rf(100, 200)
        if (!this.modals.length) this.npcEvent()
      }
      // 灵泉产灵液
      if (this.cave.spring > 0) {
        this.springAcc += this.cave.spring * 0.4 * dt
        while (this.springAcc >= 1) { this.springAcc -= 1; this.addMat('lingye', 1) }
      }
      // 灵田成熟
      for (const p of this.plots) {
        if (p.seed && now >= p.ready) {
          const sd = SEED_MAP[p.seed]
          if (sd) {
            const n = ri(sd.yield[0], sd.yield[1]) * (1 + this.cave.field * 0.15)
            this.addMat(sd.herb, Math.round(n))
            if (chance(0.08)) { this.addMat('jiuye', 1); this.toast('灵田变异！收获九叶莲×1', 'gold') }
          }
          p.seed = ''
        }
      }
      // NPC 成长
      growNpcs(this.npcs, dt)
      // 世界频道
      this.worldTimer -= dt
      if (this.worldTimer <= 0) { this.worldTimer = rf(20, 45); this.genWorldMsg() }
      // 奇遇概率
      if (chance(dt / 1500) && !this.enc && this.modals.length === 0) this.rollEncounter()
      // 寄售成交判定
      this.consignTick(dt)
      // 称号 / 新手目标 / 收集奖励检查（低频）
      if (this.playSec % 3 < dt) { this.checkTitles(); this.checkGoals(); this.checkCollects() }
      // 图鉴/共鸣记录（低频）
      if (this.playSec % 5 < dt) {
        const d = this.derived
        for (const id of d.active) if (!this.codex.resSeen.includes(id)) this.codex.resSeen.push(id)
        this.codex.maxRealm = Math.max(this.codex.maxRealm, this.lv)
      }
      // 自动存档
      if (now - this.lastSave > 15000) this.save()
      // 每日刷新
      this.dailyReset()
      // 限时活动窗口检查（跨段自动重置进度）
      this.evtRoll()
      // 自动挖掘
      if (this.mine.auto && now - this.lastAutoMine > 900) {
        this.lastAutoMine = now
        if (this.res.lingmai >= veinDigCost(this.vein.lv)) this.mineAt(1, true)
        else this.mine.auto = false
      }
      // 龙脉疏通完成检查
      this.veinTick()
      // 挖掘进度结算：到时开箱并展示产物
      if (this.mineBusy && !this.mineBusy.done && now - this.mineBusy.t0 >= this.mineBusy.dur) {
        const eqs = this.mineAt(this.mineBusy.count, true)
        this.mineBusy.eqs = eqs
        this.mineBusy.done = true
        if (eqs.length) {
          const best = eqs.reduce((a, b) => (a.score > b.score ? a : b))
          if (best.q >= 12) sfx.epic()
          else if (best.q >= 9) sfx.rare()
          else sfx.success()
        }
      }
    },

    genWorldMsg() {
      if (this.npcs.length < 2) return
      const tpl = pick(WORLD_MSGS)
      const n1 = pick(this.npcs).name
      let n2 = pick(this.npcs).name
      if (n2 === n1) n2 = this.npcs[(this.npcs.findIndex(x => x.name === n1) + 1) % this.npcs.length].name
      const item = pick(['青霄剑', '玄龟盾', '赤炎珠', '混天绫', '乾坤袋', '玉净瓶'])
      const beast = pick(BEAST_KINDS).n
      const realm = pick(['炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体'])
      const age = ri(120, 900)
      const text = tpl.replace(/\{n1\}/g, n1).replace(/\{n2\}/g, n2).replace('{item}', item).replace('{beast}', beast).replace('{realm}', realm).replace('{age}', '' + age)
      this.pushWorld(text)
    },

    // ================= 烛龙脉（挖掘 + 疏通升级） =================
    veinStartUp() {
      if (this.vein.lv >= VEIN_MAX) { this.toast('烛龙脉已至圆满', 'dim'); return }
      if (this.vein.upgUntil > 0) { this.toast('龙脉正在疏通中，可用龙髓加速', 'dim'); return }
      const req = veinDigReq(this.vein.lv)
      if ((this.vein.digs || 0) < req) { this.toast(`先在本境挖掘 ${req} 次方可疏通（当前 ${this.vein.digs || 0}）`, 'red'); return }
      const cost = veinUpCost(this.vein.lv)
      if (this.res.lingshi < cost) { this.toast(`疏通需 灵石×${fmt(cost)}（持有 ${fmt(this.res.lingshi)}，还差 ${fmt(cost - this.res.lingshi)}）`, 'red'); return }
      this.res.lingshi -= cost
      this.vein.upgUntil = Date.now() + veinUpTime(this.vein.lv)
      this.toast(`开始疏通第 ${this.vein.lv + 1} 级龙脉（预计 ${fmtTime(veinUpTime(this.vein.lv))}），龙髓可加速`, 'gold')
      sfx.click()
    },
    veinAccelerate() {
      if (this.vein.upgUntil <= 0) return
      if ((this.mats.longsui || 0) < 1) { this.toast('龙髓不足（挖掘、宝箱、坊市、长阶可得）', 'red'); return }
      this.mats.longsui--
      const remain = this.vein.upgUntil - Date.now()
      if (remain <= 10 * 60000) this.veinComplete()
      else {
        this.vein.upgUntil -= 10 * 60000
        this.toast(`龙髓入脉，疏通进度缩短 10 分钟（剩余 龙髓×${this.mats.longsui}）`, 'jade')
      }
      sfx.click()
    },
    veinComplete() {
      if (this.vein.upgUntil <= 0) return
      this.vein.upgUntil = 0
      this.vein.digs = 0 // 新境从头开采
      this.vein.lv++
      const lv = this.vein.lv
      const qr = veinQRange(lv)
      this.toast(`烛龙脉疏通完成 → 第 ${lv} 级·${veinTier(lv)}！可挖品质上限提升至 ${qName(qr.max)}（装备等级随境界）`, 'gold')
      this.flash(); this.burst()
      sfx.epic()
      this.checkTitles()
    },
    veinTick() {
      if (this.vein.upgUntil > 0 && Date.now() >= this.vein.upgUntil) this.veinComplete()
    },
    mineAt(times = 1, silent = false): Equip[] {
      const lv = this.vein.lv
      const cost = veinDigCost(lv)
      const r = veinQRange(lv)
      const out: Equip[] = []
      for (let t = 0; t < times; t++) {
        if (this.res.lingmai < cost) { if (!silent) this.toast('开脉石不足', 'red'); break }
        this.res.lingmai -= cost
        this.mine.pulls['v'] = (this.mine.pulls['v'] || 0) + 1
        this.mine.pity100['v'] = (this.mine.pity100['v'] || 0) + 1
        this.mine.pity500['v'] = (this.mine.pity500['v'] || 0) + 1
        this.codex.pulls++
        this.vein.digs = (this.vein.digs || 0) + 1 // 本境挖掘计数（疏通门槛）
        this.addTaskProgress('mine', 1)
        const act = this.activity
        const luckBase = this.derived.stats.dropLuck + veinLuck(lv) + (act?.id === 'tide' ? 40 : 0)
        const falloff = veinFalloff(lv)
        // 脉力暴动
        const surgeP = 0.03 * (act?.id === 'tide' ? 2 : 1) * (1 + this.attrs.qiYun * 0.005)
        if (chance(surgeP)) {
          out.push(...this.doSuge())
          continue
        }
        // 保底
        let forceQ = 0
        let forceRune = false
        if (this.mine.pity100['v'] >= 120) { forceQ = r.max; this.mine.pity100['v'] = 0 }
        if (this.mine.pity500['v'] >= 600) { forceRune = true; this.mine.pity500['v'] = 0 }
        const q = forceQ || rollQuality(r.min, r.max, luckBase, falloff)
        const eqLv = mineEquipLevel(this.lv, luckBase) // 装备等级随主角境界（与龙脉脱钩）
        const e = genEquip(eqLv, r.min, r.max, { q, forceRune, selfMined: true })
        if (this.derived.stats.starFloor > 0 && e.stars < this.derived.stats.starFloor) e.stars = this.derived.stats.starFloor
        this.acquire(e, true)
        out.push(e)
        // 龙髓：烛龙脉的髓脂（疏通加速道具）
        if (chance(0.06)) {
          this.addMat('longsui', 1)
          if (!silent) this.pushLog('挖出一枚「龙髓」（疏通龙脉可加速）', 'jade')
        }
        // 随等级解锁的伴生产出
        this.veinSpecials(lv)
      }
      if (out.length) {
        this.mine.recent = [...out, ...this.mine.recent].slice(0, 24)
        const best = out.reduce((a, b) => (a.score > b.score ? a : b))
        if (best.q >= 12) { sfx.epic(); this.flash(); this.pushWorld(`${this.name} 挖出「${best.name}」（${qName(best.q)}），天地震动！`) }
        else if (best.q >= 9) { sfx.rare(); this.burst() }
        else if (!silent) sfx.success()
      }
      return out
    },
    doSuge(): Equip[] {
      const lv = this.vein.lv
      const r = veinQRange(lv)
      const out: Equip[] = []
      const n = ri(5, 8)
      for (let i = 0; i < n; i++) {
        const base = rollQuality(r.min, r.max, 45, veinFalloff(lv))
        const boost = i < 2 ? 1 : 0 // 至少2件品质提升一级
        const q = clamp(base + boost, 1, 16)
        const e = genEquip(mineEquipLevel(this.lv, 45), r.min, r.max, { q, selfMined: true })
        this.acquire(e, true)
        out.push(e)
      }
      const sui = ri(1, 3)
      this.addMat('longsui', sui)
      this.flash(); this.burst(); sfx.epic(); this.shake()
      this.toast(`⚡ 脉力暴动！一连炸出 ${n} 件装备，额外采得龙髓×${sui}`, 'gold')
      this.pushWorld(`⚡ 烛龙脉暴动！${this.name}在龙脉深处连获至宝！`)
      return out
    },
    veinSpecials(lv: number) {
      const act = this.activity
      const beastBoost = act?.id === 'beast' ? 2 : 1
      // 论道帖：挖龙脉有概率挖出（论道台入场券）
      if (chance(0.05)) {
        this.addRes('pvpTicket', 1)
        this.pushLog('挖出一枚「论道帖」（论道台入场券），好好收着', 'jade')
      }
      const r = rnd()
      if (lv >= 6 && r < 0.02) this.addMat('fabaoPiece', 1)
      else if (lv >= 10 && r < 0.03) this.eggs.push({ id: uid(), q: ri(1, 4) * (beastBoost > 1 ? 2 : 1) > 4 ? ri(3, 6) : ri(1, 4) })
      else if (lv >= 14 && r < 0.04) this.addMat('gongfaPage', 1)
      else if (lv >= 20 && r < 0.025) {
        const rq = veinQRange(lv)
        const e = genEquip(mineEquipLevel(this.lv), rq.min, rq.max, { forceRune: true, selfMined: true })
        this.acquire(e, true)
        this.toast(`烛龙髓海：获得灵纹装备「${e.name}」`, 'gold')
      } else if (lv >= 34 && r < 0.02) this.getTreasure(10, 12)
      else if (lv >= 44 && r < 0.015) this.getTreasure(12, 15)
    },
    setAuto(b: boolean) { this.mine.auto = b },
    // 手动挖掘：带进度条，结算后在弹窗展示产物（防止连点瞬挖）
    mineDig(count = 1) {
      if (this.mineBusy && !this.mineBusy.done) { this.toast('挖掘进行中……', 'dim'); return }
      const cost = veinDigCost(this.vein.lv) * count
      if (this.res.lingmai < cost) { this.toast(`开脉石不足（需 ${cost}）`, 'red'); return }
      this.mineBusy = { t0: Date.now(), dur: 700 + count * 130, count, cost, done: false, eqs: [] }
      this.pushModal('dig')
    },
    mineDigClaim() {
      this.mineBusy = null
      this.closeModal()
    },

    // ================= 分身系统（化神期解锁） =================
    deriveCtx(equipped: Equip[]): DeriveCtx {
      return {
        major: this.major, phase: this.phase, minor: this.minor,
        attrs: this.attrs as unknown as Record<string, number>,
        equipped,
        fams: this.famEquipped,
        collects: this.collect.done,
        traits: this.traits,
        techniques: [...this.equippedTechs, ...this.equippedSkills].map(id => this.techs.find(t => t.id === id)).filter((t): t is Technique => !!t),
        beast: this.beast,
        treasures: this.treasures.filter(t => this.treasureEquipped.includes(t.id)),
        physique: this.physique,
        sect: this.sect,
        caveCultP: this.cave.cult * 8,
        buffCultP: (this.julingUntil > Date.now() ? 40 : 0) + this.cave.spring * 4 + (this.shuangxiuUntil > Date.now() ? 30 : 0) + (this.shop.monthUntil > Date.now() ? 3 : 0),
        sectMods: (this.sect && SECT_MAP[this.sect] ? SECT_MAP[this.sect].mods : {}),
        rootMult: this.root.mult,
        stageBonus: { allP: stageBonus(this.stage.cleared) },
      }
    },
    // 某装备穿在哪个分身上（无 → null）
    wornBodyOf(id: number): 'main' | 'yang' | 'yin' | null {
      const maps: ['main' | 'yang' | 'yin', Partial<Record<SlotKey, number>>][] = [
        ['main', this.equipped], ['yang', this.clones.yangEquip], ['yin', this.clones.yinEquip],
      ]
      for (const [b, m] of maps) for (const s of SLOTS) if (m[s] === id) return b
      return null
    },
    // 某分身按当前配装的战力（纯计算，不切换出战状态）
    bodyPower(id: 'main' | 'yang' | 'yin'): number {
      if (id === this.clones.active) return this.derived.power
      const map = id === 'main' ? this.equipped : id === 'yang' ? this.clones.yangEquip : this.clones.yinEquip
      const eq: Equip[] = []
      for (const s of SLOTS) {
        const eid = map[s]
        if (eid != null) {
          const it = this.inventory.find(e => e.id === eid)
          if (it) eq.push(it)
        }
      }
      return derive(this.deriveCtx(eq)).power
    },
    openClone(id: 'yang' | 'yin') {
      if (this.major < 5) { this.toast('需化神期方可凝练分身', 'red'); return }
      if (id === 'yang') {
        if (this.clones.yangOpen) return
        if (this.res.xianyu < 300 || this.res.lingmai < 10000) { this.toast('凝练阳神需 仙玉×300 · 开脉石×10000', 'red'); return }
        this.res.xianyu -= 300
        this.res.lingmai -= 10000
        this.clones.yangOpen = true
        this.toast('阳神凝练成功！神念分化，可独立配装出战', 'gold')
      } else {
        if (this.clones.yinOpen) return
        if (!this.clones.yangOpen) { this.toast('需先凝练阳神', 'red'); return }
        if (this.res.xianyu < 600 || this.res.lingmai < 25000) { this.toast('凝练阴身需 仙玉×600 · 开脉石×25000', 'red'); return }
        this.res.xianyu -= 600
        this.res.lingmai -= 25000
        this.clones.yinOpen = true
        this.toast('阴身凝练成功！阴阳相济，战力更进一步', 'gold')
      }
      this.flash(); this.burst()
      sfx.epic()
      this.checkTitles()
    },
    setActiveBody(id: 'main' | 'yang' | 'yin') {
      if (id === 'yang' && !this.clones.yangOpen) { this.toast('尚未凝练阳神（化神期解锁）', 'red'); return }
      if (id === 'yin' && !this.clones.yinOpen) { this.toast('尚未凝练阴身', 'red'); return }
      this.clones.active = id
      this.toast(`已切换出战分身：${id === 'main' ? '本体' : id === 'yang' ? '阳神' : '阴身'}`, 'jade')
      sfx.click()
    },

    // ================= 装备操作 =================
    equipItem(id: number) {
      const e = this.inventory.find(x => x.id === id)
      if (!e) return
      const owner = this.wornBodyOf(id)
      if (owner && owner !== this.clones.active) {
        const om = owner === 'main' ? this.equipped : owner === 'yang' ? this.clones.yangEquip : this.clones.yinEquip
        for (const s of SLOTS) if (om[s] === id) delete om[s]
        this.toast(`已从${owner === 'main' ? '本体' : owner === 'yang' ? '阳神' : '阴身'}转移该装备`, 'dim')
      }
      this.equipMap[e.slot] = e.id
      sfx.click()
    },
    // 精确对比：临时换装后实测战力（含共鸣/铭纹联动），用于装备详情页「穿戴后战力」
    powerWithEquip(e: Equip): number {
      const map = this.equipMap
      const inInv = this.inventory.some(x => x.id === e.id)
      if (!inInv) this.inventory.push(e)
      const prev = map[e.slot]
      map[e.slot] = e.id
      const withP = this.derived.power
      if (prev == null) delete map[e.slot]
      else map[e.slot] = prev
      if (!inInv) this.inventory = this.inventory.filter(x => x.id !== e.id)
      return withP
    },
    unequip(slot: SlotKey) { delete this.equipMap[slot] },
    reforge(id: number, mode: 'value' | 'type') {
      const e = this.inventory.find(x => x.id === id)
      if (!e) return
      const locks = e.locks || []
      if (mode === 'value') {
        const need = 3 + locks.length * 2
        if (this.res.xilian < need) { this.toast(`洗练石不足（需 ${need}）`, 'red'); return }
        this.res.xilian -= need
        const up = this.reforgeUp
        e.affixes.forEach((a, i) => {
          if (locks.includes(i)) return
          const base = isFinite(a.v) ? a.v : 1
          a.v = Math.round(base * rf(0.7, up) * 10) / 10
        })
        this.toast(`「${e.name}」词条数值重铸完毕${locks.length ? `（锁定 ${locks.length} 条）` : ''}`, 'jade')
      } else {
        const need = 1 + locks.length
        if (this.res.gaiming < need) { this.toast(`改命石不足（需 ${need}）`, 'red'); return }
        this.res.gaiming -= need
        const pool = e.affixes.map(a => a.k)
        e.affixes.forEach((a, i) => {
          if (locks.includes(i)) return
          const nk = pick(pool.filter(k => k !== a.k))
          if (!nk) return
          const def = AFFIX_MAP[nk]
          a.k = nk
          a.tier = def.tier
          a.v = this.rollAffix(nk, e.q, e.stars, e.level)
        })
        this.toast(`「${e.name}」词条类型重塑完毕${locks.length ? `（锁定 ${locks.length} 条）` : ''}`, 'jade')
      }
      e.enchanted = true
      refreshScore(e)
      this.addTaskProgress('reforge', 1)
      sfx.success()
    },
    toggleLock(id: number, idx: number) {
      const e = this.inventory.find(x => x.id === id)
      if (!e) return
      if (!e.locks) e.locks = []
      const i = e.locks.indexOf(idx)
      if (i >= 0) e.locks.splice(i, 1)
      else e.locks.push(idx)
      sfx.click()
    },
    // 单个分解改为会掉落改命石
    discardOne(id: number) {
      const e = this.inventory.find(x => x.id === id)
      if (!e) return
      if (this.discardJunkDropGaiming(e)) this.toast('分解时意外得到改命石×1', 'jade')
      this.discardItem(id)
    },
    discardJunkDropGaiming(e: Equip): boolean {
      if (e.q >= 10 || (e.q >= 7 && chance(0.35))) { this.addRes('gaiming', 1); return true }
      return false
    },
    rollAffix(k: string, q: number, stars: number, lv: number): number {
      const def = AFFIX_MAP[k]
      const roll = rf(def.min, def.max)
      if (def.pct) return Math.round(roll * (1 + 0.06 * (q - 1)) * (1 + 0.04 * (stars - 1)) * 10) / 10
      if (k === 'reincarnate') return ri(1, 3)
      const qm = 1 + 0.38 * (q - 1)
      const sm = 1 + 0.3 * (stars - 1)
      if (def.flat === 'atk') return Math.max(1, Math.round(roll * 0.55 * Math.pow(1.03644, lv) * qm * sm))
      if (def.flat === 'def') return Math.max(1, Math.round(roll * 0.48 * Math.pow(1.03644, lv) * qm * sm))
      if (def.flat === 'hp') return Math.max(1, Math.round(roll * 0.7 * Math.pow(1.03897, lv) * qm * sm))
      if (def.flat === 'spd') return Math.max(1, Math.round(roll * (1 + lv * 0.00457) * (1 + 0.08 * (q - 1))))
      return Math.round(roll * 10) / 10
    },
    forge(baseId: number, matIds: string[], rune: boolean) {
      const base = this.inventory.find(x => x.id === baseId)
      if (!base) return
      const matsOk = matIds.every(m => (this.mats[m] || 0) > 0)
      if (!matsOk) { this.toast('材料不足', 'red'); return }
      if (rune && (this.mats['fuwen'] || 0) < 2) { this.toast('符文石不足（需2）', 'red'); return }
      for (const m of matIds) this.mats[m]--
      if (rune) this.mats['fuwen'] -= 2
      const matBonus = matIds.length * 0.05 + this.cave.forge * 0.05
      const fail = !chance(clamp(0.5 + matBonus, 0.45, 0.88))
      if (fail) {
        this.discardItem(baseId)
        this.injured = Math.max(this.injured, 120)
        sfx.fail()
        this.toast(`炼器失败！「${base.name}」器胚损毁，你被炉火灼伤`, 'red')
        return
      }
      const up = ri(1, 2)
      const nq = clamp(base.q + up, 1, 16)
      const ne = genEquip(Math.max(1, base.level || this.eqLvBase), nq, nq, { q: nq, slot: base.slot, forceRune: rune || nq >= 12, selfMined: true })
      this.discardItem(baseId)
      this.acquire(ne)
      this.toast(`炼器成功！「${base.name}」→ 「${ne.name}」（${qName(nq)}）`, 'gold')
    },

    // ================= 突破 / 心魔 / 渡劫 =================
    breakthroughPillBonus(): number {
      let bonus = 0
      for (const [k, n] of Object.entries(this.pills)) {
        const [id, q] = k.split(':')
        if (id === 'podan' && n > 0) {
          bonus = 12 * PILL_QMULT[Number(q)]
          this.pills[k]--
          if (this.pills[k] <= 0) delete this.pills[k]
          this.toast(`服下破障丹（${PILL_QNAMES[Number(q)]}），突破率 +${Math.round(bonus)}%`, 'jade')
          break
        }
      }
      return bonus
    },
    tryBreakthrough() {
      const req = this.nextReq
      if (this.cultivation < req) { this.toast('修为未满，尚不可强行突破', 'red'); return }
      const bonus = this.breakthroughPillBonus() + this.derived.stats.tribBonus
      const p = breakChance(this.major, this.phase, this.minor, this.attrs.wuXing, this.attrs.daoXin, this.attrs.yeLi, this.attrs.jieQi, bonus)
      const roll = rnd()
      if (roll < p) {
        this.onBreakSuccess()
      } else {
        this.onBreakFail()
      }
    },
    onBreakSuccess() {
      if (this.minor >= 9) {
        if (this.phase < 3) {
          // 小境界跃迁（前期→中期→后期→圆满）
          this.phase++
          this.minor = 0
        } else {
          // 大境界突破
          if (this.major >= 1) {
            // 需要渡劫（炼气之后的大境界）
            this.startTribulation()
            return
          }
          this.major++
          this.phase = 0
          this.minor = 0
          this.attrs.jieQi += 3 // 逆天改命，天劫值累积
          this.spawnRivals()
        }
      } else {
        this.minor++
      }
      this.afterRealmUp()
    },
    // 修为崩退一小阶（跨小境界回退）
    demoteStage() {
      if (this.minor > 0) this.minor--
      else if (this.phase > 0) { this.phase--; this.minor = 9 }
    },
    afterRealmUp(showModal = true) {
      this.cultivation = 0
      this.attrs.daoXin += 1
      this.evtAdd('breakthrough')
      this.checkPromotion() // 境界达标后自动触发宗门晋升考核
      sfx.breakthrough()
      this.flash()
      this.toast(`突破成功！境界提升至【${this.realmText}】`, 'gold')
      if (this.minor === 0) this.pushWorld(`${this.name} 成功突破${this.realmText}，气象万千！`)
      // 境界解锁提示（入门阶生效一次）
      if (this.minor === 0 && this.phase === 0) {
        if (this.major === 1) this.toast('解锁：灵脉深层、洞府、坊市、天机阁', 'jade')
        if (this.major === 2) this.toast('解锁：宗门任务、灵兽出战', 'jade')
        if (this.major === 3) this.toast('解锁：收徒、天骄榜竞争愈发激烈', 'jade')
        if (this.major === 5) { this.treasureSlots = 4; this.toast('法宝栏位 +1（4 位）', 'jade') }
        if (this.major === 8) { this.treasureSlots = 5; this.toast('法宝栏位 +1（5 位）', 'jade') }
      }
      if (showModal) this.pushModal('text', { title: '境界突破', body: `恭喜！你已突破至【${this.realmText}】。仙途无垠，继续精进吧。` })
    },
    onBreakFail() {
      const req = this.nextReq
      this.cultivation = Math.floor(req * 0.25)
      this.injured = Math.max(this.injured, 360)
      this.attrs.daoXin = Math.max(0, this.attrs.daoXin - 2)
      sfx.fail()
      this.shake()
      this.toast('突破失败！修为大幅倒退，经脉受创', 'red')
      // 高境界失败可能修为崩退一小阶
      if ((this.minor > 0 || this.phase > 0) && this.major >= 4 && chance(0.15)) {
        this.demoteStage()
        this.toast('经脉逆乱，修为崩退一小阶！', 'red')
      }
      // 心魔概率
      if (chance(0.35) && this.major >= 1) this.startDemon()
      if (this.attrs.daoXin <= 0 && chance(0.5)) {
        this.align = '魔'
        this.toast('心魔难抑，你踏入魔道。杀伐果决，然天劫愈重。', 'red')
      }
    },
    startDemon() {
      this.demon = { scene: ri(0, DEMON_SCENES.length - 1), done: false, result: '' }
      this.pushModal('demon')
    },
    demonChoice(idx: number) {
      if (!this.demon || this.demon.done) return
      const sc = DEMON_SCENES[this.demon.scene]
      const opt = sc.options[idx]
      this.attrs.daoXin = Math.max(0, this.attrs.daoXin + opt.d)
      if (opt.y) this.attrs.yeLi += opt.y
      this.demon.done = true
      this.demon.result = opt.t
      this.pushModal('text', { title: '心魔试炼', body: opt.t })
    },
    startTribulation() {
      const bolts = this.major >= 7 ? 9 : this.major >= 4 ? 6 : 3
      let extra = ''
      if (this.npcs.some(n => n.rel === 'enemy')) { extra = '仇家闻讯赶来，欲趁劫行凶……' }
      this.trib = {
        bolts, cur: 1, hpPct: 100, treasureUses: this.treasures.length, dujieLeft: this.countPills('dujie'),
        arrayUsed: false, companionUsed: false, sectUsed: false, done: false, success: false, awaiting: true,
        log: [
          { t: `【渡劫·${bolts}雷劫】乌云压顶，雷海翻涌，你静立劫云之下。`, c: 'l-sys' },
          { t: extra || '天地肃杀，唯雷声轰鸣。', c: 'l-bad' },
        ],
      }
      this.pushModal('trib')
      sfx.thunder()
    },
    countPills(id: string): number {
      let n = 0
      for (const [k, c] of Object.entries(this.pills)) if (k.startsWith(id + ':')) n += c
      return n
    },
    consumePillAny(id: string): boolean {
      for (const [k, c] of Object.entries(this.pills)) {
        if (k.startsWith(id + ':') && c > 0) {
          this.pills[k]--
          if (this.pills[k] <= 0) delete this.pills[k]
          return true
        }
      }
      return false
    },
    tribDamage(base: number): number {
      const d = this.derived.stats
      const mitig = d.def / (d.def + d.atk * 3 + 50)
      let dmg = base * (1 - Math.min(0.6, mitig))
      dmg *= 1 + this.attrs.jieQi * 0.003
      if (this.activity?.id === 'trib') dmg *= 0.8
      return Math.max(1, Math.round(dmg))
    },
    tribAct(kind: 'hard' | 'treasure' | 'pill' | 'array' | 'companion' | 'sect') {
      const t = this.trib
      if (!t || t.done || !t.awaiting) return
      let dmg = 0
      let note = ''
      switch (kind) {
        case 'hard':
          dmg = this.tribDamage(16 + rf(0, 10))
          note = `你以血肉之躯硬抗雷劫，气血激荡！`
          break
        case 'treasure':
          if (t.treasureUses <= 0) { this.toast('法宝已然受损，无力再挡', 'red'); return }
          t.treasureUses--
          dmg = this.tribDamage(4)
          note = `法宝冲天而起，替你挡下大半雷威。`
          break
        case 'pill':
          if (t.dujieLeft <= 0 || !this.consumePillAny('dujie')) { this.toast('没有渡劫丹了', 'red'); return }
          t.dujieLeft--
          dmg = 0
          note = `渡劫丹化开，药力护住周身经脉，此劫无恙。`
          break
        case 'array':
          if (t.arrayUsed) { this.toast('大阵已然残破', 'red'); return }
          t.arrayUsed = true
          dmg = this.tribDamage(5)
          note = `你启动护身大阵，雷威滔滔，皆入大地。`
          break
        case 'companion':
          if (t.companionUsed) { this.toast('再无道友可依', 'red'); return }
          t.companionUsed = true
          dmg = this.tribDamage(3)
          note = `道友远来护法，为你分担雷威。`
          break
        case 'sect':
          if (t.sectUsed || !this.sect || this.res.contrib < 2000) { this.toast('宗门秘宝不可轻动（需贡献2000）', 'red'); return }
          t.sectUsed = true
          this.res.contrib -= 2000
          this.attrs.jieQi += 3
          dmg = 0
          note = `你借来宗门秘宝，雷劫被硬生生压下（天劫值+3）。`
          break
      }
      t.hpPct -= dmg
      t.log.push({ t: `第 ${t.cur}/${t.bolts} 道雷劫：${note}${dmg > 0 ? `（-${dmg}% 气血）` : '（毫发无损）'}`, c: dmg > 10 ? 'l-bad' : 'l-proc' })
      sfx.thunder()
      this.shake()
      if (kind === 'hard') this.burst()
      if (t.hpPct <= 0) {
        t.done = true
        t.awaiting = false
        const r = rnd()
        if (r < 0.45) {
          t.log.push({ t: '你于雷海中被轰落尘埃，重伤垂危……', c: 'l-rainbow' })
          this.trib = t
          this.pushModal('text', { title: '渡劫失败·重伤', body: '你侥幸保住性命，但经脉尽损、道行大损。' })
          this.injured = 600
          this.cultivation = Math.floor(this.nextReq * 0.3)
        } else if (r < 0.8) {
          this.trib = t
          this.pushModal('text', { title: '渡劫失败·修为倒退', body: '雷劫之下，你修为崩退一小阶，灰头土脸。' })
          this.demoteStage()
          this.cultivation = 0
          this.injured = 600
        } else {
          this.die('渡劫失败，魂飞魄散', true)
        }
        return
      }
      if (t.cur >= t.bolts) {
        t.done = true
        t.awaiting = false
        t.success = true
        this.major++
        this.phase = 0
        this.minor = 0
        this.attrs.jieQi += 3 // 逆天改命
        this.spawnRivals()
        this.afterRealmUp(false)
        this.cultivation = 0
        const attrKey = pick(['genGu', 'wuXing', 'shenShi', 'qiYun', 'daoXin'])
        ;(this.attrs as unknown as Record<string, number>)[attrKey] += 1
        this.pushModal('text', { title: '渡劫成功！', body: `雷劫尽数落下，你如浴火重生，境界提升至【${this.realmText}】！雷劫淬体，${keyName(attrKey)} +1。` })
        sfx.epic()
        this.flash()
      } else {
        t.cur++
      }
      this.trib = t
    },
    closeTrib() {
      this.trib = null
      this.closeModal()
    },
    die(reason: string, tribFail = false) {
      if (!this.started || this.dead) return
      this.dead = true
      this.codex.deaths++
      const pts = this.major * 5 + Math.floor(this.attrs.gongDe / 50) - Math.floor(this.attrs.yeLi / 50) - this.reinc.count * 2
      this.reinc.points += Math.max(1, pts)
      this.pushModal('death', { reason, tribFail, points: Math.max(1, pts) })
      sfx.fail()
    },
    reincarnate() {
      // 跨世档案：记录此生
      pushRecord({ n: this.name || '无名', realm: this.realmText, power: this.derived.power, reinc: this.reinc.count, root: this.root.n, days: Math.floor(this.playSec / 86400), at: Date.now() })
      const keep = {
        reinc: this.reinc, codex: this.codex, settings: this.settings,
        seed: this.seed, version: this.version, days: Math.floor(Date.now() / DAY),
      }
      const fresh = this.$state
      void fresh
      // 重置核心玩法状态，保留图鉴 / 转世 / 设置
      this.$reset()
      this.reinc = keep.reinc
      this.codex = keep.codex
      this.settings = keep.settings
      this.seed = keep.seed
      this.reinc.count++
      this.npcs = makeNpcs()
      this.traits = rollTraits()
      this.lastTick = Date.now()
      this.started = false
      this.modals = []
      this.toasts = []
      this.world = []
      this.log = []
      this.toast(`轮回转世（第${this.reinc.count}世），前世记忆化作 ${this.reinc.points} 点轮回之力`, 'gold')
    },

    // ================= 洞府 / 灵田 =================
    caveUpgradeCost(fac: string): { res: number } {
      const lv = (this.cave as unknown as Record<string, number>)[fac]
      const base: Record<string, number> = { cult: 800, alchemy: 600, forge: 600, field: 500, spring: 1000 }
      return { res: Math.round(base[fac] * Math.pow(2.1, lv)) }
    },
    upgradeCave(fac: 'cult' | 'alchemy' | 'forge' | 'field' | 'spring') {
      const lv = this.cave[fac]
      if (lv >= 5) { this.toast('此设施已至圆满', 'dim'); return }
      const cost = this.caveUpgradeCost(fac).res
      if (this.res.lingshi < cost) { this.toast(`灵石不足（需 ${fmt(cost)}）`, 'red'); return }
      this.res.lingshi -= cost
      this.cave[fac]++
      if (fac === 'field') this.syncPlots()
      sfx.success()
      this.toast('洞府设施升级成功', 'jade')
    },
    upgradeCaveLevel() {
      if (this.cave.level >= 10) { this.toast('洞府已至最高等级', 'dim'); return }
      const cost = 2000 * Math.pow(2.4, this.cave.level - 1)
      if (this.res.lingshi < cost) { this.toast(`灵石不足（需 ${fmt(cost)}）`, 'red'); return }
      this.res.lingshi -= cost
      this.cave.level++
      this.toast(`洞府扩建至 ${this.cave.level} 级，灵脉汇聚，出产更盛`, 'gold')
      sfx.success()
    },
    syncPlots() {
      const n = 2 + this.cave.field * 2
      const cur = this.plots
      const next: Plot[] = []
      for (let i = 0; i < n; i++) next.push(cur[i] || { idx: i, seed: '', at: 0, ready: 0 })
      this.plots = next
    },
    plant(idx: number, seedId: string) {
      const sd = SEED_MAP[seedId]
      const p = this.plots[idx]
      if (!sd || !p || p.seed) return
      if ((this.mats[seedId] || 0) <= 0) { this.toast('没有这种种子', 'red'); return }
      if (this.major < sd.realm) { this.toast(`需${MAJOR[sd.realm]}方可种植`, 'red'); return }
      this.mats[seedId]--
      p.seed = seedId
      p.at = Date.now()
      p.ready = Date.now() + sd.minutes * 60000
      this.toast(`种下${sd.n}，约 ${sd.minutes} 分钟成熟（游戏内更快）`, 'jade')
    },
    harvest(idx: number) {
      const p = this.plots[idx]
      if (!p || !p.seed) return
      if (Date.now() < p.ready) { this.toast(`尚需 ${fmtTime(p.ready - Date.now())}`, 'dim'); return }
      const sd = SEED_MAP[p.seed]
      const n = Math.round(ri(sd.yield[0], sd.yield[1]) * (1 + this.cave.field * 0.15))
      this.addMat(sd.herb, n)
      if (chance(0.08)) { this.addMat('jiuye', 1); this.toast('灵草变异！额外收获九叶莲×1', 'gold') }
      this.toast(`收获 ${MAT_MAP[sd.herb].n}×${n}`, 'jade')
      this.evtAdd('harvest')
      p.seed = ''
      sfx.coin()
    },

    // ================= 炼丹 =================
    alchemy(recipeId: string, accuracy: number) {
      const r = RECIPE_MAP[recipeId]
      if (!r) return
      if (this.major < r.realm) { this.toast(`需${MAJOR[r.realm]}修为方可炼制此丹`, 'red'); return }
      for (const [m, n] of r.mats) {
        if ((this.mats[m] || 0) < n) { this.toast(`材料不足：${MAT_MAP[m].n}×${n}`, 'red'); return }
      }
      for (const [m, n] of r.mats) this.mats[m] -= n
      if (accuracy < 0.15 && chance(0.6)) {
        this.injured = Math.max(this.injured, 180)
        sfx.fail()
        this.toast('轰！丹炉炸裂，材料尽毁，你被丹火燎伤', 'red')
        return
      }
      let q = Math.round(accuracy * 6 + this.cave.alchemy * 0.4 + this.attrs.wuXing * 0.05 + rf(-0.7, 0.7))
      q = clamp(q, 0, 6)
      if (q === 0) { this.toast('这一炉炼成了废丹……', 'dim'); sfx.fail(); return }
      this.addPill(r.out, q, 1)
      this.evtAdd('alchemy')
      sfx.success()
      if (q >= 5) { sfx.rare(); this.burst() }
      this.toast(`炼成【${PILL_MAP[r.out].n}·${PILL_QNAMES[q]}】！`, q >= 4 ? 'gold' : 'jade')
    },

    // ================= 功法 / 神通 =================
    learnTechById(id: string, free = false) {
      if (this.techs.some(t => t.id === id)) return
      const def = TECH_MAP[id]
      if (!def) return
      this.techs.push({ id, level: 1 })
      if (def.kind === 'passive' && this.equippedTechs.length < 3) this.equippedTechs.push(id)
      if (def.kind === 'active' && this.equippedSkills.length < 2) this.equippedSkills.push(id)
      this.toast(`习得${def.kind === 'passive' ? '功法' : '神通'}【${def.n}】`, 'gold')
      if (!free) sfx.rare()
    },
    learnRandom(kindType: 'passive' | 'active') {
      const cost = 10
      if ((this.mats['gongfaPage'] || 0) < cost) { this.toast(`功法残页不足（需${cost}张）`, 'red'); return }
      const maxTier = 2 + Math.floor(this.major / 2)
      const pool = TECHNIQUES.filter(t => t.kind === kindType && t.tier <= maxTier && !this.techs.some(x => x.id === t.id))
      if (!pool.length) { this.toast('残页中已无新的法门可悟', 'dim'); return }
      this.mats['gongfaPage'] -= cost
      const w = pool.map(t => ({ w: Math.max(1, 8 - t.tier * 1.2), v: t.id }))
      this.learnTechById(weighted(w))
    },
    levelupTech(id: string) {
      const t = this.techs.find(x => x.id === id)
      if (!t || t.level >= 10) return
      const def = TECH_MAP[t.id]
      const cost = Math.round(200 * def.tier * Math.pow(1.9, t.level - 1))
      if (this.cultivation < cost) { this.toast(`修为不足（需 ${fmt(cost)}）`, 'red'); return }
      this.cultivation -= cost
      t.level++
      this.toast(`【${def.n}】熟练度提升至 Lv.${t.level}`, 'jade')
      sfx.success()
    },
    toggleTech(id: string) {
      const def = TECH_MAP[id]
      if (!def) return
      const arr = def.kind === 'passive' ? this.equippedTechs : this.equippedSkills
      const i = arr.indexOf(id)
      if (i >= 0) arr.splice(i, 1)
      else {
        const max = def.kind === 'passive' ? (this.major >= 8 ? 5 : this.major >= 5 ? 4 : 3) : 3
        if (arr.length >= max) { this.toast('装备栏已满，请先卸下其他法门', 'red'); return }
        arr.push(id)
      }
    },

    // ================= 法宝 / 灵兽 =================
    getTreasure(minQ: number, maxQ: number) {
      const pool = TREASURES.filter(t => t.q >= minQ && t.q <= maxQ)
      const def = pool.length ? pick(pool) : pick(TREASURES)
      const tr: Treasure = { id: uid(), name: def.n, q: def.q, level: 1, stars: 1 }
      this.treasures.push(tr)
      if (!this.codex.treasuresSeen.includes(def.n)) this.codex.treasuresSeen.push(def.n)
      this.toast(`获得法宝【${def.n}】！`, 'gold')
      sfx.rare(); this.burst()
    },
    combineTreasure(kind: 'fabao' | 'zhibao') {
      if (kind === 'fabao') {
        if ((this.mats['fabaoPiece'] || 0) < 10 || this.res.qihun < 100) { this.toast('需法宝碎片×10、器魂×100', 'red'); return }
        this.mats['fabaoPiece'] -= 10
        this.res.qihun -= 100
        this.getTreasure(9, 11)
      } else {
        if ((this.mats['zhibaoPiece'] || 0) < 20 || this.res.qihun < 500) { this.toast('需至宝碎片×20、器魂×500', 'red'); return }
        this.mats['zhibaoPiece'] -= 20
        this.res.qihun -= 500
        this.getTreasure(12, 15)
      }
    },
    upgradeTreasure(id: number) {
      const t = this.treasures.find(x => x.id === id)
      if (!t) return
      const cost = Math.round(60 * Math.pow(1.6, t.level - 1))
      if (this.res.qihun < cost) { this.toast(`器魂不足（需 ${cost}）`, 'red'); return }
      this.res.qihun -= cost
      t.level++
      this.toast(`【${t.name}】提升至 Lv.${t.level}`, 'jade')
      sfx.success()
    },
    starTreasure(id: number) {
      const t = this.treasures.find(x => x.id === id)
      if (!t || t.stars >= 5) return
      const cost = 300 * t.stars
      if (this.res.qihun < cost) { this.toast(`器魂不足（需 ${cost}）`, 'red'); return }
      this.res.qihun -= cost
      t.stars++
      this.toast(`【${t.name}】升至 ${t.stars} 星！`, 'gold')
      sfx.rare()
    },
    equipTreasure(id: number) {
      if (this.treasureEquipped.includes(id)) return
      if (this.treasureEquipped.length >= this.treasureSlots) { this.toast('法宝栏已满', 'red'); return }
      this.treasureEquipped.push(id)
      sfx.click()
    },
    unequipTreasure(id: number) {
      this.treasureEquipped = this.treasureEquipped.filter(x => x !== id)
    },
    hatchEgg(id: number) {
      const i = this.eggs.findIndex(e => e.id === id)
      if (i < 0) return
      const egg = this.eggs[i]
      this.eggs.splice(i, 1)
      // 血脉相承：40% 概率孵出已有种类，便于同种吞食升阶
      let kind = pick(BEAST_KINDS)
      if (this.beasts.length && chance(0.4)) {
        const own = pick(this.beasts)
        kind = BEAST_MAP[own.kind] || kind
      }
      const qual = rollBeastQual(egg.q)
      const growth = Math.round((0.9 + rnd() * 0.25) * 100) / 100
      const b: Beast = { id: uid(), name: beastName(egg.q, kind.n), kind: kind.id, q: egg.q, level: 1, exp: 0, qual, growth }
      this.beasts.push(b)
      const avg = Math.round((qual.atk + qual.def + qual.hp + qual.spd) / 4)
      this.toast(`灵兽孵化！【${b.name}】认你为主（资质均值 ${avg} · 成长率 ${growth}）`, 'gold')
      sfx.rare(); this.burst()
    },
    setBeast(id: number | null) { this.beastActive = id },
    feedBeast(id: number) {
      const b = this.beasts.find(x => x.id === id)
      if (!b) return
      if ((this.mats['shouhun'] || 0) <= 0) { this.toast('兽魂不足（兽魂来自副本/游历/长阶）', 'red'); return }
      this.mats['shouhun']--
      const need = Math.round(10 * Math.pow(1.35, b.level - 1))
      b.exp += 12
      while (b.exp >= need) {
        b.exp -= need
        b.level++
      }
      this.addTaskProgress('feed', 1)
      this.toast(`【${b.name}】饱食灵力，经验 +12（Lv.${b.level}）`, 'jade')
      sfx.coin()
    },
    // 吞食同类：消耗一只同种灵兽，目标升阶一次，并随机提升一项主人加成资质
    mergeBeast(targetId: number, dupId: number) {
      const t = this.beasts.find(b => b.id === targetId)
      const d = this.beasts.find(b => b.id === dupId)
      if (!t || !d || t.id === d.id || t.kind !== d.kind) { this.toast('需同种灵兽方可吞食升阶', 'dim'); return }
      if (this.beastActive === d.id) this.beastActive = null
      const stage = t.stage || 0
      let stageTxt = ''
      if (stage < BEAST_STAGES.length - 1) {
        t.stage = stage + 1
        const sk = BEAST_STAGE_SKILLS[stage]
        stageTxt = `进阶「${BEAST_STAGES[t.stage]}」并解锁「${sk.name}」；`
      } else {
        stageTxt = '已至太古期，资质再度精纯；'
      }
      if (!t.qual) t.qual = { atk: 50, def: 50, hp: 50, spd: 50 }
      const qk = pick(['atk', 'def', 'hp', 'spd'] as const)
      const qName: Record<string, string> = { atk: '攻击', def: '防御', hp: '气血', spd: '速度' }
      const qBefore = t.qual[qk]
      t.qual[qk] = Math.min(100, qBefore + ri(3, 6))
      t.growth = Math.min(1.3, Math.round(((t.growth ?? 1) + 0.01) * 100) / 100)
      t.exp += d.level * 8
      this.beasts = this.beasts.filter(b => b.id !== d.id)
      this.toast(`【${t.name}】吞食【${d.name}】：${stageTxt}主人加成·${qName[qk]}资质 ${qBefore}→${t.qual[qk]}！`, 'gold')
      sfx.rare(); this.burst()
    },
    advanceBeast(id: number) {
      const b = this.beasts.find(x => x.id === id)
      if (!b) return
      const stage = b.stage || 0
      if (stage >= BEAST_STAGES.length - 1) { this.toast('灵兽已至最高阶', 'dim'); return }
      const needLv = (stage + 1) * 10
      if (b.level < needLv) { this.toast(`需达到 Lv.${needLv} 才能进阶`, 'dim'); return }
      const costS = 20 * (stage + 1) * (stage + 1)
      const costL = Math.round(3000 * Math.pow(1.04069, this.lv) * (stage + 1))
      if ((this.mats['shouhun'] || 0) < costS) { this.toast(`兽魂不足（需 ${costS}）`, 'red'); return }
      if (this.res.lingshi < costL) { this.toast(`灵石不足（需 ${fmt(costL)}）`, 'red'); return }
      this.mats['shouhun'] -= costS
      this.res.lingshi -= costL
      b.stage = stage + 1
      const sk = BEAST_STAGE_SKILLS[stage]
      this.toast(`【${b.name}】进阶为「${BEAST_STAGES[b.stage]}」，解锁助战技「${sk.name}」！`, 'gold')
      sfx.rare(); this.burst()
    },
    enhanceItem(id: number) {
      const e = this.inventory.find(x => x.id === id)
      if (!e) return
      const enh = e.enh || 0
      if (enh >= ENH_MAX) { this.toast('已强化至上限', 'dim'); return }
      const cost = enhanceCost(e)
      const disc = this.enhanceDiscount // 炼器房：强化灵石折扣
      const needLs = Math.max(1, Math.round(cost.lingshi * (1 - disc)))
      if (this.res.lingshi < needLs) { this.toast(`灵石不足（需 ${fmt(needLs)}）`, 'red'); return }
      if (this.res.lingmai < cost.lingmai) { this.toast(`开脉石不足（需 ${cost.lingmai}）`, 'red'); return }
      this.res.lingshi -= needLs
      this.res.lingmai -= cost.lingmai
      e.enh = enh + 1
      refreshScore(e)
      this.toast(`【${e.name}】强化成功 → +${e.enh}（词条效果 +${e.enh * 5}%）${disc > 0 ? ` · 炼器房省下 ${Math.round(disc * 100)}% 灵石` : ''}`, e.enh >= 10 ? 'gold' : 'jade')
      if (e.enh === 10 || e.enh === 15) { this.flash(); this.shake(); this.burst() }
      sfx.success()
    },
    checkTitles() {
      const ctx = {
        major: this.major,
        power: this.derived.power,
        rank: this.myRank,
        lingshi: this.res.lingshi,
        xianyu: this.res.xianyu,
        pulls: this.codex.pulls,
        bestQ: Math.max(0, ...Object.values(this.codex.items).map(e => e.q)),
        codexCount: Object.keys(this.codex.items).length,
        sect: !!this.sect,
        reinc: this.reinc.count,
        beasts: this.beasts.length,
        treasures: this.treasures.length,
        lovers: this.npcs.filter(n => n.rel === 'lover').length,
        masters: this.npcs.filter(n => n.rel === 'master' || n.rel === 'disciple').length,
        famCatch: this.fam.catches,
        famKinds: this.fam.seen.length,
        gachaLegend: this.gacha.legends,
        payTotal: this.shop.total,
        swordFlavor: this.equippedItems.filter(e => e.flavors.includes('剑类')).length,
        clones: (this.clones.yangOpen ? 1 : 0) + (this.clones.yinOpen ? 1 : 0),
        yaoRank: this.yao.dmg > 0 ? this.yaoRank : 0,
        veinLv: this.vein.lv,
      }
      for (const t of TITLES) {
        if (this.titles.owned.includes(t.id)) continue
        if (t.ok(ctx)) {
          this.titles.owned.push(t.id)
          if (!this.titles.eq) this.titles.eq = t.id
          // 称号解锁附带资源奖励（成就实利）
          const xy = [0, 5, 10, 20, 50, 100][t.r]
          const ls = Math.round(2000 * Math.pow(1.0262, this.lv) * t.r * 0.4)
          this.addRes('xianyu', xy)
          this.addRes('lingshi', ls)
          this.toast(`获得称号【${t.n}】（${TITLE_RARITY[t.r]}）：仙玉×${xy}、灵石×${fmt(ls)}`, t.r >= 4 ? 'gold' : 'jade')
          if (t.r >= 4) sfx.rare()
        }
      }
    },
    equipTitle(id: string) {
      if (!this.titles.owned.includes(id)) return
      this.titles.eq = this.titles.eq === id ? null : id
      sfx.click()
    },

    // ================= 精怪（捉妖/养成） =================
    absorbFamiliar(fid: string): string {
      const def = FAM_MAP[fid]
      if (!def) return '神秘妖气消散了…'
      if (!this.fam.seen.includes(fid)) this.fam.seen.push(fid)
      const own = this.fam.list.find(f => f.fid === fid)
      if (!own) {
        this.fam.list.push({ id: uid(), fid, level: 1, stars: 1 })
        return `初遇精怪「${def.n}」（${FAM_RARITY[def.r]}）！`
      }
      this.fam.dupes[fid] = (this.fam.dupes[fid] || 0) + 1
      return `再遇「${def.n}」，已收作同种喂养材料（持有×${this.fam.dupes[fid]}，去详情喂养升阶）`
    },
    // 喂同种升阶：消耗一只同种精怪，星级 +1（5★后转化为材料）
    famFeedDup(id: number) {
      const f = this.fam.list.find(x => x.id === id)
      if (!f) return
      const def = FAM_MAP[f.fid]
      const n = this.fam.dupes[f.fid] || 0
      if (n <= 0) { this.toast('没有同种精怪可供喂养（凝珠化形/万兽幽林可获得）', 'dim'); return }
      this.fam.dupes[f.fid] = n - 1
      if (f.stars < 5) {
        f.stars++
        this.toast(`喂养同种：「${def?.n}」升阶至 ${f.stars}★（每星加成一阶 +25%）`, 'gold')
        sfx.rare(); this.burst()
      } else {
        this.addRes('xianyu', 10)
        this.addMat('yaozhu', 5)
        this.toast(`「${def?.n}」已至 5★，同种化为妖珠碎片×5、仙玉×10`, 'jade')
      }
    },
    catchFamiliar() {
      // 已废弃：改为「凝珠化形」——副本/长阶刷妖珠碎片
      this.weaveFamiliar()
    },
    weaveFamiliar() {
      if ((this.mats['yaozhu'] || 0) < 30) { this.toast('妖珠碎片不足（需 30）——通关万兽幽林等副本掉落', 'red'); return }
      this.mats['yaozhu'] -= 30
      this.fam.catches++
      const bonus = Math.floor(this.attrs.qiYun / 8) + Math.min(4, this.reinc.count)
      const def = catchRoll(bonus)
      const msg = this.absorbFamiliar(def.id)
      this.evtAdd('fam')
      this.toast(`珠中化形：${msg}`, def.r >= 4 ? 'gold' : 'jade')
      if (def.r >= 4) { sfx.rare(); this.burst() } else sfx.success()
    },
    famEquip(id: number) {
      if (this.fam.equipped.includes(id)) return
      if (this.fam.equipped.length >= this.famSlots) { this.toast('出战位已满（境界提升可解锁更多）', 'red'); return }
      this.fam.equipped.push(id)
      sfx.click()
    },
    famUnequip(id: number) { this.fam.equipped = this.fam.equipped.filter(x => x !== id) },
    famLevelUp(id: number) {
      const f = this.fam.list.find(x => x.id === id)
      if (!f) return
      if (f.level >= 30) { this.toast('精怪已至满级', 'dim'); return }
      const def = FAM_MAP[f.fid]
      const cost = Math.round(400 * Math.pow(1.32, f.level) * (1 + (def?.r || 1) * 0.6))
      if (this.res.lingshi < cost) { this.toast(`灵石不足（需 ${fmt(cost)}）`, 'red'); return }
      this.res.lingshi -= cost
      f.level++
      this.toast(`「${def?.n || '精怪'}」提升至 Lv.${f.level}`, 'jade')
      sfx.success()
    },

    // ================= 寻仙问道（抽卡） =================
    execGacha(res: GachaResult, pool: 'std' | 'lim'): string {
      const gr = res.grant
      if (gr.t === 'res') { this.addRes(gr.id, gr.n); return `${RES_LABEL[gr.id] || gr.id}×${fmt(gr.n)}` }
      if (gr.t === 'dynres') { const n = XY_DYN[gr.id](this.lv); this.addRes(gr.id, n); return `${RES_LABEL[gr.id]}×${fmt(n)}` }
      if (gr.t === 'pill') { this.addPill(gr.id, gr.q ?? 1, gr.n); return `${PILL_MAP[gr.id]?.n || gr.id}×${gr.n}` }
      if (gr.t === 'egg') { const q = ri(gr.qmin, gr.qmax); this.eggs.push({ id: uid(), q }); return `${qName(q)}品质灵兽蛋` }
      if (gr.t === 'fam') {
        if (gr.fid) return this.absorbFamiliar(gr.fid)
        return this.absorbFamiliar(this.pickFamInRange(gr.rmin, gr.rmax))
      }
      if (gr.t === 'treasure') {
        this.getTreasure(gr.qmin, gr.qmax)
        let s = `法宝（${qName(gr.qmin)}~${qName(gr.qmax)}）`
        if (pool === 'lim' && gr.qmin >= 12) { this.addRes('xianyu', 200); s += ' + 仙玉×200' }
        return s
      }
      // equip
      const eq = genEquip(this.eqLvBase, gr.qmin, Math.min(16, gr.qmax), { selfMined: false, forceRune: gr.rune != null })
      if (gr.rune && gr.rune !== 'random') eq.rune = gr.rune
      if (eq.rune) refreshScore(eq)
      this.acquire(eq, true)
      return `${qName(eq.q)}「${eq.name}」${eq.rune ? '·灵纹' + (RUNE_MAP[eq.rune]?.n || '') : ''}`
    },
    pickFamInRange(rmin: number, rmax: number): string {
      const defs = Object.values(FAM_MAP).filter(f => f.r >= rmin && f.r <= rmax)
      return defs.length ? pick(defs).id : pick(Object.values(FAM_MAP)).id
    },
    gachaPull(pool: 'std' | 'lim', times: number) {
      const cost = times >= 10 ? GACHA_COST_10 : GACHA_COST_1
      let paidBy = ''
      if (this.res.gachaTicket >= times) {
        this.res.gachaTicket -= times
        paidBy = `寻仙令×${times}`
      } else if (this.res.xianyu >= cost) {
        this.res.xianyu -= cost
        paidBy = `仙玉×${cost}`
      } else {
        this.toast(`寻仙令不足（需 ${times}）且仙玉不足（需 ${cost}）`, 'red')
        return
      }
      void paidBy
      const pityKey = pool === 'std' ? 'stdPity' : 'limPity'
      const results: GachaResult[] = []
      for (let i = 0; i < times; i++) {
        this.gacha[pityKey]++
        let r: GachaResult
        if (this.gacha[pityKey] >= GACHA_PITY) { r = rollGacha(pool, 4); this.gacha[pityKey] = 0 }
        else r = rollGacha(pool)
        if (r.r === 4) this.gacha[pityKey] = 0
        results.push(r)
      }
      if (times >= 10 && !results.some(r => r.r >= 3)) {
        results[results.length - 1] = rollGacha(pool, 3) // 十连保底史诗
      }
      const display = results.map(r => {
        const got = this.execGacha(r, pool)
        if (r.r === 4) this.gacha.legends++
        return { r: r.r, n: r.n, d: `${r.d} · 获得：${got}` }
      })
      this.gacha.total += times
      this.pushModal('gacha', { results: display, pool })
      if (results.some(r => r.r === 4)) { sfx.epic(); this.flash(); this.shake(); this.burst(); this.burst() }
      else sfx.coin()
    },
    // ================= 礼包码（设置页） =================
    redeemCode(input: string): boolean {
      const code = input.trim().toUpperCase()
      if (!code) return false
      const def = REDEEM_CODES.find(c => c.code === code)
      if (!def) { this.toast('礼包码无效', 'red'); sfx.fail(); return false }
      if (this.codesUsed.includes(code)) { this.toast('此礼包码已在当前存档兑换过', 'dim'); return false }
      this.codesUsed.push(code)
      const out = this.grant(def.grant)
      this.toast(`礼包码【${def.n}】兑换成功：${out.join('、')}`, 'gold')
      sfx.epic(); this.burst()
      return true
    },
    gachaFree() {
      if (this.gacha.freeDay === this.dayKey) { this.toast('今日免费寻仙已用', 'dim'); return }
      this.gacha.freeDay = this.dayKey
      const r = rollGacha('std')
      const got = this.execGacha(r, 'std')
      if (r.r === 4) this.gacha.legends++
      this.gacha.total++
      this.pushModal('gacha', { results: [{ r: r.r, n: r.n, d: `${r.d} · 获得：${got}` }], pool: 'std' })
      if (r.r === 4) { sfx.epic(); this.flash(); this.shake(); this.burst(); this.burst() }
      else sfx.coin()
    },

    // ================= 模拟充值（单机演示，无真实扣费） =================
    startPay(packId: string) {
      const p = PAY_PACKS.find(x => x.id === packId)
      if (!p) return
      this.pushModal('pay', { id: packId })
    },
    completePay(packId: string) {
      const p = PAY_PACKS.find(x => x.id === packId)
      if (!p) return
      if (p.kind === 'month') {
        this.shop.monthUntil = Math.max(this.shop.monthUntil, Date.now()) + MONTH_CARD.days * DAY
        this.addRes('xianyu', MONTH_CARD.bonusXianyu)
        this.toast(`月卡开通：立即得仙玉×${MONTH_CARD.bonusXianyu}，30 天内每日可领 ${MONTH_CARD.dailyXianyu} 仙玉（演示模式，无真实扣费）`, 'gold')
        sfx.rare(); this.burst(); return
      }
      if (p.kind === 'pass') {
        this.pass.premium = true
        this.toast('修行战令·豪华版已解锁（演示模式，无真实扣费）', 'gold')
        sfx.rare(); this.burst(); return
      }
      const isFirst = !!p.first && !this.shop.first.includes(packId)
      if (isFirst) this.shop.first.push(packId)
      const amount = p.n * (isFirst ? 2 : 1)
      this.addRes('xianyu', amount)
      this.shop.total += amount
      this.toast(`模拟充值成功：仙玉×${fmt(amount)} 已入账（演示模式，未产生真实扣费）`, 'gold')
      sfx.rare(); this.burst()
    },

    // ================= 运营福利（在线 / 月卡 / 战令 / 仙武 / 榜单） =================
    claimOnline(idx: number) {
      const d = ONLINE_REWARDS[idx]
      if (!d || this.online.got.includes(idx)) return
      if (this.online.sec < d.sec) { this.toast('挂机时长不足', 'dim'); return }
      this.online.got.push(idx)
      const out = this.grant(d.grant)
      this.toast(`在线福利（${d.n}）：${out.join('、')}`, 'jade')
      sfx.coin()
    },
    claimMonth() {
      if (this.shop.monthUntil <= Date.now()) { this.toast('月卡未开通', 'dim'); return }
      if (this.shop.monthClaimDay === this.dayKey) { this.toast('今日月卡已领取', 'dim'); return }
      this.shop.monthClaimDay = this.dayKey
      this.addRes('xianyu', MONTH_CARD.dailyXianyu)
      this.toast(`月卡每日领取：仙玉×${MONTH_CARD.dailyXianyu}`, 'gold')
      sfx.coin()
    },
    // 打开社交面板并定位到指定子页（天骄榜/论道台/众生百态）
    openSocial(t: string) {
      this.socialTab = t
      this.tab = 'social'
    },
    // 打开任意面板（供面板内跳转）
    openPanel(t: string) {
      this.tab = t
      this.socialTab = this.socialTab || 'rank'
    },
    claimPass() {
      const lv = this.passLevel
      let n = 0
      for (let i = 1; i <= lv; i++) {
        if (!this.pass.freeGot.includes(i)) { this.pass.freeGot.push(i); this.grant(passFree(i)); n++ }
        if (this.pass.premium && !this.pass.premGot.includes(i)) { this.pass.premGot.push(i); this.grant(passPrem(i)); n++ }
      }
      if (!n) { this.toast('暂无可领取的战令奖励', 'dim'); return }
      this.toast(`修行战令：领取 ${n} 份奖励`, 'gold')
      sfx.rare()
    },
    buyPvp(id: string) {
      const sku = PVP_SHOP.find(s => s.id === id)
      if (!sku) return
      if ((this.pvpShop.counts[id] || 0) >= sku.weekly) { this.toast('本周限购已达上限', 'red'); return }
      if (this.res.xianwu < sku.cost) { this.toast('仙武积分不足', 'red'); return }
      this.res.xianwu -= sku.cost
      this.pvpShop.counts[id] = (this.pvpShop.counts[id] || 0) + 1
      const out = this.grant(sku.grant)
      this.toast(`仙武商店：${out.join('、')}`, 'jade')
      sfx.coin()
    },
    settleWeek() {
      // 天骄榜与论道天梯取更优名次结算
      const rank = Math.min(this.myRank, pvpRank(this.pvp.points))
      const rw = weekSettle(rank)
      this.addRes('xianyu', rw.xianyu)
      this.addRes('xianwu', rw.xianwu)
      this.toast(`周结算：名次第 ${rank}（天骄榜 ${this.myRank} · 论道台 ${pvpRank(this.pvp.points)}）· 仙玉×${rw.xianyu}、仙武积分×${rw.xianwu}`, 'gold')
      this.pushWorld(`本周结算，${this.name} 位列第 ${rank}`)
      sfx.rare()
    },
    shuangxiu(id: number) {
      const n = this.npcs.find(x => x.id === id)
      if (!n || n.rel !== 'lover') return
      if (this.sxDay === this.dayKey) { this.toast('今日已双修', 'dim'); return }
      this.sxDay = this.dayKey
      this.shuangxiuUntil = Date.now() + 2 * 3600000
      n.favor += 5
      n.mateAt = Date.now()
      this.toast(`与「${n.real}」双修两小时：修炼速度 +30%、好感 +5`, 'gold')
      sfx.epic()
    },
    npcEvent() {
      const n = pick(this.npcs)
      const roll = Math.random()
      if (roll < 0.26) {
        n.favor += 4
        this.toast(`「${n.real}」差人送来一份心意（好感 +4）`, 'dim')
      } else if (roll < 0.46) {
        if (this.derived.power > npcPower(n) * 1.05) {
          n.favor += 3
          const loot = Math.round(300 * Math.pow(1.0262, this.lv))
          this.addRes('lingshi', loot)
          this.toast(`「${n.real}」上门约战，你轻取一筹（好感+3、灵石+${fmt(loot)}）`, 'jade')
        } else {
          n.hate += 1
          this.toast(`「${n.real}」上门约战，你落了下风（仇怨 +1）`, 'dim')
        }
      } else if (roll < 0.58) {
        n.favor += 2
        this.addRes('lingmai', 5)
        this.toast(`「${n.real}」与你分享一处小机缘（好感+2、开脉石+5）`, 'dim')
      } else if (roll < 0.70) {
        // 蒙面修士拦路打劫
        if (this.derived.power > npcPower(n) * 1.1) {
          const loot = Math.round(500 * Math.pow(1.0262, this.lv))
          this.addRes('lingshi', loot)
          this.toast(`一伙蒙面修士拦路打劫，被你就地反抢（灵石 +${fmt(loot)}）`, 'jade')
        } else {
          const loss = Math.min(Math.round(this.res.lingshi * 0.04), Math.round(600 * Math.pow(1.0262, this.lv)))
          this.res.lingshi = Math.max(0, this.res.lingshi - loss)
          this.toast(`遭遇蒙面修士劫道，破财免灾（灵石 -${fmt(loss)}）`, 'red')
        }
      } else if (roll < 0.78) {
        this.attrs.gongDe += 3
        n.favor += 2
        this.toast(`「${n.real}」的后辈远来求教，你指点三句（功德+3、好感+2）`, 'dim')
      } else if (roll < 0.86) {
        this.addRes('lingmai', 10)
        this.addRes('xianyu', 2)
        this.toast('一场灵雨恰逢其会，你顺势采撷了不少灵机（开脉石+10、仙玉+2）', 'jade')
      } else if (roll < 0.94) {
        // 赠礼：NPC 送你一件礼物
        const g2 = pick(GIFTS)
        this.addMat(g2.id, 1)
        n.favor += 1
        this.toast(`「${n.real}」赠你一份「${g2.n}」（已入材料仓库，可投其所好转赠他人）`, 'jade')
      } else {
        // 切磋邀约：弹窗抉择
        this.pushModal('npcduel', { id: n.id })
      }
    },

    // ================= 先天气运 / 仙途纪事 / 新生代 / 跨世档案 =================
    spawnRivals() {
      while (this.npcs.length >= 36) {
        const cands = this.npcs.filter(x => x.rel === 'none')
        if (!cands.length) break
        const weakest = cands.reduce((a, b) => (a.level <= b.level ? a : b))
        this.npcs.splice(this.npcs.indexOf(weakest), 1)
      }
      const maxId = this.npcs.reduce((m, x) => Math.max(m, x.id), 0)
      const a = makeRival(this.lv, maxId + 1)
      const b = makeRival(this.lv, maxId + 2)
      this.npcs.push(a, b)
      this.pushWorld(`新生代天骄「${a.real}」与「${b.real}」横空出世，江湖格局再变`)
      this.toast(`新生代天骄涌现：「${a.real}」（${npcRealm(a).name}）、「${b.real}」（${npcRealm(b).name}）登上天骄榜`, 'jade')
    },
    storyCtxReady(id: string): boolean {
      const c = STORY_MAP[id]
      if (!c) return false
      return storyChapterReady(c, this.storyCtx)
    },

    // ================= 问道长阶（小关卡·剧情嵌入） =================
    stageEnter() {
      const n = this.stage.cleared + 1
      if (n > STAGE_MAX) { this.toast('已通关全部 90 阶，静候仙门开启', 'dim'); return }
      const info = stageEnemy(n)
      const enemy = makeEnemy(info.lv, info.mult, info.name, { boss: info.boss })
      const r = simulate(this.playerCombatant(), enemy)
      const rewards: string[] = []
      let won = false
      if (r.win === 'a') {
        won = true
        this.stage.cleared = n
        rewards.push(...this.grant(stageRewards(n)))
        if (n % 10 === 0) rewards.push(`长阶悟道：全属性 +1%（当前累计 +${stageBonus(n)}%）`)
        const seg = stageSeg(n)
        if (n === seg.to) this.pushWorld(`${this.name} 踏破${seg.n}，问道之路更进一步！`)
        sfx.success()
      } else {
        this.injured = Math.max(this.injured, 120)
        sfx.fail()
      }
      this.pushBattleView({ title: `问道长阶 · 第 ${n} 阶${info.boss ? '·守关' : ''}`, log: r.log, win: won, rewards })
      this.pushModal('battle')
      // 剧情嵌入：通关本阶自动开启主线正卷（关闭战报后阅卷）
      if (won) {
        const ch = storyAtStage(n)
        if (ch && !this.story.done.includes(ch.id) && this.storyCtxReady(ch.id)) {
          this.toast(`仙途纪事解锁：《${ch.n}》（关闭战报后阅卷）`, 'gold')
          this.pushModal('story', ch.id)
        }
      }
    },
    openStory(id: string) {
      if (!this.storyCtxReady(id)) { this.toast('机缘未至', 'dim'); return }
      this.pushModal('story', id)
    },
    resolveStory(id: string, idx: number) {
      const c = STORY_MAP[id]
      if (!c || this.story.done.includes(id)) return
      this.story.done.push(id)
      const ch = c.choices[idx]
      if (!ch) { this.closeModal(); return }
      const gained: string[] = []
      if (ch.cult) { const amt = Math.round(ch.cult < 10 ? ch.cult * this.nextReq : ch.cult); this.cultivation = Math.min(this.nextReq, this.cultivation + amt); gained.push(`修为 +${fmt(amt)}`) }
      if (ch.lingshi) { this.addRes('lingshi', ch.lingshi); gained.push(`灵石 +${fmt(ch.lingshi)}`) }
      if (ch.xianyu) { this.addRes('xianyu', ch.xianyu); gained.push(`仙玉 +${ch.xianyu}`) }
      if (ch.daoXin) { this.attrs.daoXin = Math.max(0, this.attrs.daoXin + ch.daoXin); gained.push(`道心 ${ch.daoXin > 0 ? '+' : ''}${ch.daoXin}`) }
      if (ch.gongDe) { this.attrs.gongDe += ch.gongDe; gained.push(`功德 +${ch.gongDe}`) }
      if (ch.yeLi) { this.attrs.yeLi = Math.max(0, this.attrs.yeLi + ch.yeLi); gained.push(`业力 ${ch.yeLi > 0 ? '+' : ''}${ch.yeLi}`) }
      if (ch.jieQi) { this.attrs.jieQi += ch.jieQi; gained.push(`天劫值 +${ch.jieQi}`) }
      if (ch.attr) { const k = ch.attr[0]; const bag = this.attrs as unknown as Record<string, number>; bag[k] = (bag[k] || 0) + ch.attr[1]; gained.push(`${keyName(k)} +${ch.attr[1]}`) }
      this.closeModal()
      this.pushModal('text', { title: `仙途纪事 · ${c.n}`, body: `${ch.t}${gained.length ? `\n\n${gained.join('、')}` : ''}` })
      sfx.rare()
    },
    // 无抉择章节：收卷收录
    finishStory(id: string) {
      const c = STORY_MAP[id]
      if (!c || this.story.done.includes(id)) { this.closeModal(); return }
      this.story.done.push(id)
      this.closeModal()
      this.toast(`《${c.n}》已收入仙途纪事卷宗`, 'jade')
      sfx.click()
    },
    checkGoals() {
      const ctx = {
        major: this.major, power: this.derived.power, pulls: this.codex.pulls,
        equippedCount: this.equippedItems.length, cleared: this.tower.cleared,
        famCount: this.fam.list.length, maxEnh: Math.max(0, ...this.inventory.map(e => e.enh || 0)),
        sect: !!this.sect, reinc: this.reinc.count, towerFloor: this.tower.best,
      }
      for (const gl of GOALS) {
        if (this.goals.done.includes(gl.id)) continue
        if (gl.ok(ctx)) {
          this.goals.done.push(gl.id)
          const out = this.grant(gl.grant)
          this.toast(`新手目标达成【${gl.n}】：${out.join('、')}`, 'gold')
          sfx.success()
        }
      }
    },
    checkCollects() {
      const ctx = {
        famKinds: this.fam.seen.length,
        codexCount: Object.keys(this.codex.items).length,
        bestQ: Math.max(0, ...Object.values(this.codex.items).map(e => e.q)),
        treasures: this.treasures.length,
        beasts: this.beasts.length,
      }
      for (const c of COLLECTS) {
        if (this.collect.done.includes(c.id)) continue
        if (c.ok(ctx)) {
          this.collect.done.push(c.id)
          this.toast(`收集达成【${c.n}】：${c.desc}（永久加成生效）`, 'gold')
          sfx.rare()
        }
      }
    },

    // ================= 宗门 =================
    joinSect(id: string) {
      if (this.sect) { this.toast('你已身在宗门', 'red'); return }
      this.sect = SECT_MAP[id].n
      this.sectRank = 0
      this.sectRankAt = Math.floor(Date.now() / DAY)
      this.refreshSectTasks(true)
      this.toast(`你加入【${SECT_MAP[id].n}】，成为一名杂役弟子`, 'gold')
      this.pushWorld(`${this.name} 拜入${SECT_MAP[id].n}门下`)
    },
    leaveSect() {
      if (!this.sect) return
      const old = this.sect
      const wasOwn = this.ownSect
      this.sect = ''
      this.res.contrib = 0
      this.sectRank = 0
      this.sectRankAt = 0
      for (const n of this.npcs) {
        if (n.inSect) {
          // 自家门人：解散时不再追随，也不结仇
          n.inSect = false
          n.sect = '散修'
          if (!wasOwn) n.favor = Math.max(-100, n.favor - 100)
        } else if (!wasOwn && n.sect === old) {
          n.favor = Math.max(-100, n.favor - 100)
        }
      }
      if (wasOwn) {
        this.toast('你解散了自家宗门，门人各自散去', 'dim')
        this.pushWorld(`${this.name} 解散了亲手创立的【${old}】`)
      } else {
        this.toast('你叛出宗门，自此为散修。旧日同门视你如仇。', 'red')
        this.pushWorld(`${this.name} 叛出${old}，天下哗然`)
      }
    },
    foundSect(sname: string) {
      if (this.sect) { this.toast('你已身在宗门', 'red'); return }
      if (this.major < 5 || this.res.contrib < 100000) { this.toast('需化神修为与10万宗门贡献方可开宗立派', 'red'); return }
      this.res.contrib -= 100000
      this.sect = sname || '太初宗'
      this.sectRank = 7
      this.sectRankAt = Math.floor(Date.now() / DAY)
      this.refreshSectTasks(true)
      this.toast(`你开宗立派，创建【${this.sect}】，自任掌门！`, 'gold')
      this.pushWorld(`${this.name} 开宗立派，创立【${this.sect}】！`)
      this.pushModal('text', { title: '开宗立派', body: `恭喜！【${this.sect}】立于云巅，四方弟子来投。你自任掌门，宗门将随你的境界一同壮大。` })
      sfx.epic()
    },
    refreshSectTasks(force = false) {
      const dk = Math.floor(Date.now() / DAY)
      if (!force && this.sectTasks.lastDaily === dk) return
      this.sectTasks = {
        daily: pickN(SECT_DAILY_TASKS.map((_, i) => i), 3),
        weekly: ri(0, SECT_WEEKLY_TASKS.length - 1),
        lastDaily: dk,
        lastWeekly: Math.floor(Date.now() / WEEK),
        dailyDone: [false, false, false],
        weeklyDone: false,
      }
    },
    doSectTask(kind: 'daily' | 'weekly', idx: number) {
      if (!this.sect) { this.toast('尚未加入宗门', 'red'); return }
      this.refreshSectTasks()
      if (kind === 'daily') {
        if (!this.sectTasks.daily.length) return
        const real = this.sectTasks.daily[idx]
        if (real == null || this.sectTasks.dailyDone[idx]) { this.toast('此任务已完成', 'dim'); return }
        const t = SECT_DAILY_TASKS[real]
        const c = Math.round(ri(t.contrib[0], t.contrib[1]) * (1 + this.sectRank * 0.8) * (1 + this.sectMembers.length * 0.1))
        this.res.contrib += c
        this.sectTasks.dailyDone[idx] = true
        this.addRes('lingshi', 300)
        this.toast(`完成【${t.n}】，宗门贡献 +${c}`, 'jade')
        this.checkPromotion()
      } else {
        if (this.sectTasks.weekly < 0 || this.sectTasks.weeklyDone) { this.toast('周常已完成', 'dim'); return }
        const t = SECT_WEEKLY_TASKS[this.sectTasks.weekly]
        const c = Math.round(ri(t.contrib[0], t.contrib[1]) * (1 + this.sectRank * 0.8) * (1 + this.sectMembers.length * 0.1))
        this.res.contrib += c
        this.sectTasks.weeklyDone = true
        this.addRes('xilian', 2)
        this.addRes('gongming', 2)
        this.toast(`完成周常【${t.n}】，贡献 +${c}，洗练石+2、共鸣石+2`, 'gold')
        this.checkPromotion()
      }
    },
    checkPromotion() {
      const next = this.sectRank + 1
      if (!this.sect || next >= RANKS.length) return
      const r = RANKS[next]
      // 门槛一：贡献
      if (this.res.contrib < r.contrib) return
      // 门槛二：境界（含小境界）
      if (this.major < r.realm || (this.major === r.realm && this.phase < r.phase)) return
      // 门槛三：当前职位任期
      const dk = Math.floor(Date.now() / DAY)
      if (r.tenure > 0 && dk - (this.sectRankAt || 0) < r.tenure) {
        this.toast(`晋升【${r.n}】需在当前职位任满 ${r.tenure} 日（已任 ${dk - (this.sectRankAt || 0)} 日）`, 'dim')
        return
      }
      // 考核战斗：职位越高，考核官越强
      const enemy = makeEnemy(this.lv + 12 + next * 6, 1.15 + next * 0.06, '宗门考核官')
      const result = this.playerBattle(enemy)
      if (result.win === 'a') {
        this.sectRank = next
        this.sectRankAt = dk
        this.toast(`通过宗门考核，晋升【${r.n}】！`, 'gold')
        this.pushWorld(`${this.name} 在${this.sect}中晋升为${r.n}`)
        sfx.levelup()
      } else {
        this.toast('考核失败，来日再战（贡献保留）', 'red')
      }
    },
    sectBuy(itemId: string) {
      const it = SECT_SHOP.find(s => s.id === itemId)
      if (!it || !this.sect) return
      if (this.sectRank < it.minRank) { this.toast('职位不足，无权兑换', 'red'); return }
      const disc = RANKS[this.sectRank].disc
      const price = Math.round(it.price * disc)
      if (this.res.contrib < price) { this.toast(`宗门贡献不足（需 ${price}）`, 'red'); return }
      this.res.contrib -= price
      switch (it.kind) {
        case 'lingmai': this.addRes('lingmai', it.amount); break
        case 'lingshi': this.addRes('lingshi', it.amount); break
        case 'xilian': this.addRes('xilian', it.amount); break
        case 'gongming': this.addRes('gongming', it.amount); break
        case 'gongfaPage': this.addMat('gongfaPage', it.amount); break
        case 'fabaoPiece': this.addMat('fabaoPiece', it.amount); break
        case 'zhibaoPiece': this.addMat('zhibaoPiece', it.amount); break
        case 'egg': this.eggs.push({ id: uid(), q: clamp(ri(3, 8), 1, 16) }); break
        case 'pill_podan': this.addPill('podan', 3, 1); break
        case 'sectEquip': {
          const e = genEquip(this.eqLvBase, 7, Math.min(16, 7 + this.sectRank), { selfMined: false })
          this.acquire(e)
          break
        }
      }
      this.toast('兑换成功', 'jade')
      sfx.coin()
    },
    runSectWar() {
      if (!this.sect) { this.toast('未加入宗门', 'red'); return }
      const wk = Math.floor(Date.now() / WEEK)
      if (this.sectWarKey === wk) { this.toast('本周宗门战已参与', 'dim'); return }
      this.sectWarKey = wk
      const enemies = SECTS.filter(s => s.n !== this.sect)
      const foe = pick(enemies)
      const lines: LogLine[] = [{ t: `【宗门战】${this.sect} 对阵 ${foe.n}（五场三胜）`, c: 'l-sys' }]
      let myWins = 0
      let foeWins = 0
      const allies = pickN([...this.sectMembers, ...this.npcs.filter(n => !n.inSect && (n.sect === this.sect || n.sect === '散修'))], 4)
      for (let i = 0; i < 5; i++) {
        const foeNpc = pick(this.npcs.filter(n => !allies.includes(n)))
        const foeLv = Math.max(1, Math.floor(foeNpc.level) + ri(-1, 1))
        let win: boolean
        let name: string
        if (i === 0) {
          // 玩家出战
          const enemy = makeEnemy(this.lv, 1.1, foeNpc.name)
          const r = simulate(this.playerCombatant(), enemy)
          win = r.win === 'a'
          name = this.name
        } else {
          const ally = allies[i - 1] || pick(this.npcs)
          const a = makeEnemy(Math.max(1, Math.floor(ally.level)), 1, ally.name)
          const b = makeEnemy(foeLv, 1, foeNpc.name)
          const r = simulate(a, b)
          win = r.win === 'a'
          name = ally.name
        }
        if (win) { myWins++; lines.push({ t: `第${i + 1}场：${name} 胜 ${i === 0 ? foeNpc.name : ''}`, c: 'l-proc' }) }
        else { foeWins++; lines.push({ t: `第${i + 1}场：${name} 惜败`, c: 'l-bad' }) }
      }
      const won = myWins > foeWins
      const contrib = Math.round((won ? 1500 : 500) * (1 + this.sectRank * 0.6) * (1 + this.sectMembers.length * 0.1))
      this.res.contrib += contrib
      const rewards: string[] = [`宗门贡献 +${contrib}`]
      if (won) {
        this.addRes('xilian', 5); this.addRes('gongming', 5)
        rewards.push('宗门战宝箱：洗练石×5、共鸣石×5')
        this.addPill('podan', 2, 1)
        rewards.push('破障丹（中品）×1')
        this.pushWorld(`${this.sect} 宗门战大胜 ${foe.n}！`)
      } else {
        rewards.push('安慰宝箱：开脉石×50')
        this.addRes('lingmai', 50)
      }
      lines.push({ t: won ? `🏆 ${this.sect} 获胜！` : `💔 ${this.sect} 落败，虽败犹荣`, c: 'l-rainbow' })
      this.pushBattleView({ title: '宗门战', log: lines, win: won, rewards })
      this.pushModal('battle')
    },

    // ================= 战斗辅助 =================
    playerCombatant(): Combatant {
      const d = this.derived
      return { name: this.name, stats: { ...d.stats }, procs: d.procs, hp: d.stats.hp, isPlayer: true }
    },
    playerBattle(enemy: Combatant): BattleResult {
      return simulate(this.playerCombatant(), enemy)
    },

    // ================= 副本 =================
    dailyAttempts(id: string): { used: number; max: number } {
      const d = DUNGEONS.find(x => x.id === id)!
      if (d.special === 'tower' || d.special === 'chaos') return { used: 0, max: 999 }
      if (d.special === 'pvp') return { used: 0, max: 1 }
      const bonus = this.monthActive ? 2 : 0 // 月卡：限次副本（含周常）+2
      if (d.weekly) return { used: this.tower.weeklyCounts[id] || 0, max: d.weekly + bonus }
      return { used: this.tower.dailyCounts[id] || 0, max: (d.daily || 0) + bonus }
    },
    enterDungeon(id: string, diff: number) {
      const d = DUNGEONS.find(x => x.id === id)
      if (!d || d.special) return
      const at = this.dailyAttempts(id)
      if (at.used >= at.max) { this.toast('今日/本周次数已尽', 'red'); return }
      if (id === 'jianzhong' && this.res.jianling < 1) { this.toast('需剑冢令×1（日常/坊市可得）', 'red'); return }
      if (id === 'hantan' && this.res.xingyun < 1) { this.toast('需星陨石×1（日常/坊市可得）', 'red'); return }
      if (id === 'jianzhong') this.res.jianling -= 1
      if (id === 'hantan') this.res.xingyun -= 1
      const df = DIFFS[diff]
      const lines: LogLine[] = [{ t: `【${d.n}·${df.n}】你踏入其中，阴风阵阵。`, c: 'l-sys' }]
      let win = true
      const waves = diff >= 2 ? 3 : 2
      let remainPct = 100
      for (let w = 0; w < waves; w++) {
        const enemyName = pick(d.enemies) + (w === waves - 1 ? '·首领' : '')
        const lv = Math.max(0, this.lv + df.lvOff)
        const enemy = makeEnemy(lv, df.mult * (w === waves - 1 ? 1.4 : 1), enemyName, { boss: w === waves - 1 })
        const r = simulate(this.playerCombatant(), enemy)
        lines.push(...r.log)
        if (r.win !== 'a') { win = false; break }
        remainPct = r.aHpPct
      }
      const rewards: string[] = []
      if (win) {
        rewards.push(...this.dungeonRewards(id, diff))
        this.tower.cleared[`${id}_${diff}`] = true
        this.addTaskProgress('dungeon', 1)
      } else {
        this.injured = Math.max(this.injured, 300)
        lines.push({ t: '你力竭败退，侥幸保住性命……', c: 'l-rainbow' })
      }
      if (d.weekly) this.tower.weeklyCounts[id] = (this.tower.weeklyCounts[id] || 0) + 1
      else this.tower.dailyCounts[id] = (this.tower.dailyCounts[id] || 0) + 1
      this.pushBattleView({ title: `${d.n}·${df.n}`, log: lines, win, rewards })
      this.pushModal('battle')
      if (win) { sfx.success() } else { sfx.fail() }
      void remainPct
    },
    dungeonRewards(id: string, diff: number): string[] {
      const df = DIFFS[diff]
      const lv = this.lv
      const eqLv = Math.min(460, this.eqLvBase + diff * 20) // 装备等级随境界（难度加成）
      const rw: string[] = []
      const act = this.activity
      const add = (key: string, n: number, label: string) => { this.addRes(key, n); rw.push(`${label}×${n}`) }
      const addM = (m: string, n: number) => { this.addMat(m, n); rw.push(`${MAT_MAP[m].n}×${n}`) }
      const times = Math.max(1, Math.round(df.rw))
      switch (id) {
        case 'kuangku':
          add('lingmai', Math.round((30 + lv * 0.75) * df.rw), '开脉石')
          add('lingshi', Math.round(200 * Math.pow(1.02225, lv) * df.rw), '灵石')
          { const e = genEquip(eqLv, Math.min(16, 2 + diff), Math.min(16, 5 + diff * 2), {}); this.acquire(e, true); rw.push(`${qName(e.q)}·${e.name}`) }
          if (chance(0.4)) addM('yaozhu', ri(1, 2))
          if (chance(0.25)) add('gaiming', 1, '改命石')
          if (chance(0.15)) add('pvpTicket', 1, '论道帖')
          break
        case 'jianzhong':
          addM('jianyi', ri(1, 3) * times)
          if (chance(0.4)) add('gaiming', 1, '改命石')
          for (let i = 0; i < 2; i++) { const e = genEquip(eqLv, Math.min(16, 3 + diff), Math.min(16, 6 + diff * 2), { slot: 'weapon' }); this.acquire(e, true); rw.push(`${qName(e.q)}·${e.name}`) }
          break
        case 'hantan':
          if (chance(0.35)) add('gaiming', 1, '改命石')
          for (let i = 0; i < 2; i++) { const e = genEquip(eqLv, Math.min(16, 3 + diff), Math.min(16, 6 + diff * 2), { slot: pick(['armor', 'helm', 'belt']) }); this.acquire(e, true); rw.push(`${qName(e.q)}·${e.name}`) }
          break
        case 'youlins': {
          const eggBoost = act?.id === 'beast' ? 2 : 1
          const n = ri(1, 2) * eggBoost
          for (let i = 0; i < n; i++) this.eggs.push({ id: uid(), q: clamp(ri(1 + diff, 5 + diff * 2) + (act?.id === 'beast' ? 3 : 0), 1, 16) })
          rw.push(`灵兽蛋×${n}`)
          addM('shouhun', ri(2, 5) * times)
          addM('yaozhu', ri(3, 6) * times)
          if (chance(0.06 + diff * 0.02)) {
            const fd = catchRoll(0)
            this.absorbFamiliar(fd.id)
            rw.push(`精怪【${fd.n}】`)
          }
          break
        }
        case 'danxia':
          addM(pick(['ningcao', 'chishen', 'yuzhi']), ri(3, 7) * times)
          if (chance(0.25)) addM('danfang', 1)
          if (chance(0.2)) addM(pick(['seed1', 'seed2', 'seed3']), 1)
          break
        case 'qihun':
          addM('fabaoPiece', ri(2, 5) * times)
          add('qihun', Math.round((8 + Math.floor(lv * 0.1)) * df.rw), '器魂')
          break
        case 'langhuan':
          addM('gongfaPage', ri(2, 4) * times)
          if (chance(0.15)) { const pool = TECHNIQUES.filter(t => t.tier <= 3 + diff); this.learnTechById(pick(pool).id) }
          break
        case 'leiyuan':
          addM(pick(['longxian', 'taichu', 'longxue']), ri(1, 2) * times)
          if (act?.id === 'trib') addM('taichu', 1)
          if (chance(0.3)) this.addPill('dujie', 2, 1)
          if (chance(0.3)) rw.push('渡劫丹（中品）×1')
          break
        case 'guxu':
          { const e = genEquip(eqLv, Math.min(16, 10 + diff), Math.min(16, 12 + diff), { forceRune: true }); this.acquire(e, true); rw.push(`灵纹·${qName(e.q)}·${e.name}`) }
          if (chance(0.25)) addM('zhibaoPiece', 1)
          if (chance(0.3)) add('gaiming', 1, '改命石')
          break
        default: break
      }
      // 通用掉落
      add('lingshi', Math.round(100 * Math.pow(1.02458, lv) * df.rw), '灵石')
      if (chance(0.3)) { add('sweep', 1, '扫荡券') }
      this.pushLog(`副本奖励：${rw.join('、')}`, 'jade')
      return rw
    },
    sweepDungeon(id: string, diff: number) {
      const key = `${id}_${diff}`
      if (!this.tower.cleared[key]) { this.toast('尚未通关此难度，无法扫荡', 'red'); return }
      const d = DUNGEONS.find(x => x.id === id)
      const at = this.dailyAttempts(id)
      if (at.used >= at.max) { this.toast('今日/本周次数已尽', 'red'); return }
      if (!this.monthActive) {
        if (this.res.sweep < 1) { this.toast('扫荡券不足（月卡可免券扫荡）', 'red'); return }
        this.res.sweep--
      }
      const rw = this.dungeonRewards(id, diff)
      this.addTaskProgress('sweep', 1)
      if (d?.weekly) this.tower.weeklyCounts[id] = (this.tower.weeklyCounts[id] || 0) + 1
      else this.tower.dailyCounts[id] = (this.tower.dailyCounts[id] || 0) + 1
      this.toast(`扫荡完成${this.monthActive ? '（月卡免券）' : ''}：${rw.join('、')}`, 'jade')
      sfx.coin()
    },
    sweepAll() {
      let n = 0
      for (const d of DUNGEONS) {
        if (d.special || !d.daily) continue
        if (!this.tower.cleared[`${d.id}_0`]) continue
        while (n < 40) {
          if (!this.monthActive && this.res.sweep < 1) break
          const at = this.dailyAttempts(d.id)
          if (at.used >= at.max) break
          this.sweepDungeon(d.id, 0)
          n++
        }
        if (!this.monthActive && this.res.sweep < 1) break
        if (n >= 40) break
      }
      if (!n) this.toast(`没有可扫荡的副本（需已通关·有余次${this.monthActive ? '' : '·有扫荡券'}）`, 'dim')
      else this.toast(`一键扫荡完成：共 ${n} 次${this.monthActive ? '（月卡免券）' : `，剩余扫荡券 ${this.res.sweep}`}`, 'jade')
    },
    autoEquipBest() {
      const map = this.equipMap
      let n = 0
      for (const s of SLOTS) {
        // 只使用未被其它分身占用的装备
        const candidates = this.inventory.filter(e => {
          if (e.slot !== s) return false
          const o = this.wornBodyOf(e.id)
          return !o || o === this.clones.active
        })
        if (!candidates.length) continue
        const best = candidates.reduce((a, b) => (a.score > b.score ? a : b))
        const curId = map[s]
        const cur = curId != null ? this.inventory.find(x => x.id === curId) : null
        if (!cur || best.score > cur.score) {
          map[s] = best.id
          n++
        }
      }
      this.toast(n ? `已自动穿戴 ${n} 件更高评分装备` : '当前已是最优配置', n ? 'jade' : 'dim')
      sfx.click()
    },
    // ================= 镇妖九重塔（肉鸽爬塔 · 每日重置） =================
    // 每层十关：第 5 关妖将，第 10 关层妖王；通关一层后三选一本日爬塔增幅
    towerEnemy(f: number): Combatant {
      const layer = tLayerOf(f)
      const stage = tStageOf(f)
      const isWang = stage === 10
      const isJiang = stage === 5
      const lv = Math.min(439, 20 + Math.floor(f * 5.6))
      const mult = 1 + f * 0.045 + (isWang ? 0.5 : isJiang ? 0.15 : 0)
      const name = isWang ? `第${layer}层·镇塔妖王` : isJiang ? `第${layer}层·妖将` : `第${layer}层·第${stage}关 妖卒`
      const enemy = makeEnemy(lv, mult, name, { boss: isWang || isJiang })
      if (isWang) {
        // 层妖王：更高抗性 + 专属神通
        enemy.stats.resistStun = 22
        enemy.stats.resistCrit = 12
        enemy.stats.resistCombo = 12
        enemy.procs.push({ id: 'tw1', name: '妖王怒啸', trigger: 'attack', chance: 0.22, desc: '妖王暴怒，额外撕碎一击', eff: { t: 'dmg', mult: 0.5 } })
      }
      return enemy
    },
    // 爬塔出战：叠加上本日已选增幅后的战斗属性
    towerPlayer(): Combatant {
      const d = this.derived
      const s = { ...d.stats }
      for (const id of this.tower.buffs) {
        const b = TOWER_BUFF_MAP[id]
        if (b) b.apply(s)
      }
      return { name: this.name, stats: s, procs: d.procs, hp: s.hp, isPlayer: true }
    },
    offerTowerBuff(layer: number) {
      this.tower.offer = { layer, ids: rollTowerOffer() }
      this.pushModal('towerpick')
    },
    pickTowerBuff(idx: number) {
      const off = this.tower.offer
      if (!off) return
      const id = off.ids[idx]
      if (!id) return
      this.tower.buffs.push(id)
      this.tower.offer = null
      const b = TOWER_BUFF_MAP[id]
      this.toast(`获得爬塔增幅【${b ? b.n : id}】：${b ? b.d : ''}`, 'gold')
      this.closeModal()
      sfx.click()
    },
    towerGrant(floor: number, ratio = 1): { xl: number; gm: number; ls: number } {
      const xl = Math.round((2 + Math.floor(floor / 3)) * ratio)
      const gm = Math.round((1 + Math.floor(floor / 4)) * ratio)
      const ls = Math.round(300 * Math.pow(1.09, floor) * ratio)
      this.addRes('xilian', xl)
      this.addRes('gongming', gm)
      this.addRes('lingshi', ls)
      return { xl, gm, ls }
    },
    enterTower() {
      if (this.tower.offer) { this.toast('请先选择爬塔增幅', 'gold'); this.pushModal('towerpick'); return }
      const f = this.tower.floor
      const layer = tLayerOf(f)
      const stage = tStageOf(f)
      const isWang = stage === 10
      const enemy = this.towerEnemy(f)
      const r = simulate(this.towerPlayer(), enemy)
      const rewards: string[] = []
      let clearedLayer = false
      if (r.win === 'a') {
        this.tower.floor = f + 1
        if (f > this.tower.best) this.tower.best = f
        const g = this.towerGrant(f)
        this.evtAdd('tower')
        rewards.push(`洗练石×${g.xl}`, `共鸣石×${g.gm}`, `灵石×${fmt(g.ls)}`)
        if (stage === 5) { this.addRes('pvpTicket', 2); rewards.push('论道帖×2') }
        if (isWang) {
          this.addRes('pvpTicket', 2)
          this.addRes('xianyu', 2)
          rewards.push('论道帖×2', '仙玉×2')
          clearedLayer = true
        }
        if ((stage === 3 || stage === 8) && chance(0.5)) { this.addRes('gaiming', 1); rewards.push('改命石×1') }
        sfx.success()
      } else {
        this.toast('挑战失败，可用「连战」或明日扫荡再战', 'red')
      }
      this.pushBattleView({ title: `镇妖九重塔 · 第${layer}层·第${stage}关${isWang ? '（妖王）' : ''}`, log: r.log, win: r.win === 'a', rewards })
      this.pushModal('battle')
      if (clearedLayer) this.offerTowerBuff(layer)
    },
    towerAuto() {
      if (this.tower.offer) { this.toast('请先选择爬塔增幅', 'gold'); this.pushModal('towerpick'); return }
      const MAX = 60
      const start = this.tower.floor
      const totals = { xl: 0, gm: 0, ls: 0, tk: 0, xy: 0, gm2: 0 }
      const lines: LogLine[] = []
      let fought = 0, lost = false, clearedLayer = 0
      let lastLog: LogLine[] = []
      while (fought < MAX) {
        const f = this.tower.floor
        const layer = tLayerOf(f)
        const stage = tStageOf(f)
        const enemy = this.towerEnemy(f)
        const r = simulate(this.towerPlayer(), enemy)
        fought++
        if (r.win !== 'a') { lost = true; lastLog = r.log; lines.push({ t: `—— 第${layer}层·第${stage}关挑战失败，连战止步 ——`, c: 'l-bad' }); break }
        this.tower.floor = f + 1
        if (f > this.tower.best) this.tower.best = f
        const g = this.towerGrant(f)
        totals.xl += g.xl
        totals.gm += g.gm
        totals.ls += g.ls
        if (stage === 5) { this.addRes('pvpTicket', 2); totals.tk += 2; lines.push({ t: `第${layer}层·妖将伏诛（论道帖×2）`, c: 'l-proc' }) }
        if (stage === 10) {
          this.addRes('pvpTicket', 2)
          this.addRes('xianyu', 2)
          totals.tk += 2
          totals.xy += 2
          lines.push({ t: `第${layer}层·妖王伏诛！通关此层（论道帖×2 · 仙玉×2）`, c: 'l-proc' })
          clearedLayer = layer
          break
        }
        if ((stage === 3 || stage === 8) && chance(0.5)) { this.addRes('gaiming', 1); totals.gm2++; lines.push({ t: `第${layer}层·第${stage}关寻得改命石×1`, c: 'l-heal' }) }
      }
      const done = this.tower.floor - 1
      this.evtAdd('tower', Math.max(0, fought - (lost ? 1 : 0)))
      lines.unshift({ t: `连战 ${fought} 场，胜 ${fought - (lost ? 1 : 0)} 场，推进至 第${tLayerOf(this.tower.floor)}层·第${tStageOf(this.tower.floor)}关${clearedLayer ? `（通关第${clearedLayer}层！）` : ''}${fought >= MAX && !lost && !clearedLayer ? '（连胜止于 60 场，可再次连战）' : ''}`, c: 'l-sys' })
      if (lost && lastLog.length) lines.push(...lastLog.slice(-22))
      const rewards = [`洗练石×${totals.xl}`, `共鸣石×${totals.gm}`, `灵石×${fmt(totals.ls)}`]
      if (totals.tk) rewards.push(`论道帖×${totals.tk}`)
      if (totals.xy) rewards.push(`仙玉×${totals.xy}`)
      if (totals.gm2) rewards.push(`改命石×${totals.gm2}`)
      const title = done + 1 > start ? `镇妖连战 · 第${tLayerOf(start)}层 → 第${tLayerOf(done + 1)}层` : `镇妖连战 · 第${tLayerOf(start)}层`
      this.pushBattleView({ title, log: lines, win: !lost, rewards })
      this.pushModal('battle')
      if (clearedLayer) this.offerTowerBuff(clearedLayer)
      if (!lost) sfx.success()
    },
    towerSweep() {
      const max = this.towerSweepMax
      if (this.tower.swept >= max) { this.toast('今日扫荡已用尽（明日 0 点重置，月卡可 +1）', 'dim'); return }
      const from = this.tower.floor
      const best = this.tower.best
      if (best < from) { this.toast('当前进度已超过历史最高，继续向上挑战吧', 'dim'); return }
      this.tower.swept++
      let xl = 0, gm = 0, ls = 0
      for (let f = from; f <= best; f++) {
        const r = this.towerGrant(f, 0.6)
        xl += r.xl
        gm += r.gm
        ls += r.ls
      }
      this.tower.floor = best + 1
      this.toast(`扫荡至历史最高（第${tLayerOf(best)}层·第${tStageOf(best)}关）：洗练石×${xl} · 共鸣石×${gm} · 灵石×${fmt(ls)}（剩 ${max - this.tower.swept} 次）`, 'jade')
      sfx.coin()
    },

    // ================= 妖王殿（世界妖王 · 伤害榜） =================
    // 妖王血量极厚不可击败；每日 0 点按对你的累计伤害排名发放奖励
    yaoSpec() {
      const dayKey = this.dayKey
      const [i, j] = yaoTraitIdx(dayKey)
      const lv = Math.min(439, 32 + Math.floor(this.lv * 0.6))
      const hp = Math.round(baseHp(lv) * 900)
      return { name: yaoName(dayKey), traits: [YAO_TRAITS[i], YAO_TRAITS[j]], idx: [i, j] as [number, number], lv, hp }
    },
    yaoEnemy(): Combatant {
      const s = this.yaoSpec()
      const enemy = makeEnemy(s.lv, 1, s.name, { boss: true })
      // 世界妖王：血量极厚（不可击败），攻击平平——比拼的是持续输出
      enemy.stats.hp = s.hp
      enemy.hp = s.hp
      enemy.stats.atk = Math.round(enemy.stats.atk * 0.55)
      // 不携带护盾神通（否则巨额护盾会把伤害全部吞掉，伤害榜失真）
      enemy.procs = enemy.procs.filter(p => p.id !== 'e4')
      enemy.stats.resistStun = 20
      enemy.stats.resistCrit = 12
      enemy.stats.resistCombo = 12
      enemy.stats.resistCounter = 8
      enemy.stats.resistLifesteal = 15
      for (const k of s.idx) YAO_TRAITS[k].apply(enemy.stats)
      enemy.procs.push({ id: 'yw1', name: '妖王怒啸', trigger: 'attack', chance: 0.22, desc: '妖王暴怒，撕裂目标', eff: { t: 'dmg', mult: 0.5 } })
      if (chance(0.5)) enemy.procs.push({ id: 'yw2', name: '妖缚', trigger: 'attack', chance: 0.16, desc: '妖气缠绕，禁锢一回合', eff: { t: 'stun', rounds: 1 } })
      return enemy
    },
    yaoChallenge() {
      const max = this.yaoTriesMax
      if (this.yao.used >= max) { this.toast('今日挑战次数已尽（月卡可 +1），明日再战', 'red'); return }
      const s = this.yaoSpec()
      const enemy = this.yaoEnemy()
      this.yao.used++
      const r = simulate(this.playerCombatant(), enemy)
      const dmg = Math.max(0, Math.round(s.hp - r.bHpLeft))
      this.yao.dmg += dmg
      const rank = this.yaoRank
      const leftPct = (Math.max(0, r.bHpLeft) / s.hp * 100).toFixed(1)
      const rewards = [`造成伤害 ${fmt(dmg)}`, `妖王余血 ${leftPct}%`, `今日累计 ${fmt(this.yao.dmg)} · 当前第 ${rank} 名`, '伤害榜奖励每日 0 点结算发放']
      this.pushBattleView({ title: `妖王殿 · ${s.name}`, log: r.log, win: r.win === 'a', rewards })
      this.pushModal('battle')
      sfx.click()
      this.checkTitles()
    },
    // ================= 仙武论道台（天梯排名赛） =================
    pvpMatch() {
      if (this.res.pvpTicket < 1) { this.toast('论道帖不足——挖灵脉有概率获得，战令/仙武商店也可兑换', 'red'); return }
      this.res.pvpTicket--
      const pts0 = this.pvp.points
      const tierIdx = pvpTierIdx(pts0)
      const foeName = rivalName()
      const lv = Math.max(0, Math.min(439, this.lv + ri(-12, 20)))
      const enemy = makeEnemy(lv, 1, `论道对手·${foeName}`, { proc: true })
      // 对手强度跟随你的战力与天梯分：段位越高对手越难
      const target = this.derived.power * clamp(0.8 + pts0 / 2200, 0.8, 1.2) * rf(0.94, 1.06)
      const raw = Math.max(1, calcPower(enemy.stats, 0))
      const k = clamp(target / raw, 0.15, 60)
      enemy.stats.atk = Math.round(enemy.stats.atk * k)
      enemy.stats.def = Math.round(enemy.stats.def * k)
      enemy.stats.hp = Math.round(enemy.stats.hp * k)
      enemy.hp = enemy.stats.hp
      const r = simulate(this.playerCombatant(), enemy)
      const rewards: string[] = []
      const tierName = PVP_TIERS[tierIdx].n
      const dbl = this.activity?.id === 'wudao' ? 2 : 1
      if (r.win === 'a') {
        const gain = (16 + ri(0, 8) + tierIdx * 2) * dbl
        this.pvp.points += gain
        this.pvp.wins++
        const xw = (30 + tierIdx * 5) * dbl
        this.addRes('xianwu', xw)
        rewards.push(`论道积分 +${gain}${dbl > 1 ? '（活动双倍）' : ''}`, `仙武积分 +${xw}`)
        const nr0 = pvpRank(pts0)
        const nr = pvpRank(this.pvp.points)
        if (nr < nr0) rewards.push(`天梯排名 ${nr0} → ${nr}`)
        const newTier = pvpTierIdx(this.pvp.points)
        if (newTier > tierIdx) rewards.push(`晋级「${PVP_TIERS[newTier].n}」段位！`)
        sfx.success()
      } else {
        const loss = Math.max(6, 10 + ri(0, 6) - tierIdx)
        this.pvp.points = Math.max(0, this.pvp.points - loss)
        this.pvp.losses++
        const xw = 10 + tierIdx * 2
        this.addRes('xianwu', xw)
        rewards.push(`论道积分 -${loss}`, `仙武积分 +${xw}`)
        this.injured = Math.max(this.injured, 150)
        sfx.fail()
      }
      this.addTaskProgress('pvp', 1)
      this.pushBattleView({ title: `论道台 · ${tierName}段对局`, log: r.log, win: r.win === 'a', rewards })
      this.pushModal('battle')
    },
    npcDeclineDuel(id: number) {
      const n = this.npcs.find(x => x.id === id)
      if (!n) return
      n.favor = Math.max(0, n.favor - 2)
      this.toast(`你婉拒了「${n.real}」的切磋邀约（好感 -2）`, 'dim')
    },
    runChaos() {
      if (!this.chaosOpen) { this.toast('混沌之门未到开启之时（每旬末开启）', 'red'); return }
      const ck = this.cycleKey
      if (this.chaosDoneKey === ck) { this.toast('本期混沌之门已探索', 'dim'); return }
      this.chaosDoneKey = ck
      const enemy = makeEnemy(Math.min(439, this.lv + 32), 1.6, '混沌之子', { boss: true })
      const r = simulate(this.playerCombatant(), enemy)
      const rewards: string[] = []
      if (r.win === 'a') {
        rewards.push('至宝碎片×2', '拍卖令×2')
        this.addMat('zhibaoPiece', 2)
        this.addRes('auction', 2)
        for (const k of ['lingshi', 'lingmai', 'xilian', 'gongming', 'qihun']) {
          const n = k === 'lingshi' ? 50000 : 100
          this.addRes(k, n)
          rewards.push(`${k} +${n}`)
        }
        this.getTreasure(12, 15)
        rewards.push('法宝（高阶）')
      }
      this.pushBattleView({ title: '混沌之门', log: r.log, win: r.win === 'a', rewards })
      this.pushModal('battle')
    },

    // ================= 坊市 =================
    refreshMarket(force = false) {
      const dk = Math.floor(Date.now() / DAY)
      if (!force && this.market.dayKey === dk) return
      this.market.dayKey = dk
      // 摆摊
      const n = ri(8, 12)
      const stalls: Stall[] = []
      for (let i = 0; i < n; i++) {
        const items: StallItem[] = []
        const cnt = ri(1, 3)
        for (let j = 0; j < cnt; j++) {
          const kind = weighted([
            { w: 26, v: 'equip' as const }, { w: 14, v: 'pill' as const }, { w: 13, v: 'material' as const },
            { w: 12, v: 'token' as const }, { w: 10, v: 'beastmat' as const }, { w: 8, v: 'veinmat' as const },
            { w: 8, v: 'fragment' as const }, { w: 9, v: 'egg' as const }, { w: 8, v: 'page' as const },
          ])
          const priceMod = rf(0.7, 1.3) * (1 - this.attrs.meiLi * 0.008)
          if (kind === 'equip') {
            const qmax = Math.min(16, 3 + Math.floor(this.major * 1.2))
            const e = genEquip(Math.max(1, this.eqLvBase + ri(-8, 8)), 1, qmax, { selfMined: false })
            refreshScore(e)
            items.push({ kind, payload: e, price: Math.round(e.score * 0.8 * priceMod + 50), haggled: 0 })
          } else if (kind === 'pill') {
            const q = ri(1, 4)
            const id = pick(['juling', 'liaoshang', 'podan', 'zengshou'])
            items.push({ kind, payload: { id, q }, price: Math.round(120 * Math.pow(2, q) * priceMod), haggled: 0 })
          } else if (kind === 'material') {
            const m = pick(MATERIALS.filter(x => x.type !== 'misc' || chance(0.5)))
            const num = ri(3, 9)
            items.push({ kind, payload: { id: m.id, n: num }, price: Math.round(30 * num * priceMod), haggled: 0 })
          } else if (kind === 'token') {
            const tok = pick(['gaiming', 'pvpTicket', 'jianling', 'xingyun', 'auction', 'sweep', 'gachaTicket'])
            const base: Record<string, number> = { gaiming: 880, pvpTicket: 460, jianling: 240, xingyun: 240, auction: 380, sweep: 170, gachaTicket: 420 }
            items.push({ kind: 'res', payload: { key: tok, n: 1 }, price: Math.round(base[tok] * rf(0.9, 1.25) * priceMod), haggled: 0 })
          } else if (kind === 'beastmat') {
            const bm = pick([{ id: 'yaozhu', n: ri(3, 6) }, { id: 'shouhun', n: ri(3, 8) }, { id: 'lingye', n: ri(4, 8) }])
            items.push({ kind: 'material', payload: bm, price: Math.round(60 * bm.n * priceMod), haggled: 0 })
          } else if (kind === 'veinmat') {
            const num = ri(2, 4)
            items.push({ kind: 'material', payload: { id: 'longsui', n: num }, price: Math.round(220 * num * priceMod), haggled: 0 })
          } else if (kind === 'fragment') {
            const num = ri(2, 5)
            items.push({ kind, payload: { id: 'fabaoPiece', n: num }, price: Math.round(180 * num * priceMod), haggled: 0 })
          } else if (kind === 'egg') {
            const q = clamp(ri(1, 6) + Math.floor(this.major / 2), 1, 16)
            items.push({ kind, payload: { q }, price: Math.round(400 * q * priceMod), haggled: 0 })
          } else {
            items.push({ kind, payload: { id: 'gongfaPage', n: ri(1, 3) }, price: Math.round(260 * priceMod), haggled: 0 })
          }
        }
        const names = ['散人摊位', '李家灵铺', '游方货郎', '幽兰阁', '玄机摊', '拾遗小铺', '炼心斋', '百草摊', '金石铺', '藏宝轩', '无名摊', '南市老铺']
        stalls.push({ id: uid(), name: pick(names), items })
      }
      this.market.stalls = stalls
      // 寄售行（NPC 挂牌）
      const consign: ConsignListing[] = []
      for (let i = 0; i < 6; i++) {
        const qmax = Math.min(16, 4 + Math.floor(this.major * 1.3))
        const e = genEquip(Math.max(1, this.eqLvBase + ri(-8, 8)), 1, qmax, { selfMined: false })
        refreshScore(e)
        consign.push({ id: uid(), payload: e, kind: 'equip', name: e.name, q: e.q, price: Math.round(e.score * 0.9 * rf(0.8, 1.2)), mine: false })
      }
      this.market.consign = consign
      // 以物易物
      const barter: BarterOffer[] = []
      const bn = ri(3, 5)
      for (let i = 0; i < bn; i++) {
        const minQ = ri(2, Math.min(10, 2 + this.major * 2))
        const cnt = ri(2, 4)
        const givePool = [
          { kind: 'pill', payload: { id: pick(['podan', 'zengshou', 'juling']), q: 3 }, desc: '上品丹药×1' },
          { kind: 'egg', payload: { q: clamp(ri(2, 8), 1, 16) }, desc: '灵兽蛋×1' },
          { kind: 'mat', payload: { id: 'fabaoPiece', n: 3 }, desc: '法宝碎片×3' },
          { kind: 'page', payload: { id: 'gongfaPage', n: 3 }, desc: '功法残页×3' },
          { kind: 'res', payload: { key: 'lingshi', n: 5000 }, desc: '灵石×5000' },
        ]
        const give = pick(givePool)
        barter.push({
          id: uid(),
          wantDesc: `${cnt}件${qName(minQ)}(${minQ})级以上装备`,
          wantCount: cnt,
          wantFilter: { type: 'equip', minQ },
          giveDesc: give.desc,
          give: { kind: give.kind, payload: give.payload },
          done: false,
        })
      }
      this.market.barter = barter
    },
    haggle(stallId: number, idx: number) {
      const st = this.market.stalls.find(s => s.id === stallId)
      if (!st) return
      const it = st.items[idx]
      if (it.haggled !== 0) { this.toast('每个摊位只可议价一次', 'dim'); return }
      const p = 0.35 + this.attrs.meiLi * 0.02 + this.attrs.qiYun * 0.01
      if (chance(p)) {
        it.price = Math.round(it.price * rf(0.7, 0.9))
        it.haggled = 2
        this.toast('巧舌如簧，摊主无奈降价！', 'jade')
      } else {
        it.price = Math.round(it.price * 1.05)
        it.haggled = 1
        this.toast('摊主面有愠色，价格反而涨了 5%', 'red')
      }
    },
    buyStall(stallId: number, idx: number) {
      const st = this.market.stalls.find(s => s.id === stallId)
      if (!st) return
      const it = st.items[idx]
      if (this.res.lingshi < it.price) { this.toast('灵石不足', 'red'); return }
      this.res.lingshi -= it.price
      this.grantStallItem(it)
      st.items.splice(idx, 1)
      sfx.coin()
    },
    grantStallItem(it: StallItem) {
      if (it.kind === 'equip') { this.acquire(it.payload as Equip, true); this.toast('购得装备一件', 'jade') }
      else if (it.kind === 'pill') { const p = it.payload as { id: string; q: number }; this.addPill(p.id, p.q); this.toast(`购得${PILL_MAP[p.id].n}（${PILL_QNAMES[p.q]}）`, 'jade') }
      else if (it.kind === 'material' || it.kind === 'fragment' || it.kind === 'page') { const p = it.payload as { id: string; n: number }; this.addMat(p.id, p.n); this.toast(`购得${MAT_MAP[p.id].n}×${p.n}`, 'jade') }
      else if (it.kind === 'egg') { const p = it.payload as { q: number }; this.eggs.push({ id: uid(), q: p.q }); this.toast('购得灵兽蛋', 'jade') }
      else if (it.kind === 'res') { const p = it.payload as { key: string; n: number }; this.addRes(p.key, p.n); this.toast(`购得${RES_LABEL[p.key] || p.key}×${p.n}`, 'jade') }
    },
    listConsign(equipId: number, price: number) {
      const e = this.inventory.find(x => x.id === equipId)
      if (!e) return
      if (this.wornByAll.has(equipId)) { this.toast('请先卸下装备', 'red'); return }
      this.inventory = this.inventory.filter(x => x.id !== equipId)
      this.market.myConsign.push({ id: uid(), payload: e, kind: 'equip', name: e.name, q: e.q, price, mine: true })
      this.toast(`「${e.name}」已寄售，作价 ${fmt(price)} 灵石（手续费 8%）`, 'jade')
    },
    cancelConsign(id: number) {
      const i = this.market.myConsign.findIndex(x => x.id === id)
      if (i < 0) return
      this.acquire(this.market.myConsign[i].payload as Equip, true)
      this.market.myConsign.splice(i, 1)
      this.toast('已下架寄售物品', 'dim')
    },
    consignTick(dt: number) {
      if (!this.market.myConsign.length) return
      for (const c of [...this.market.myConsign]) {
        const e = c.payload as Equip
        const value = Math.max(1, e.score * 0.8)
        const ratio = c.price / value
        const p = clamp(1.3 - ratio, 0, 0.9) * dt / 600 // 10 分钟一判
        if (chance(p)) {
          const gain = Math.round(c.price * 0.92)
          this.addRes('lingshi', gain)
          this.market.myConsign = this.market.myConsign.filter(x => x.id !== c.id)
          this.toast(`寄售成交！「${c.name}」售出，税后入账 ${fmt(gain)} 灵石`, 'gold')
          sfx.coin()
        }
      }
    },
    buyConsign(id: number) {
      const c = this.market.consign.find(x => x.id === id)
      if (!c) return
      if (this.res.lingshi < c.price) { this.toast('灵石不足', 'red'); return }
      this.res.lingshi -= c.price
      const e = c.payload as Equip
      e.selfMined = false
      this.acquire(e, true)
      this.market.consign = this.market.consign.filter(x => x.id !== id)
      this.toast(`购得「${e.name}」`, 'jade')
      sfx.coin()
    },
    refreshAuction(force = false) {
      const ck = this.cycleKey
      const d = (Date.now() / DAY) % CYCLE_DAYS
      const open = d >= 0 && d < 2.5 // 每旬前 2.5 天
      if (!open && !force) return false
      if (this.market.auctionKey === ck && this.market.lots.length) return true
      this.market.auctionKey = ck
      this.market.auctionDone = false
      const lots: AuctionLot[] = []
      const n = ri(4, 6)
      for (let i = 0; i < n; i++) {
        const qmax = Math.min(16, 6 + Math.floor(this.major * 1.5))
        const roll = rnd()
        if (roll < 0.5) {
          const e = genEquip(Math.max(1, this.eqLvBase + ri(4, 12)), qmax - 2, qmax, { selfMined: false })
          refreshScore(e)
          lots.push({ payload: e, kind: 'equip', name: e.name, q: e.q, price: Math.round(e.score * 1.1), npcMax: Math.round(e.score * rf(1.2, 2.2)), sold: false, shill: 0 })
        } else if (roll < 0.75) {
          const e = genEquip(Math.max(1, this.eqLvBase + ri(8, 16)), qmax, qmax, { forceRune: true, selfMined: false })
          refreshScore(e)
          lots.push({ payload: e, kind: 'equip', name: e.name, q: e.q, price: Math.round(e.score * 1.3), npcMax: Math.round(e.score * rf(1.5, 2.6)), sold: false, shill: 0 })
        } else {
          const treasure = pick(TREASURES.filter(t => t.q >= 10))
          lots.push({ payload: treasure, kind: 'treasure', name: treasure.n, q: treasure.q, price: ri(8000, 20000), npcMax: ri(12000, 40000), sold: false, shill: 0 })
        }
      }
      this.market.lots = lots
      return true
    },
    bidAuction(idx: number) {
      const lot = this.market.lots[idx]
      if (!lot || lot.sold) return
      const bid = Math.round(lot.price * 1.12)
      if (this.res.lingshi < bid) { this.toast('灵石不足', 'red'); return }
      const shillP = lot.shill === 0 ? 0.5 : 0.22
      if (chance(shillP) && bid < lot.npcMax) {
        lot.price = Math.round(bid * rf(1.06, 1.18))
        lot.shill++
        this.toast(chance(0.4) ? '似乎有托儿在抬价……' : '有人与你相争，价格水涨船高', 'dim')
        return
      }
      // 落槌
      this.res.lingshi -= bid
      lot.sold = true
      lot.price = bid
      if (lot.kind === 'equip') { const e = lot.payload as Equip; e.selfMined = false; this.acquire(e, true); this.toast(`🔨 落槌！你拍下「${lot.name}」，花费 ${fmt(bid)} 灵石`, 'gold') }
      else { const t = lot.payload as { id: string; n: string; q: number }; this.treasures.push({ id: uid(), name: t.n, q: t.q, level: 1, stars: 1 }); this.toast(`🔨 落槌！你拍下法宝【${t.n}】`, 'gold') }
      if (this.attrs.qiYun > 10 && chance(this.attrs.qiYun * 0.008)) {
        this.addRes('lingshi', Math.round(bid * 0.3))
        this.toast('气运加持，捡漏！返还三成灵石', 'gold')
      }
      sfx.rare()
    },
    refreshBm(force = false) {
      const dk = Math.floor(Date.now() / DAY)
      const unlocked = this.attrs.yeLi > 50 || this.sect === '幽冥宗' || this.align === '魔'
      if (!unlocked) return
      if (!force && this.market.bmKey === dk) return
      this.market.bmKey = dk
      const goods: typeof this.market.bmGoods = []
      for (let i = 0; i < 6; i++) {
        const roll = rnd()
        if (roll < 0.35) {
          const qmax = Math.min(16, 6 + Math.floor(this.major * 1.6))
          const e = genEquip(Math.max(1, this.eqLvBase + ri(-8, 8)), qmax - 1, qmax, { selfMined: false })
          refreshScore(e)
          goods.push({ kind: 'equip', payload: e, price: Math.round(e.score * 0.45), fake: chance(0.25), name: e.name })
        } else if (roll < 0.65) {
          const id = pick(['podan', 'xisui', 'dujie'])
          goods.push({ kind: 'pill', payload: { id, q: 3 }, price: ri(800, 2400), fake: chance(0.2), name: `${PILL_MAP[id].n}（上品）` })
        } else {
          const id = pick(['fabaoPiece', 'zhibaoPiece', 'taichu'])
          goods.push({ kind: 'mat', payload: { id, n: ri(2, 6) }, price: ri(1000, 4000), fake: chance(0.2), name: `${MAT_MAP[id].n}` })
        }
      }
      this.market.bmGoods = goods
    },
    bmBuy(idx: number) {
      const g = this.market.bmGoods[idx]
      if (!g) return
      if (this.res.lingshi < g.price) { this.toast('灵石不足', 'red'); return }
      this.res.lingshi -= g.price
      this.attrs.yeLi += 2
      if (g.fake && chance(0.8)) {
        this.toast('假货！黑市水深，你被坑了', 'red')
        sfx.fail()
      } else {
        if (g.kind === 'equip') { const e = g.payload as Equip; e.selfMined = false; this.acquire(e, true) }
        else if (g.kind === 'pill') { const p = g.payload as { id: string; q: number }; this.addPill(p.id, p.q) }
        else { const p = g.payload as { id: string; n: number }; this.addMat(p.id, p.n) }
        this.toast('交易完成（业力+2）', 'jade')
      }
      this.market.bmGoods.splice(idx, 1)
      if (chance(0.15)) {
        this.toast('正道执法者盯上了你，触发追杀！', 'red')
        const enemy = makeEnemy(this.lv + 5, 1.2, '正道执法者')
        const r = simulate(this.playerCombatant(), enemy)
        this.pushBattleView({ title: '黑市追杀', log: r.log, win: r.win === 'a', rewards: r.win === 'a' ? ['击退追兵，缴获灵石×3000'] : ['被罚灵石×2000'] })
        this.pushModal('battle')
        if (r.win === 'a') this.addRes('lingshi', 3000)
        else { this.res.lingshi = Math.max(0, this.res.lingshi - 2000); this.injured = 300 }
      }
    },
    barterDo(id: number) {
      const b = this.market.barter.find(x => x.id === id)
      if (!b || b.done) return
      const f = b.wantFilter
      if (f.type !== 'equip') return
      const worn = this.wornByAll
      const candidates = this.inventory.filter(e => !worn.has(e.id) && e.q >= (f.minQ || 1)).sort((a, c) => a.score - c.score)
      if (candidates.length < b.wantCount) { this.toast('背包中没有足够的指定装备', 'red'); return }
      const take = candidates.slice(0, b.wantCount)
      for (const t of take) this.inventory = this.inventory.filter(x => x.id !== t.id)
      this.grantBarter(b)
      b.done = true
      this.toast(`以 ${b.wantCount} 件装备换得 ${b.giveDesc}`, 'gold')
      sfx.coin()
    },
    grantBarter(b: BarterOffer) {
      const g = b.give
      if (g.kind === 'pill') { const p = g.payload as { id: string; q: number }; this.addPill(p.id, p.q) }
      else if (g.kind === 'egg') { const p = g.payload as { q: number }; this.eggs.push({ id: uid(), q: p.q }) }
      else if (g.kind === 'mat') { const p = g.payload as { id: string; n: number }; this.addMat(p.id, p.n) }
      else if (g.kind === 'page') { this.addMat('gongfaPage', 3) }
      else if (g.kind === 'res') { const p = g.payload as { key: string; n: number }; this.addRes(p.key, p.n) }
    },

    // ================= 社交 =================
    duelNpc(id: number) {
      const n = this.npcs.find(x => x.id === id)
      if (!n) return
      const enemy = makeEnemy(Math.max(1, Math.floor(n.level)), 1.05, n.name)
      const r = simulate(this.playerCombatant(), enemy)
      const rewards: string[] = []
      if (r.win === 'a') {
        n.favor += 5
        n.hate = Math.max(0, n.hate - 5)
        this.attrs.daoXin += 0
        rewards.push('好感+5')
        if (chance(0.3)) { this.addRes('lingshi', 500); rewards.push('切磋彩头：灵石×500') }
      } else {
        n.hate += 2
      }
      this.pushBattleView({ title: `切磋 · ${n.name}`, log: r.log, win: r.win === 'a', rewards })
      this.pushModal('battle')
    },
    giftNpc(id: number) {
      const n = this.npcs.find(x => x.id === id)
      if (!n) return
      const max = this.giftMax
      const used = this.npcDaily.gift[id] || 0
      if (used >= max) { this.toast(`今日礼数已尽（${used}/${max}），明日再来`, 'dim'); return }
      if (this.res.lingshi < 1000) { this.toast('灵石不足（需1000）', 'red'); return }
      this.res.lingshi -= 1000
      this.npcDaily.gift[id] = used + 1
      n.favor += 12
      n.hate = Math.max(0, n.hate - 10)
      this.evtAdd('gift')
      this.toast(`${n.name} 收下灵石礼金，好感 +12（今日 ${used + 1}/${max}）`, 'jade')
    },
    giftNpcWith(id: number, giftId: string) {
      const n = this.npcs.find(x => x.id === id)
      const def = GIFT_MAP[giftId]
      if (!n || !def) return
      const max = this.giftMax
      const used = this.npcDaily.gift[id] || 0
      if (used >= max) { this.toast(`今日赠礼已达 ${max} 次上限`, 'dim'); return }
      if ((this.mats[giftId] || 0) <= 0) { this.toast('没有这件礼物（游历/坊市/副本可得）', 'red'); return }
      this.mats[giftId]--
      const { gain, match } = giftFavor(def, id)
      n.favor += gain
      n.hate = Math.max(0, n.hate - (match ? 15 : 5))
      this.npcDaily.gift[id] = used + 1
      this.evtAdd('gift')
      this.toast(match
        ? `投其所好！「${n.real}」对「${def.n}」爱不释手，好感 +${gain}（喜好：${npcLikes(id).join('、')}）`
        : `「${n.real}」收下「${def.n}」，好感 +${gain}`, match ? 'gold' : 'jade')
      sfx.coin()
    },
    // 快捷赠礼：自动挑一件（优先投其所好，其次喜好值最高）
    quickGift(id: number) {
      const n = this.npcs.find(x => x.id === id)
      if (!n) return
      const used = this.npcDaily.gift[id] || 0
      if (used >= this.giftMax) { this.toast(`今日赠礼已达 ${this.giftMax} 次上限`, 'dim'); return }
      const owned = GIFTS.filter(g2 => (this.mats[g2.id] || 0) > 0)
      if (!owned.length) { this.toast('暂无礼物（游历/坊市/副本可得）', 'red'); return }
      const likes = npcLikes(id)
      const liked = owned.filter(g2 => likes.includes(g2.type))
      const pool = liked.length ? liked : owned
      const best = pool.reduce((a, b) => (b.fav > a.fav ? b : a))
      this.giftNpcWith(id, best.id)
    },
    teachNpc(id: number) {
      const n = this.npcs.find(x => x.id === id)
      if (!n) return
      const used = this.npcDaily.teach[id] || 0
      if (used >= 5) { this.toast(`今日已指点 ${n.real} 五次，再教恐拔苗助长`, 'dim'); return }
      this.npcDaily.teach[id] = used + 1
      n.favor += 10
      if (used === 0) {
        this.attrs.daoXin += 1
        this.toast(`你指点 ${n.name} 修行，好感 +10，道心 +1（今日 1/5）`, 'jade')
      } else {
        this.toast(`你指点 ${n.name} 修行，好感 +10（今日 ${used + 1}/5）`, 'jade')
      }
    },
    // 日常叙话：对方战力更高则为「请教」，更低则为「指点」；每日首次好感 +4~8，重复叙聊无好感
    chatNpc(id: number) {
      const n = this.npcs.find(x => x.id === id)
      if (!n) return
      const stronger = npcPower(n) > this.derived.power
      const mode = stronger ? '请教' : '指点'
      const line = pick(stronger ? ASK_LINES : TEACH_LINES)
      const used = this.npcDaily.chat[id] || 0
      if (used >= 1) {
        this.toast(`与你${mode === '请教' ? '论道' : '叙话'}：「${n.real}」${line}`, 'dim')
        return
      }
      this.npcDaily.chat[id] = 1
      const gain = ri(4, 8)
      n.favor += gain
      this.toast(`${mode}「${n.real}」：${line}（好感 +${gain}）`, 'jade')
      sfx.click()
    },
    proposeNpc(id: number) {
      const n = this.npcs.find(x => x.id === id)
      if (!n) return
      if (n.rel === 'lover') { this.toast('你们已是道侣', 'dim'); return }
      if (n.favor < 100) { this.toast(`好感不足（${n.favor}/100），缘分未到`, 'red'); return }
      n.rel = 'lover'
      n.mateAt = Date.now()
      this.toast(`💗 ${n.name} 与你结为道侣，从此双修共道！`, 'gold')
      this.pushWorld(`${this.name} 与 ${n.name} 结为道侣，仙途同行`)
      sfx.epic()
    },
    masterNpc(id: number) {
      const n = this.npcs.find(x => x.id === id)
      if (!n) return
      if (n.favor < 50) { this.toast('对方尚不愿收你为徒（好感50+）', 'red'); return }
      if (this.npcs.some(x => x.rel === 'master')) { this.toast('你已有师尊', 'dim'); return }
      n.rel = 'master'
      this.toast(`你拜 ${n.name} 为师，师尊的庇护与指点将助你修行`, 'gold')
    },
    recruitDisciple(id: number) {
      if (this.major < 3) { this.toast('金丹之后方可收徒', 'red'); return }
      const n = this.npcs.find(x => x.id === id)
      if (!n) return
      if (n.favor < 60) { this.toast('对方尚在犹豫（好感60+）', 'red'); return }
      if (this.npcs.some(x => x.rel === 'disciple')) { this.toast('你已有一名亲传弟子', 'dim'); return }
      n.rel = 'disciple'
      this.toast(`收入 ${n.name} 为亲传弟子！`, 'gold')
    },
    // —— 延揽门人（需自创宗门；好感≥80、战力不弱于对方、非仇敌；上限 8 人） ——
    recruitToSect(id: number) {
      const n = this.npcs.find(x => x.id === id)
      if (!n) return
      if (n.inSect) { this.toast(`${n.name} 已是本门门人`, 'dim'); return }
      if (!this.ownSect) { this.toast('需先开宗立派（自创宗门），方可延揽门人', 'red'); return }
      if (n.rel === 'enemy') { this.toast('仇怨未了，对方岂肯入门', 'red'); return }
      if (n.favor < 80) { this.toast(`好感不足（${n.favor}/80），对方尚不愿入你门下`, 'red'); return }
      if (this.derived.power < npcPower(n)) { this.toast('需战力不弱于对方，方显掌门气度', 'red'); return }
      if (this.sectMembers.length >= 8) { this.toast('宗门门人已满（8 名）', 'dim'); return }
      n.inSect = true
      n.sect = this.sect
      n.favor = Math.min(100, n.favor + 10)
      this.toast(`【${n.name}】受邀加入【${this.sect}】，从此荣辱与共！`, 'gold')
      this.pushWorld(`${n.name} 受邀加入【${this.sect}】，担任门人`)
      sfx.epic()
    },
    dismissFromSect(id: number) {
      const n = this.npcs.find(x => x.id === id)
      if (!n || !n.inSect) return
      n.inSect = false
      n.sect = '散修'
      n.favor = Math.max(-100, n.favor - 20)
      this.toast(`你请【${n.name}】另谋高就（好感 -20）`, 'dim')
    },
    npcDecayTick() {
      // 道侣长期不理可能离去
      for (const n of this.npcs) {
        if (n.rel === 'lover' && Date.now() - n.mateAt > 3 * DAY) {
          if (chance(0.02)) {
            n.rel = 'none'
            n.favor = 20
            this.toast(`${n.name} 久等你不来，黯然离去……`, 'red')
            this.pushWorld(`${n.name} 与 ${this.name} 的道侣缘分已尽`)
          }
        }
      }
    },

    // ================= 日常 / 签到 =================
    dailyReset() {
      const dk = Math.floor(Date.now() / DAY)
      if (this.daily.day === dk) return
      this.daily.day = dk
      this.daily.daySigned = false
      this.xyu.counts = {}
      if (this.online.day !== dk) { this.online.day = dk; this.online.sec = 0; this.online.got = [] }
      if (this.shop.monthUntil > Date.now()) this.daily.makeup = Math.min(99, this.daily.makeup + 1) // 月卡权益：每日补签+1
      this.daily.giftTaken = false
      this.daily.chestTaken = false
      this.daily.progress = {}
      this.daily.taskClaimed = []
      this.tower.dailyCounts = {}
      this.tower.dayKey = dk
      // 镇妖塔每日重置 + 妖王殿结算/重置
      this.tower.floor = 1
      this.tower.swept = 0
      this.tower.buffs = []
      this.tower.offer = null
      // 妖王殿：按昨日伤害榜排名结算发奖
      if (this.yao.dmg > 0) {
        const board = yaoNpcBoard(this.npcs, this.yao.dayKey)
        const rank = 1 + board.filter(b => b.dmg > this.yao.dmg).length
        const tier = yaoTierOf(rank)
        const parts: string[] = []
        if (tier.xianyu) { this.addRes('xianyu', tier.xianyu); parts.push(`仙玉×${tier.xianyu}`) }
        if (tier.yaozhu) { this.addMat('yaozhu', tier.yaozhu); parts.push(`妖珠碎片×${tier.yaozhu}`) }
        if (tier.shouhun) { this.addMat('shouhun', tier.shouhun); parts.push(`兽魂×${tier.shouhun}`) }
        if (tier.gacha) { this.addRes('gachaTicket', tier.gacha); parts.push(`寻仙令×${tier.gacha}`) }
        if (tier.gaiming) { this.addRes('gaiming', tier.gaiming); parts.push(`改命石×${tier.gaiming}`) }
        this.yao.last = { rank, total: this.yao.dmg, summary: parts.join('、') }
        this.toast(`妖王殿昨榜结算：第 ${rank} 名，奖励已发放`, 'gold')
        this.pushModal('text', { title: '妖王殿 · 伤害榜结算', body: `昨日妖王「${yaoName(this.yao.dayKey)}」讨伐榜结算：\n你累计造成伤害 ${fmt(this.yao.dmg)}，位列第 ${rank} 名。\n\n奖励：${parts.join('、') || '无'}\n今日妖王已刷新，可继续挑战。` })
      } else {
        this.yao.last = null
      }
      this.yao.dayKey = dk
      this.yao.used = 0
      this.yao.dmg = 0
      // NPC 交互日常次数重置
      this.npcDaily = { day: dk, gift: {}, teach: {}, chat: {} }
      const wk = Math.floor(Date.now() / WEEK)
      if (this.tower.weekKey !== wk) {
        const had = this.tower.weekKey > 0
        this.tower.weekKey = wk
        this.tower.weeklyCounts = {}
        this.pvpShop.week = wk
        this.pvpShop.counts = {}
        if (had) this.settleWeek()
      }
      // 战令赛季（10 天）滚动
      const sk = passSeason()
      if (this.pass.season !== sk) {
        this.pass.season = sk
        this.pass.xp = 0
        this.pass.freeGot = []
        this.pass.premGot = []
        this.pass.premium = false
      }
      this.refreshMarket()
      this.refreshBm()
      this.refreshSectTasks(true)
      this.npcDecayTick()
    },
    // ================= 限时活动 =================
    evtRoll() {
      const a = this.activity
      if (!a) { this.evt.key = ''; return }
      const key = `${this.cycleKey}:${a.id}`
      if (this.evt.key !== key) {
        this.evt = { key, coins: {}, counts: {}, claimed: [], bought: {} }
      }
    },
    evtAdd(t: string, n = 1) {
      if (n <= 0 || !EVT_TYPES.includes(t as EvtType)) return
      this.evtRoll()
      if (!this.currentEvt) return
      this.evt.counts[t] = (this.evt.counts[t] || 0) + n
    },
    claimEvtTask(taskId: string) {
      const ev = this.currentEvt
      if (!ev) return
      const task = ev.tasks.find(x => x.id === taskId)
      if (!task) return
      const ck = `${ev.id}:${taskId}`
      if (this.evt.claimed.includes(ck)) { this.toast('该活动任务奖励已领取', 'dim'); return }
      if ((this.evt.counts[task.type] || 0) < task.target) { this.toast('任务尚未完成', 'dim'); return }
      this.evt.claimed.push(ck)
      this.evt.coins[ev.id] = (this.evt.coins[ev.id] || 0) + task.coins
      this.toast(`领取「${task.n}」：${ev.coin}×${task.coins}`, 'gold')
      sfx.success()
    },
    buyEvt(skuId: string) {
      const ev = this.currentEvt
      if (!ev) return
      const sku = ev.shop.find(x => x.id === skuId)
      if (!sku) return
      const bk = `${ev.id}:${skuId}`
      if ((this.evt.bought[bk] || 0) >= sku.limit) { this.toast('已达限购上限', 'red'); return }
      if ((this.evt.coins[ev.id] || 0) < sku.cost) { this.toast(`${ev.coin}不足`, 'red'); return }
      this.evt.coins[ev.id] -= sku.cost
      this.evt.bought[bk] = (this.evt.bought[bk] || 0) + 1
      const out = this.grant(sku.grant)
      this.toast(`兑换「${sku.n}」：${out.join('、')}`, 'jade')
      sfx.coin()
    },
    addTaskProgress(k: string, n: number) {
      this.daily.progress[k] = (this.daily.progress[k] || 0) + n
      this.pass.xp += n // 战令经验
      // 限时活动进度联动（mine/dungeon/sweep→dungeon/meditate/pvp 等共享计数器）
      this.evtAdd(k === 'sweep' ? 'dungeon' : k, n)
    },
    claimTask(idx: number) {
      const t = DAILY_TASKS[idx]
      if (!t || this.daily.taskClaimed[idx]) return
      if ((this.daily.progress[t.k] || 0) < t.target) { this.toast('任务尚未完成', 'dim'); return }
      this.daily.taskClaimed[idx] = true
      this.daily.progress['pt'] = (this.daily.progress['pt'] || 0) + t.pt
      this.pass.xp += t.pt
      this.toast(`任务奖励：活跃度 +${t.pt}`, 'jade')
    },
    claimChest() {
      if (this.daily.progress['pt'] >= 100 && !this.daily.chestTaken) {
        this.daily.chestTaken = true
        this.addRes('lingmai', 30); this.addRes('lingshi', 5000); this.addRes('xilian', 3); this.addRes('xianyu', 10); this.addRes('gachaTicket', 2)
        this.addMat('longsui', 2)
        this.pass.xp += 30
        this.addPill('podan', 2, 1)
        this.toast('领取活跃宝箱：开脉石×30、灵石×5000、洗练石×3、寻仙令×2、破障丹×1、仙玉×10、龙髓×2', 'gold')
        sfx.rare()
      }
    },
    signIn() {
      if (this.daily.daySigned) { this.toast('今日已签到', 'dim'); return }
      this.daily.daySigned = true
      if (this.daily.monthCount >= MONTH_DAYS) this.daily.monthCount = 0
      this.daily.monthCount++
      const day = this.daily.monthCount
      const rewards = this.grant(monthReward(day))
      if (this.daily.newbieDay < 7) {
        this.daily.newbieDay++
        rewards.push(...this.grant(newbieReward(this.daily.newbieDay)))
      }
      this.toast(`签到成功（第${day}/30天）：${rewards.slice(0, 6).join('、')}${rewards.length > 6 ? ' …' : ''}`, 'gold')
      sfx.coin()
    },
    makeUpSign() {
      if (this.daily.daySigned) { this.toast('今日已签到', 'dim'); return }
      if (this.daily.makeup <= 0) { this.toast('本月补签次数用尽', 'red'); return }
      if (this.res.lingshi < 200) { this.toast('灵石不足（需200）', 'red'); return }
      this.res.lingshi -= 200
      this.daily.makeup--
      this.signIn()
    },
    // 执行奖励列表（签到 / 礼包 / 兑换共用）
    grant(list: RewardItem[]): string[] {
      const out: string[] = []
      for (const r of list) {
        if (r.t === 'res') {
          this.addRes(r.id, r.n)
          out.push(`${RES_LABEL[r.id] || r.id}×${fmt(r.n)}`)
        } else if (r.t === 'dynres') {
          const n = XY_DYN[r.id](this.lv)
          this.addRes(r.id, n)
          out.push(`${RES_LABEL[r.id]}×${fmt(n)}`)
        } else if (r.t === 'mat') {
          this.addMat(r.id, r.n)
          out.push(`${MAT_MAP[r.id]?.n || r.id}×${fmt(r.n)}`)
        } else if (r.t === 'pill') {
          this.addPill(r.id, r.q ?? 1, r.n)
          out.push(`${PILL_MAP[r.id]?.n || r.id}×${r.n}`)
        } else if (r.t === 'egg') {
          const q = ri(r.qmin, Math.min(16, r.qmax))
          this.eggs.push({ id: uid(), q })
          out.push(`${qName(q)}品质灵兽蛋`)
        } else if (r.t === 'fam') {
          out.push(this.absorbFamiliar(r.fid || this.pickFamInRange(r.rmin, r.rmax)))
        } else {
          const e = genEquip(this.eqLvBase, r.qmin, Math.min(16, r.qmax), { selfMined: false })
          this.acquire(e, true)
          out.push(`${qName(e.q)}·${e.name}`)
        }
      }
      return out
    },
    claimRealmGift(n: number) {
      if (this.major < n) { this.toast(`尚未达到【${MAJOR[n]}】`, 'dim'); return }
      if (this.daily.realmGifts.includes(n)) { this.toast('该礼包已领取', 'dim'); return }
      this.daily.realmGifts.push(n)
      const out = this.grant(realmGift(n))
      this.toast(`境界大礼包（${MAJOR[n]}）：${out.join('、')}`, 'gold')
      sfx.rare()
    },
    buyXianyu(id: string) {
      const sku = XY_SKUS.find(s => s.id === id)
      if (!sku) return
      if ((this.xyu.counts[id] || 0) >= sku.limit) { this.toast('今日限购已达上限', 'red'); return }
      if (this.res.xianyu < sku.cost) { this.toast('仙玉不足', 'red'); return }
      this.res.xianyu -= sku.cost
      this.xyu.counts[id] = (this.xyu.counts[id] || 0) + 1
      const out: string[] = []
      if (sku.dynRes) {
        const n = XY_DYN[sku.dynRes](this.lv)
        this.addRes(sku.dynRes, n)
        out.push(`${RES_LABEL[sku.dynRes]}×${fmt(n)}`)
      }
      if (sku.resId && sku.amount) {
        this.addRes(sku.resId, sku.amount)
        out.push(`${RES_LABEL[sku.resId] || sku.resId}×${sku.amount}`)
      }
      if (sku.pillId) {
        this.addPill(sku.pillId, sku.pillQ ?? 1, 1)
        out.push(`${PILL_MAP[sku.pillId]?.n || sku.pillId}×1`)
      }
      this.toast(`仙玉阁兑换：${out.join('、')}`, 'gold')
      sfx.coin()
    },
    claimGift() {
      if (this.daily.giftTaken) { this.toast('今日礼包已领', 'dim'); return }
      this.daily.giftTaken = true
      this.addRes('lingmai', 5)
      this.addRes('lingshi', 1000)
      this.addRes('xianyu', 1)
      this.toast('领取每日礼包：开脉石×5、灵石×1000、仙玉×1', 'jade')
      sfx.coin()
    },
    meditate() {
      if (this.meditateUntil > 0) { this.toast('正在打坐中……', 'dim'); return }
      this.meditateUntil = Date.now() + 30000
      this.toast('开始打坐冥想（30秒），完成后领取双倍礼包', 'jade')
    },

    // ================= 奇遇 =================
    rollEncounter() {
      const q = weighted([
        { w: 40, v: 1 }, { w: 30, v: 2 }, { w: 18, v: 3 }, { w: 9, v: 4 }, { w: 3, v: 5 },
      ]) + Math.min(2, this.reinc.count)
      const pool = ENCOUNTERS.filter(e => e.q === Math.min(5, q))
      const def = pick(pool.length ? pool : ENCOUNTERS)
      this.enc = { id: def.id, resolved: '', options: def.options.map(o => ({ label: o.label, resText: '', done: false })) }
      this.pushModal('encounter')
      sfx.rare()
    },
    explore() {
      if (this.enc) { this.toast('奇遇正待抉择', 'dim'); return }
      if (this.travel.n < 1) { this.toast(`游历次数不足，下次恢复还需 ${fmtTime(Math.max(0, 300000 - (Date.now() - this.travel.rec)))}`, 'dim'); return }
      this.travel.n--
      this.rollEncounter()
    },
    resolveEncounter(idx: number) {
      if (!this.enc) return
      const def = ENCOUNTERS.find(e => e.id === this.enc!.id)!
      const opt = def.options[idx]
      const res = opt.res
      const done: string[] = []
      const scaleReq = this.nextReq
      if (res.text) done.push(res.text)
      if (res.cult) { const amt = Math.round(res.cult < 10 ? res.cult * scaleReq : res.cult); this.cultivation = Math.min(this.nextReq, this.cultivation + amt); done.push(`修为 +${fmt(amt)}`) }
      if (res.lingshi) { this.addRes('lingshi', res.lingshi); done.push(`灵石 +${res.lingshi}`) }
      if (res.lingmai) { this.addRes('lingmai', res.lingmai); done.push(`开脉石 +${res.lingmai}`) }
      if (res.xilian) { this.addRes('xilian', res.xilian) }
      if (res.gongming) { this.addRes('gongming', res.gongming) }
      if (res.xianyu) { this.addRes('xianyu', res.xianyu); done.push(`仙玉 +${res.xianyu}`) }
      if (res.attr) { const [k, v] = res.attr; (this.attrs as unknown as Record<string, number>)[k] += v; done.push(`${keyName(k)} +${v}`) }
      if (res.daoXin) { this.attrs.daoXin = Math.max(0, this.attrs.daoXin + res.daoXin); done.push(`道心 ${res.daoXin > 0 ? '+' : ''}${res.daoXin}`) }
      if (res.yeLi) { this.attrs.yeLi += res.yeLi; done.push(`业力 +${res.yeLi}`) }
      if (res.gongDe) { this.attrs.gongDe += res.gongDe; done.push(`功德 +${res.gongDe}`) }
      if (res.jieQi) { this.attrs.jieQi += res.jieQi; done.push(`天劫值 +${res.jieQi}`) }
      if (res.reincP) { this.reinc.points += res.reincP; done.push(`轮回之力 +${res.reincP}`) }
      if (res.hpPct && res.hpPct < 0) { this.injured = Math.max(this.injured, Math.abs(res.hpPct) * 12); done.push('受伤') }
      if (res.mat) { this.addMat(res.mat[0], res.mat[1]); done.push(`${MAT_MAP[res.mat[0]].n}×${res.mat[1]}`) }
      if (res.equipQ) { const e = genEquip(Math.max(1, this.eqLvBase + ri(-4, 4)), res.equipQ[0], Math.min(16, res.equipQ[1]), { selfMined: true }); this.acquire(e); done.push(`获得「${e.name}」`) }
      if (res.techTier) {
        const pool = TECHNIQUES.filter(t => t.tier <= res.techTier! && !this.techs.some(x => x.id === t.id))
        if (pool.length) { const t = pick(pool); this.learnTechById(t.id); done.push(`习得【${t.n}】`) }
        else { this.addMat('gongfaPage', 5); done.push('功法残页×5') }
      }
      if (res.beast) { const kind = pick(BEAST_KINDS); const q2 = clamp(ri(2, 8), 1, 16); const b: Beast = { id: uid(), name: beastName(q2, kind.n), kind: kind.id, q: q2, level: 1, exp: 0 }; this.beasts.push(b); done.push(`灵兽【${b.name}】认主`) }
      if (res.treasure) { this.getTreasure(9, 12) }
      if (res.fight) {
        const enemy = makeEnemy(Math.max(1, this.lv + res.fight * 4), 1.15, '伏击者')
        const r = simulate(this.playerCombatant(), enemy)
        if (r.win === 'a') { done.push('战斗胜利！') }
        else { this.injured = Math.max(this.injured, 400); done.push('战斗失利，负伤而逃') }
      }
      this.enc = null
      this.closeModal()
      this.pushModal('text', { title: `${ENC_NAMES[def.q - 1]}·${def.title}`, body: done.join('\n') })
    },

    // ================= 存档 =================
    save() {
      if (!this.started) return
      try {
        const data = this.serialize()
        localStorage.setItem(SAVE_KEY, JSON.stringify(data))
        this.lastSave = Date.now()
      } catch (e) {
        console.warn('save failed', e)
      }
    },
    serialize(): Record<string, unknown> {
      const skip = new Set(['toasts', 'modals', 'battle', 'trib', 'demon', 'enc', 'fx', 'world', 'log', 'worldTimer', 'lastAutoMine', 'chaosDoneKey', 'tab', 'mineBusy'])
      const out: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(this.$state)) {
        if (skip.has(k)) continue
        out[k] = v
      }
      return out
    },
    exportSave(): string {
      const json = JSON.stringify(this.serialize())
      return btoa(unescape(encodeURIComponent(json)))
    },
    importSave(code: string): boolean {
      try {
        const json = decodeURIComponent(escape(atob(code.trim())))
        const data = JSON.parse(json)
        this.applyLoad(data)
        this.save()
        return true
      } catch {
        return false
      }
    },
    applyLoad(data: Record<string, unknown>) {
      const state = this.$state as unknown as Record<string, unknown>
      for (const [k, v] of Object.entries(data)) {
        if (k in state) state[k] = v
      }
      // 补全新增字段
      if (!this.plots.length) this.syncPlots()
      // 签到/货币体系迁移（月历签到 + 仙玉）
      const dd = this.daily as unknown as Record<string, unknown>
      if (typeof dd.monthCount !== 'number' || dd.monthCount < 0) dd.monthCount = 0
      if (this.daily.monthCount > MONTH_DAYS) this.daily.monthCount = MONTH_DAYS
      if (typeof this.daily.newbieDay !== 'number') this.daily.newbieDay = 0
      if (!Array.isArray(this.daily.realmGifts)) this.daily.realmGifts = []
      if (this.res.xianyu == null) this.res.xianyu = 0
      if (!this.xyu || typeof this.xyu.counts !== 'object') this.xyu = { counts: {} }
      // 版本迁移：精怪 / 抽卡 / 充值
      if (!this.fam || !Array.isArray(this.fam.list)) this.fam = { list: [], equipped: [], catches: 0, seen: [], dupes: {} }
      if (!this.fam.dupes || typeof this.fam.dupes !== 'object') this.fam.dupes = {}
      if (!this.gacha || typeof this.gacha.stdPity !== 'number') this.gacha = { stdPity: 0, limPity: 0, total: 0, legends: 0, freeDay: 0 }
      if (!this.shop || !Array.isArray(this.shop.first)) this.shop = { first: [], total: 0, monthUntil: 0, monthClaimDay: 0 }
      if (this.shop.monthUntil == null) this.shop.monthUntil = 0
      if (this.shop.monthClaimDay == null) this.shop.monthClaimDay = 0
      if (typeof this.gacha.freeDay !== 'number') this.gacha.freeDay = 0
      if (!this.online || typeof this.online.sec !== 'number') this.online = { sec: 0, day: 0, got: [] }
      if (!this.goals || !Array.isArray(this.goals.done)) this.goals = { done: [] }
      if (!this.collect || !Array.isArray(this.collect.done)) this.collect = { done: [] }
      if (!this.pass || typeof this.pass.xp !== 'number') this.pass = { season: passSeason(), xp: 0, freeGot: [], premGot: [], premium: false }
      if (!Array.isArray(this.pass.freeGot)) this.pass.freeGot = []
      if (!Array.isArray(this.pass.premGot)) this.pass.premGot = []
      if (this.pass.premium == null) this.pass.premium = false
      if (!this.pvpShop || typeof this.pvpShop.week !== 'number') this.pvpShop = { week: 0, counts: {} }
      if (typeof this.shuangxiuUntil !== 'number') this.shuangxiuUntil = 0
      if (typeof this.sxDay !== 'number') this.sxDay = 0
      if (typeof this.npcEvtCd !== 'number') this.npcEvtCd = 90
      if (!this.lastOffline || typeof this.lastOffline.cult !== 'number') this.lastOffline = { cult: 0, ls: 0, lm: 0 }
      if (this.settings.music == null) this.settings.music = true
      if (!Array.isArray(this.traits)) this.traits = []
      if (!this.story || !Array.isArray(this.story.done)) this.story = { done: [] }
      if (typeof this.sectRankAt !== 'number') this.sectRankAt = 0
      if (typeof this.realName !== 'string') this.realName = ''
      // —— 新系统迁移：关卡/天梯/NPC日常/新资源/词条锁定/灵兽资质 ——
      if (!this.stage || typeof this.stage.cleared !== 'number') this.stage = { cleared: 0 }
      if (!this.pvp || typeof this.pvp.points !== 'number') this.pvp = { points: 0, wins: 0, losses: 0 }
      if (!this.npcDaily || typeof this.npcDaily.day !== 'number') this.npcDaily = { day: 0, gift: {}, teach: {}, chat: {} }
      if (!this.npcDaily.chat || typeof this.npcDaily.chat !== 'object') this.npcDaily.chat = {}
      if (this.mineBusy === undefined) this.mineBusy = null
      if (this.res.pvpTicket == null) this.res.pvpTicket = 3
      if (this.res.gaiming == null) this.res.gaiming = 0
      if (this.res.gachaTicket == null) this.res.gachaTicket = 5
      if (!Array.isArray(this.codesUsed)) this.codesUsed = []
      // 版本迁移：分身系统（本体/阳神/阴身）
      if (!this.clones || typeof this.clones !== 'object') {
        this.clones = { active: 'main', yangOpen: false, yinOpen: false, yangEquip: {}, yinEquip: {} }
      }
      if (typeof this.clones.yangOpen !== 'boolean') this.clones.yangOpen = false
      if (typeof this.clones.yinOpen !== 'boolean') this.clones.yinOpen = false
      if (!this.clones.yangEquip || typeof this.clones.yangEquip !== 'object') this.clones.yangEquip = {}
      if (!this.clones.yinEquip || typeof this.clones.yinEquip !== 'object') this.clones.yinEquip = {}
      if (!['main', 'yang', 'yin'].includes(this.clones.active)) this.clones.active = 'main'
      if (this.clones.active === 'yang' && !this.clones.yangOpen) this.clones.active = 'main'
      if (this.clones.active === 'yin' && !this.clones.yinOpen) this.clones.active = 'main'
      // 版本迁移：镇妖塔每日重置（历史最高层）/ 妖王殿
      if (typeof this.tower.best !== 'number') this.tower.best = Math.max(1, this.tower.floor || 1)
      if (this.tower.best < (this.tower.floor || 1)) this.tower.best = this.tower.floor
      if (typeof this.tower.swept === 'boolean') this.tower.swept = this.tower.swept ? 1 : 0
      if (typeof this.tower.swept !== 'number') this.tower.swept = 0
      if (!Array.isArray(this.tower.buffs)) this.tower.buffs = []
      if (this.tower.offer == null || typeof this.tower.offer !== 'object' || !Array.isArray((this.tower.offer as { ids?: unknown }).ids)) this.tower.offer = null
      // 妖王殿改版（世界妖王伤害榜）
      if (!this.yao || typeof this.yao.dmg !== 'number') this.yao = { dayKey: 0, used: 0, dmg: 0, last: null }
      if (this.yao.last === undefined) this.yao.last = null
      // 面板导航状态
      if (this.socialTab == null) this.socialTab = 'rank'
      if (this.tab == null) this.tab = 'cultivate'
      // 限时活动状态补全
      if (!this.evt || typeof this.evt !== 'object' || !this.evt.counts) this.evt = { key: '', coins: {}, counts: {}, claimed: [], bought: {} }
      if (!Array.isArray(this.evt.claimed)) this.evt.claimed = []
      if (typeof this.evt.coins !== 'object') this.evt.coins = {}
      if (typeof this.evt.counts !== 'object') this.evt.counts = {}
      if (typeof this.evt.bought !== 'object') this.evt.bought = {}
      // 第19批：境界体系重构（4 小境界 × 10 阶 = 440 级标尺）——旧档等级映射，NPC/装备同步
      const srcVer = (data as { ver?: number }).ver
      if (srcVer !== 3) {
        const lvSrc = srcVer === 2 ? this.major * 10 + this.minor : this.major * 4 + this.minor
        const lvNew = Math.max(0, Math.min(439, Math.round(lvSrc * (srcVer === 2 ? 4 : 10.14))))
        this.major = Math.min(10, Math.floor(lvNew / 40))
        const rem = lvNew % 40
        this.phase = Math.floor(rem / 10)
        this.minor = rem % 10
        const npcK = srcVer === 2 ? 4 : 10.14
        for (const n of this.npcs) n.level = Math.round(n.level * npcK * 10) / 10
        if (srcVer !== 2) this.cultivation = Math.round(this.cultivation * 8) // 需求抬升，保留进度感
        // 装备等级：1..42 旧标尺 → 1..460 新标尺
        const remapEq = (e: unknown) => { const q = e as Equip | undefined; if (q && typeof q.level === 'number') q.level = Math.max(1, Math.round(q.level * 10.95)) }
        for (const e of this.inventory) remapEq(e)
        for (const e of Object.values(this.codex.items)) remapEq(e)
      }
      this.ver = 3
      // 版本迁移：灵脉 → 烛龙脉（旧深度换算等级，一次性；depth 随后归零避免重转）
      if (!this.vein || typeof this.vein.lv !== 'number') this.vein = { lv: 1, upgUntil: 0, digs: 0 }
      if (typeof this.vein.upgUntil !== 'number') this.vein.upgUntil = 0
      if (typeof this.vein.digs !== 'number') this.vein.digs = 0
      if (this.mine && typeof this.mine.depth === 'number' && this.mine.depth > 0 && this.vein.lv === 1 && this.vein.upgUntil === 0) {
        this.vein.lv = Math.min(VEIN_MAX, 1 + this.mine.depth * 7)
        this.mine.depth = 0
      }
      // 属性完整性（道基本体 6 维 + 特殊维度）
      const attrRec = this.attrs as unknown as Record<string, number>
      const attrDefaults: Record<string, number> = {
        genGu: 5, wuXing: 5, shenShi: 5, qiYun: 5, daoXin: 5, meiLi: 5,
        yeLi: 0, jieQi: 0, gongDe: 0,
      }
      for (const [k, dv] of Object.entries(attrDefaults)) {
        if (typeof attrRec[k] !== 'number' || !isFinite(attrRec[k])) attrRec[k] = dv
      }
      // 版本迁移：游历次数 / 称号 / NPC 本名 / 灵兽阶位 / 装备强化
      if (!this.travel || typeof this.travel.n !== 'number') this.travel = { n: this.travelMax, rec: Date.now() }
      if (!this.titles || !Array.isArray(this.titles.owned)) this.titles = { owned: [], eq: null }
      this.npcs.forEach((n, i) => { if (!n.real) n.real = NPC_DEFS[i % NPC_DEFS.length]?.real || '无名' })
      this.beasts.forEach(b => {
        if (typeof b.stage !== 'number') b.stage = 0
        if (!b.qual) b.qual = rollBeastQual(b.q)
        if (typeof b.growth !== 'number') b.growth = Math.round((0.95 + rnd() * 0.15) * 100) / 100
      })
      this.inventory.forEach(e => { if (typeof e.enh !== 'number') e.enh = 0 })
      // 修复历史版本：缺失词条的装备按品质补全
      const fixEquip = (e: Equip | null | undefined) => {
        if (!e || typeof e.q !== 'number' || e.q <= 0) return
        if (!Array.isArray(e.locks)) e.locks = []
        if (!e.level || e.level < 1) e.level = 1 // 老装备补齐等级下限
        if (!Array.isArray(e.tags)) e.tags = rollEquipTags(e.q) // 老装备按品质补铭纹（10+品才有）
        const want = QUALITIES[Math.min(15, e.q - 1)].aff
        if (!Array.isArray(e.affixes)) e.affixes = []
        if (e.affixes.length >= want) { refreshScore(e); return } // 顺便按当前评分口径重算
        const used = new Set(e.affixes.map(a => a.k))
        const pool = affixPoolFor(e.q)
        let guard = 0
        while (e.affixes.length < want && guard++ < 80) {
          const k = weighted(pool)
          if (!k || used.has(k)) continue
          used.add(k)
          const def = AFFIX_MAP[k]
          if (!def) continue
          e.affixes.push({ k, tier: def.tier, v: this.rollAffix(k, e.q, e.stars || 1, e.level || 0) })
        }
        // 兜底：加权撞车时直接补未使用词条
        if (e.affixes.length < want) {
          const rest = pool.filter(p => !used.has(p.v))
          for (const p of rest) {
            if (e.affixes.length >= want) break
            const def = AFFIX_MAP[p.v]
            if (!def) continue
            used.add(p.v)
            e.affixes.push({ k: p.v, tier: def.tier, v: this.rollAffix(p.v, e.q, e.stars || 1, e.level || 0) })
          }
        }
        refreshScore(e)
      }
      this.inventory.forEach(fixEquip)
      this.mine.recent.forEach(fixEquip)
      Object.values(this.codex.items).forEach(fixEquip)
      this.market.stalls.forEach(s => s.items.forEach(i => { if (i.kind === 'equip') fixEquip(i.payload as Equip) }))
      this.market.consign.forEach(c => fixEquip(c.payload as Equip))
      this.market.myConsign.forEach(c => fixEquip(c.payload as Equip))
      this.market.lots.forEach(l => { if (l.kind === 'equip') fixEquip(l.payload as Equip) })
      // 修复历史版本重复/无效的装备 id
      const seenIds = new Set<number>()
      for (const e of this.inventory) {
        if (!e.id || seenIds.has(e.id)) e.id = uid()
        seenIds.add(e.id)
      }
      const byId = new Set(this.inventory.map(e => e.id))
      const allWorn = new Set<number>()
      for (const m of [this.equipped, this.clones.yangEquip, this.clones.yinEquip]) for (const v of Object.values(m)) if (v != null) allWorn.add(v)
      for (const map of [this.equipped, this.clones.yangEquip, this.clones.yinEquip]) {
        for (const s of SLOTS) {
          const id = map[s]
          if (id == null) continue
          if (!byId.has(id)) {
            const best = this.inventory.filter(e => e.slot === s && !allWorn.has(e.id)).sort((a, b) => b.score - a.score)[0]
            if (best) { map[s] = best.id; allWorn.add(best.id) }
            else delete map[s]
          }
        }
      }
      // 恢复 uid
      let maxId = 0
      const scan = (x: unknown) => { if (x && typeof x === 'object' && 'id' in (x as Record<string, unknown>)) maxId = Math.max(maxId, Number((x as { id: number }).id) || 0) }
      this.inventory.forEach(scan); this.beasts.forEach(scan); this.treasures.forEach(scan); this.eggs.forEach(scan)
      this.market.stalls.forEach(s => { scan(s); s.items.forEach(i => scan(i.payload)) })
      this.market.consign.forEach(scan); this.market.myConsign.forEach(scan)
      this.market.barter.forEach(scan)
      this.market.lots.forEach(l => scan(l.payload))
      setUidSeq(maxId + 100)
      setSeed(this.seed)
    },
    load(): boolean {
      try {
        const raw = localStorage.getItem(SAVE_KEY)
        if (!raw) return false
        const data = JSON.parse(raw)
        this.applyLoad(data)
        return true
      } catch {
        return false
      }
    },
    init() {
      const ok = this.load()
      setAudio(this.settings.audio)
      setMusic(this.settings.music && ok)
      // 先天气运补录（老存档 / 首次开局）
      if (!this.traits.length) {
        this.traits = rollTraits()
        if (ok && this.started) this.toast('天机补录：觉醒先天气运 ×3（可在「更多」查看）', 'gold')
      }
      if (ok && this.started) {
        const now = Date.now()
        const away = Math.min(OFFLINE_CAP, Math.max(0, (now - this.lastTick) / 1000))
        if (away > 60) {
          const cult = this.cultPerSec * away
          const ls = this.lingshiPerSec * away
          const lm = this.lingmaiPerSec * away
          const pv = this.lastOffline || { cult: 0, ls: 0, lm: 0 }
          this.cultivation = Math.min(this.nextReq, this.cultivation + cult)
          this.addRes('lingshi', ls)
          this.addRes('lingmai', lm)
          growNpcs(this.npcs, away)
          for (const p of this.plots) { /* 成熟在 tick 中处理 */ }
          this.lastOffline = { cult: Math.round(cult), ls: Math.round(ls), lm: Math.round(lm) }
          this.pushModal('offline', { away, cult, ls, lm, prev: pv })
        }
        this.lastTick = now
        this.dailyReset()
        this.evtRoll()
        if (this.dead) this.pushModal('death', { reason: '前尘已尽，静待轮回裁决', tribFail: false, points: 0 })
      }
    },
    resetGame() {
      localStorage.removeItem(SAVE_KEY)
      this.$reset()
      this.npcs = makeNpcs()
    },
  },
})

export function keyName(k: string): string {
  const map: Record<string, string> = { genGu: '根骨', wuXing: '悟性', shenShi: '神识', qiYun: '气运', daoXin: '道心', meiLi: '魅力', yeLi: '业力', jieQi: '天劫值', gongDe: '功德' }
  return map[k] || k
}

// 可用于开局重掷的道基属性（展示顺序 + 作用说明）
export const ROLLED_ATTRS: [string, string, string][] = [
  ['genGu', '根骨', '气血+1.5%/点 · 防御+1%/点'],
  ['wuXing', '悟性', '修炼速度+5%/点 · 突破成功率+0.5%/点 · 炼丹品质小幅提升'],
  ['shenShi', '神识', '攻击+1.2%/点'],
  ['qiYun', '气运', '挂机灵石+3%/点 · 脉力暴动概率+0.5%/点 · 议价成功率+1%/点 · 捕捉精怪加成（气运÷8）'],
  ['daoXin', '道心', '突破成功率+0.8%/点 · 道心归零时，突破失败恐堕入魔道'],
  ['meiLi', '魅力', '坊市物价-0.8%/点 · 议价成功率+2%/点'],
]
