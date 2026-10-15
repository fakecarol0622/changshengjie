<template>
  <div class="flex flex-col gap-3">
    <!-- 三个独立页面：由首页「仙途万象」分别入口，此处仅作静态标题 -->
    <div class="panel-t">{{ pageTitle }} <span class="text-xs dim">{{ pageSub }}</span></div>

    <!-- 天骄榜 -->
    <template v-if="tab === 'rank'">
      <div class="panel text-xs dim">
        NPC 也在修炼：约每 10 分钟提升一级（离线同样成长、高境界放缓）。躺平会掉排名，勤修方能上榜。你当前第 <b class="gold">{{ g.myRank }}</b> 位。
      </div>
      <div class="panel">
        <div v-for="(row, i) in g.worldTop20" :key="i" class="flex justify-between items-center py-1" :class="row.me ? 'gold' : ''">
          <span>
            <b class="mr-2" :class="i < 3 ? 'text-yellow-500' : 'dim'">{{ i + 1 }}</b>
            {{ row.n }} <span class="chip ml-1">{{ row.realm }}</span>
            <span v-if="row.me" class="chip chip-gold ml-1">我</span>
          </span>
          <span class="text-sm">战力 {{ fmt(row.power) }}</span>
        </div>
      </div>
    </template>

    <!-- 仙武论道台（天梯） -->
    <template v-else-if="tab === 'pvp'">
      <div class="panel">
        <div class="panel-t">天 梯 排 位 <span class="text-xs dim">寻道大千式排名赛</span></div>
        <div class="grid grid-cols-4 gap-2 text-center text-sm">
          <div><div class="dim text-xs">段位</div><b class="gold">{{ tierName }}</b></div>
          <div><div class="dim text-xs">天梯排名</div><b class="gold">第 {{ myPvpRank }}</b></div>
          <div><div class="dim text-xs">论道积分</div><b class="jade">{{ g.pvp.points }}</b></div>
          <div><div class="dim text-xs">战绩</div><b>{{ g.pvp.wins }}胜 {{ g.pvp.losses }}负</b></div>
        </div>
        <div class="text-xs dim mt-2">赢了对局积分上升、排名前进；输了掉分掉名次。对手实力随段位提升，需消耗「论道帖」（摇落宝树有概率获得，战令/商店可兑换）。</div>
        <div class="flex gap-2 mt-2 items-center flex-wrap">
          <button class="btn btn-gold" :disabled="g.res.pvpTicket < 1" @click="g.pvpMatch()">{{ g.res.pvpTicket < 1 ? '论道帖不足' : '匹配对战（论道帖×1）' }}</button>
          <span class="text-xs">持有论道帖 <b class="gold">{{ g.res.pvpTicket }}</b> 张</span>
          <span class="text-xs dim">胜利：积分+16~26 · 仙武积分+30起</span>
        </div>
        <div class="mt-2 flex flex-wrap gap-1">
          <span v-for="(t, i) in PVP_TIERS" :key="t.n" class="chip" :class="i === tierIdx ? 'chip-gold' : i < tierIdx ? 'chip-jade' : ''">{{ t.n }} {{ t.min }}分</span>
        </div>
      </div>
      <div class="panel">
        <div class="panel-t">仙 武 商 店 <span class="text-xs dim">压缩周刷新限购</span></div>
        <div v-for="s in PVP_SHOP" :key="s.id" class="flex justify-between items-center py-1 gap-2 text-sm">
          <span class="min-w-0"><b class="gold">{{ s.n }}</b> <span class="text-xs dim ml-1">{{ s.desc }}</span></span>
          <span class="flex items-center gap-2 shrink-0">
            <span class="text-xs dim">周购 {{ g.pvpShop.counts[s.id] || 0 }}/{{ s.weekly }}</span>
            <span class="jade text-xs">积分 {{ s.cost }}</span>
            <button class="btn btn-xs" :disabled="(g.pvpShop.counts[s.id] || 0) >= s.weekly || g.res.xianwu < s.cost" @click="g.buyPvp(s.id)">兑换</button>
          </span>
        </div>
      </div>
      <div class="panel text-xs dim">周结算：按天骄榜/论道天梯中更优名次发放仙玉与仙武积分（第1名：仙玉×120、积分×250）。</div>
    </template>

    <!-- 众生 -->
    <template v-else>
      <div class="panel text-xs dim">
        点开修士查看详情、投其所好赠礼、请教论道，还可切磋、拜师、收徒。
        <button class="info-dot" type="button" aria-label="结交玩法说明" @click="g.pushModal('text', { title: '结交玩法', body: SOCIAL_INFO })">!</button>
      </div>
      <div class="grid md:grid-cols-2 gap-2">
        <div v-for="n in g.npcs" :key="n.id" class="panel !p-3 cursor-pointer" @click="openNpc(n.id)">
          <div class="flex justify-between items-center flex-wrap gap-1">
            <div>
              <b class="gold">{{ n.real }}</b>
              <span class="chip ml-1">{{ n.name }}</span>
              <span class="chip ml-1" :class="n.align === '魔' ? 'chip-red' : n.align === '正' ? 'chip-jade' : ''">{{ n.align }}道</span>
              <span class="chip ml-1">{{ n.sect }}</span>
              <span class="chip ml-1">{{ flavorText(n) }}</span>
            </div>
            <div class="text-xs text-right">
              <div>{{ realmOf(n).name }}</div>
              <div class="dim">战力 {{ fmt(powerOf(n)) }}</div>
            </div>
          </div>
          <div class="flex items-center gap-2 mt-2 text-xs">
            <span class="dim w-8">好感</span>
            <div class="pbar !h-1.5 flex-1"><div class="pfill pfill-jade" :style="{ width: Math.min(100, Math.max(0, n.favor) / 1.5) + '%' }"></div></div>
            <span>{{ n.favor }}</span>
            <span v-if="n.hate > 0" class="red">仇怨 {{ n.hate }}</span>
            <span v-if="n.rel !== 'none'" class="chip chip-gold">
              {{ n.rel === 'lover' ? '❤ 道侣' : n.rel === 'master' ? '师尊' : n.rel === 'disciple' ? '弟子' : n.rel === 'enemy' ? '仇敌' : n.rel }}
            </span>
            <span v-if="n.inSect" class="chip chip-jade">本门门人</span>
          </div>
          <div class="flex gap-1 mt-2 flex-wrap" @click.stop>
            <button class="btn btn-xs" @click="g.duelNpc(n.id)">切磋</button>
            <button class="btn btn-xs" @click="openNpc(n.id)">详 情</button>
            <button class="btn btn-xs" title="自动挑一件礼物：优先投其所好，其次喜好值最高" @click="g.quickGift(n.id)">赠 礼</button>
            <button class="btn btn-xs" @click="g.chatNpc(n.id)">{{ powerOf(n) > g.derived.power ? '请教' : '指点' }}（{{ npcCount('chat', n.id) }}/1）</button>
            <button v-if="n.rel === 'lover'" class="btn btn-xs btn-gold" @click="g.shuangxiu(n.id)">双修</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGame } from '../stores/game'
import { npcPower, npcRealm } from '../core/npc'
import { PVP_SHOP, PVP_TIERS, pvpRank, pvpTierIdx } from '../data/meta'
import { fmt } from '../core/format'
import type { Npc } from '../types'

const g = useGame()
// 子页由 store 驱动（首页「仙途万象」可直接进入对应子页）
const tab = computed(() => g.socialTab || 'rank')
// 三个独立页面的静态标题（不再提供页内切换）
const PAGE_INFO: Record<string, [string, string]> = {
  rank: ['天 骄 榜', '天下修士战力排位'],
  pvp: ['论 道 台', '仙武天梯 · 每周商店'],
  npc: ['众 生 百 态', '结交 · 赠礼 · 延揽'],
}
const pageTitle = computed(() => PAGE_INFO[tab.value]?.[0] || '')
const pageSub = computed(() => PAGE_INFO[tab.value]?.[1] || '')

const tierIdx = computed(() => pvpTierIdx(g.pvp.points))
const tierName = computed(() => PVP_TIERS[tierIdx.value].n + '段')
const myPvpRank = computed(() => pvpRank(g.pvp.points))

function realmOf(n: Npc) { return npcRealm(n) }
function powerOf(n: Npc) { return npcPower(n) }
function flavorText(n: Npc) { return n.flavor }
function npcCount(kind: 'gift' | 'chat', id: number): number { return (g.npcDaily[kind] as Record<number, number>)[id] || 0 }
// 「结交玩法」说明：长文案收进 ⓘ
const SOCIAL_INFO = `· 点开修士卡片可查看属性、喜好与携宝；投其所好赠礼，好感 ×2.5。
· 每日「灵石礼金 + 赠礼」合计 ${g.giftMax} 次（月卡 +5）；「请教/指点」每日 1 次：对方战力更高为请教，更低为指点，首次加好感 4~8。
· 好感 80 且战力不弱于对方、非仇敌，可邀其入你自创的宗门（门人上限 8）；还可切磋、拜师、收徒、结为道侣。`
function openNpc(id: number) { g.pushModal('npc', id) }
</script>
