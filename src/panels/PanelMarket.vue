<template>
  <div class="flex flex-col gap-3">
    <div class="flex gap-1 flex-wrap">
      <button v-for="t in tabs" :key="t.id" class="btn btn-sm" :class="tab === t.id ? 'btn-gold' : ''" @click="switchTab(t.id)">{{ t.n }}</button>
    </div>

    <!-- ============ 摆摊区 ============ -->
    <template v-if="tab === 'stall'">
      <div class="text-xs dim">每日刷新 8~12 个摊位。价格受魅力与气运影响，可讨价还价一次。</div>
      <div class="grid md:grid-cols-2 gap-2">
        <div v-for="st in g.market.stalls" :key="st.id" class="panel">
          <div class="panel-t"><span>{{ st.name }}</span><span class="text-xs dim2">灵石 {{ fmt(g.res.lingshi) }}</span></div>
          <div v-for="(it, i) in st.items" :key="i" class="flex justify-between items-center gap-2 py-1 border-b border-dashed" style="border-color: var(--line2)">
            <div class="min-w-0 text-sm" :class="it.kind === 'equip' ? 'cursor-pointer' : ''" @click="it.kind === 'equip' && viewItem(it.payload)">
              <template v-if="it.kind === 'equip'">
                <span :class="'qc' + (it.payload as any).q" class="font-bold">{{ (it.payload as any).name }}</span>
                <span class="text-xs dim ml-1">评分 {{ fmt((it.payload as any).score) }}</span>
              </template>
              <template v-else-if="it.kind === 'pill'">
                <span class="gold font-bold">{{ PILL_MAP[(it.payload as any).id].n }}</span>
                <span class="chip ml-1">{{ PILL_QNAMES[(it.payload as any).q] }}</span>
              </template>
              <template v-else-if="it.kind === 'egg'">
                <span class="gold">灵兽蛋</span><span class="chip ml-1">{{ qName((it.payload as any).q) }}品质</span>
              </template>
              <template v-else-if="it.kind === 'res'">
                <span class="gold">{{ RES_LABEL[(it.payload as any).key] || '凭证' }}</span>
                <span class="chip ml-1">×{{ (it.payload as any).n || 1 }}</span>
              </template>
              <template v-else>
                <span>{{ MAT_MAP[(it.payload as any).id]?.n || '秘宝' }} ×{{ (it.payload as any).n || 1 }}</span>
              </template>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <span class="gold text-sm">{{ fmt(it.price) }}</span>
              <button class="btn btn-xs" :disabled="it.haggled !== 0" @click="g.haggle(st.id, i)">议价</button>
              <button class="btn btn-xs btn-gold" @click="g.buyStall(st.id, i)">购买</button>
            </div>
          </div>
          <div v-if="!st.items.length" class="dim2 text-xs py-1">货架已空</div>
        </div>
      </div>
    </template>

    <!-- ============ 拍卖会 ============ -->
    <template v-else-if="tab === 'auction'">
      <div v-if="!g.auctionOpen" class="panel text-center">
        <div class="modal-title">拍 卖 会 未 开 始</div>
        <p class="dim text-sm my-2">每旬前 2.5 天举办。距下次开槌：<b class="gold">{{ fmtTime(nextAuctionIn) }}</b></p>
      </div>
      <template v-else>
        <div class="text-xs dim">拍品珍稀，NPC 会竞价甚至安排托儿抬价。气运高时可能捡漏。</div>
        <div v-for="(lot, i) in g.market.lots" :key="i" class="panel">
          <div class="flex justify-between items-center flex-wrap gap-2">
            <div>
              <span :class="['qc' + lot.q, lot.kind === 'equip' ? 'cursor-pointer' : '']" class="font-bold" @click="lot.kind === 'equip' && viewItem(lot.payload)">{{ lot.name }}</span>
              <span class="chip ml-1">{{ lot.kind === 'treasure' ? '法宝' : '装备' }}</span>
              <span v-if="lot.sold" class="chip chip-jade ml-1">已落槌</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="gold">当前价 {{ fmt(lot.price) }}</span>
              <button class="btn btn-xs btn-gold" :disabled="lot.sold" @click="g.bidAuction(i)">出价 {{ fmt(Math.round(lot.price * 1.12)) }}</button>
            </div>
          </div>
        </div>
      </template>
    </template>

    <!-- ============ 寄售行 ============ -->
    <template v-else-if="tab === 'consign'">
      <div class="panel">
        <div class="panel-t">我 的 寄 售（手续费 8%）</div>
        <div v-if="!g.market.myConsign.length" class="dim2 text-sm">暂无寄售。淘汰的装备可在此变现。</div>
        <div v-for="c in g.market.myConsign" :key="c.id" class="flex justify-between items-center py-1">
          <span :class="'qc' + c.q">{{ c.name }}</span>
          <span class="flex gap-1 items-center">
            <span class="gold text-sm">{{ fmt(c.price) }}</span>
            <button class="btn btn-xs" @click="g.cancelConsign(c.id)">下架</button>
          </span>
        </div>
        <div class="divider"></div>
        <div class="flex flex-wrap gap-2 items-center text-sm">
          <select v-model.number="sellId" class="btn !min-h-8 !py-1 max-w-56" style="color: var(--txt); background: #1c1712">
            <option :value="0" disabled>选择要上架的装备…</option>
            <option v-for="e in sellable" :key="e.id" :value="e.id">{{ e.name }}（评分{{ fmt(e.score) }}）</option>
          </select>
          <input v-model.number="sellPrice" type="number" class="btn !min-h-8 !py-1 w-32" style="color: var(--txt); background: #1c1712" min="1" />
          <button class="btn btn-sm btn-gold" :disabled="!sellId" @click="doList">上 架</button>
          <span class="text-xs dim">建议价：评分 × 0.8</span>
        </div>
      </div>
      <div class="panel">
        <div class="panel-t">他 人 寄 售</div>
        <div v-for="c in g.market.consign" :key="c.id" class="flex justify-between items-center py-1 gap-2">
          <span :class="'qc' + c.q" class="truncate cursor-pointer" @click="viewItem(c.payload)">{{ c.name }} <span class="text-xs dim">评分 {{ fmt((c.payload as any).score) }}</span></span>
          <span class="flex gap-1 items-center shrink-0">
            <span class="gold text-sm">{{ fmt(c.price) }}</span>
            <button class="btn btn-xs btn-gold" @click="g.buyConsign(c.id)">购买</button>
          </span>
        </div>
      </div>
    </template>

    <!-- ============ 黑市 ============ -->
    <template v-else-if="tab === 'bm'">
      <div v-if="!bmUnlocked" class="panel text-center">
        <div class="modal-title red">黑 市 之 门</div>
        <p class="dim text-sm my-2">需要魔道身份（业力>50、幽冥宗弟子或已入魔道）。</p>
        <p class="text-xs dim2">当前业力 {{ g.attrs.yeLi }} · 阵营 {{ g.align }}{{ g.sect ? ' · 宗门 ' + g.sect : '' }}</p>
      </div>
      <template v-else>
        <div class="panel">
          <div class="text-xs red mb-2">⚠ 黑市水深：可能买到假货，也可能被正道执法者盯上（触发追杀）。每次交易业力 +2。</div>
          <div v-for="(gd, i) in g.market.bmGoods" :key="i" class="flex justify-between items-center py-1 gap-2">
            <span :class="gd.kind === 'equip' ? 'cursor-pointer' : ''" @click="gd.kind === 'equip' && viewItem(gd.payload)">
              <span :class="'qc' + (gd.kind === 'equip' ? (gd.payload as any).q : 10)" class="font-bold">{{ gd.name }}</span>
              <span class="chip ml-1">{{ gd.kind === 'pill' ? '丹药' : gd.kind === 'mat' ? '材料' : '装备' }}</span>
              <span class="text-xs dim ml-1">×{{ (gd.payload as any).n || 1 }}</span>
            </span>
            <span class="flex gap-1 items-center">
              <span class="gold text-sm">{{ fmt(gd.price) }}</span>
              <button class="btn btn-xs btn-red" @click="g.bmBuy(i)">交易</button>
            </span>
          </div>
          <div v-if="!g.market.bmGoods.length" class="dim2 text-sm">黑市今日货已售罄，明日再来。</div>
        </div>
      </template>
    </template>

    <!-- ============ 仙玉阁 ============ -->
    <template v-else-if="tab === 'xy'">
      <div class="text-xs dim">仙玉为稀有货币，来自签到、境界礼包与活跃奖励。每日限购；袋装资源随境界提升。</div>
      <div v-for="s in XY_SKUS" :key="s.id" class="panel">
        <div class="flex justify-between items-center gap-2 flex-wrap">
          <div class="min-w-0">
            <b class="violet">{{ s.n }}</b>
            <span class="text-xs dim ml-1">{{ s.desc }}</span>
            <div class="text-xs dim2">今日已购 {{ g.xyu.counts[s.id] || 0 }}/{{ s.limit }}</div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="violet text-sm">仙玉 {{ s.cost }}</span>
            <button class="btn btn-sm btn-gold" :disabled="(g.xyu.counts[s.id] || 0) >= s.limit || g.res.xianyu < s.cost" @click="g.buyXianyu(s.id)">兑 换</button>
          </div>
        </div>
      </div>
    </template>

    <!-- ============ 以物易物 ============ -->
    <template v-else>
      <div class="text-xs dim mb-1">NPC 有特定需求，以物易物，慧眼识珍可捡漏。每日刷新。</div>
      <div v-for="b in g.market.barter" :key="b.id" class="panel">
        <div class="flex justify-between items-center flex-wrap gap-2">
          <div class="text-sm">
            <div>求：<b class="gold">{{ b.wantDesc }}</b>（持有可用 <b :class="barterCount(b) >= b.wantCount ? 'jade' : 'red'">{{ barterCount(b) }}</b>/{{ b.wantCount }}）</div>
            <div class="dim">予：{{ b.giveDesc }}</div>
          </div>
          <button class="btn btn-sm btn-gold" :disabled="b.done || barterCount(b) < b.wantCount" @click="g.barterDo(b.id)">
            {{ b.done ? '已完成' : '交 换' }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGame } from '../stores/game'
import { RES_LABEL } from '../data/rewards'
import { MAT_MAP, PILL_MAP, PILL_QNAMES } from '../data/items'
import { qName } from '../data/qualities'
import { XY_SKUS } from '../data/rewards'
import { fmt, fmtTime } from '../core/format'
import type { BarterOffer } from '../types'

const g = useGame()
const tabs = [
  { id: 'stall', n: '摆摊区' }, { id: 'xy', n: '仙玉阁' }, { id: 'auction', n: '拍卖会' },
  { id: 'consign', n: '寄售行' }, { id: 'bm', n: '黑市' }, { id: 'barter', n: '以物易物' },
]
const tab = ref('stall')

function viewItem(payload: unknown) {
  g.pushModal('item', payload)
}

function switchTab(id: string) {
  tab.value = id
  if (id === 'auction') g.refreshAuction()
  if (id === 'bm') g.refreshBm()
}

const nextAuctionIn = computed(() => {
  const d = (Date.now() / 86400000) % 10
  if (d < 2.5) return 0
  return (10 - d) * 86400000
})

// 寄售
const sellId = ref(0)
const sellPrice = ref(0)
const sellable = computed(() => {
  const worn = g.wornByAll
  return g.inventory.filter(e => !worn.has(e.id)).sort((a, b) => b.score - a.score).slice(0, 60)
})
function doList() {
  if (!sellId.value) return
  const e = g.inventory.find(x => x.id === sellId.value)
  if (!e) return
  const price = Math.max(1, Math.round(sellPrice.value || e.score * 0.8))
  g.listConsign(sellId.value, price)
  sellId.value = 0
  sellPrice.value = 0
}

// 黑市
const bmUnlocked = computed(() => g.attrs.yeLi > 50 || g.sect === '幽冥宗' || g.align === '魔')

// 易物
function barterCount(b: BarterOffer): number {
  const f = b.wantFilter
  if (f.type !== 'equip') return 0
  const worn = g.wornByAll
  return g.inventory.filter(e => !worn.has(e.id) && e.q >= (f.minQ || 1)).length
}
</script>
