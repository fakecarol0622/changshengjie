<template>
  <div class="itemcard cursor-pointer" :class="'bq' + e.q" @click="open" title="点击查看详情">
    <div class="flex justify-between items-start gap-2">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span :class="'qc' + e.q" class="font-bold">{{ e.name }}</span>
          <span class="gold text-xs">{{ stars }}</span>
          <span class="chip chip-gold">Lv.{{ e.level }}</span>
          <span v-if="e.enh" class="chip" style="color: #ffd76a; border-color: rgba(255, 215, 106, 0.45)">+{{ e.enh }}</span>
          <span class="chip">{{ slotName }}</span>
          <span v-if="e.rune" class="chip chip-gold">灵纹·{{ runeName }}</span>
          <span v-if="e.enchanted" class="chip">已洗练</span>
          <span v-if="e.selfMined" class="chip chip-jade">摇得</span>
        </div>
        <div class="mt-1 flex flex-wrap">
          <span v-for="(a, i) in e.affixes" :key="i" class="affix-chip" :class="'t' + a.tier">{{ affixText(a) }}</span>
          <span v-if="!e.affixes.length" class="dim2 text-xs">无词条</span>
        </div>
        <div class="mt-0.5 text-[11px] dim2 flex gap-2 flex-wrap">
          <span>评分 <b class="gold">{{ fmt(e.score) }}</b></span>
          <span v-if="e.flavors.length">流派 {{ e.flavors.join('/') }}</span>
          <span v-if="e.elements.length">五行 {{ e.elements.join('/') }}</span>
        </div>
        <div v-if="e.tags && e.tags.length" class="mt-1 flex gap-1 flex-wrap">
          <span
            v-for="t in e.tags" :key="t" class="chip"
            style="color: #c9a0ff; border-color: rgba(180, 140, 255, 0.5)"
            :title="TAG_MAP[t]?.d + '（铭纹间可共鸣）'"
          >{{ TAG_LABEL(t) }}</span>
        </div>
      </div>
      <div v-if="!compact" class="flex flex-col gap-1 shrink-0" @click.stop>
        <slot name="actions"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AffixRoll, Equip } from '../types'
import { AFFIX_MAP, RUNE_MAP, SLOT_NAMES } from '../data/qualities'
import { TAG_LABEL, TAG_MAP } from '../data/tags'
import { fmt } from '../core/format'
import { useGame } from '../stores/game'

const g = useGame()
const props = defineProps<{ e: Equip; compact?: boolean }>()

function open() {
  g.pushModal('item', props.e)
}

const slotName = computed(() => SLOT_NAMES[props.e.slot])
const runeName = computed(() => (props.e.rune ? RUNE_MAP[props.e.rune]?.n || '' : ''))
const stars = computed(() => '★'.repeat(props.e.stars))

function affixText(a: AffixRoll): string {
  const d = AFFIX_MAP[a.k]
  return `${d.n} +${a.v}${d.pct ? '%' : ''}`
}
</script>
