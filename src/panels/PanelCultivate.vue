<template>
  <div class="flex flex-col gap-3">
    <!-- 角色总览：境界 / 命格 / 属性 / 战力 -->
    <div class="panel">
      <div class="flex items-start justify-between flex-wrap gap-2">
        <div class="min-w-0">
          <div class="text-xl gold">{{ g.realmText }}
            <span class="text-xs dim">战力 {{ fmt(g.derived.power) }}</span>
            <span v-if="g.clones.active !== 'main'" class="chip chip-gold text-[10px] align-middle ml-1">出战·{{ g.activeBodyName }}</span>
          </div>
          <div class="text-xs dim">
            灵根：<b class="jade">{{ g.root.n }}</b>（×{{ g.root.mult }}）
            <span v-if="g.physique"> · 体质：<b class="gold">{{ g.physique }}</b></span>
            · 出身：{{ g.origin }}
          </div>
          <div class="flex items-center gap-1 flex-wrap mt-1">
            <span class="text-xs dim">命格</span>
            <span v-for="tid in g.traits" :key="tid" class="chip" :title="`${traitDef(tid).desc}（洗髓丹可重掷命格）`">
              <b :class="traitCls(tid)">{{ traitDef(tid).n }}</b>
            </span>
          </div>
        </div>
        <div class="text-right text-xs shrink-0">
          <div>天骄榜 <b class="gold">第 {{ g.myRank }} 位</b></div>
          <div class="dim">论道台 第 {{ pvpRank(g.pvp.points) }} 位 · {{ PVP_TIERS[pvpTierIdx(g.pvp.points)].n }}段</div>
        </div>
      </div>
      <div class="pbar mt-2">
        <div class="pfill" :style="{ width: pctCult + '%' }"></div>
      </div>
      <div class="flex justify-between text-xs mt-1 dim">
        <span>修为 {{ fmt(g.cultivation) }} / {{ fmt(g.nextReq) }}</span>
        <span>+{{ fmt1(g.cultPerSec) }} / 秒{{ g.injured > 0 ? '（受伤 -30%）' : '' }}</span>
      </div>
      <div class="flex gap-2 mt-2">
        <button class="btn btn-gold flex-1" :disabled="g.cultivation < g.nextReq" @click="g.tryBreakthrough()">
          {{ g.cultivation >= g.nextReq ? '尝 试 突 破' : '修为未满' }}
        </button>
        <button class="btn" @click="g.meditate()">{{ g.meditateUntil > 0 ? '打坐中…' : '打坐冥想' }}</button>
      </div>
      <div class="text-xs dim mt-1">
        突破成功率约 <b class="gold">{{ Math.round(g.breakChanceBase * 100) }}%</b>（大境界将触发雷劫抉择）；
        持有破障丹将自动服下提升成功率
      </div>

      <div class="divider"></div>
      <div class="text-xs dim mb-1">道 基 属 性</div>
      <div class="grid grid-cols-3 sm:grid-cols-6 gap-y-1 text-xs">
        <div v-for="(v, k) in attrList" :key="k">
          {{ k }} <b :class="k === '业力' ? 'red' : k === '功德' ? 'jade' : 'gold'">{{ v }}</b>
        </div>
      </div>

      <div class="divider"></div>
      <div class="text-xs dim mb-1">战 力 总 览</div>
      <div class="grid grid-cols-3 sm:grid-cols-4 gap-y-1 text-xs">
        <div v-for="(v, k) in statList" :key="k">{{ k }} <b class="gold">{{ v }}</b></div>
      </div>
      <div v-if="activeRes.length" class="mt-2">
        <div class="text-xs dim mb-1 flex items-center justify-between">
          <span>已激活共鸣 · {{ activeRes.length }} 条</span>
          <button class="btn btn-xs" @click="showRes = !showRes">{{ showRes ? '收起详情' : '共鸣详情' }}</button>
        </div>
        <span v-for="r in activeRes" :key="r.id" class="chip chip-gold mr-1 mb-1" :title="r.desc">{{ r.name }}</span>
        <div v-if="showRes" class="flex flex-col gap-1 mt-1">
          <div v-for="r in resList" :key="r.id" class="panel !p-2 text-xs" :class="r.active ? '' : 'opacity-70'">
            <div class="flex justify-between items-center gap-2">
              <b :class="r.active ? 'gold' : 'dim'">{{ r.name }}<span v-if="r.active" class="jade"> ✓</span></b>
              <span class="dim2 shrink-0">需：{{ r.req }}</span>
            </div>
            <div class="dim mt-0.5">{{ r.desc }}</div>
            <div class="jade mt-0.5">现有：{{ r.progress }}</div>
            <div v-if="r.contributors.length" class="dim2 mt-0.5">来源：{{ r.contributors.join('、') }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 问道长阶 · 入口 -->
    <div class="panel cursor-pointer" @click="props.go?.('stage')">
      <div class="flex justify-between items-center flex-wrap gap-2">
        <div class="min-w-0">
          <b class="gold">问 道 长 阶 · {{ segInfo.n }}</b>
          <span class="text-xs dim ml-2">已通关 {{ g.stage.cleared }}/{{ STAGE_MAX }} 阶 · 悟道加成 全属性+{{ stageBonus(g.stage.cleared) }}%</span>
          <div class="text-xs dim mt-1">下一关：第 {{ nextStageN }} 阶 · {{ nextEnemyInfo.name }}{{ nextEnemyInfo.boss ? '（守关BOSS）' : '' }} · 首通：{{ rewardBrief(stageRewards(nextStageN)) }}</div>
        </div>
        <button class="btn btn-sm btn-gold shrink-0" @click.stop="props.go?.('stage')">进入长阶 →</button>
      </div>
    </div>

    <!-- 仙途日课 -->
    <div class="panel">
      <div class="panel-t">仙 途 日 课 <span class="text-xs dim">每日福利，点开即领</span></div>
      <div class="grid grid-cols-3 sm:grid-cols-5 gap-2">
        <button class="btn btn-sm flex-col !min-h-14 gap-0.5" :class="!g.daily.daySigned ? 'btn-gold' : ''" @click="g.pushModal('signin')">
          <span class="text-base leading-none">📅</span><span class="text-[11px]">签到</span>
        </button>
        <button class="btn btn-sm flex-col !min-h-14 gap-0.5" :class="bundleReady ? 'btn-gold' : ''" @click="g.pushModal('bundle')">
          <span class="text-base leading-none">🎁</span><span class="text-[11px]">大礼包</span>
        </button>
        <button class="btn btn-sm flex-col !min-h-14 gap-0.5" :class="dailyReady ? 'btn-gold' : ''" @click="g.pushModal('daily')">
          <span class="text-base leading-none">📋</span><span class="text-[11px]">日常</span>
        </button>
        <button class="btn btn-sm flex-col !min-h-14 gap-0.5" :class="onlineReady ? 'btn-gold' : ''" @click="g.pushModal('online')">
          <span class="text-base leading-none">⏳</span><span class="text-[11px]">在线</span>
        </button>
        <button class="btn btn-sm flex-col !min-h-14 gap-0.5" :class="isActiveNow ? 'btn-gold' : ''" @click="g.pushModal('activity')">
          <span class="text-base leading-none">🗓</span><span class="text-[11px]">活动</span>
        </button>
      </div>
    </div>

    <!-- 仙途万象 -->
    <div class="panel">
      <div class="panel-t">仙 途 万 象 <span class="text-xs dim">天机阁与榜单 · 纪事与目标</span></div>
      <div class="grid grid-cols-4 gap-2">
        <button class="btn btn-sm flex-col !min-h-14 gap-0.5" title="图鉴 / 称号 / 共鸣典藏" @click="props.go?.('codex')">
          <span class="text-base leading-none">📜</span><span class="text-[11px]">天机阁</span>
        </button>
        <button class="btn btn-sm flex-col !min-h-14 gap-0.5" title="天骄榜 / 论道台 / 众生百态" @click="props.go?.('social')">
          <span class="text-base leading-none">🏆</span><span class="text-[11px]">天骄榜</span>
        </button>
        <button class="btn btn-sm flex-col !min-h-14 gap-0.5" :class="storyReady ? 'btn-gold' : ''" @click="g.pushModal('storybook')">
          <span class="text-base leading-none">📖</span><span class="text-[11px]">纪事</span>
        </button>
        <button class="btn btn-sm flex-col !min-h-14 gap-0.5" @click="g.pushModal('goals')">
          <span class="text-base leading-none">🎯</span><span class="text-[11px]">目标</span>
        </button>
      </div>
    </div>

    <!-- 游历与见闻 -->
    <div class="panel">
      <div class="panel-t">仙 途 见 闻</div>
      <div class="flex gap-2 mb-2 items-center">
        <button class="btn flex-1" :disabled="g.travel.n < 1" @click="g.explore()">
          出门游历 · 寻奇遇（{{ g.travel.n }}/{{ g.travelMax }}）
        </button>
        <span class="chip chip-jade" :title="g.activityDesc">{{ g.seasonText }}</span>
      </div>
      <div class="text-xs mb-1">当前天象：<b class="jade">{{ g.seasonText }}</b> · {{ g.activity?.desc || '无特殊加成' }}</div>
      <div class="text-xs dim mb-2">
        {{ g.travel.n >= g.travelMax ? '游历次数已满' : `下次恢复：${fmtTime(nextTravelIn)}` }} · 每 5 分钟恢复 1 点，境界越高上限越高
      </div>
      <div class="worldfeed max-h-44 overflow-y-auto">
        <p v-for="(w, i) in feed" :key="i">· {{ w }}</p>
        <p v-if="!feed.length" class="dim2">江湖平淡，暂无要闻……</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useGame, keyName, DAILY_TASKS } from '../stores/game'
import { fmt, fmt1, fmtTime, pct } from '../core/format'
import { ONLINE_REWARDS, PVP_TIERS, pvpRank, pvpTierIdx } from '../data/meta'
import { STORY } from '../data/story'
import { STAGE_MAX, stageBonus, stageEnemy, stageRewards, stageSeg } from '../data/stages'
import { TRAIT_MAP } from '../data/traits'
import { rewardBrief } from '../data/rewards'

const props = defineProps<{ go?: (t: string) => void }>()
const g = useGame()
const showRes = ref(false)

// 长阶入口与命格展示
const segInfo = computed(() => stageSeg(Math.min(STAGE_MAX, g.stage.cleared + 1)))
const nextStageN = computed(() => Math.min(STAGE_MAX, g.stage.cleared + 1))
const nextEnemyInfo = computed(() => stageEnemy(nextStageN.value))
function traitDef(id: string) { return TRAIT_MAP[id] || { n: '未知', r: 1, desc: '' } }
function traitCls(id: string) {
  const r = traitDef(id).r
  return r === 3 ? 'gold' : r === 2 ? 'jade' : 'dim'
}

// 入口按钮红点（可领取状态）
const dailyReady = computed(() =>
  DAILY_TASKS.some((t, i) => !g.daily.taskClaimed[i] && (g.daily.progress[t.k] || 0) >= t.target) ||
  ((g.daily.progress['pt'] || 0) >= 100 && !g.daily.chestTaken),
)
const onlineReady = computed(() => ONLINE_REWARDS.some((r, i) => g.online.sec >= r.sec && !g.online.got.includes(i)))
const bundleReady = computed(() =>
  (!g.daily.daySigned && g.daily.newbieDay < 7) ||
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].some(n => g.major >= n && !g.daily.realmGifts.includes(n)),
)
const storyReady = computed(() => STORY.some(sc => !g.story.done.includes(sc.id) && g.storyCtxReady(sc.id)))
const isActiveNow = computed(() => !!g.activity)

const now = ref(Date.now())
const timer = window.setInterval(() => { now.value = Date.now() }, 1000)
onUnmounted(() => clearInterval(timer))
const nextTravelIn = computed(() => Math.max(0, 300000 - (now.value - g.travel.rec)))

const pctCult = computed(() => Math.min(100, (g.cultivation / g.nextReq) * 100))

const attrList = computed(() => {
  const a = g.attrs
  return {
    根骨: a.genGu, 悟性: a.wuXing, 神识: a.shenShi, 气运: a.qiYun,
    道心: a.daoXin, 魅力: a.meiLi, 业力: a.yeLi, 天劫值: a.jieQi, 功德: a.gongDe,
    器道: a.qiDao, 丹道: a.danDao, 探幽: a.tanYou,
  }
})

const statList = computed(() => {
  const s = g.derived.stats
  return {
    攻击: fmt(s.atk), 防御: fmt(s.def), 气血: fmt(s.hp), 速度: fmt1(s.spd),
    暴击率: pct(s.crit), 暴击伤害: pct(s.critDmg), 连击率: pct(s.combo),
    闪避率: pct(s.dodge), 吸血: pct(s.lifesteal), 破甲: pct(s.armorPen),
    伤害减免: pct(s.dmgReduce), 护盾强度: pct(s.shield),
    击晕率: pct(s.stun), 反击率: pct(s.counter),
    抗击晕: pct(s.resistStun), 抗暴击: pct(s.resistCrit), 抗连击: pct(s.resistCombo),
    抗反击: pct(s.resistCounter), 抗吸血: pct(s.resistLifesteal),
  }
})

const activeRes = computed(() => g.resonanceInfo.filter(r => r.active))
const resList = computed(() => g.resonanceInfo)

const feed = computed(() => [...g.world].slice(-14).reverse().map(w => w.t))

void keyName
</script>
