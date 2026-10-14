<template>
  <div class="flex flex-col gap-3">
    <!-- 未入宗门 -->
    <template v-if="!g.sect">
      <div class="panel text-xs dim">
        加入宗门可获得职位晋升、贡献商店折扣、宗门任务与宗门战。也可作为散修（灵脉出货+15% 概念加成，商店加价）。
      </div>
      <div class="grid md:grid-cols-2 gap-2">
        <div v-for="s in SECTS" :key="s.id" class="panel">
          <div class="flex justify-between items-center">
            <b class="gold">{{ s.n }}</b><span class="chip">{{ s.path }}</span>
          </div>
          <div class="text-xs dim mt-1">{{ s.desc }}</div>
          <div class="text-xs jade mt-1">特色：{{ s.feature }} · 被动：{{ modsText(s.mods) }}</div>
          <button class="btn btn-sm mt-2 w-full" @click="g.joinSect(s.id)">拜 入 门 下</button>
        </div>
      </div>
      <div class="panel">
        <div class="panel-t">自 创 宗 门（化神期 + 贡献10万）</div>
        <div class="flex gap-2">
          <input v-model="newSectName" class="btn !min-h-9 flex-1" style="color: var(--txt); background: #1c1712" placeholder="宗门名称…" maxlength="8" />
          <button class="btn btn-sm btn-gold" @click="g.foundSect(newSectName)">开宗立派</button>
        </div>
        <div class="text-xs dim mt-1">当前贡献 {{ fmt(g.res.contrib) }} · 境界 {{ g.realmText }}</div>
      </div>
    </template>

    <!-- 已入宗门 -->
    <template v-else>
      <div class="panel">
        <div class="flex justify-between items-center flex-wrap gap-1">
          <div>
            <b class="gold text-lg">{{ g.sect }}</b>
            <span class="chip ml-2">{{ g.rankName }}</span>
          </div>
          <button class="btn btn-xs btn-red" @click="leave">叛 出 宗 门</button>
        </div>
        <div class="text-xs dim mt-1">
          贡献 {{ fmt(g.res.contrib) }} · 职位折扣 {{ Math.round((1 - RANKS[g.sectRank].disc) * 100) }}%
          <span v-if="nextRank"> · 下一职位【{{ nextRank.n }}】需贡献 {{ fmt(nextRank.contrib) }} + {{ MAJOR[nextRank.realm] }}（完成宗门任务自动触发考核）</span>
        </div>
      </div>

      <div class="panel">
        <div class="panel-t">宗 门 任 务</div>
        <div v-for="(real, i) in g.sectTasks.daily" :key="i" class="flex justify-between items-center py-1">
          <div>
            <b>{{ SECT_DAILY_TASKS[real]?.n }}</b>
            <span class="text-xs dim ml-1">{{ SECT_DAILY_TASKS[real]?.desc }}</span>
          </div>
          <button class="btn btn-xs" :disabled="g.sectTasks.dailyDone[i]" @click="g.doSectTask('daily', i)">
            {{ g.sectTasks.dailyDone[i] ? '已完成' : '执 行' }}
          </button>
        </div>
        <div class="divider"></div>
        <div v-if="g.sectTasks.weekly >= 0" class="flex justify-between items-center">
          <div>
            <b class="gold">周常 · {{ SECT_WEEKLY_TASKS[g.sectTasks.weekly]?.n }}</b>
            <span class="text-xs dim ml-1">{{ SECT_WEEKLY_TASKS[g.sectTasks.weekly]?.desc }}</span>
          </div>
          <button class="btn btn-xs" :disabled="g.sectTasks.weeklyDone" @click="g.doSectTask('weekly', 0)">
            {{ g.sectTasks.weeklyDone ? '已完成' : '执 行' }}
          </button>
        </div>
      </div>

      <div class="panel">
        <div class="panel-t">宗 门 战（每 3 天一次，五场三胜）</div>
        <p class="text-xs dim mb-2">与敌对宗门各出 5 名代表（你 + 4 名师门同侪）。胜方贡献 +1500 与宝箱，败方 +500。</p>
        <button class="btn btn-sm btn-gold w-full" :disabled="g.sectWarKey === weekKey" @click="g.runSectWar()">
          {{ g.sectWarKey === weekKey ? '本期已参战' : '参 与 宗 门 战' }}
        </button>
      </div>

      <div class="panel">
        <div class="panel-t">宗 门 商 店（贡献兑换）</div>
        <div v-for="it in SECT_SHOP" :key="it.id" class="flex justify-between items-center py-1">
          <div>
            <span>{{ it.n }}</span>
            <span v-if="g.sectRank < it.minRank" class="chip chip-red ml-1">{{ RANKS[it.minRank].n }}解锁</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="gold text-sm">{{ fmt(Math.round(it.price * RANKS[g.sectRank].disc)) }}</span>
            <button class="btn btn-xs" :disabled="g.sectRank < it.minRank" @click="g.sectBuy(it.id)">兑换</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGame } from '../stores/game'
import { RANKS, SECTS, SECT_DAILY_TASKS, SECT_SHOP, SECT_WEEKLY_TASKS } from '../data/sects'
import { MAJOR } from '../data/realms'
import { fmt } from '../core/format'
import type { Mods } from '../types'

const g = useGame()
const newSectName = ref('')

const nextRank = computed(() => (g.sectRank + 1 < RANKS.length ? RANKS[g.sectRank + 1] : null))
const weekKey = computed(() => Math.floor(Date.now() / (86400000 * 3)))

function modsText(m: Mods): string {
  const parts: string[] = []
  if (m.atkP) parts.push(`攻击+${m.atkP}%`)
  if (m.pillBonus) parts.push(`丹药+${m.pillBonus}%`)
  if (m.treasureBonus) parts.push(`法宝+${m.treasureBonus}%`)
  if (m.beastBonus) parts.push(`灵兽+${m.beastBonus}%`)
  if (m.lifestealAdd) parts.push(`吸血+${m.lifestealAdd}%`)
  if (m.dmgReduceAdd) parts.push(`减伤+${m.dmgReduceAdd}%`)
  return parts.join('、') || '无'
}

function leave() {
  if (window.confirm('叛宗将损失全部贡献，原宗门 NPC 好感 -100，且商店关闭。确定吗？')) g.leaveSect()
}
</script>
