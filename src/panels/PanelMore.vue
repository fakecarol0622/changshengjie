<template>
  <div class="flex flex-col gap-3">
    <!-- 工具（弹窗化） -->
    <div class="panel">
      <div class="panel-t">工 具</div>
      <div class="grid grid-cols-2 gap-2">
        <button class="btn btn-sm flex-col !min-h-14 gap-0.5" @click="g.pushModal('settings')">
          <span class="text-base leading-none">⚙</span><span class="text-[11px]">设置</span>
        </button>
        <button class="btn btn-sm flex-col !min-h-14 gap-0.5" @click="g.pushModal('guide')">
          <span class="text-base leading-none">📖</span><span class="text-[11px]">玩法</span>
        </button>
      </div>
    </div>

    <!-- 转世 -->
    <div class="panel">
      <div class="panel-t">轮 回 转 世</div>
      <div class="text-sm">转世次数 {{ g.reinc.count }} · 轮回之力 <b class="gold">{{ g.reinc.points }}</b> · 历史身死 {{ g.codex.deaths }} 次</div>
      <div class="text-xs dim mt-1">渡劫失败或主动散功后可转世（仙途无尽，寿元不再成为枷锁）。轮回之力提升初始属性点、稀有灵根概率与体质觉醒率。</div>
      <button class="btn btn-sm mt-2" :class="renounceArm ? 'btn-red' : ''" @click="doRenounce">{{ renounceArm ? '再点一次确认散功转世' : '主动散功转世（修为尽弃，铭刻于万古流芳）' }}</button>
    </div>

    <!-- 跨世档案 -->
    <div class="panel">
      <div class="panel-t">万 古 流 芳 <span class="text-xs dim">所有存档共享</span></div>
      <div class="text-sm">历代身 {{ g.accountData.records.length }} 条 · 存世最佳 <b class="gold">{{ fmt(g.accountData.best.power) }}</b><span v-if="g.accountData.best.realm" class="dim">（{{ g.accountData.best.n }} · {{ g.accountData.best.realm }}）</span></div>
      <div v-for="(r, i) in g.accountData.records.slice(0, 6)" :key="i" class="text-xs dim py-0.5">
        · {{ r.n }}【{{ r.realm }}】战力 {{ fmt(r.power) }} · 第{{ r.reinc + 1 }}世 · {{ r.root }}
      </div>
      <div v-if="!g.accountData.records.length" class="text-xs dim2">尚无记录。此生转世之时，将铭刻于此。</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGame } from '../stores/game'
import { fmt } from '../core/format'

const props = defineProps<{ go: (t: string) => void }>()
void props
const g = useGame()

const renounceArm = ref(false)
let renounceTimer: number | undefined
function doRenounce() {
  if (!renounceArm.value) {
    renounceArm.value = true
    g.toast('散功转世将失去当前修为与装备（保留轮回之力/图鉴/跨世档案），再点一次确认', 'gold')
    if (renounceTimer) window.clearTimeout(renounceTimer)
    renounceTimer = window.setTimeout(() => { renounceArm.value = false }, 4000)
    return
  }
  renounceArm.value = false
  g.reincarnate()
}
</script>
