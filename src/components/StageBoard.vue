<template>
  <div class="panel">
    <div class="panel-t">
      <span>问 道 长 阶 · {{ seg.n }}</span>
      <span class="text-xs dim">已通关 {{ g.stage.cleared }}/{{ STAGE_MAX }} 阶 · 悟道加成 全属性+{{ stageBonus(g.stage.cleared) }}%</span>
    </div>
    <div class="text-xs dim mb-1">{{ seg.desc }} · 每 10 阶守关，首通得大礼；特定关卡内嵌「仙途纪事」剧情（📖）</div>
    <div class="grid grid-cols-5 sm:grid-cols-8 gap-1">
      <button
        v-for="n in nodes" :key="n"
        class="btn btn-xs !min-h-8 relative"
        :class="n <= g.stage.cleared ? 'jade' : n === g.stage.cleared + 1 ? 'btn-gold' : 'opacity-50'"
        :disabled="n > g.stage.cleared + 1"
        :title="nodeTitle(n)"
        @click="doStage(n)"
      >
        {{ n }}
        <span v-if="g.storyMarkSet.has(n)" class="absolute -top-1 -right-1 text-[10px]">📖</span>
        <span v-if="n <= g.stage.cleared" class="text-[10px]">✓</span>
      </button>
    </div>
    <div class="flex gap-2 mt-2 items-center flex-wrap">
      <span v-if="isCurrent" class="text-xs">下一关：第 {{ nextN }} 阶 · {{ nextEnemy.name }}（{{ realmShort2(nextEnemy.lv) }}）{{ nextEnemy.boss ? '·守关BOSS' : '' }}</span>
      <span v-else class="text-xs dim">{{ g.stage.cleared >= seg.to ? '本段已全部通关 ✓' : '尚未抵达此段（先打通前面的关卡）' }}</span>
      <button v-if="isCurrent" class="btn btn-sm btn-gold" :disabled="g.stage.cleared >= STAGE_MAX" @click="g.stageEnter()">
        {{ g.stage.cleared >= STAGE_MAX ? '已全部通关' : `挑 战 第 ${nextN} 阶` }}
      </button>
    </div>
    <div v-if="isCurrent" class="text-xs dim mt-1">首通奖励：{{ rewardBrief(stageRewards(nextN)) }}（每 10 阶额外获得悟道加成与论道帖/改命石）</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGame } from '../stores/game'
import { STAGE_MAX, STAGE_SEGS, stageBonus, stageEnemy, stageRewards, stageSeg } from '../data/stages'
import { MAJOR } from '../data/realms'
import { rewardBrief } from '../data/rewards'

const props = defineProps<{ segOverride?: number | null }>()
const g = useGame()

const seg = computed(() => (
  props.segOverride != null
    ? STAGE_SEGS[props.segOverride]
    : stageSeg(Math.min(STAGE_MAX, g.stage.cleared + 1))
))
const isCurrent = computed(() => {
  const n = g.stage.cleared + 1
  return g.stage.cleared >= STAGE_MAX || (n >= seg.value.from && n <= seg.value.to)
})
const nodes = computed(() => {
  const out: number[] = []
  for (let n = seg.value.from; n <= seg.value.to; n++) out.push(n)
  return out
})
const nextN = computed(() => Math.min(STAGE_MAX, g.stage.cleared + 1))
const nextEnemy = computed(() => stageEnemy(nextN.value))

function realmShort2(lv: number): string {
  const major = Math.min(10, Math.floor(lv / 40))
  return MAJOR[major]
}
function nodeTitle(n: number): string {
  if (n <= g.stage.cleared) return `第 ${n} 阶（已通关）`
  if (n === g.stage.cleared + 1) return `第 ${n} 阶（待挑战）`
  return `第 ${n} 阶（未解锁）`
}
function doStage(n: number) {
  if (n === g.stage.cleared + 1) g.stageEnter()
  else {
    const sid = g.storyIdAt(n)
    if (sid) g.openStory(sid)
  }
}
</script>
