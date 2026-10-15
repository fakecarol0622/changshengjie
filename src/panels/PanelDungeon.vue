<template>
  <div class="flex flex-col gap-3">
    <div class="panel text-xs dim flex items-center justify-between gap-2 flex-wrap">
      <span>副本每日/每周刷新。通关后可消耗「扫荡券」扫荡（持有 {{ g.res.sweep }} 张）<b class="gold">，月卡期间免券扫荡</b>，扫荡同样消耗副本次数。难度越高，产出倍率越高。</span>
      <button class="btn btn-sm" @click="g.sweepAll()">一键扫荡</button>
    </div>

    <!-- 日常副本 -->
    <div class="grid md:grid-cols-2 gap-2">
      <div v-for="d in dailyDungeons" :key="d.id" class="panel">
        <div class="flex justify-between items-center">
          <b class="gold">{{ d.n }}</b>
          <span class="chip">{{ d.type }}</span>
        </div>
        <div class="text-xs dim mt-1">{{ d.desc }}</div>
        <div class="text-xs mt-1 jade">产出：{{ d.rewards }}</div>
        <div class="text-xs dim mt-1">
          次数 {{ attempts(d.id).used }} / {{ attempts(d.id).max }} · 重置倒计时 {{ fmtTime(resetIn(d)) }}
        </div>
        <div class="flex gap-1 mt-2 flex-wrap items-center">
          <button
            v-for="(df, i) in DIFFS" :key="i"
            class="btn btn-xs" :class="dsel[d.id] === i ? 'btn-gold' : ''"
            @click="dsel[d.id] = i"
          >{{ df.n }}</button>
        </div>
        <div class="flex gap-2 mt-2 items-center">
          <span
            class="text-xs shrink-0"
            :class="recRatio(dsel[d.id] || 0) >= 1.5 ? 'jade' : recRatio(dsel[d.id] || 0) >= 0.8 ? 'gold' : 'red'"
            title="你的战力 ÷ 敌方单体参考战力：≥1.5 稳胜，＜0.8 危险"
          >战力比 ×{{ recRatio(dsel[d.id] || 0).toFixed(1) }}</span>
          <button class="btn btn-sm flex-1" :disabled="attempts(d.id).used >= attempts(d.id).max" @click="g.enterDungeon(d.id, dsel[d.id] || 0)">挑 战</button>
          <button
            class="btn btn-sm"
            :disabled="!g.tower.cleared[d.id + '_' + (dsel[d.id] || 0)] || (!g.monthActive && g.res.sweep < 1) || attempts(d.id).used >= attempts(d.id).max"
            @click="g.sweepDungeon(d.id, dsel[d.id] || 0)"
          >扫荡（券×1）</button>
        </div>
      </div>
    </div>

    <!-- 问道长阶（独立页面入口） -->
    <div class="panel md:col-span-2 flex justify-between items-center gap-2 flex-wrap">
      <div>
        <b class="gold">问 道 长 阶</b>
        <span class="text-xs dim ml-2">主线关卡已独立成页 · 已通关 {{ g.stage.cleared }} 阶</span>
      </div>
      <button class="btn btn-sm btn-gold" @click="g.tab = 'stage'">进入长阶 →</button>
    </div>

    <!-- 特殊挑战 -->
    <div class="grid md:grid-cols-2 gap-2">
      <div class="panel">
        <div class="flex justify-between items-center">
          <b class="gold">镇妖九重塔</b><span class="chip">肉鸽爬塔</span>
        </div>
        <div class="text-xs dim mt-1">每层十关，第 5 关妖将、第 10 关层妖王；每通关一层三选一本日爬塔增幅</div>
        <div class="text-xs dim mt-1">今日 第 <b class="gold">{{ tLayer(g.tower.floor) }}</b> 层 · 第 <b class="gold">{{ tStage(g.tower.floor) }}</b> 关 · 历史最高 <b class="gold">{{ tLayer(g.tower.best) }}</b> 层</div>
        <div v-if="buffChips.length" class="flex gap-1 flex-wrap mt-1 items-center">
          <span class="text-xs dim">增幅</span>
          <span v-for="c in buffChips" :key="c.id" class="chip" :class="c.tier === 3 ? 'chip-gold' : c.tier === 2 ? 'chip-jade' : ''" :title="c.d">{{ c.n }}<span v-if="c.count > 1">×{{ c.count }}</span></span>
        </div>
        <div class="text-xs jade mt-1">产出：洗练石、共鸣石、灵石；妖将出论道帖，妖王额外仙玉</div>
        <div class="flex gap-2 mt-2">
          <button class="btn btn-sm flex-1" @click="g.enterTower()">挑战第 {{ tStage(g.tower.floor) }} 关</button>
          <button class="btn btn-sm" title="自动连战至通关一层（稍后选择增幅）或战败（至多 60 场）" @click="g.towerAuto()">连 战</button>
        </div>
        <button
          class="btn btn-sm w-full mt-2"
          :disabled="g.tower.swept >= g.towerSweepMax || g.tower.best < g.tower.floor"
          :title="g.tower.swept >= g.towerSweepMax ? '今日扫荡已用尽，明日 0 点重置（月卡 +1 次）' : g.tower.best < g.tower.floor ? '今日进度已超过历史最高' : '一键扫荡至历史最高，按 60% 结算收益（不获得增幅）'"
          @click="g.towerSweep()"
        >{{ g.tower.swept >= g.towerSweepMax ? '今日扫荡已用尽（明日重置）' : (g.tower.best < g.tower.floor ? '进度已超历史最高' : `每日扫荡（剩 ${g.towerSweepMax - g.tower.swept} 次 · 60%收益）`) }}</button>
      </div>
      <div class="panel">
        <div class="flex justify-between items-center">
          <b class="gold">妖 王 殿</b><span class="chip">世界妖王</span>
        </div>
        <div class="text-xs dim mt-1">
          今日妖王：<b class="gold">{{ yaoInfo.name }}</b>（Lv.{{ yaoInfo.lv }} · 血量 {{ fmt(yaoInfo.hp) }}）
          <span class="dim2">· 血量极厚无法击败，比的是伤害</span>
        </div>
        <div class="flex gap-1 flex-wrap mt-1">
          <span v-for="t in yaoInfo.traits" :key="t.n" class="chip chip-red" :title="t.d">{{ t.n }} · {{ t.d }}</span>
        </div>
        <div class="text-xs mt-1">
          今日伤害 <b class="gold">{{ fmt(g.yao.dmg) }}</b> · 当前第 <b class="gold">{{ g.yaoRank }}</b> 名（榜上 {{ g.yaoTop.length }} 人）
          <span v-if="g.yao.last" class="dim2"> · 昨日第 {{ g.yao.last.rank }} 名已结算</span>
        </div>
        <div class="text-xs jade mt-1">每日 0 点按伤害排名发奖：仙玉·妖珠碎片·兽魂，前二名另有寻仙令、榜首加改命石</div>
        <div class="flex gap-2 mt-2">
          <button class="btn btn-sm flex-1" :disabled="g.yao.used >= g.yaoTriesMax" @click="g.yaoChallenge()">
            {{ g.yao.used >= g.yaoTriesMax ? '今日次数已尽' : `挑战妖王（剩 ${g.yaoTriesMax - g.yao.used} 次）` }}
          </button>
          <button class="btn btn-sm" title="查看今日伤害榜（含 NPC 修士）" @click="g.pushModal('yaoboard')">伤害榜</button>
        </div>
      </div>
      <div class="panel">
        <div class="flex justify-between items-center">
          <b class="gold">仙武论道台</b><span class="chip">天梯 PVP</span>
        </div>
        <div class="text-xs dim mt-1">寻道大千式排名赛：赢升名次、输掉名次，需消耗「论道帖」（挖灵脉有概率获得）。完整榜单在「仙缘」页。</div>
        <div class="text-xs jade mt-1">论道帖 <b class="gold">{{ g.res.pvpTicket }}</b> 张 · 当前 {{ PVP_TIERS[pvpTierIdx(g.pvp.points)].n }}段（第 {{ pvpRank(g.pvp.points) }} 名）</div>
        <button class="btn btn-sm mt-2 w-full" :disabled="g.res.pvpTicket < 1" @click="g.pvpMatch()">
          {{ g.res.pvpTicket < 1 ? '论道帖不足（去挖灵脉）' : '匹配对战（论道帖×1）' }}
        </button>
      </div>
      <div class="panel">
        <div class="flex justify-between items-center">
          <b class="gold">天劫雷渊</b><span class="chip">挑战</span>
        </div>
        <div class="text-xs dim mt-1">雷渊孕育渡劫造化，每次产出突破材料。</div>
        <div class="text-xs dim mt-1">次数 {{ attempts('leiyuan').used }} / {{ attempts('leiyuan').max }} · 重置 {{ fmtTime(resetIn(weeklyDungeon('leiyuan')!) ) }}</div>
        <div class="flex gap-2 mt-2">
          <button class="btn btn-sm flex-1" :disabled="attempts('leiyuan').used >= attempts('leiyuan').max" @click="g.enterDungeon('leiyuan', 0)">探 索</button>
          <button class="btn btn-sm" :disabled="!g.tower.cleared['leiyuan_0'] || (!g.monthActive && g.res.sweep < 1) || attempts('leiyuan').used >= attempts('leiyuan').max" @click="g.sweepDungeon('leiyuan', 0)">扫荡</button>
        </div>
      </div>
      <div class="panel">
        <div class="flex justify-between items-center">
          <b class="gold">太古遗墟</b><span class="chip">探索</span>
        </div>
        <div class="text-xs dim mt-1">上古遗迹，必出灵纹装备，稀有至宝碎片。</div>
        <div class="text-xs dim mt-1">次数 {{ attempts('guxu').used }} / {{ attempts('guxu').max }}</div>
        <div class="flex gap-2 mt-2">
          <button class="btn btn-sm flex-1" :disabled="attempts('guxu').used >= attempts('guxu').max" @click="g.enterDungeon('guxu', 0)">探 索</button>
          <button class="btn btn-sm" :disabled="!g.tower.cleared['guxu_0'] || (!g.monthActive && g.res.sweep < 1) || attempts('guxu').used >= attempts('guxu').max" @click="g.sweepDungeon('guxu', 0)">扫荡</button>
        </div>
      </div>
      <div class="panel md:col-span-2">
        <div class="flex justify-between items-center">
          <b :class="g.chaosOpen ? 'gold' : 'dim'">混沌之门</b>
          <span class="chip" :class="g.chaosOpen ? 'chip-gold' : ''">{{ g.chaosOpen ? '已开启' : '未开启' }}</span>
        </div>
        <div class="text-xs dim mt-1">每三旬旬末开启，门后混沌藏无尽造化与隐藏结局线索。</div>
        <button class="btn btn-sm mt-2" :disabled="!g.chaosOpen || g.chaosDoneKey === g.cycleKey" @click="g.runChaos()">
          {{ g.chaosDoneKey === g.cycleKey ? '本期已探索' : '推 门 而 入' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useGame } from '../stores/game'
import { DUNGEONS, DIFFS } from '../data/world'
import { baseAtk, baseDef, baseHp } from '../data/realms'
import { PVP_TIERS, pvpRank, pvpTierIdx } from '../data/meta'
import { TOWER_BUFF_MAP } from '../data/towerbuffs'
import { fmt, fmtTime } from '../core/format'

const g = useGame()
const dsel = reactive<Record<string, number>>({})

// 妖王殿：当前待挑战妖王的名号与凶威（按天数+尊序轮换）
const yaoInfo = computed(() => g.yaoSpec())

// 镇妖塔：关序 ↔ 层/关、今日增幅汇总
const tLayer = (f: number) => Math.ceil(f / 10)
const tStage = (f: number) => ((f - 1) % 10) + 1
interface BuffChip { id: string; n: string; d: string; tier: number; count: number }
const buffChips = computed<BuffChip[]>(() => {
  const cnt: Record<string, number> = {}
  for (const id of g.tower.buffs) cnt[id] = (cnt[id] || 0) + 1
  const out: BuffChip[] = []
  for (const [id, count] of Object.entries(cnt)) {
    const b = TOWER_BUFF_MAP[id]
    if (b) out.push({ id, n: b.n, d: b.d, tier: b.tier, count })
  }
  return out
})

function recRatio(diffIdx: number): number {
  const df = DIFFS[diffIdx]
  const lv = Math.max(0, g.lv + df.lvOff)
  const enemy = (baseAtk(lv) * 10 + baseDef(lv) * 6 + baseHp(lv) * 0.9) * df.mult
  return g.derived.power / Math.max(1, enemy)
}

const dailyDungeons = DUNGEONS.filter(d => !d.special && d.daily)

function weeklyDungeon(id: string) { return DUNGEONS.find(d => d.id === id) || null }

function attempts(id: string) { return g.dailyAttempts(id) }

const DAY = 86400000
const WEEK = DAY * 3
function resetIn(d: { weekly?: number; daily?: number }): number {
  const now = Date.now()
  if (d.weekly) return WEEK - (now % WEEK)
  return DAY - (now % DAY)
}
</script>
