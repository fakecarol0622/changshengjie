<template>
  <div class="flex flex-col gap-3">
    <!-- 烛龙脉 · 疏通 -->
    <div class="panel">
      <div class="panel-t">
        <span>烛 龙 脉 · {{ tierName }}（第 {{ v.lv }} 级）</span>
        <span class="text-xs dim">沉眠地底的远古龙脉，疏其经络，灵气自通</span>
      </div>
      <!-- 当前加成 -->
      <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <div class="flex justify-between"><span class="dim">挖出装备等级 <span class="dim2">（随境界）</span></span><b class="gold">Lv.{{ eqRange.min }} ~ {{ eqRange.max }}</b></div>
        <div class="flex justify-between"><span class="dim">可挖品质区间</span><b :style="{ color: qColor(cur.q.max) }">{{ qName(cur.q.min) }} ~ {{ qName(cur.q.max) }}</b></div>
        <div class="flex justify-between"><span class="dim">挖掘出货率</span><b class="jade">+{{ cur.luck }}%</b></div>
        <div class="flex justify-between"><span class="dim">开脉石收益</span><b class="jade">+{{ cur.lingmaiP }}%</b></div>
      </div>
      <div class="divider"></div>

      <!-- 疏通中 -->
      <template v-if="uping">
        <div class="flex justify-between items-center text-sm">
          <span>正在疏通 <b class="gold">第 {{ v.lv + 1 }} 级</b>（{{ nextTierName }}）</span>
          <b class="gold">{{ remainStr }}</b>
        </div>
        <div class="pbar mt-1"><div class="pfill" :style="{ width: pct + '%' }"></div></div>
        <div class="flex gap-2 mt-2 items-center flex-wrap">
          <button class="btn btn-sm btn-gold" :disabled="longsui < 1" @click="g.veinAccelerate()">龙髓加速 ×1（-10 分钟）</button>
          <span class="text-xs dim">持有龙髓 <b class="gold">{{ longsui }}</b> 枚</span>
        </div>
      </template>

      <!-- 圆满 -->
      <template v-else-if="v.lv >= VEIN_MAX">
        <div class="text-sm jade">烛龙脉已至圆满（{{ VEIN_MAX }} 级），天地灵气尽归此脉。</div>
      </template>

      <!-- 可升级：下一级预览 + 疏通 -->
      <template v-else>
        <div class="text-xs mb-1"><span class="dim">下一级（第 {{ v.lv + 1 }} 级 · {{ nextTierName }}）加成预览：</span></div>
        <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <div class="flex justify-between gap-1">
            <span class="dim shrink-0">品质区间</span>
            <span>{{ qName(cur.q.min) }}~{{ qName(cur.q.max) }} → <b class="jade">{{ qName(next.q.min) }}~{{ qName(next.q.max) }}</b></span>
          </div>
          <div class="flex justify-between"><span class="dim">出货率</span><span>+{{ cur.luck }}% → <b class="jade">+{{ next.luck }}%</b></span></div>
          <div class="flex justify-between"><span class="dim">开脉石收益</span><span>+{{ cur.lingmaiP }}% → <b class="jade">+{{ next.lingmaiP }}%</b></span></div>
        </div>
        <div class="flex justify-between items-center text-xs mt-2">
          <span>本境挖掘进度 <b :class="digMet ? 'jade' : 'gold'">{{ Math.min(digs, digReq) }} / {{ digReq }}</b><span class="dim2">（疏通前需先在本境挖掘）</span></span>
        </div>
        <div class="pbar !h-1.5 mt-1"><div class="pfill !h-full" :style="{ width: (digReq ? Math.min(100, digs / digReq * 100) : 100) + '%' }"></div></div>
        <div class="text-xs mt-2">
          疏通消耗：<b :class="g.res.lingshi >= upCost ? 'gold' : 'red'">灵石 {{ fmt(upCost) }}</b><span class="dim">（持有 {{ fmt(g.res.lingshi) }}<template v-if="g.res.lingshi < upCost"> · <b class="red">还差 {{ fmt(upCost - g.res.lingshi) }}</b></template>）</span>
          · 预计耗时 <b class="gold">{{ fmtTime(upTime) }}</b>
          <span class="dim2">（后期愈发艰难，龙髓可缩短时间）</span>
        </div>
        <button class="btn w-full mt-2" :class="canUp ? 'btn-gold' : ''" :disabled="!canUp" @click="g.veinStartUp()">
          {{ !digMet ? `还需在本境挖掘 ${Math.max(0, digReq - digs)} 次` : g.res.lingshi < upCost ? `灵石不足 · 还差 ${fmt(upCost - g.res.lingshi)}` : '疏 通 龙 脉' }}
        </button>
      </template>
      <div class="text-xs dim2 mt-2">龙髓获取：挖掘掉落 · 每日活跃宝箱 · 坊市奇货 · 问道长阶每 10 阶首通 · 脉力暴动</div>
    </div>

    <!-- 挖掘操作区 -->
    <div class="panel">
      <div class="panel-t">
        <span>龙 脉 挖 掘</span>
        <span class="text-xs dim">出货率 {{ sgn(Math.round(g.derived.stats.dropLuck)) }}% {{ sgn(cur.luck) }}%（龙脉）{{ tide ? ' +40%（潮汐）' : '' }}</span>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <button
          class="btn btn-gold min-w-28"
          :disabled="busy || g.res.lingmai < digCost"
          @click="g.mineDig(1)"
        >挖掘 ×1（耗开脉石×{{ digCost }}）</button>
        <button class="btn" :disabled="busy || g.res.lingmai < digCost * 10" @click="g.mineDig(10)">
          连挖 ×10（耗开脉石×{{ digCost * 10 }})
        </button>
        <div class="flex items-center gap-2 text-xs dim ml-auto">
          <span>自动挖掘</span>
          <div class="switch" :class="{ on: g.mine.auto }" @click="g.setAuto(!g.mine.auto)"></div>
        </div>
      </div>
      <div class="text-xs dim mt-1">
        开脉石：<b class="gold">{{ fmt(g.res.lingmai) }}</b>（+{{ fmt1(g.lingmaiPerSec) }}/秒{{ cur.lingmaiP > 0 ? `，含龙脉 +${cur.lingmaiP}%` : '' }}）
        · 每挖一次耗开脉石 <b class="gold">{{ digCost }}</b>（龙脉越深耗得越多；挖掘本身不再产出开脉石） · 脉力暴动概率 {{ surgePct }}%
      </div>
      <div class="text-xs dim2 mt-0.5">开脉石来源：挂机吐纳 · 副本扫荡 · 活跃宝箱 · 坊市奇货；主要去处：开凿龙脉 · 装备强化 · 分身凝练。</div>
      <div class="grid grid-cols-2 gap-2 mt-2 text-xs">
        <div>
          <div class="flex justify-between dim"><span>小保底（120 次）</span><span>{{ pity100 }}/120</span></div>
          <div class="pbar !h-1.5"><div class="pfill !h-full" :style="{ width: (pity100 % 120) / 1.2 + '%' }"></div></div>
        </div>
        <div>
          <div class="flex justify-between dim"><span>大保底（600 次·灵纹）</span><span>{{ pity500 }}/600</span></div>
          <div class="pbar !h-1.5"><div class="pfill pfill-blue !h-full" :style="{ width: (pity500 % 600) / 6 + '%' }"></div></div>
        </div>
      </div>
      <div class="divider"></div>
      <div class="mt-2">
        <div class="text-xs dim mb-1">各品质概率（由龙脉等级决定 · 含当前出货率加成）</div>
        <div class="flex h-2.5 rounded overflow-hidden" style="border: 1px solid var(--line2)">
          <div v-for="dt in qdist" :key="dt.q" :style="{ width: dt.pct + '%', background: qColor(dt.q) }" :title="qName(dt.q) + ' ' + dt.pct + '%'"></div>
        </div>
        <div class="flex flex-wrap gap-1 mt-1 text-xs">
          <span v-for="dt in qdist" :key="dt.q" class="chip" :style="{ color: qColor(dt.q), borderColor: qColor(dt.q) + '66' }">{{ qName(dt.q) }} {{ dt.pct }}%</span>
        </div>
      </div>
    </div>

    <!-- 最近收获 -->
    <div class="panel">
      <div class="panel-t">
        <span>最 近 收 获</span>
        <button class="btn btn-xs" @click="g.discardJunk(4, 2)">清理低阶（≤地品2星）</button>
      </div>
      <div v-if="!g.mine.recent.length" class="dim2 text-sm">尚无收获，去挖一铲试试运气吧。</div>
      <div class="flex flex-col gap-2 max-h-96 overflow-y-auto">
        <ItemCard v-for="it in g.mine.recent" :key="it.id" :e="it" class="pop-item">
          <template #actions>
            <button
              class="btn btn-xs" :class="wornIn(it.id) === g.clones.active ? '' : 'btn-gold'"
              @click="wornIn(it.id) === g.clones.active ? g.unequip(it.slot) : g.equipItem(it.id)"
            >{{ wornIn(it.id) === g.clones.active ? '卸 下' : wornIn(it.id) ? '转移装备' : '装 备' }}</button>
          </template>
        </ItemCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useGame } from '../stores/game'
import { VEIN_MAX, eqLevelRange, veinDigCost, veinDigReq, veinLingmaiP, veinLuck, veinQRange, veinQualityDist, veinTier, veinUpCost, veinUpTime } from '../data/realms'
import { qColor, qName } from '../data/qualities'
import { fmt, fmt1, fmtTime } from '../core/format'
import ItemCard from '../components/ItemCard.vue'

const g = useGame()
function wornIn(id: number): 'main' | 'yang' | 'yin' | null { return g.wornBodyOf(id) }
const tide = computed(() => g.activity?.id === 'tide')
const v = computed(() => g.vein)
const tierName = computed(() => veinTier(v.value.lv))
const nextTierName = computed(() => veinTier(v.value.lv + 1))
const digCost = computed(() => veinDigCost(v.value.lv))
const upCost = computed(() => veinUpCost(v.value.lv))
const upTime = computed(() => veinUpTime(v.value.lv))
const digReq = computed(() => veinDigReq(v.value.lv))
const digs = computed(() => v.value.digs || 0)
const digMet = computed(() => digs.value >= digReq.value)
const canUp = computed(() => digMet.value && g.res.lingshi >= upCost.value)
const longsui = computed(() => g.mats['longsui'] || 0)
const pity100 = computed(() => g.mine.pity100['v'] || 0)
const pity500 = computed(() => g.mine.pity500['v'] || 0)
const eqRange = computed(() => eqLevelRange(g.lv))
const busy = computed(() => !!g.mineBusy)

interface VeinSnap { q: { min: number; max: number }; luck: number; lingmaiP: number }
function snap(lv: number): VeinSnap {
  return { q: veinQRange(lv), luck: veinLuck(lv), lingmaiP: veinLingmaiP(lv) }
}
const cur = computed<VeinSnap>(() => snap(v.value.lv))
const next = computed<VeinSnap>(() => snap(Math.min(VEIN_MAX, v.value.lv + 1)))

// 疏通倒计时（每秒刷新）
const now = ref(Date.now())
const timer = window.setInterval(() => { now.value = Date.now(); g.veinTick() }, 1000)
onUnmounted(() => window.clearInterval(timer))
const uping = computed(() => v.value.upgUntil > now.value)
const pct = computed(() => {
  if (!uping.value) return 0
  const total = upTime.value
  const remain = v.value.upgUntil - now.value
  return Math.max(0, Math.min(100, (1 - remain / total) * 100))
})
const remainStr = computed(() => (uping.value ? fmtTime(Math.max(0, v.value.upgUntil - now.value)) : ''))

const qdist = computed(() => veinQualityDist(v.value.lv, g.derived.stats.dropLuck + veinLuck(v.value.lv) + (tide.value ? 40 : 0)))
function sgn(n: number): string { return (n >= 0 ? '+' : '') + n }
const surgePct = computed(() => {
  const base = 3 * (tide.value ? 2 : 1) * (1 + g.attrs.qiYun * 0.005)
  return (Math.round(base * 10) / 10).toFixed(1)
})
</script>
