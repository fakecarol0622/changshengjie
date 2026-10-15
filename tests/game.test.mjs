import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'vite'
import { createPinia, setActivePinia } from 'pinia'

const memory = new Map()
globalThis.localStorage = { getItem: k => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, v), removeItem: k => memory.delete(k) }
globalThis.window = { setInterval: () => 0, clearInterval() {} }
const actualNow = Date.now
let now = Date.parse('2026-10-15T16:05:00Z')
Date.now = () => now
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const [G, R, E, B, rng, audio, T, S, Q, RES] = await Promise.all([
    '/src/stores/game.ts', '/src/data/realms.ts', '/src/core/equip.ts', '/src/core/battle.ts',
    '/src/core/rng.ts', '/src/core/sfx.ts', '/src/core/time.ts', '/src/data/stages.ts',
    '/src/data/qualities.ts', '/src/data/resonances.ts',
  ].map(path => server.ssrLoadModule(path)))
  setActivePinia(createPinia())
  const g = G.useGame()
  function fresh() {
    now = Date.parse('2026-10-15T16:05:00Z')
    memory.clear()
    g.$reset()
    g.started = true
    g.settings.audio = false
    g.settings.music = false
    audio.setAudio(false)
    Object.assign(g.attrs, { genGu: 5, wuXing: 5, shenShi: 5, qiYun: 5, daoXin: 5, meiLi: 5 })
    g.traits = []
    g.root = { n: '五灵根', mult: 1, desc: '' }
    g.dailyReset()
    rng.setSeed(42)
    return g
  }
  const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} != ${b}`)
  function unit(name, stats = {}, procs = []) {
    return { name, hp: stats.hp ?? 1000, stats: { ...E.emptyStats(), hp: 1000, atk: 100, def: 50, spd: 10, crit: 0, combo: 0, dodge: 0, ...stats }, procs }
  }
  const proc = (eff, overrides = {}) => ({ id: 'test', name: '测试技能', trigger: 'start', chance: 1, desc: '', eff, ...overrides })

  await test('日常任选70点可领取宝箱，重复领取不再发奖', () => {
    fresh()
    assert.equal(G.DAILY_TASKS.reduce((sum, t) => sum + t.pt, 0), 100)
    for (const [i, task] of G.DAILY_TASKS.entries()) { g.daily.progress[task.k] = task.target; g.claimTask(i) }
    assert.equal(g.daily.progress.pt, 100)
    g.daily.progress.pt = G.DAILY_CHEST_POINTS - 1
    g.claimChest(); assert.equal(g.daily.chestTaken, false)
    g.daily.progress.pt++
    g.claimChest(); assert.equal(g.daily.chestTaken, true)
    const reward = { ...g.res }
    g.claimChest(); assert.deepEqual(g.res, reward)
  })
  await test('在线时长同步到日常任务', () => {
    fresh()
    const startedAt = now
    for (let i = 1; i <= 30; i++) { now = startedAt + i * 60000; g.tick(now) }
    assert.equal(g.online.sec, 1800)
    assert.equal(g.daily.progress.online, 1800)
  })
  await test('扫荡同时计入副本通关与扫荡日常', () => {
    fresh(); g.tower.cleared.kuangku_0 = true
    g.sweepDungeon('kuangku', 0)
    assert.equal(g.daily.progress.dungeon, 1)
    assert.equal(g.daily.progress.sweep, 1)
  })
  await test('加入宗门立即获得基础被动，中文旧档仍生效', () => {
    fresh(); const atk = g.derived.stats.atk
    g.joinSect('qingxiao')
    assert.equal(g.sect, '青霄剑宗')
    assert.equal(g.deriveCtx([]).sectMods.atkP, 8)
    assert.equal(g.derived.stats.atk, Math.round(atk * 1.08))
    const saved = JSON.parse(JSON.stringify(g.serialize())); g.$reset(); g.applyLoad(saved)
    assert.equal(g.deriveCtx([]).sectMods.atkP, 8)
  })
  await test('所有普通进阶基础速度单调递增', () => {
    fresh(); let speed = 0
    for (let lv = 0; lv <= R.LV_MAX; lv++) {
      g.major = Math.floor(lv / 40); g.phase = Math.floor(lv % 40 / 10); g.minor = lv % 10
      assert.ok(g.derived.stats.spd >= speed); speed = g.derived.stats.spd
    }
  })
  await test('悟性只计算一次，5点提供25%修炼加成', () => {
    fresh(); g.attrs.wuXing = 0; const base = g.cultPerSec
    g.attrs.wuXing = 5; near(g.cultPerSec / base, 1.25)
  })
  await test('普通进阶掷骰：成则消耗本阶需求且道心不变，败则损25%并获补偿', () => {
    fresh()
    let success = false
    for (let i = 0; i < 60 && !success; i++) {
      g.cultivation = g.nextReq * 2
      const before = g.cultivation; const req = g.nextReq; const lv = g.lv; const bf = g.breakFailures
      g.tryBreakthrough()
      if (g.lv > lv) {
        success = true
        assert.equal(g.lv, lv + 1)
        near(g.cultivation, before - req)
        assert.equal(g.attrs.daoXin, 5)
        assert.equal(g.modals.length, 0)
      } else {
        assert.equal(g.cultivation, before - Math.ceil(req * 0.25))
        assert.equal(g.breakFailures, bf + 1)
        if (g.modals.length) g.closeModal()
      }
    }
    assert.ok(success)
    assert.equal(g.pills.podan, undefined)
  })
  await test('突破率全阶搏骰：常规局面封顶92%，高道心不越界', () => {
    assert.ok(R.breakChance(9, 3, 9, 5, 10000, 0, 27, 0) < 0.7)
    assert.equal(R.breakChance(0, 0, 0, 5, 5, 0, 0, 0), 0.92)
    assert.ok(R.breakChance(0, 0, 0, 5, 9999, 0, 0, 0) <= 0.92)
  })
  await test('失败保留储存修为，补偿有上限', () => {
    fresh(); g.major = 5; g.phase = 3; g.minor = 9
    g.cultivation = g.nextReq * 3
    const before = g.cultivation; const req = g.nextReq; const rate = g.breakChanceBase
    g.onBreakFail()
    assert.equal(g.lv, 239); assert.equal(g.cultivation, before - Math.ceil(req * .25))
    assert.ok(g.breakChanceBase > rate); assert.equal(g.injured, 120)
    g.breakFailures = 3; const capped = g.breakChanceBase
    g.breakFailures = 30; assert.equal(g.breakChanceBase, capped)
  })
  await test('12小时闭关只积累储存、不自动进阶，满仓即停', () => {
    fresh()
    const cap = g.cultivationCap
    const result = g.cultivateFor(43200)
    assert.equal(g.lv, 0)
    assert.equal(g.trib, null)
    assert.ok(g.cultivation > g.nextReq * 10)
    near(result.cult, g.cultivation)
    near(g.cultivation, cap)
    assert.ok(result.overflow < 1e-6)
  })
  await test('修为可储存多阶，不自动进阶', () => {
    fresh(); g.cultivateFor(3600)
    assert.equal(g.lv, 0); assert.ok(g.cultivation > g.nextReq)
  })
  await test('储存满后准确报告溢出，旧档超额修为不会被截掉', () => {
    fresh(); g.phase = 3; g.minor = 9
    g.cultivation = g.cultivationCap
    const result = g.cultivateFor(600)
    near(result.cult, 0); assert.ok(result.overflow > 0)
    g.cultivation = g.cultivationCap * 2
    const before = g.cultivation; assert.equal(g.addCultivation(100), 0)
    assert.equal(g.cultivation, before)
  })
  await test('最终境界不越界、不消耗破障丹', () => {
    fresh(); g.major = 10; g.phase = 3; g.minor = 9; g.cultivation = g.nextReq * 2
    g.pills['podan:2'] = 1
    g.tryBreakthrough(); g.cultivateFor(100)
    assert.equal(g.lv, 439); assert.equal(g.pills['podan:2'], 1)
  })
  await test('大境界成功只消费当前阶需求，道心按里程碑增加', () => {
    fresh(); g.phase = 3; g.minor = 9; g.cultivation = g.nextReq * 3
    const req = g.nextReq; g.onBreakSuccess()
    assert.equal(g.lv, 40); near(g.cultivation, req * 2)
    assert.equal(g.attrs.daoXin, 7); assert.equal(g.breakFailures, 0)
  })
  await test('渡劫只计已装备法宝，准备条件生效，攻击不再增加雷伤', () => {
    fresh(); g.major = 1; g.phase = 3; g.minor = 9
    g.treasures = [{ id: 1, name: '未知', q: 1, level: 1, stars: 1 }, { id: 2, name: '未知', q: 1, level: 1, stars: 1 }]
    g.treasureEquipped = [1]; g.startTribulation()
    assert.equal(g.trib.treasureUses, 1)
    g.tribAct('array'); assert.equal(g.trib.cur, 1)
    g.tribAct('companion'); assert.equal(g.trib.cur, 1)
    g.mats.fuwen = 3; g.tribAct('array')
    assert.equal(g.mats.fuwen, 0); assert.equal(g.trib.cur, 2)
    const dmg = g.tribDamage(20); g.attrs.shenShi = 1000
    assert.equal(g.tribDamage(20), dmg)
    g.attrs.genGu = 1000; assert.ok(g.tribDamage(20) < dmg)
  })
  await test('渡劫成功保留额外储存修为', () => {
    fresh(); g.major = 1; g.phase = 3; g.minor = 9; g.cultivation = g.nextReq * 3
    const req = g.nextReq; g.pills['dujie:2'] = 3
    g.startTribulation(); for (let i = 0; i < 3; i++) g.tribAct('pill')
    assert.equal(g.lv, 80); near(g.cultivation, req * 2)
  })
  await test('打坐限每日3次，灵石按30分钟产出、开脉石按5分钟产出', () => {
    fresh(); g.npcEvtCd = Infinity // 隔离NPC赠礼等独立收入。
    for (let i = 0; i < G.MEDITATE_MAX; i++) {
      const before = g.res.xianyu; const expected = g.meditateReward.xy
      g.meditate(); now += 31000; g.tick(now)
      assert.equal(g.res.xianyu - before, expected)
    }
    g.meditate(); assert.equal(g.meditateUntil, 0)
    assert.equal(g.daily.meditations, G.MEDITATE_MAX)
    now += 86400000; g.dailyReset(); g.meditate()
    assert.equal(g.daily.meditations, 1)
    near(g.meditateReward.ls, Math.max(500, Math.round(g.lingshiPerSec * 1800)))
  })
  await test('主动转世有门槛，与死亡使用相同奖励且不重复发放', () => {
    fresh(); g.reincarnate(); assert.equal(g.reinc.count, 0)
    g.major = 1; const reward = g.reincReward; g.reincarnate()
    assert.equal(g.reinc.points, reward); assert.equal(g.reinc.count, 1)
    fresh(); g.major = 1; g.die('test'); const points = g.reinc.points
    g.reincarnate(); assert.equal(g.reinc.points, points)
  })
  await test('旧存档迁移补默认字段，保留已有资源/领取状态', () => {
    fresh(); g.daily.daySigned = true; g.daily.chestTaken = true; g.attrs.daoXin = 120
    const saved = JSON.parse(JSON.stringify(g.serialize())); delete saved.balanceVersion
    delete saved.gender; delete saved.daily.meditations; delete saved.breakFailures
    saved.daily.day = Math.floor(saved.lastTick / 86400000)
    g.$reset(); g.applyLoad(saved)
    assert.equal(g.gender, '男'); assert.equal(g.daily.meditations, 0)
    assert.equal(g.attrs.daoXin, 120); assert.deepEqual(g.res, saved.res)
    g.dailyReset(); assert.equal(g.daily.daySigned, true); assert.equal(g.daily.chestTaken, true)
  })
  await test('转世后停在角色创建页也能保存，重载不会回到前一世', () => {
    fresh(); g.major = 1; const reward = g.reincReward
    g.reincarnate(); g.$reset(); assert.equal(g.load(), true)
    assert.equal(g.started, false); assert.equal(g.reinc.count, 1)
    assert.equal(g.reinc.points, reward)
  })
  await test('仙玉日常供给与消费能力相符，领取后不可重复刷', async () => {
    fresh()
    const { PREMIUM_REWARDS, meditateXianyu } = await server.ssrLoadModule('/src/data/premium.ts')
    const { monthReward } = await server.ssrLoadModule('/src/data/rewards.ts')
    const { ONLINE_REWARDS } = await server.ssrLoadModule('/src/data/meta.ts')
    assert.equal(meditateXianyu(0), 10); assert.equal(meditateXianyu(10), 30)
    assert.equal(monthReward(1).find(r => r.id === 'xianyu').n, 20)
    const daily = PREMIUM_REWARDS.dailyGift + PREMIUM_REWARDS.dailyChest + PREMIUM_REWARDS.dailySign + meditateXianyu(0) * G.MEDITATE_MAX
    const online = ONLINE_REWARDS.flatMap(r => r.grant).filter(r => r.id === 'xianyu').reduce((sum,r) => sum + r.n,0)
    assert.equal(daily, 140); assert.equal(online, 110)
    g.claimGift(); assert.equal(g.res.xianyu, 30)
    g.claimGift(); assert.equal(g.res.xianyu, 30)
    g.daily.progress.pt = 70; g.claimChest(); assert.equal(g.res.xianyu, 90)
    g.claimChest(); assert.equal(g.res.xianyu, 90)
  })
  await test('长阶仙玉分普通与守关，已完成旧档补差且只发一次', () => {
    fresh()
    assert.equal(S.stageRewards(1).find(r => r.id === 'xianyu').n, 20)
    assert.equal(S.stageRewards(10).find(r => r.id === 'xianyu').n, 90)
    assert.equal(S.stageRewards(89).find(r => r.id === 'xianyu').n, 45)
    const saved = JSON.parse(JSON.stringify(g.serialize()))
    delete saved.premiumVersion; saved.stage.cleared = 10; saved.daily.realmGifts = [1]
    const before = saved.res.xianyu
    g.$reset(); g.applyLoad(saved)
    assert.equal(g.res.xianyu - before, 320)
    const migrated = JSON.parse(JSON.stringify(g.serialize()))
    g.$reset(); g.applyLoad(migrated)
    assert.equal(g.res.xianyu, migrated.res.xianyu)
    assert.equal(g.stage.cleared, 10)
    assert.deepEqual(g.daily.realmGifts, [1])
  })
  await test('已领取日常、在线与目标补差不重置领取状态，未领档位仍可正常领取', () => {
    fresh()
    const saved = JSON.parse(JSON.stringify(g.serialize())); delete saved.premiumVersion
    saved.res.xianyu = 100; saved.goals.done = ['g2']
    Object.assign(saved.daily, { giftTaken: true, chestTaken: true, meditations: 3, monthCount: 3, newbieDay: 3 })
    saved.online.got = [0, 2]
    g.$reset(); g.applyLoad(saved)
    assert.equal(g.res.xianyu, 347)
    assert.equal(g.daily.meditations, 3); assert.equal(g.daily.chestTaken, true)
    g.claimGift(); g.claimChest(); g.claimOnline(0); g.meditate()
    assert.equal(g.res.xianyu, 347)
    g.online.sec = 900; g.claimOnline(1)
    assert.equal(g.res.xianyu, 357)
    const oldDay = JSON.parse(JSON.stringify(saved))
    oldDay.res.xianyu = 100; oldDay.daily.day--; oldDay.online.day--
    g.$reset(); g.applyLoad(oldDay)
    assert.equal(g.res.xianyu, 217) // 仅补目标、当前签到月与新手已领里程碑。
  })
  await test('离线结算立即存档，再次加载不会重复领；死亡期间不发收益', () => {
    fresh(); g.lastTick = now - 43200000; g.save(); g.$reset(); g.init()
    assert.equal(g.lv, 0); assert.ok(g.cultivation > g.nextReq)
    assert.ok(g.modals.some(x => x.kind === 'offline'))
    const resources = { ...g.res }; g.$reset(); g.init()
    assert.deepEqual(g.res, resources)
    assert.ok(!g.modals.some(x => x.kind === 'offline'))
    fresh(); g.dead = true; g.lastTick = now - 43200000; g.save()
    const before = { ...g.res }; g.$reset(); g.init(); assert.deepEqual(g.res, before)
  })
  await test('北京时间0点切日，倒计时与日键一致', () => {
    const before = Date.parse('2026-10-15T15:59:59Z'); const after = before + 1000
    assert.equal(T.gameDayKey(after), T.gameDayKey(before) + 1)
    assert.equal(T.resetIn(before), 1000); assert.equal(T.resetIn(after), 86400000)
  })
  await test('万法共鸣可以用现有5种词条达成', () => {
    const top = Q.AFFIXES.filter(x => x.tier === 3)
    assert.equal(top.length, 5)
    const res = RES.RES_MAP.wanfa
    assert.equal(res.check({ distinctTop: top.length }), true)
    assert.equal(res.check({ distinctTop: top.length - 1 }), false)
  })
  await test('后期龙脉星级保底在生成属性前生效', () => {
    fresh(); assert.equal(R.veinStarFloor(55), 1); assert.equal(R.veinStarFloor(56), 2)
    assert.equal(R.veinStarFloor(61), 3); assert.equal(R.veinStarFloor(66), 4)
    g.vein.lv = 66; g.res.lingmai = 10000
    for (const item of g.mineAt(10, true)) { assert.ok(item.stars >= 4); assert.equal(item.score, Q.scoreEquip(item)) }
    assert.equal(R.veinAcceleration(3600000), 720000)
    assert.equal(R.veinAcceleration(300000), 300000)
  })
  await test('首通灵石与参考挂机产出同阶，龙脉时间不再增长到数天', () => {
    assert.ok(S.stageRewards(90).find(x => x.id === 'lingshi').n < 10000000)
    assert.ok(R.veinUpTime(65) <= 12 * 3600000)
    assert.ok(R.veinUpCost(65) < 100000000)
  })
  await test('灵石福利随境界成长，新手奖励可支付基础建设', async () => {
    const L = await server.ssrLoadModule('/src/data/lingshi.ts')
    assert.equal(L.dailyLingshiRewards(0).gift, 3000)
    assert.equal(L.dailyLingshiRewards(0).chest, 10000)
    assert.equal(S.stageRewards(1).find(r => r.id === 'lingshi').n, 1500)
    assert.ok(S.stageRewards(1).find(r => r.id === 'lingshi').n >= R.veinUpCost(1))
    assert.ok(L.realmLingshiReward(1) >= 10000)
    let previous = 0
    for (const lv of [0, 40, 120, 240, 360, 439]) {
      const reward = L.dailyLingshiRewards(lv)
      assert.ok(reward.gift >= previous)
      assert.ok(reward.chest >= R.idleLingshi(lv, 5, 1.5) * 3600 * 6 - 1)
      previous = reward.gift
    }
  })
  await test('动态签到、在线、战令实际按当前境界发灵石，日常不重复领取', async () => {
    fresh()
    const { monthReward } = await server.ssrLoadModule('/src/data/rewards.ts')
    const { passFree } = await server.ssrLoadModule('/src/data/meta.ts')
    const L = await server.ssrLoadModule('/src/data/lingshi.ts')
    const before = g.res.lingshi; g.claimGift(); g.claimGift()
    assert.equal(g.res.lingshi - before, 3000)
    g.daily.progress.pt = 70; const gift = g.res.lingshi; g.claimChest(); g.claimChest()
    assert.equal(g.res.lingshi - gift, 10000)
    const sign = g.res.lingshi; g.grant(monthReward(1)); assert.equal(g.res.lingshi - sign, 2000)
    g.major = 6; const online = g.res.lingshi; g.online.sec = 300; g.claimOnline(0); g.claimOnline(0)
    assert.equal(g.res.lingshi - online, L.lingshiReward(240, 60, 2000))
    const pass = g.res.lingshi; g.grant(passFree(1))
    assert.equal(g.res.lingshi - pass, L.lingshiReward(240, 20, 1024))
  })
  await test('副本基础灵石不再过少，困难倍率有效，后期已有收益不削减', async () => {
    fresh()
    let before = g.res.lingshi; g.dungeonRewards('danxia', 0)
    assert.equal(g.res.lingshi - before, 1000)
    before = g.res.lingshi; g.dungeonRewards('kuangku', 0)
    assert.equal(g.res.lingshi - before, 2500)
    before = g.res.lingshi; g.dungeonRewards('kuangku', 1)
    assert.equal(g.res.lingshi - before, 4500)
    const L = await server.ssrLoadModule('/src/data/lingshi.ts')
    for (const lv of [120, 240, 439]) assert.ok(L.dungeonLingshiReward(lv, 1) >= Math.round(100 * 1.02458 ** lv))
  })
  await test('单件分解返灵石，已穿戴装备不返任何资源，重复操作无收益', () => {
    fresh(); const item = E.genEquip(80, 12, 12); g.acquire(item, true); g.equipItem(item.id)
    const before = g.res.lingshi; const mats = g.res.gaiming
    g.discardOne(item.id)
    assert.equal(g.res.lingshi, before); assert.equal(g.res.gaiming, mats)
    assert.ok(g.inventory.some(e => e.id === item.id))
    g.unequip(item.slot); g.discardOne(item.id)
    assert.equal(g.res.lingshi - before, E.salvageLingshi(item))
    const after = { ...g.res }; g.discardOne(item.id); assert.deepEqual(g.res, after)
    const trash = { ...E.genEquip(1, 1, 1), score: 0 }
    assert.equal(E.salvageLingshi(trash), 5)
  })
  await test('背包满自动清理返灵石并保护已穿戴装备', () => {
    fresh(); g.inventory = Array.from({ length: 240 }, () => E.genEquip(1, 1, 1))
    g.equipped = { [g.inventory[0].slot]: g.inventory[0].id }
    const protectedId = g.inventory[0].id; const next = E.genEquip(50, 10, 10)
    const expected = [...g.inventory, next].filter(e => e.id !== protectedId).sort((a,b) => a.score - b.score)[0]
    const before = g.res.lingshi; g.acquire(next, true)
    assert.equal(g.inventory.length, 240); assert.ok(g.inventory.some(e => e.id === protectedId))
    assert.equal(g.res.lingshi - before, E.salvageLingshi(expected))
    assert.ok(!g.inventory.some(e => e.id === expected.id))
  })
  await test('旧档灵石福利只补发一次，保留既有通关与已领取状态', () => {
    fresh(); const saved = JSON.parse(JSON.stringify(g.serialize())); delete saved.lingshiVersion
    saved.res.lingshi = 100; saved.stage.cleared = 1
    Object.assign(saved.daily, { monthCount: 1, giftTaken: true, chestTaken: true, meditations: 1 })
    saved.online.got = [0]
    g.$reset(); g.applyLoad(saved)
    assert.equal(g.res.lingshi, 9977)
    assert.equal(g.stage.cleared, 1); assert.equal(g.daily.chestTaken, true)
    const migrated = JSON.parse(JSON.stringify(g.serialize()))
    g.$reset(); g.applyLoad(migrated); assert.equal(g.res.lingshi, 9977)
  })
  await test('普通技能受防御和减伤影响，真实伤害保持独立', () => {
    const basic = unit('base'); const tank = unit('tank', { def: 50000, dmgReduce: 80 })
    const attacker = unit('attacker', {}, [proc({ t: 'dmg', mult: 1 })])
    const a = B.simulate(attacker, basic, { maxRounds: 0 }).bHpLeft
    const b = B.simulate(attacker, tank, { maxRounds: 0 }).bHpLeft
    assert.ok(b > a)
    attacker.procs = [proc({ t: 'true', mult: 1 })]
    assert.equal(B.simulate(attacker, basic, { maxRounds: 0 }).bHpLeft, B.simulate(attacker, tank, { maxRounds: 0 }).bHpLeft)
  })
  await test('反伤同归于尽判平局；复活可以改变结果', () => {
    const attacker = unit('attacker', { hp: 1, spd: 100 })
    const reflector = unit('reflector', { hp: 1, reflect: 100 })
    assert.equal(B.simulate(attacker, reflector).win, 'draw')
    attacker.stats.reviveCount = 1; attacker.stats.revivePct = 100
    assert.equal(B.simulate(attacker, reflector).win, 'a')
  })
  await test('免疫负面与一次触发机制生效', () => {
    const target = unit('immune', {}, [proc({ t: 'immune' })])
    const stunner = unit('stunner', {}, [proc({ t: 'stun', rounds: 1 })])
    assert.ok(B.simulate(target, stunner, { maxRounds: 0 }).log.some(x => x.t.includes('免疫了')))
    const once = unit('once', {}, [proc({ t: 'heal', pct: 1 }, { trigger: 'attack', once: true })])
    assert.equal(B.simulate(once, unit('target'), { maxRounds: 3 }).log.filter(x => x.t.includes('测试技能')).length, 1)
  })
  await test('开场致命技能立即结算，死者不再出手', () => {
    const killer = unit('killer', {}, [proc({ t: 'true', mult: 100 })])
    const result = B.simulate(killer, unit('target'))
    assert.equal(result.win, 'a')
    assert.ok(!result.log.some(x => x.t.includes('target 出手')))
  })
  await test('首领参考战力不消耗随机数，伤害加成识别首领', () => {
    rng.setSeed(12); const seed = rng.getSeed(); B.enemyReferenceStats(100, 1.4, true)
    assert.equal(rng.getSeed(), seed)
    const attacker = unit('hunter', { vsBossP: 100 })
    const enemy = unit('boss'); enemy.isBoss = true
    rng.setSeed(42); const strong = B.simulate(attacker, enemy, { maxRounds: 1 })
    enemy.isBoss = false; rng.setSeed(42); const weak = B.simulate(attacker, enemy, { maxRounds: 1 })
    assert.ok(strong.bHpLeft < weak.bHpLeft)
  })
} finally {
  Date.now = actualNow
  await server.close()
}
