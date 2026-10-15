<template>
  <div class="flex flex-col gap-3">
    <div class="flex gap-1 flex-wrap">
      <button v-for="t in tabs" :key="t.id" class="btn btn-sm" :class="tab === t.id ? 'btn-gold' : ''" @click="tab = t.id">{{ t.n }}</button>
    </div>

    <!-- 品质 -->
    <template v-if="tab === 'quality'">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div v-for="(qd, i) in QUALITIES" :key="i" class="panel text-center" :class="'bq' + (i + 1)">
          <div :class="'qc' + (i + 1)" class="font-bold text-lg">{{ qd.n }}</div>
          <div class="text-xs dim">品质 {{ i + 1 }} 级</div>
          <div class="text-xs">词条 {{ qd.aff }} 条 · 共鸣槽 {{ Math.max(0, Math.floor((i + 1 - 4) / 2) + (i >= 3 ? 1 : 0)) }}</div>
          <div class="text-xs dim2">掉落权重随品质指数衰减</div>
        </div>
      </div>
    </template>

    <!-- 前缀 -->
    <template v-else-if="tab === 'prefix'">
      <div class="panel">
        <input v-model="search" class="btn !min-h-9 w-full" style="color: var(--txt); background: #1c1712" placeholder="搜索前缀（共 167 个）…" />
        <div class="flex gap-1 mt-2 flex-wrap">
          <button v-for="(seg, i) in PREFIX_SEGS" :key="i" class="btn btn-xs" :class="segTab === i ? 'btn-gold' : ''" @click="segTab = i">
            第{{ i + 1 }}段（品质{{ ['1~4', '5~8', '9~12', '13~16'][i] }}）
          </button>
        </div>
      </div>
      <div class="flex flex-wrap gap-1">
        <span
          v-for="p in filteredPrefixes" :key="p"
          class="chip cursor-default" :class="seen(p) ? 'chip-gold' : ''"
          :title="seen(p) ? '已见过' : '未曾出土'"
        >{{ p }}</span>
      </div>
    </template>

    <!-- 共鸣 -->
    <template v-else-if="tab === 'res'">
      <div class="panel text-xs dim">
        品质 10+ 装备自带「铭纹」（炎/寒/雷/风/岩/幽/星/龙）：同纹 3 件或双纹各 2 件即触发<b class="gold">铭纹共鸣</b>。旧的“基础属性堆叠”类共鸣（暴击≥4件等）易达成且过强，已废止。
      </div>
      <div v-for="cls in ['M', 'E', '宗']" :key="cls">
        <div class="gold text-sm my-1">
          {{ CLS_N[cls] }}（{{ RES_BY_CLS[cls].length }}）
        </div>
        <div class="grid sm:grid-cols-2 gap-2">
          <div
            v-for="r in RES_BY_CLS[cls]" :key="r.id"
            class="panel !p-2"
            :class="active(r.id) ? 'ring-1 ring-yellow-600/70' : 'opacity-70'"
          >
            <div class="flex justify-between items-center">
              <b :class="active(r.id) ? 'gold' : 'dim'">{{ r.name }}</b>
              <span v-if="active(r.id)" class="chip chip-gold">已激活</span>
              <span v-else class="chip">未激活</span>
            </div>
            <div class="text-xs dim mt-1">触发：{{ r.req }}</div>
            <div class="text-xs jade">{{ r.desc }}</div>
          </div>
        </div>
      </div>
    </template>

    <!-- 词条 -->
    <template v-else-if="tab === 'affix'">
      <div v-for="tier in [1, 2, 3]" :key="tier" class="panel">
        <div class="panel-t">{{ ['基 础 词 条（凡品~地品主出）', '进 阶 词 条（天品~神品主出）', '顶 级 词 条（圣品~混沌可出）'][tier - 1] }}</div>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1 text-sm">
          <div v-for="a in AFFIXES.filter(x => x.tier === tier)" :key="a.k">
            {{ a.n }} <span class="dim text-xs">{{ a.min }} ~ {{ a.max }}{{ a.pct ? '%' : '' }}</span>
          </div>
        </div>
      </div>
    </template>

    <!-- 装备图鉴 -->
    <template v-else-if="tab === 'item'">
      <div class="panel text-xs dim">
        共收录 {{ Object.keys(g.codex.items).length }} 件装备 · 历史最高评分 {{ fmt(g.codex.bestScore) }} · 摇落 {{ g.codex.pulls }} 次 · 转世 {{ g.codex.deaths }} 次
      </div>
      <div v-if="compare.length" class="panel">
        <div class="panel-t">装 备 对 比</div>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div v-for="e in compare" :key="e.id" class="itemcard" :class="'bq' + e.q">
            <div :class="'qc' + e.q" class="font-bold">{{ e.name }}</div>
            <div>评分 {{ fmt(e.score) }} · 品质{{ qName(e.q) }} · {{ e.stars }}★</div>
            <div class="dim mt-1">{{ e.affixes.length }} 条词条</div>
          </div>
        </div>
        <div class="text-xs gold mt-1">
          评分差：{{ fmt(Math.abs(compare[0].score - compare[1].score)) }}
          （{{ compare[0].score > compare[1].score ? compare[0].name : compare[1].name }} 更优）
        </div>
        <button class="btn btn-xs mt-1" @click="compare = []">清除对比</button>
      </div>
      <div class="flex flex-col gap-2 max-h-[560px] overflow-y-auto">
        <ItemCard v-for="e in codexItems" :key="e.id" :e="e">
          <template #actions>
            <button class="btn btn-xs" @click="toggleCompare(e)">{{ compare.find(x => x.id === e.id) ? '移出对比' : '加入对比' }}</button>
          </template>
        </ItemCard>
      </div>
    </template>

    <!-- 称号 -->
    <template v-else-if="tab === 'title'">
      <div class="text-xs dim">达成条件自动获得称号，可佩戴一个展示于顶栏。稀有度：凡品 · 良品 · 珍品 · 极品 · 传说（越高视觉效果越耀眼）。</div>
      <div class="grid sm:grid-cols-2 gap-2">
        <div v-for="t in TITLES" :key="t.id" class="panel !p-3" :class="owned(t.id) ? '' : 'opacity-40'">
          <div class="flex justify-between items-center gap-2">
            <div class="min-w-0">
              <span class="chip" :class="'title-r' + t.r">{{ t.n }}</span>
              <span class="text-xs ml-1" :class="'title-r' + t.r">{{ TITLE_RARITY[t.r] }}</span>
            </div>
            <button v-if="owned(t.id)" class="btn btn-xs shrink-0" :class="g.titles.eq === t.id ? '' : 'btn-gold'" @click="g.equipTitle(t.id)">
              {{ g.titles.eq === t.id ? '佩戴中' : '佩 戴' }}
            </button>
            <span v-else class="chip shrink-0">未达成</span>
          </div>
          <div class="text-xs dim mt-1">{{ t.desc }}</div>
        </div>
      </div>
      <div class="text-xs dim2">已获得 {{ g.titles.owned.length }} / {{ TITLES.length }} 个称号</div>
    </template>

    <!-- 太初宝树 -->
    <template v-else>
      <div class="panel">
        <div class="text-xs dim mb-2">太初宝树：根须扎在烛龙脉上，摇落得宝。每重提升出货率、品质区间与灵露产出；<b class="gold">每重需先在本重摇落一定次数</b>方可培育，后期所需灵石与时间渐增，可用「龙髓」加速（摇落/宝箱/坊市/长阶可得）。<b class="jade">摇出的装备等级随主角境界（当前 Lv.{{ eqRange.min }}~{{ eqRange.max }}）</b>，与宝树重数无关。</div>
        <table class="tbl">
          <thead><tr><th>重</th><th>段</th><th>品质区间</th><th>出货率</th><th>灵露</th><th>需摇落</th><th>培育消耗</th><th>耗时</th></tr></thead>
          <tbody>
            <tr v-for="row in veinRows" :key="row.lv" :class="row.lv === g.vein.lv ? 'gold' : ''">
              <td>{{ row.lv }}{{ row.lv === g.vein.lv ? '（当前）' : '' }}</td>
              <td>{{ row.tier }}</td>
              <td>{{ qName(row.q.min) }} ~ {{ qName(row.q.max) }}</td>
              <td>+{{ row.luck }}%</td>
              <td>+{{ row.lingmaiP }}%</td>
              <td>{{ row.digReq }} 次</td>
              <td>{{ row.cost ? fmt(row.cost) : '—' }}</td>
              <td>{{ row.time ? fmtTime(row.time) : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGame } from '../stores/game'
import { fmt, fmtTime } from '../core/format'
import { AFFIXES, PREFIX_SEGS, QUALITIES, qName } from '../data/qualities'
import { CORE_RES, RESONANCES, SECT_RES } from '../data/resonances'
import { VEIN_MAX, eqLevelRange, veinDigReq, veinLingmaiP, veinLuck, veinQRange, veinTier, veinUpCost, veinUpTime } from '../data/realms'
import { TITLES, TITLE_RARITY } from '../data/titles'
import type { Equip } from '../types'
import ItemCard from '../components/ItemCard.vue'

const g = useGame()
const eqRange = computed(() => eqLevelRange(g.lv))
const veinRows = computed(() => {
  const out: { lv: number; tier: string; q: { min: number; max: number }; luck: number; lingmaiP: number; cost: number; time: number; digReq: number }[] = []
  for (let lv = 1; lv <= VEIN_MAX; lv++) {
    out.push({
      lv, tier: veinTier(lv), q: veinQRange(lv),
      luck: veinLuck(lv), lingmaiP: veinLingmaiP(lv),
      cost: lv < VEIN_MAX ? veinUpCost(lv) : 0, time: lv < VEIN_MAX ? veinUpTime(lv) : 0,
      digReq: veinDigReq(lv),
    })
  }
  return out
})
const tabs = [
  { id: 'quality', n: '品质图鉴' }, { id: 'prefix', n: '前缀图鉴' }, { id: 'res', n: '共鸣图鉴' },
  { id: 'affix', n: '词条图鉴' }, { id: 'item', n: '装备图鉴' }, { id: 'vein', n: '宝树图鉴' }, { id: 'title', n: '称号' },
]
const tab = ref('quality')
const owned = (id: string) => g.titles.owned.includes(id)
const search = ref('')
const segTab = ref(0)

const filteredPrefixes = computed(() => {
  const s = search.value.trim()
  if (s) {
    return PREFIX_SEGS.flat().filter(p => p.includes(s))
  }
  return PREFIX_SEGS[segTab.value]
})
function seen(p: string) { return g.codex.prefixes.includes(p) }

const CLS_N: Record<string, string> = { M: '铭 纹 共 鸣', E: '玄 奇 共 鸣', 宗: '宗门专属共鸣' }
const RES_BY_CLS = computed(() => ({
  M: CORE_RES.filter(r => r.cls === 'M'),
  E: CORE_RES.filter(r => r.cls === 'E'),
  宗: SECT_RES,
}))
function active(id: string) { return g.derived.active.includes(id) }

const codexItems = computed(() =>
  Object.values(g.codex.items).sort((a, b) => b.score - a.score).slice(0, 120),
)
const compare = ref<Equip[]>([])

function toggleCompare(e: Equip) {
  const i = compare.value.findIndex(x => x.id === e.id)
  if (i >= 0) { compare.value.splice(i, 1); return }
  if (compare.value.length >= 2) compare.value.shift()
  compare.value.push(e)
}

void RESONANCES
</script>
