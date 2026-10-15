<template>
  <div class="flex flex-col gap-3">
    <div class="flex gap-1 flex-wrap">
      <button v-for="t in tabs" :key="t.id" class="btn btn-sm" :class="tab === t.id ? 'btn-gold' : ''" @click="tab = t.id">{{ t.n }}</button>
    </div>

    <!-- ============ 装备 ============ -->
    <template v-if="tab === 'equip'">
      <div class="panel !p-2">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xs dim shrink-0">出 战 分 身</span>
          <button class="btn btn-xs" :class="g.clones.active === 'main' ? 'btn-gold' : ''" title="切换后战斗沿用其配装" @click="g.setActiveBody('main')">
            本体 · {{ fmt(g.bodyPower('main')) }}
          </button>
          <button v-if="g.clones.yangOpen" class="btn btn-xs" :class="g.clones.active === 'yang' ? 'btn-gold' : ''" @click="g.setActiveBody('yang')">
            阳神 · {{ fmt(g.bodyPower('yang')) }}
          </button>
          <button v-else class="btn btn-xs" :class="g.major >= 5 ? 'btn-gold' : ''" :disabled="g.major < 5" title="化神期解锁 · 消耗 仙玉×300 + 开脉石×10000" @click="g.openClone('yang')">
            凝练阳神（仙玉300·开脉石10000）
          </button>
          <button v-if="g.clones.yinOpen" class="btn btn-xs" :class="g.clones.active === 'yin' ? 'btn-gold' : ''" @click="g.setActiveBody('yin')">
            阴身 · {{ fmt(g.bodyPower('yin')) }}
          </button>
          <button v-else class="btn btn-xs" :class="g.major >= 5 && g.clones.yangOpen ? 'btn-gold' : ''" :disabled="g.major < 5 || !g.clones.yangOpen" :title="g.major < 5 ? '化神期解锁' : !g.clones.yangOpen ? '需先凝练阳神' : '消耗 仙玉×600 + 开脉石×25000'" @click="g.openClone('yin')">
            凝练阴身（仙玉600·开脉石25000）
          </button>
        </div>
        <div class="text-xs dim2 mt-1">分身拥有独立装备栏与共鸣；切换后长阶、论道台、副本等战斗自动沿用其配装，道基/灵兽/精怪/法宝/丹药共享。</div>
      </div>
      <div class="panel">
        <div class="panel-t">装 备 栏（{{ g.activeBodyName }}） <span class="text-xs dim">点击槽位筛选 · 战力 {{ fmt(g.derived.power) }} · 共鸣 {{ g.derived.active.length }} 条</span></div>
        <div class="slot6">
          <div
            v-for="s in SLOTS" :key="s"
            class="panel !p-2 text-center cursor-pointer"
            :class="filterSlot === s ? 'ring-1 ring-yellow-600/60' : ''"
            @click="filterSlot = filterSlot === s ? null : s"
          >
            <div class="text-xs dim">{{ SLOT_NAMES[s] }}</div>
            <div v-if="slotItem(s)" :class="'qc' + slotItem(s)!.q" class="text-sm font-bold truncate">{{ slotItem(s)!.name }}</div>
            <div v-else class="dim2 text-sm">空</div>
          </div>
        </div>
        <div class="mt-2 flex items-center gap-1 flex-wrap text-xs">
          <span class="dim">铭纹</span>
          <span
            v-for="(n, k) in tagCounts" :key="k" class="chip"
            style="color: #c9a0ff; border-color: rgba(180, 140, 255, 0.5)"
            :title="TAG_MAP[k]?.d"
          >{{ TAG_LABEL(k) }} ×{{ n }}</span>
          <span v-if="!Object.keys(tagCounts).length" class="dim2">暂无铭纹（品质 10+ 装备自带，同纹 3 件或双纹各 2 件可共鸣）</span>
        </div>
        <div class="mt-1 flex items-center gap-1 flex-wrap text-xs">
          <span class="dim">共鸣</span>
          <span v-for="r in activeResDefs" :key="r.id" class="chip chip-gold" :title="r.req + ' → ' + r.desc">{{ r.name }}</span>
          <span v-if="!activeResDefs.length" class="dim2">无（点击下方装备查看铭纹；共鸣详情见修炼页）</span>
        </div>
      </div>
      <div class="panel">
        <div class="panel-t">
          <span>背包 {{ g.invCount }} / 240</span>
          <span class="flex gap-1 flex-wrap items-center">
            <button class="btn btn-xs" @click="filterSlot = null">全部</button>
            <button class="btn btn-xs" @click="sortDesc = !sortDesc">评分{{ sortDesc ? '降序' : '升序' }}</button>
            <button class="btn btn-xs btn-gold" title="每个部位换上评分最高的装备" @click="g.autoEquipBest()">一键最优</button>
            <select v-model.number="massQ" class="btn btn-xs" style="padding: 2px 6px">
              <option v-for="q in 10" :key="q" :value="q">≤{{ q }} 品</option>
            </select>
            <button
              class="btn btn-xs" :class="massArmed ? 'btn-red' : ''"
              :disabled="junkCount === 0"
              :title="`分解背包中未穿戴且品质 ≤${massQ} 的装备，回收 20% 评分灵石`"
              @click="doMass"
            >{{ massArmed ? `确认分解 ${junkCount} 件` : `分解（${junkCount}）` }}</button>
          </span>
        </div>
        <div class="flex flex-col gap-2 max-h-[540px] overflow-y-auto pr-1">
          <div v-if="!invFiltered.length" class="dim2 text-sm">空空如也，去灵脉挖掘或副本寻宝吧。</div>
          <ItemCard v-for="it in invFiltered" :key="it.id" :e="it">
            <template #actions>
              <button class="btn btn-xs" :class="wornIn(it.id) === g.clones.active ? '' : 'btn-gold'" @click="g.equipItem(it.id)">
                {{ wornIn(it.id) === g.clones.active ? '已装备' : wornIn(it.id) ? '转移装备' : '装备' }}
              </button>
              <div class="flex gap-1">
                <button class="btn btn-xs" title="洗炼石×3起（锁词条越高越贵），重铸词条数值" @click="g.reforge(it.id, 'value')">洗数值</button>
                <button class="btn btn-xs" title="改命石×1起（锁词条越高越贵），重铸词条类型" @click="g.reforge(it.id, 'type')">洗类型</button>
                <button class="btn btn-xs btn-red" @click="g.discardOne(it.id)">丢</button>
              </div>
            </template>
          </ItemCard>
        </div>
      </div>
    </template>

    <!-- ============ 法宝 ============ -->
    <template v-else-if="tab === 'treasure'">
      <div class="panel">
        <div class="panel-t">法 宝 栏（{{ g.treasureEquipped.length }} / {{ g.treasureSlots }}）</div>
        <div class="flex gap-2 flex-wrap">
          <div v-for="i in g.treasureSlots" :key="i" class="panel !p-2 min-w-28 text-center">
            <template v-if="g.treasureEquipped[i - 1] != null && treaById(g.treasureEquipped[i - 1])">
              <div :class="'qc' + treaById(g.treasureEquipped[i - 1])!.q" class="font-bold">{{ treaById(g.treasureEquipped[i - 1])!.name }}</div>
              <div class="text-[11px] dim">Lv.{{ treaById(g.treasureEquipped[i - 1])!.level }} · {{ '★'.repeat(treaById(g.treasureEquipped[i - 1])!.stars) }}</div>
            </template>
            <span v-else class="dim2 text-sm">空 位</span>
          </div>
        </div>
        <div class="text-xs mt-2">
          <span class="dim">法宝共鸣：</span>
          <span v-for="c in TREASURE_COMBOS" :key="c.n" class="chip mr-1 mb-1" :class="comboActive(c.ids) ? 'chip-gold' : ''">{{ c.n }}{{ comboActive(c.ids) ? '（已激活）' : '' }}·{{ c.desc }}</span>
        </div>
        <div class="flex gap-2 mt-2 flex-wrap">
          <button class="btn btn-sm" @click="g.combineTreasure('fabao')">碎片合成（碎片×10 + 器魂×100）</button>
          <button class="btn btn-sm" @click="g.combineTreasure('zhibao')">至宝合成（至宝碎片×20 + 器魂×500）</button>
          <span class="chip">法宝碎片 {{ g.mats['fabaoPiece'] || 0 }} · 至宝碎片 {{ g.mats['zhibaoPiece'] || 0 }} · 器魂 {{ fmt(g.res.qihun) }}</span>
        </div>
      </div>
      <div class="panel">
        <div class="panel-t">所 有 法 宝</div>
        <div v-if="!g.treasures.length" class="dim2 text-sm">尚无法宝。器魂深渊与灵脉深处可寻碎片，合成法宝。</div>
        <div class="flex flex-col gap-2">
          <div v-for="t in g.treasures" :key="t.id" class="itemcard" :class="'bq' + t.q">
            <div class="flex justify-between items-start gap-2 flex-wrap">
              <div>
                <span :class="'qc' + t.q" class="font-bold">{{ t.name }}</span>
                <span class="text-xs gold ml-1">Lv.{{ t.level }} {{ '★'.repeat(t.stars) }}</span>
                <div class="text-xs dim mt-0.5">{{ TREASURE_MAP[t.name]?.desc || '' }}</div>
              </div>
              <div class="flex gap-1 flex-wrap">
                <button class="btn btn-xs" :class="g.treasureEquipped.includes(t.id) ? '' : 'btn-gold'" @click="g.treasureEquipped.includes(t.id) ? g.unequipTreasure(t.id) : g.equipTreasure(t.id)">
                  {{ g.treasureEquipped.includes(t.id) ? '卸下' : '出战' }}
                </button>
                <button class="btn btn-xs" @click="g.upgradeTreasure(t.id)">升级（器魂{{ Math.round(60 * Math.pow(1.6, t.level - 1)) }}）</button>
                <button class="btn btn-xs" @click="g.starTreasure(t.id)" :disabled="t.stars >= 5">升星（器魂{{ 300 * t.stars }}）</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ============ 灵兽 ============ -->
    <template v-else-if="tab === 'beast'">
      <div class="panel">
        <div class="panel-t">出 战 灵 兽 <span class="text-xs dim">点卡片查看详情与培养</span></div>
        <div v-if="g.beast" class="itemcard cursor-pointer" @click="openBeast(g.beast!.id)">
          <div class="flex justify-between items-center flex-wrap gap-2">
            <div>
              <span :class="'qc' + g.beast.q" class="font-bold text-lg">{{ g.beast.name }}</span>
              <span class="chip ml-2">等级 {{ g.beast.level }}</span>
              <span class="chip chip-gold ml-1">{{ BEAST_STAGES[g.beast.stage || 0] }}</span>
              <span class="chip ml-1">成长 {{ g.beast.growth ?? 1 }}</span>
              <span class="chip chip-jade ml-1">资质 {{ beastGrade(g.beast).n }}（均{{ beastAvg(g.beast) }}）</span>
              <div class="text-xs dim mt-1">{{ BEAST_MAP[g.beast.kind]?.desc }}</div>
              <div class="text-xs gold mt-1">技能：{{ beastSkills(g.beast.kind, g.beast.stage || 0) }}</div>
              <div class="pbar !h-2 mt-1 max-w-56"><div class="pfill pfill-jade" :style="{ width: beastExpPct + '%' }"></div></div>
            </div>
            <div class="flex gap-1 flex-wrap" @click.stop>
              <button class="btn btn-xs btn-gold" @click="openBeast(g.beast!.id)">详情/培养</button>
              <button class="btn btn-xs btn-red" @click="g.setBeast(null)">收回</button>
            </div>
          </div>
        </div>
        <div v-else class="dim2 text-sm">未出战的灵兽。灵兽提供属性加成与战斗助战技。</div>
      </div>
      <div class="panel">
        <div class="panel-t">灵 兽 蛋（{{ g.eggs.length }}）</div>
        <div v-if="!g.eggs.length" class="dim2 text-sm">暂无灵兽蛋。万兽幽林、坊市、长阶、战令可得。</div>
        <div class="flex gap-2 flex-wrap">
          <button v-for="egg in g.eggs" :key="egg.id" class="btn btn-sm" @click="g.hatchEgg(egg.id)">
            孵化 · {{ qName(egg.q) }}蛋
          </button>
        </div>
      </div>
      <div class="panel">
        <div class="panel-t">灵 兽 名 录（{{ g.beasts.length }}）<span class="text-xs dim">每只资质/成长各异，同种可吞食升阶</span></div>
        <div v-if="!g.beasts.length" class="dim2 text-sm">尚无灵兽。</div>
        <div class="flex flex-col gap-2">
          <div v-for="b in g.beasts" :key="b.id" class="itemcard cursor-pointer" @click="openBeast(b.id)">
            <div class="flex justify-between items-center flex-wrap gap-1">
              <div>
                <span :class="'qc' + b.q" class="font-bold">{{ b.name }}</span>
                <span class="chip ml-2">Lv.{{ b.level }}</span>
                <span class="chip chip-gold ml-1">{{ BEAST_STAGES[b.stage || 0] }}</span>
                <span class="chip ml-1">成长 {{ b.growth ?? 1 }}</span>
                <span class="chip chip-jade ml-1">资质 {{ beastGrade(b).n }}（均{{ beastAvg(b) }}）</span>
                <div class="text-xs dim2 mt-0.5">技能：{{ beastSkills(b.kind, b.stage || 0) }}</div>
              </div>
              <div class="flex gap-1" @click.stop>
                <button class="btn btn-xs" :class="g.beastActive === b.id ? '' : 'btn-gold'" @click="g.setBeast(g.beastActive === b.id ? null : b.id)">
                  {{ g.beastActive === b.id ? '收回' : '出战' }}
                </button>
                <button class="btn btn-xs" @click="openBeast(b.id)">详情</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ============ 精怪 ============ -->
    <template v-else-if="tab === 'fam'">
      <div class="panel">
        <div class="panel-t">精 怪 · 出 战 位（{{ g.famEquipped.length }}/{{ g.famSlots }}） <span class="text-xs dim">境界提升解锁更多出战位</span></div>
        <div class="text-xs dim">精怪出战位提供被动加成，并在战斗中自动触发专属战斗技（与灵兽主动出手不同）；升星 +25%/星、升级 +8%/级。</div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
          <div v-for="i in g.famSlots" :key="i" class="itemcard text-center">
            <template v-if="g.famEquipped[i - 1]">
              <div :class="'fam-r' + famDef(g.famEquipped[i - 1].fid).r" class="font-bold">{{ famDef(g.famEquipped[i - 1].fid).n }}</div>
              <div class="text-xs">Lv.{{ g.famEquipped[i - 1].level }} · {{ '★'.repeat(g.famEquipped[i - 1].stars) }}</div>
              <div class="text-xs dim" :title="famDef(g.famEquipped[i - 1].fid).sk + '：' + famDef(g.famEquipped[i - 1].fid).skDesc">战技【{{ famDef(g.famEquipped[i - 1].fid).sk }}】</div>
              <div class="text-xs dim">{{ famPct(g.famEquipped[i - 1]) }}</div>
              <button class="btn btn-xs btn-red mt-1" @click="g.famUnequip(g.famEquipped[i - 1].id)">撤 下</button>
            </template>
            <div v-else class="dim2 text-xs py-4">空置出战位</div>
          </div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-t">凝 珠 化 形 <span class="text-xs dim">已凝形 {{ g.fam.catches }} 次 · 图鉴 {{ g.fam.seen.length }}/{{ FAMILIARS.length }}</span></div>
        <div class="flex gap-2 items-center flex-wrap">
          <button class="btn btn-gold" :disabled="(g.mats['yaozhu'] || 0) < 30" @click="g.weaveFamiliar()">凝珠化形（妖珠碎片×30 · 持有 {{ g.mats['yaozhu'] || 0 }}）</button>
          <span class="text-xs dim">碎片来自万兽幽林/浮尘矿窟/长阶/战令；副本还有小概率直接获得完整精怪。概率：妖灵44% · 灵胎27% · 玄妖17% · 地妖9% · 天妖3%</span>
        </div>
      </div>
      <div class="panel">
        <div class="panel-t">精 怪 名 录（{{ g.fam.list.length }}）<span class="text-xs dim">点卡片看详情</span></div>
        <div v-if="!g.fam.list.length" class="dim2 text-sm">尚未收服任何精怪，去凝珠化形吧。</div>
        <div class="grid md:grid-cols-2 gap-2">
          <div v-for="f in g.fam.list" :key="f.id" class="itemcard cursor-pointer" @click="openFam(f.id)">
            <div class="flex justify-between items-start flex-wrap gap-1">
              <div class="min-w-0">
                <b :class="'fam-r' + famDef(f.fid).r">{{ famDef(f.fid).n }}</b>
                <span class="chip ml-1">{{ FAM_RARITY[famDef(f.fid).r] }}</span>
                <span class="chip ml-1">Lv.{{ f.level }}</span>
                <span class="chip chip-gold ml-1">{{ '★'.repeat(f.stars) }}</span>
                <span v-if="(g.fam.dupes[f.fid] || 0) > 0" class="chip chip-jade ml-1">同种×{{ g.fam.dupes[f.fid] }}</span>
                <div class="text-xs dim mt-0.5" :title="famDef(f.fid).sk + '：' + famDef(f.fid).skDesc">战技【{{ famDef(f.fid).sk }}】{{ famDef(f.fid).skDesc }} · 当前加成 ×{{ famPct(f) }}</div>
              </div>
              <div class="flex gap-1 shrink-0" @click.stop>
                <button v-if="!isFamOn(f.id)" class="btn btn-xs btn-gold" @click="g.famEquip(f.id)">出战</button>
                <button v-else class="btn btn-xs" @click="g.famUnequip(f.id)">撤下</button>
                <button class="btn btn-xs" @click="openFam(f.id)">详情</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ============ 功法 ============ -->
    <template v-else-if="tab === 'tech'">
      <div class="panel">
        <div class="panel-t">法 门 修 行</div>
        <div class="text-xs dim mb-2">
          功法栏 {{ g.equippedTechs.length }}/{{ g.major >= 8 ? 5 : g.major >= 5 ? 4 : 3 }} · 神通栏 {{ g.equippedSkills.length }}/3
          · 功法残页 {{ g.mats['gongfaPage'] || 0 }}
        </div>
        <div class="flex gap-2 flex-wrap">
          <button class="btn btn-sm" @click="g.learnRandom('passive')">领悟功法（残页×10）</button>
          <button class="btn btn-sm" @click="g.learnRandom('active')">参悟神通（残页×10）</button>
        </div>
      </div>
      <div class="panel">
        <div class="panel-t">已 学 法 门</div>
        <div v-if="!g.techs.length" class="dim2 text-sm">尚未习得任何法门。琅嬛玉阁、宗门藏经阁、奇遇皆可获取。</div>
        <div class="flex flex-col gap-2">
          <div v-for="t in g.techs" :key="t.id" class="itemcard">
            <div class="flex justify-between items-start flex-wrap gap-1">
              <div>
                <span class="gold font-bold">{{ TECH_MAP[t.id]?.n }}</span>
                <span class="chip ml-1">{{ TECH_TIERS[(TECH_MAP[t.id]?.tier || 1) - 1] }}</span>
                <span class="chip ml-1">{{ TECH_MAP[t.id]?.kind === 'passive' ? '功法' : '神通' }}</span>
                <span class="chip chip-jade ml-1">Lv.{{ t.level }}</span>
                <div class="text-xs dim mt-0.5">{{ TECH_MAP[t.id]?.desc }}（每级效果 +8%）</div>
              </div>
              <div class="flex gap-1 flex-wrap">
                <button class="btn btn-xs" @click="g.toggleTech(t.id)">
                  {{ g.equippedTechs.includes(t.id) || g.equippedSkills.includes(t.id) ? '卸下' : '装备' }}
                </button>
                <button class="btn btn-xs" @click="g.levelupTech(t.id)" :disabled="t.level >= 10">
                  参悟升级（修为{{ fmt(200 * (TECH_MAP[t.id]?.tier || 1) * Math.pow(1.9, t.level - 1)) }}）
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ============ 材料 ============ -->
    <template v-else>
      <div class="panel">
        <div class="panel-t">丹 药 储 备</div>
        <div v-if="!pillList.length" class="dim2 text-sm">暂无丹药。可从丹霞秘境、炼丹或坊市获得。</div>
        <div class="flex flex-col gap-2">
          <div v-for="p in pillList" :key="p.key" class="itemcard">
            <div class="flex justify-between items-center flex-wrap gap-2">
              <div>
                <span class="gold font-bold">{{ p.name }}</span>
                <span class="chip chip-jade ml-1">{{ p.qn }}</span>
                <span class="chip ml-1">×{{ p.count }}</span>
                <div class="text-xs dim mt-0.5">{{ p.desc }}</div>
              </div>
              <button v-if="p.usable" class="btn btn-xs" @click="p.use()">服用</button>
              <span v-else class="text-xs dim2">{{ p.note }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-t">材 料 仓 库</div>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
          <div v-for="m in matList" :key="m.id" class="flex justify-between panel !p-2">
            <span>{{ m.n }}</span>
            <b class="gold">{{ m.count }}</b>
          </div>
        </div>
        <div v-if="!matList.length" class="dim2 text-sm">仓库空空。</div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGame } from '../stores/game'
import { SLOTS, SLOT_NAMES, qName } from '../data/qualities'
import { TAG_LABEL, TAG_MAP } from '../data/tags'
import { RES_MAP } from '../data/resonances'
import { BEAST_MAP, BEAST_STAGES, BEAST_STAGE_SKILLS, MATERIALS, MAT_MAP, PILL_MAP, PILL_QNAMES, TECH_MAP, TECH_TIERS, TREASURE_COMBOS, TREASURE_MAP } from '../data/items'
import { fmt } from '../core/format'
import ItemCard from '../components/ItemCard.vue'
import { FAM_MAP, FAM_RARITY, FAMILIARS, famScale } from '../data/familiars'
import { beastAvgQual, beastGrade } from '../core/beast'
import { procEffectText } from '../core/equip'
import type { Beast, Familiar, SlotKey, Treasure } from '../types'

function famDef(fid: string) { return FAM_MAP[fid] || FAMILIARS[0] }
function famPct(f: Familiar) { return Math.round(famScale(f.level, f.stars) * 100) + '%' }
function famLvCost(f: Familiar) { return Math.round(400 * Math.pow(1.32, f.level) * (1 + famDef(f.fid).r * 0.6)) }
function isFamOn(id: number) { return g.fam.equipped.includes(id) }
function openFam(id: number) { g.pushModal('fam', id) }
function openBeast(id: number) { g.pushModal('beast', id) }
function beastAvg(b: Beast): number {
  return beastAvgQual(b)
}

function beastSkills(kind: string, stage: number): string {
  const base = (BEAST_MAP[kind]?.procs || []).map(p => `${p.name}（${procEffectText(p)}）`)
  const unlocked = BEAST_STAGE_SKILLS.slice(0, stage).map(p => `${p.name}（${procEffectText(p)}）`)
  return [...base, ...unlocked].join(' · ') || '无'
}
void advCost
void famLvCost
function advCost(stage: number, lv: number) {
  return { s: 20 * (stage + 1) * (stage + 1), l: Math.round(3000 * Math.pow(1.04069, lv) * (stage + 1)) }
}

const g = useGame()
// 本套铭纹统计与已激活共鸣（装备页可见）
const tagCounts = computed(() => {
  const acc: Record<string, number> = {}
  for (const e of g.equippedItems) for (const t of e.tags || []) acc[t] = (acc[t] || 0) + 1
  return acc
})
const activeResDefs = computed(() => g.derived.active.map(id => RES_MAP[id]).filter(Boolean))
const tabs = [
  { id: 'equip', n: '装备' }, { id: 'treasure', n: '法宝' }, { id: 'beast', n: '灵兽' },
  { id: 'fam', n: '精怪' }, { id: 'tech', n: '功法' }, { id: 'mat', n: '材料丹药' },
]
const tab = ref('equip')
const filterSlot = ref<SlotKey | null>(null)
const sortDesc = ref(true)
const massQ = ref(6)
const massArmed = ref(false)
let massTimer: number | undefined
const wornIds = computed(() => g.wornByAll)
const junkCount = computed(() => g.inventory.filter(e => !wornIds.value.has(e.id) && e.q <= massQ.value).length)
function doMass() {
  if (!massArmed.value) {
    massArmed.value = true
    g.toast(`再点一次确认分解 ${junkCount.value} 件 ≤${massQ.value} 品装备`, 'gold')
    if (massTimer) window.clearTimeout(massTimer)
    massTimer = window.setTimeout(() => { massArmed.value = false }, 3500)
    return
  }
  massArmed.value = false
  g.discardJunk(massQ.value)
}

function slotItem(s: SlotKey) { return g.equippedItems.find(e => e.slot === s) || null }
function wornIn(id: number): 'main' | 'yang' | 'yin' | null { return g.wornBodyOf(id) }

const invFiltered = computed(() => {
  let list = [...g.inventory]
  if (filterSlot.value) list = list.filter(e => e.slot === filterSlot.value)
  list.sort((a, b) => (sortDesc.value ? b.score - a.score : a.score - b.score))
  return list
})

function treaById(id: number): Treasure | null { return g.treasures.find(t => t.id === id) || null }
function comboActive(ids: [string, string]) {
  const n1 = TREASURE_MAP[ids[0]]?.n
  const n2 = TREASURE_MAP[ids[1]]?.n
  return g.treasureEquipped.some(id => g.treasures.find(t => t.id === id)?.name === n1) &&
    g.treasureEquipped.some(id => g.treasures.find(t => t.id === id)?.name === n2)
}

const beastExpPct = computed(() => {
  if (!g.beast) return 0
  const need = Math.round(10 * Math.pow(1.35, g.beast.level - 1))
  return Math.min(100, (g.beast.exp / need) * 100)
})

interface PillRow { key: string; name: string; qn: string; count: number; desc: string; usable: boolean; note: string; use: () => void }
const pillList = computed<PillRow[]>(() => {
  const rows: PillRow[] = []
  for (const [key, count] of Object.entries(g.pills)) {
    if (count <= 0) continue
    const [id, qs] = key.split(':')
    const def = PILL_MAP[id]
    if (!def) continue
    const q = Number(qs)
    const usable = ['juling', 'liaoshang', 'zengshou', 'xisui'].includes(id)
    rows.push({
      key, name: def.n, qn: PILL_QNAMES[q], count,
      desc: def.desc,
      usable,
      note: id === 'podan' ? '突破时自动服用' : id === 'dujie' ? '渡劫中可服用' : '',
      use: () => g.usePill(key),
    })
  }
  return rows
})

const matList = computed(() =>
  MATERIALS.filter(m => (g.mats[m.id] || 0) > 0).map(m => ({ id: m.id, n: m.n, count: g.mats[m.id] })),
)

void MAT_MAP
</script>
