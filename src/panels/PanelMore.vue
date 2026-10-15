<template>
  <div class="flex flex-col gap-3">
    <div class="panel">
      <div class="panel-t">仙 途 百 业 <span class="text-xs dim">修行之外，亦有天地</span></div>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <button v-for="entry in entries" :key="entry.id" class="system-entry" @click="props.go(entry.id)">
          <span class="system-seal" aria-hidden="true"><GlyphIcon :id="entry.icon" :size="20" :stroke="1.7" /></span>
          <span><b class="gold block">{{ entry.name }}</b><span class="text-xs dim">{{ entry.desc }}</span></span>
        </button>
      </div>
    </div>
    <!-- 工具（弹窗化） -->
    <div class="panel">
      <div class="panel-t">工 具</div>
      <div class="grid grid-cols-2 gap-2">
        <button class="btn btn-sm flex-col !min-h-14 gap-0.5" @click="g.pushModal('settings')">
          <GlyphIcon id="settings" :size="17" /><span class="text-[11px]">设置</span>
        </button>
        <button class="btn btn-sm flex-col !min-h-14 gap-0.5" @click="g.pushModal('guide')">
          <GlyphIcon id="story" :size="17" /><span class="text-[11px]">玩法</span>
        </button>
      </div>
    </div>

    <!-- 转世 -->
    <div class="panel">
      <div class="panel-t">轮 回 转 世</div>
      <div class="text-sm">转世次数 {{ g.reinc.count }} · 轮回之力 <b class="gold">{{ g.reinc.points }}</b> · 历史身死 {{ g.codex.deaths }} 次</div>
      <div class="text-xs dim mt-1">炼气期起可主动转世，获得与死亡转世相同的轮回之力。保留图鉴与历代档案，重置此生装备、修为与资源。</div>
      <div class="text-sm jade mt-2">本次可得轮回之力 +{{ g.reincReward }}</div>
      <button class="btn btn-sm mt-2" :disabled="g.major < 1" :class="renounceArm ? 'btn-red' : ''" @click="doRenounce">{{ renounceArm ? `确认散功，获得 ${g.reincReward} 点轮回之力` : g.major < 1 ? '修至炼气期后可转世' : '主动散功转世' }}</button>
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
import GlyphIcon from '../components/GlyphIcon.vue'

const props = defineProps<{ go: (t: string) => void }>()
const entries = [
  { id: 'cave', icon: 'cave', name: '洞府', desc: '灵田 · 炼丹 · 修炼设施' },
  { id: 'sect', icon: 'sect', name: '宗门', desc: '传承 · 任务 · 门人' },
  { id: 'market', icon: 'market', name: '坊市', desc: '交易 · 拍卖 · 奇货' },
  { id: 'gacha', icon: 'compass', name: '仙缘', desc: '寻仙 · 精怪 · 收藏' },
  { id: 'codex', icon: 'codex', name: '天机阁', desc: '图鉴 · 称号 · 共鸣' },
  { id: 'social', icon: 'npc', name: '江湖', desc: '修士 · 关系 · 榜单' },
]
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
