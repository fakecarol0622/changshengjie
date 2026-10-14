<template>
  <div class="flex flex-col gap-3">
    <!-- 头部 -->
    <div class="panel flex justify-between items-center flex-wrap gap-2">
      <div>
        <b class="gold text-lg">问 道 长 阶</b>
        <span class="text-xs dim ml-2">已通关 {{ g.stage.cleared }}/{{ STAGE_MAX }} 阶 · 悟道加成 全属性 +{{ stageBonus(g.stage.cleared) }}%</span>
      </div>
      <button class="btn btn-sm" @click="props.go?.('cultivate')">← 返回首页</button>
    </div>

    <!-- 段位浏览 -->
    <div class="panel">
      <div class="text-xs dim mb-1">选择段位浏览进度（挑战始终从最新一关开始）</div>
      <div class="flex gap-1 flex-wrap">
        <button
          v-for="(s, i) in STAGE_SEGS" :key="s.n"
          class="btn btn-xs"
          :class="viewSeg === i ? 'btn-gold' : g.stage.cleared >= s.to ? 'jade' : ''"
          @click="viewSeg = i"
        >{{ s.n }} · {{ segDone(s) }}/{{ s.to - s.from + 1 }}</button>
      </div>
    </div>

    <!-- 关卡盘面 -->
    <StageBoard :seg-override="viewSeg" />

    <div class="panel text-xs dim leading-relaxed">
      规则：每 10 阶为守关 BOSS，首通获得论道帖/改命石与永久悟道加成（全属性 +1%/10阶）；📖 标记的关卡通关后解锁「仙途纪事」剧情卷宗。失败无惩罚，不断精进即可推进。
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGame } from '../stores/game'
import { STAGE_MAX, STAGE_SEGS, stageBonus } from '../data/stages'
import StageBoard from '../components/StageBoard.vue'

const props = defineProps<{ go?: (t: string) => void }>()
const g = useGame()
const viewSeg = ref(Math.min(STAGE_SEGS.length - 1, Math.floor(Math.max(0, g.stage.cleared) / 15)))

function segDone(s: { from: number; to: number }): number {
  return Math.max(0, Math.min(g.stage.cleared, s.to) - s.from + 1)
}
</script>
