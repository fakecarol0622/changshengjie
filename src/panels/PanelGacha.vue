<template>
  <div class="flex flex-col gap-3">
    <!-- 限时阁（每 3 天轮换，保底继承） -->
    <div class="panel gacha-banner">
      <div class="flex justify-between items-start flex-wrap gap-2">
        <div>
          <div class="gold font-bold text-lg">✨ {{ banner.n }}</div>
          <div class="text-xs dim">{{ banner.sub }}</div>
          <div class="text-xs mt-1">限定大奖：<b class="gold">{{ banner.legend.n }}</b> · {{ banner.legend.d }}</div>
        </div>
        <div class="text-xs text-right dim shrink-0">限时轮换倒计时<br /><b class="gold">{{ fmtTime(nextRotateIn) }}</b></div>
      </div>
      <div class="grid grid-cols-2 gap-2 mt-3">
        <button class="btn btn-gold" @click="g.gachaPull('lim', 1)">{{ pullLabel(1) }}</button>
        <button class="btn btn-gold" @click="g.gachaPull('lim', 10)">{{ pullLabel(10) }}</button>
      </div>
      <div class="text-xs dim mt-1">持有：寻仙令 <b class="gold">{{ g.res.gachaTicket }}</b> · 仙玉 <b class="gold">{{ fmt(g.res.xianyu) }}</b>（寻仙令优先消耗）</div>
      <div class="flex justify-between text-xs dim mt-2">
        <span>传说保底进度 {{ g.gacha.limPity }}/{{ GACHA_PITY }}</span>
        <span>保底跨轮换继承</span>
      </div>
      <div class="pbar mt-1"><div class="pfill" :style="{ width: (g.gacha.limPity / GACHA_PITY) * 100 + '%' }"></div></div>
      <button class="btn btn-xs w-full mt-2" @click="showPoolLim = !showPoolLim">{{ showPoolLim ? '收起奖池明细' : '查看奖池与概率' }}</button>
      <div v-if="showPoolLim" class="mt-1 text-xs">
        <div v-for="t in limBreakdown" :key="t.tier" class="py-0.5">
          <b :class="'gacha-r' + t.tier">{{ ['', '普通', '稀有', '史诗', '传说'][t.tier] }} {{ t.pct }}%</b>
          <div class="dim">{{ t.items.map(x => `${x.n} ${x.pct}%`).join(' · ') }}</div>
        </div>
      </div>
    </div>

    <!-- 常驻阁 -->
    <div class="panel">
      <div class="flex justify-between items-start flex-wrap gap-2">
        <div>
          <div class="gold font-bold text-lg">🪷 仙缘·问道（常驻）</div>
          <div class="text-xs dim">大奖：混沌仙兵（16 品灵纹装备）/ 天妖精怪 / 上古法宝 / 仙玉豪礼</div>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2 mt-3">
        <button class="btn" @click="g.gachaPull('std', 1)">{{ pullLabel(1) }}</button>
        <button class="btn btn-gold" @click="g.gachaPull('std', 10)">{{ pullLabel(10) }}</button>
      </div>
      <div class="text-xs dim mt-1">持有：寻仙令 <b class="gold">{{ g.res.gachaTicket }}</b> · 仙玉 <b class="gold">{{ fmt(g.res.xianyu) }}</b></div>
      <button
        class="btn w-full mt-2"
        :class="g.gacha.freeDay === g.dayKey ? '' : 'btn-gold freePulse'"
        :disabled="g.gacha.freeDay === g.dayKey"
        @click="g.gachaFree()"
      >{{ g.gacha.freeDay === g.dayKey ? '今日免费寻仙已用' : '✨ 每日免费一抽（白嫖）' }}</button>
      <div class="flex justify-between text-xs dim mt-2">
        <span>传说保底进度 {{ g.gacha.stdPity }}/{{ GACHA_PITY }}</span>
        <span>已寻仙 {{ g.gacha.total }} 次 · 出传说 {{ g.gacha.legends }} 次</span>
      </div>
      <div class="pbar mt-1"><div class="pfill pfill-blue" :style="{ width: (g.gacha.stdPity / GACHA_PITY) * 100 + '%' }"></div></div>
      <button class="btn btn-xs w-full mt-2" @click="showPoolStd = !showPoolStd">{{ showPoolStd ? '收起奖池明细' : '查看奖池与概率' }}</button>
      <div v-if="showPoolStd" class="mt-1 text-xs">
        <div v-for="t in stdBreakdown" :key="t.tier" class="py-0.5">
          <b :class="'gacha-r' + t.tier">{{ ['', '普通', '稀有', '史诗', '传说'][t.tier] }} {{ t.pct }}%</b>
          <div class="dim">{{ t.items.map(x => `${x.n} ${x.pct}%`).join(' · ') }}</div>
        </div>
      </div>
    </div>

    <div class="panel text-xs dim">
      概率公示：普通 60% · 稀有 27% · 史诗 10.7% · 传说 2.3%；十连必出史诗及以上；60 抽保底传说。
      「寻仙令」可替代仙玉抽取，来自每日活跃宝箱、在线奖励、签到月历、长阶通关、坊市与仙武商店；仙玉来自签到、活跃奖励、境界礼包与充值中心。
    </div>

    <!-- 充值中心（模拟） -->
    <div class="panel">
      <div class="panel-t">充 值 中 心 <span class="text-xs red">模拟充值 · 单机演示 · 无真实扣费</span></div>
      <div class="grid grid-cols-2 gap-2 mb-2">
        <div class="itemcard text-center">
          <div class="gold font-bold">月卡 · 30 天</div>
          <div class="text-xs dim mt-0.5">立即 300 仙玉 · 每日领 100</div>
          <div v-if="monthActive" class="text-xs jade mt-0.5">剩余 {{ monthDays }} 天</div>
          <button v-if="!monthActive" class="btn btn-sm btn-gold w-full mt-2" @click="g.startPay('mk')">开 通 ¥30</button>
          <button v-else class="btn btn-sm w-full mt-2" :disabled="g.shop.monthClaimDay === g.dayKey" @click="g.claimMonth()">
            {{ g.shop.monthClaimDay === g.dayKey ? '今日已领' : '领今日 100 仙玉' }}
          </button>
          <button class="btn btn-xs w-full mt-1" @click="showMonthDetail = !showMonthDetail">查看月卡权益</button>
          <div v-if="showMonthDetail" class="text-xs gold text-left mt-1 leading-relaxed">
            · 开通立即获得 300 仙玉<br />
            · 30 天内每日领取 100 仙玉<br />
            · 每日补签次数 +1<br />
            · 修炼速度 +3%<br />
            · 每日限次副本（含周常）次数 +2<br />
            · NPC 送礼次数 +5/日<br />
            · 妖王殿挑战次数 +1<br />
            · 镇妖塔每日扫荡 +1 次
          </div>
        </div>
        <div class="itemcard text-center">
          <div class="gold font-bold">修行战令 · 豪华版</div>
          <div class="text-xs dim mt-0.5">解锁豪华奖励线：海量仙玉（共约 3300）+ 寻仙令/灵蛋/龙髓/高阶装备（见下方战令）</div>
          <button v-if="!g.pass.premium" class="btn btn-sm btn-gold w-full mt-2" @click="g.startPay('prem')">解 锁 ¥68</button>
          <span v-else class="chip chip-gold mt-2">已解锁</span>
        </div>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div v-for="p in PACK_CARDS" :key="p.id" class="itemcard text-center">
          <div class="gold font-bold">仙玉 × {{ fmt(packAmount(p)) }}</div>
          <div class="text-xs dim mt-0.5">¥ {{ p.rmb }}<span v-if="isFirst(p)" class="red"> · 首充双倍</span></div>
          <button class="btn btn-sm btn-gold w-full mt-2" @click="g.startPay(p.id)">购 买</button>
        </div>
      </div>
      <div class="text-xs dim2 mt-1">点击购买将模拟支付流程并直接到账，不会产生任何真实扣费；演示用，请放心点击。</div>
    </div>

    <!-- 修行战令 -->
    <div class="panel">
      <div class="panel-t">修 行 战 令 <span class="text-xs dim">赛季剩余 {{ fmtTime(seasonLeft) }}</span></div>
      <div class="flex justify-between text-xs dim mb-1">
        <span>等级 Lv.{{ g.passLevel }}/30（活跃度同步积累战令经验）</span>
        <span>{{ g.pass.xp % 100 }}/100</span>
      </div>
      <div class="pbar mb-2"><div class="pfill" :style="{ width: (g.passLevel >= 30 ? 100 : g.pass.xp % 100) + '%' }"></div></div>
      <div class="flex gap-2 flex-wrap items-center">
        <button class="btn btn-sm btn-gold" @click="g.claimPass()">领取可领奖励</button>
        <span v-if="g.pass.premium" class="chip chip-gold">豪华线已解锁</span>
        <span class="text-xs dim">免费线：每级灵石，逢 5 级加洗练石</span>
      </div>
      <div class="text-xs dim mt-2">豪华线：每级仙玉/灵露/洗练石随等级递增（仙玉 23→110/级），逢 5 级加共鸣石/改命石/论道帖，逢 10 级加寻仙令，10/20 级送灵兽蛋，15/20 级送龙髓，25 级送兽魂/妖珠，30 级送 15~16 品装备 + 仙玉×1288 + 太古兽卵 + 寻仙令×3 等（充值中心解锁）</div>
      <button class="btn btn-xs w-full mt-2" @click="showPass = !showPass">{{ showPass ? '收起奖励一览' : '查看全部奖励（1~30 级）' }}</button>
      <div v-if="showPass" class="mt-2 max-h-72 overflow-y-auto text-xs" style="border: 1px solid var(--line2); border-radius: 6px; padding: 4px 8px">
        <div v-for="i in 30" :key="i" class="flex justify-between py-0.5 gap-2">
          <span class="dim shrink-0">Lv.{{ i }}</span>
          <span class="flex-1">免费：{{ rewardFull(passFree(i)) }}</span>
          <span class="flex-[1.6] gold">豪华：{{ rewardFull(passPrem(i)) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useGame } from '../stores/game'
import { GACHA_COST_1, GACHA_COST_10, GACHA_PITY, LIM_BANNERS, bannerIndex, gachaBreakdown, nextRotateAt } from '../data/gacha'
import { PAY_PACKS, type PayPack, rewardFull } from '../data/rewards'
import { passSeasonEnd, passFree, passPrem } from '../data/meta'
import { fmt, fmtTime } from '../core/format'

const g = useGame()
const now = ref(Date.now())
const timer = window.setInterval(() => { now.value = Date.now() }, 1000)
const showMonthDetail = ref(false)
const showPass = ref(false)
const showPoolStd = ref(false)
const showPoolLim = ref(false)

const banner = computed(() => LIM_BANNERS[bannerIndex()])
const nextRotateIn = computed(() => Math.max(0, nextRotateAt() - now.value))
const PACK_CARDS = PAY_PACKS.filter(p => (p.kind ?? 'xianyu') === 'xianyu')
const monthActive = computed(() => g.shop.monthUntil > now.value)
const monthDays = computed(() => Math.max(0, Math.ceil((g.shop.monthUntil - now.value) / 86400000)))
const seasonLeft = computed(() => Math.max(0, passSeasonEnd() - now.value))
const stdBreakdown = computed(() => gachaBreakdown('std'))
const limBreakdown = computed(() => gachaBreakdown('lim'))
function pullLabel(n: number): string {
  const name = n >= 10 ? '十 连' : '单 抽'
  if (g.res.gachaTicket >= n) return `${name}（寻仙令×${n}）`
  return `${name}（仙玉 ${n >= 10 ? GACHA_COST_10 : GACHA_COST_1}）`
}
function isFirst(p: PayPack) { return !!p.first && !g.shop.first.includes(p.id) }
function packAmount(p: PayPack) { return p.n * (isFirst(p) ? 2 : 1) }
onUnmounted(() => clearInterval(timer))
</script>
