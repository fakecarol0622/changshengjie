<template>
  <div class="flex flex-col gap-3">
    <div class="flex gap-1 flex-wrap">
      <button v-for="t in tabs" :key="t.id" class="btn btn-sm" :class="tab === t.id ? 'btn-gold' : ''" @click="tab = t.id">{{ t.n }}</button>
    </div>

    <!-- ============ 洞府 ============ -->
    <template v-if="tab === 'cave'">
      <div class="panel">
        <div class="panel-t">洞 府 · {{ g.cave.level }} 级</div>
        <p class="text-xs dim mb-2">洞府等级提升灵脉福荫，全设施产出提升。搬迁至灵脉福地可获额外加成。</p>
        <button class="btn btn-sm" :disabled="g.cave.level >= 10" @click="g.upgradeCaveLevel()">
          {{ g.cave.level >= 10 ? '已至最高等级' : `扩建洞府（灵石 ${fmt(2000 * Math.pow(2.4, g.cave.level - 1))}）` }}
        </button>
      </div>
      <div class="grid sm:grid-cols-2 gap-2">
        <div v-for="f in facs" :key="f.id" class="panel">
          <div class="flex justify-between items-center">
            <b class="gold">{{ f.n }}</b>
            <span class="chip">{{ g.cave[f.id as keyof typeof g.cave] }} / 5</span>
          </div>
          <div class="text-xs dim mt-1">{{ f.desc }}</div>
          <button
            class="btn btn-xs mt-2"
            :disabled="(g.cave[f.id as keyof typeof g.cave] as number) >= 5"
            @click="g.upgradeCave(f.id as 'cult' | 'alchemy' | 'forge' | 'field' | 'spring')"
          >
            {{ (g.cave[f.id as keyof typeof g.cave] as number) >= 5 ? '圆满' : `升级（灵石 ${fmt(g.caveUpgradeCost(f.id).res)}）` }}
          </button>
        </div>
      </div>
      <div class="panel text-xs dim">
        灵泉已产灵液：<b class="gold">{{ g.mats['lingye'] || 0 }}</b>（每级 +0.4/秒）
        · 灵田 {{ g.plots.length }} 块 · 丹房加成 +{{ g.cave.alchemy * 8 }}% · 器房加成 +{{ g.cave.forge * 5 }}%
      </div>
    </template>

    <!-- ============ 灵田 ============ -->
    <template v-else-if="tab === 'field'">
      <div class="panel">
        <div class="panel-t">灵 田（{{ g.plots.length }} 块）</div>
        <p class="text-xs dim mb-2">种植灵草，成熟后收获炼丹材料。升级灵田设施可增加田块与产量。</p>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div v-for="p in g.plots" :key="p.idx" class="panel !p-2 text-center">
            <template v-if="!p.seed">
              <div class="dim2 text-sm mb-1">空 地</div>
              <div class="flex flex-wrap gap-1 justify-center">
                <button
                  v-for="sd in seedOptions"
                  :key="sd.id"
                  class="btn btn-xs"
                  :disabled="(g.mats[sd.id] || 0) <= 0 || g.major < sd.realm"
                  @click="g.plant(p.idx, sd.id)"
                  :title="`${sd.minutes}分钟成熟 · 需${sd.realm > 0 ? MAJOR[sd.realm] : '凡人'}`"
                >{{ sd.n.replace('种子', '') }}×{{ g.mats[sd.id] || 0 }}</button>
              </div>
            </template>
            <template v-else>
              <div class="text-sm gold">{{ SEED_MAP[p.seed].n }}</div>
              <div v-if="now < p.ready" class="text-xs dim mt-1">成长中 · 剩余 {{ fmtTime(p.ready - now) }}</div>
              <button v-else class="btn btn-xs btn-gold mt-1" @click="g.harvest(p.idx)">收 获</button>
            </template>
          </div>
        </div>
        <button class="btn btn-sm mt-2" @click="harvestAll">一键收获全部</button>
      </div>
    </template>

    <!-- ============ 炼丹 ============ -->
    <template v-else-if="tab === 'alchemy'">
      <div class="panel">
        <div class="panel-t">丹 方</div>
        <div class="flex flex-col gap-2">
          <div v-for="r in RECIPES" :key="r.id" class="itemcard" :class="g.major < r.realm ? 'opacity-50' : ''">
            <div class="flex justify-between items-center flex-wrap gap-1">
              <div>
                <b class="gold">{{ PILL_MAP[r.out].n }}</b>
                <span class="chip ml-1">{{ g.major < r.realm ? `${MAJOR[r.realm]}解锁` : '可炼制' }}</span>
                <div class="text-xs dim mt-0.5">{{ PILL_MAP[r.out].desc }} · 材料：{{ r.desc }}</div>
              </div>
              <button class="btn btn-xs btn-gold" :disabled="g.major < r.realm" @click="selectRecipe(r.id)">开 炉</button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="recipe" class="panel">
        <div class="panel-t">火 候 控 制 · {{ PILL_MAP[recipe.out].n }}</div>
        <p class="text-xs dim mb-2">在光标进入高亮火区时点击「停」，火候越准，丹药品质越高。丹房等级与悟性可提升品质。</p>
        <div class="firetrack">
          <div class="fire-zone" :style="{ left: (zone - 0.12) * 100 + '%', width: '24%' }"></div>
          <div class="fire-mark" :style="{ left: pos * 100 + '%' }"></div>
        </div>
        <div class="flex gap-2 mt-2">
          <button class="btn btn-gold flex-1" @click="stopFire">停！</button>
          <button class="btn" @click="recipe = ''">取消</button>
        </div>
      </div>

      <div class="panel">
        <div class="panel-t">丹 药 储 备</div>
        <div class="flex flex-wrap gap-1">
          <span v-for="(c, k) in g.pills" :key="k" class="chip chip-gold">{{ pillName(k) }} ×{{ c }}</span>
          <span v-if="!Object.keys(g.pills).length" class="dim2 text-sm">暂无丹药</span>
        </div>
      </div>
    </template>

    <!-- ============ 炼器 ============ -->
    <template v-else>
      <div class="panel">
        <div class="panel-t">器 胚 选 择</div>
        <p class="text-xs dim mb-2">选择一件装备作为器胚，消耗矿石与符文石熔炼。成功可提升 1~2 级品质，失败则器胚损毁。</p>
        <div class="flex flex-col gap-1 max-h-64 overflow-y-auto">
          <label
            v-for="it in forgeBases" :key="it.id"
            class="flex items-center gap-2 itemcard cursor-pointer"
            :class="baseId === it.id ? 'bq12' : ''"
          >
            <input type="radio" :value="it.id" v-model="baseId" />
            <span :class="'qc' + it.q">{{ it.name }}</span>
            <span class="text-xs dim">{{ SLOT_NAMES[it.slot] }} · 评分 {{ fmt(it.score) }}</span>
          </label>
          <div v-if="!forgeBases.length" class="dim2 text-sm">没有可用器胚（未被穿戴的装备）。</div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-t">材 料 与 符 文</div>
        <div class="flex flex-wrap gap-2">
          <label v-for="m in forgeMats" :key="m.id" class="chip cursor-pointer" :class="matSel.includes(m.id) ? 'chip-gold' : ''">
            <input type="checkbox" class="mr-1" :value="m.id" v-model="matSel" :disabled="(g.mats[m.id] || 0) <= 0" />
            {{ m.n }}（{{ g.mats[m.id] || 0 }}）
          </label>
        </div>
        <label class="chip cursor-pointer mt-2" :class="runeOn ? 'chip-gold' : ''">
          <input type="checkbox" class="mr-1" v-model="runeOn" :disabled="(g.mats['fuwen'] || 0) < 2" />
          附加符文石×2（必出灵纹）（持 {{ g.mats['fuwen'] || 0 }}）
        </label>
        <div class="text-xs dim mt-2">成功率约 {{ Math.round(successP * 100) }}%（材料与器房等级提升成功率）</div>
        <button class="btn btn-gold w-full mt-2" :disabled="baseId == null" @click="doForge">开 炉 炼 器</button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useGame } from '../stores/game'
import { MAJOR } from '../data/realms'
import { PILL_MAP, PILL_QNAMES, RECIPES, SEED_MAP, SEEDS } from '../data/items'
import { SLOT_NAMES } from '../data/qualities'
import { fmt, fmtTime } from '../core/format'

const g = useGame()
const tabs = [
  { id: 'cave', n: '洞府' }, { id: 'field', n: '灵田' }, { id: 'alchemy', n: '炼丹' }, { id: 'forge', n: '炼器' },
]
const tab = ref('cave')

const facs = [
  { id: 'cult', n: '修炼室', desc: `挂机修炼加成 +8%/级（当前 +${0}%）` },
  { id: 'alchemy', n: '丹房', desc: '炼丹品质与成功率加成' },
  { id: 'forge', n: '器房', desc: '炼器成功率 +5%/级' },
  { id: 'field', n: '灵田', desc: '增加田块与产量' },
  { id: 'spring', n: '灵泉', desc: '产出灵液用于炼丹，+4%修炼/级' },
]

// —— 灵田实时刷新 ——
const now = ref(Date.now())
const timer = window.setInterval(() => { now.value = Date.now() }, 1000)
onUnmounted(() => clearInterval(timer))
const seedOptions = computed(() => SEEDS)

function harvestAll() {
  for (const p of g.plots) if (p.seed && now.value >= p.ready) g.harvest(p.idx)
}

// —— 炼丹小游戏 ——
const recipe = ref('')
const pos = ref(0)
const zone = ref(0.5)
let raf = 0
let t0 = performance.now()

function loop(t: number) {
  const dt = t - t0
  pos.value = 0.5 + 0.46 * Math.sin(dt / 520)
  raf = requestAnimationFrame(loop)
}
watch(recipe, v => {
  if (v) { zone.value = 0.3 + Math.random() * 0.4; t0 = performance.now(); raf = requestAnimationFrame(loop) }
  else cancelAnimationFrame(raf)
})
onUnmounted(() => cancelAnimationFrame(raf))

function selectRecipe(id: string) { recipe.value = id }
function stopFire() {
  cancelAnimationFrame(raf)
  const acc = Math.max(0, 1 - Math.abs(pos.value - zone.value) / 0.3)
  g.alchemy(recipe.value, acc)
  recipe.value = ''
}

function pillName(key: string): string {
  const [id, q] = key.split(':')
  return `${PILL_MAP[id]?.n || id}·${PILL_QNAMES[Number(q)]}`
}

// —— 炼器 ——
const baseId = ref<number | null>(null)
const matSel = ref<string[]>([])
const runeOn = ref(false)
const forgeBases = computed(() => {
  const worn = g.wornByAll
  return g.inventory.filter(e => !worn.has(e.id)).sort((a, b) => a.score - b.score).slice(0, 40)
})
const forgeMats = [
  { id: 'tiekuang', n: '铁矿' }, { id: 'xuantie', n: '玄铁矿' }, { id: 'xingyunTie', n: '星陨铁' },
  { id: 'longxue', n: '龙血矿' }, { id: 'taichu', n: '太初石' },
]
const successP = computed(() => Math.min(0.92, 0.55 + matSel.value.length * 0.05 + g.cave.forge * 0.05))
function doForge() {
  if (baseId.value == null) return
  g.forge(baseId.value, [...matSel.value], runeOn.value)
  baseId.value = null
  matSel.value = []
  runeOn.value = false
}
</script>
