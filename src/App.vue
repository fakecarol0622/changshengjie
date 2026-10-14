<template>
  <div class="app-bg min-h-screen" :class="{ shake: shaking }">
    <!-- ============ 角色创建 ============ -->
    <div v-if="!g.started" class="min-h-screen flex items-center justify-center p-4">
      <div class="panel max-w-lg w-full !p-5">
        <div class="text-center text-3xl gold font-bold tracking-[0.35em] my-3">长 生 劫</div>
        <p class="text-center dim text-xs mb-4">单机放置修仙 · 长生路上多劫难，问君能渡几重天</p>

        <label class="text-xs dim">道 号</label>
        <input
          v-model="name"
          class="btn !min-h-9 w-full mb-3 justify-start"
          style="color: var(--txt); background: #1c1712"
          maxlength="8"
          placeholder="请为道友取个道号…"
        />

        <label class="text-xs dim">出 身</label>
        <div class="grid grid-cols-2 gap-1 my-1 mb-3">
          <div
            v-for="(o, i) in ORIGINS" :key="i"
            class="panel !p-2 cursor-pointer text-xs"
            :class="origin === i ? 'ring-1 ring-yellow-600/70' : ''"
            @click="origin = i"
          >
            <b class="gold">{{ o.n }}</b>
            <div class="dim">{{ o.desc }}</div>
          </div>
        </div>

        <div class="panel !p-3 mb-3">
          <div class="text-center text-xs dim mb-1">初 始 道 基 <span class="dim2">（可无限重掷）</span></div>
          <div class="grid grid-cols-3 gap-y-1 text-xs">
            <span v-for="[k, label] in ROLLED_ATTRS" :key="k" class="text-center">{{ label }} <b class="gold">{{ attrVal(k) }}</b></span>
          </div>
          <div class="text-xs dim2 text-center mt-1">器道省强化灵石、丹道增丹药效果、探幽提高奇遇品质</div>
          <button class="btn btn-xs w-full mt-2" @click="g.rerollAttrs()">重掷道基</button>
        </div>

        <div class="panel !p-3 text-center text-sm mb-3">
          <div>天生灵根：<b class="jade text-lg">{{ g.root.n }}</b> <span class="dim">修行 ×{{ g.root.mult }}</span></div>
          <div class="dim text-xs mt-1">{{ g.root.desc }}</div>
          <div v-if="g.physique" class="gold text-xs mt-1">体质觉醒：{{ g.physique }}</div>
          <button class="btn btn-xs mt-2" @click="g.rerollRoot()">重掷灵根（不限次）</button>
        </div>

        <div class="panel !p-3 mb-3">
          <div class="text-center text-xs dim mb-1">先 天 气 运（命格） <span class="dim2">共 {{ TRAIT_COUNT }} 种 · 可无限重掷</span></div>
          <div v-for="tid in g.traits" :key="tid" class="text-xs text-center py-0.5">
            <b :class="traitCls(tid)">【{{ traitDef(tid).n }}】</b>
            <span class="dim">{{ traitDef(tid).desc }}</span>
          </div>
          <button class="btn btn-xs w-full mt-2" @click="g.rerollTraits()">重掷气运（不限次）</button>
        </div>

        <div class="text-xs dim2 mb-3">随机种子 {{ g.seed }} · 每一次轮回皆是不同的天机</div>
        <button class="btn btn-gold w-full !min-h-11" :disabled="!name.trim()" @click="start">踏 上 仙 途</button>
        <p v-if="g.reinc.points > 0" class="text-center gold text-xs mt-2">轮回之力 ×{{ g.reinc.points }} 将在新一世庇佑于你</p>
      </div>
    </div>

    <!-- ============ 主界面 ============ -->
    <template v-else>
      <header class="topbar">
        <div class="max-w-5xl mx-auto px-3 py-2 flex items-center justify-between gap-2 flex-wrap text-xs">
          <div class="flex items-center gap-1 flex-wrap">
            <b class="gold">{{ g.name }}</b>
            <span class="chip chip-gold">{{ g.realmText }}</span>
            <span v-if="g.titleEqDef" class="chip" :class="'title-r' + g.titleEqDef.r">{{ g.titleEqDef.n }}</span>
            <span v-if="g.injured > 0" class="chip chip-red">受 伤 中</span>
            <span class="chip chip-jade" :title="g.activityDesc">{{ g.seasonText }}</span>
          </div>
          <div class="flex gap-2 flex-wrap items-center num">
            <span>灵石 <b class="gold">{{ fmt(g.res.lingshi) }}</b></span>
            <span>灵脉石 <b class="gold">{{ fmt(g.res.lingmai) }}</b></span>
            <span>仙玉 <b class="violet">{{ fmt(g.res.xianyu) }}</b></span>
            <span class="hidden sm:inline">洗练 <b class="gold">{{ g.res.xilian }}</b></span>
            <span class="hidden sm:inline">共鸣 <b class="gold">{{ g.res.gongming }}</b></span>
            <span class="hidden md:inline">器魂 <b class="gold">{{ fmt(g.res.qihun) }}</b></span>
            <span class="hidden md:inline" v-if="g.sect">贡献 <b class="gold">{{ fmt(g.res.contrib) }}</b></span>
          </div>
        </div>
      </header>

      <main class="max-w-5xl mx-auto px-3 pt-3 pb-28">
        <component :is="panelComp" :go="goTab" />
      </main>

      <nav class="nav-b">
        <div
          v-for="t in NAV" :key="t.id"
          class="nav-btn" :class="{ active: g.tab === t.id }"
          @click="goTab(t.id)"
        >
          <span class="ni">{{ t.icon }}</span>
          <span>{{ t.n }}</span>
        </div>
      </nav>
    </template>

    <Particles />
    <ModalHost />
    <div v-if="tip" :key="tip.id" class="tip-bubble modal-box !p-2 !w-auto !max-w-xs text-xs float-up">{{ tip.t }}</div>
    <div v-if="flashOn" :key="flashKey" class="golden-flash"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useGame } from './stores/game'
import { ORIGINS } from './data/world'
import { fmt } from './core/format'
import { startMusic } from './core/sfx'
import { TRAIT_MAP, TRAITS } from './data/traits'
import { ROLLED_ATTRS } from './stores/game'
import Particles from './components/Particles.vue'
import ModalHost from './components/ModalHost.vue'
import PanelGacha from './panels/PanelGacha.vue'
import PanelCultivate from './panels/PanelCultivate.vue'
import PanelMine from './panels/PanelMine.vue'
import PanelGear from './panels/PanelGear.vue'
import PanelCave from './panels/PanelCave.vue'
import PanelMarket from './panels/PanelMarket.vue'
import PanelDungeon from './panels/PanelDungeon.vue'
import PanelSect from './panels/PanelSect.vue'
import PanelCodex from './panels/PanelCodex.vue'
import PanelSocial from './panels/PanelSocial.vue'
import PanelMore from './panels/PanelMore.vue'
import PanelStage from './panels/PanelStage.vue'

const g = useGame()
const name = ref('')
const origin = ref(0)
const TRAIT_COUNT = TRAITS.length

function attrVal(k: string): number {
  return (g.attrs as unknown as Record<string, number>)[k] || 0
}

function traitDef(id: string) { return TRAIT_MAP[id] || { n: '未知', r: 1, desc: '' } }
function traitCls(id: string) {
  const r = traitDef(id).r
  return r === 3 ? 'gold' : r === 2 ? 'jade' : 'dim'
}

function initMusicOnGesture() {
  if (g.settings.music) startMusic()
  document.removeEventListener('pointerdown', initMusicOnGesture)
}
onMounted(() => document.addEventListener('pointerdown', initMusicOnGesture))

// —— 移动端：点按 [title] 元素弹出解释气泡（桌面端仍用原生悬停） ——
const tip = ref<{ t: string; id: number } | null>(null)
let tipTimer: number | undefined
function onDocTap(e: Event) {
  const tg = e.target
  if (!(tg instanceof Element)) return
  if (!window.matchMedia || !window.matchMedia('(hover: none)').matches) return
  const el = tg.closest('[title]')
  if (!el) return
  // 按钮/链接/输入控件：点按是执行动作，不弽气泡
  if (el.closest('button, a, input, select, textarea')) return
  const txt = el.getAttribute('title')
  if (!txt) return
  tip.value = { t: txt, id: Date.now() }
  if (tipTimer) window.clearTimeout(tipTimer)
  tipTimer = window.setTimeout(() => { tip.value = null }, 3200)
}
onMounted(() => document.addEventListener('click', onDocTap, true))
onUnmounted(() => document.removeEventListener('click', onDocTap, true))

const NAV = [
  { id: 'cultivate', n: '修炼', icon: '☯' },
  { id: 'mine', n: '灵脉', icon: '⛏' },
  { id: 'gear', n: '器物', icon: '⚔' },
  { id: 'cave', n: '洞府', icon: '🏔' },
  { id: 'dungeon', n: '副本', icon: '🗡' },
  { id: 'sect', n: '宗门', icon: '⛩' },
  { id: 'market', n: '坊市', icon: '🏮' },
  { id: 'gacha', n: '仙缘', icon: '✨' },
  { id: 'more', n: '更多', icon: '☰' },
]

const PANELS: Record<string, unknown> = {
  cultivate: PanelCultivate,
  mine: PanelMine,
  gear: PanelGear,
  cave: PanelCave,
  market: PanelMarket,
  gacha: PanelGacha,
  dungeon: PanelDungeon,
  sect: PanelSect,
  codex: PanelCodex,
  social: PanelSocial,
  more: PanelMore,
  stage: PanelStage,
}
const panelComp = computed(() => PANELS[g.tab] || PanelCultivate)

function goTab(t: string) {
  g.tab = t
  window.scrollTo({ top: 0 })
}

function start() {
  g.startGame(name.value.trim(), origin.value)
}

// 闪光与震动
const flashOn = ref(false)
const flashKey = ref(0)
const shaking = ref(false)
watch(() => g.fx.flash, () => {
  flashKey.value++
  flashOn.value = true
  setTimeout(() => { flashOn.value = false }, 1100)
})
watch(() => g.fx.shake, () => {
  shaking.value = true
  setTimeout(() => { shaking.value = false }, 500)
})

let timer = 0
onMounted(() => {
  g.init()
  timer = window.setInterval(() => g.tick(Date.now()), 1000)
  window.addEventListener('beforeunload', () => g.save())
  // 调试句柄（控制台可输入 g 查看状态）
  ;(window as unknown as { g: unknown }).g = g
  const saved = localStorage.getItem('changshengjie_v1')
  void saved
})
onUnmounted(() => {
  clearInterval(timer)
})
</script>
