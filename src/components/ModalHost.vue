<template>
  <!-- 浮窗消息 -->
  <div class="fixed top-16 right-2 left-2 sm:left-auto z-[95] flex flex-col gap-1 items-end pointer-events-none">
    <div
      v-for="t in g.toasts"
      :key="t.id"
      class="modal-box !p-2 !max-w-sm !w-auto text-sm float-up"
      :class="t.c === 'red' ? 'red' : t.c === 'gold' ? 'gold' : t.c === 'jade' ? 'jade' : 'dim'"
    >{{ t.t }}</div>
  </div>

  <!-- 主弹窗 -->
  <div v-if="top" class="modal-mask" @click.self="onMask">
    <div class="modal-box">
      <!-- 通用文本 -->
      <template v-if="top.kind === 'text'">
        <div class="modal-title">{{ d('title') }}</div>
        <p class="whitespace-pre-line leading-relaxed my-3 text-center">{{ d('body') }}</p>
        <button class="btn btn-gold w-full" @click="g.closeModal()">确认</button>
      </template>

      <!-- 离线收益 -->
      <template v-else-if="top.kind === 'offline'">
        <div class="modal-title">闭关归来</div>
        <p class="text-center dim my-2">你闭关了 {{ fmtTime(Number(d('away')) * 1000) }}（离线收益上限 12 小时）</p>
        <div class="panel my-2 text-center">
          <div>修为 <b class="gold">+{{ fmt(Number(d('cult'))) }}</b></div>
          <div>灵石 <b class="gold">+{{ fmt(Number(d('ls'))) }}</b></div>
          <div>灵脉石 <b class="gold">+{{ fmt(Number(d('lm'))) }}</b></div>
        </div>
        <div v-if="offlineDelta" class="text-xs dim text-center mb-2">{{ offlineDelta }}</div>
        <button class="btn btn-gold w-full" @click="g.closeModal()">收下机缘</button>
      </template>

      <!-- 奇遇 -->
      <template v-else-if="top.kind === 'encounter' && encDef">
        <div class="modal-title">{{ encName }} · {{ encDef.title }}</div>
        <p class="my-3 leading-relaxed">{{ encDef.text }}</p>
        <div class="flex flex-col gap-2">
          <button
            v-for="(o, i) in encDef.options"
            :key="i"
            class="btn w-full"
            @click="g.resolveEncounter(i)"
          >{{ o.label }}</button>
        </div>
      </template>

      <!-- 心魔 -->
      <template v-else-if="top.kind === 'demon' && g.demonScene">
        <div class="modal-title red">心魔试炼</div>
        <p class="my-3 leading-relaxed">{{ g.demonScene.text }}</p>
        <div v-if="!g.demon?.done" class="flex flex-col gap-2">
          <button
            v-for="(o, i) in g.demonScene.options"
            :key="i"
            class="btn w-full"
            @click="g.demonChoice(i)"
          >{{ o.l }}</button>
        </div>
        <template v-else>
          <p class="jade my-2">{{ g.demon?.result }}</p>
          <button class="btn btn-gold w-full" @click="closeDemon">心念已定</button>
        </template>
      </template>

      <!-- 渡劫 -->
      <template v-else-if="top.kind === 'trib' && g.trib">
        <div class="modal-title gold">雷 劫 加 身</div>
        <div class="flex items-center justify-between text-sm my-1">
          <span v-if="!g.trib.done">第 <b class="gold">{{ g.trib.cur }}</b> / {{ g.trib.bolts }} 道雷劫</span>
          <span v-else class="dim">劫云已散</span>
          <span>气血 <b :class="g.trib.hpPct > 40 ? 'jade' : 'red'">{{ Math.max(0, Math.round(g.trib.hpPct)) }}%</b></span>
        </div>
        <div class="pbar"><div class="pfill pfill-red" :style="{ width: Math.max(0, g.trib.hpPct) + '%' }"></div></div>
        <div class="blog my-2">
          <p v-for="(l, i) in g.trib.log" :key="i" :class="l.c || 'l-sys'">{{ l.t }}</p>
        </div>
        <div v-if="!g.trib.done" class="grid grid-cols-2 gap-2">
          <button class="btn" @click="g.tribAct('hard')">硬抗（伤气血）</button>
          <button class="btn" :disabled="g.trib.treasureUses <= 0" @click="g.tribAct('treasure')">法宝挡劫（{{ g.trib.treasureUses }}）</button>
          <button class="btn" :disabled="g.trib.dujieLeft <= 0" @click="g.tribAct('pill')">服渡劫丹（{{ g.trib.dujieLeft }}）</button>
          <button class="btn" :disabled="g.trib.arrayUsed" @click="g.tribAct('array')">布阵御雷</button>
          <button class="btn" :disabled="g.trib.companionUsed" @click="g.tribAct('companion')">道友护法</button>
          <button class="btn" :disabled="g.trib.sectUsed || !g.sect" @click="g.tribAct('sect')">借宗门秘宝</button>
        </div>
        <div v-else class="mt2">
          <button class="btn btn-gold w-full" @click="g.closeTrib()">{{ g.trib.success ? '破劫飞升' : '收拢残躯' }}</button>
        </div>
      </template>

      <!-- 战斗（逐行播放，可跳过） -->
      <template v-else-if="top.kind === 'battle' && g.battle">
        <div class="modal-title">{{ g.battle.title }}</div>
        <div v-if="battleDone" class="text-center my-1">
          <span v-if="g.battle.win" class="chip chip-jade">大 胜</span>
          <span v-else class="chip chip-red">败 北</span>
        </div>
        <div class="blog my-2">
          <p v-for="(l, i) in battleShown" :key="i" :class="l.c || 'l-sys'">{{ l.t }}</p>
        </div>
        <div v-if="battleDone && g.battle.rewards.length" class="panel my-2 text-sm">
          <div class="gold mb-1">获得：</div>
          <div v-for="(r, i) in g.battle.rewards" :key="i" class="dim">{{ r }}</div>
        </div>
        <div class="flex gap-2">
          <button v-if="!battleDone" class="btn flex-1" @click="skipBattle">跳 过 （{{ battleShown.length }}/{{ g.battle.log.length }}）</button>
          <button v-else class="btn btn-gold flex-1" @click="closeBattle">离 开</button>
        </div>
      </template>

      <!-- 镇妖塔 · 爬塔增幅三选一 -->
      <template v-else-if="top.kind === 'towerpick' && g.tower.offer">
        <div class="modal-title gold">爬 塔 增 幅 · 三 选 一</div>
        <p class="text-xs dim text-center my-1">已通关第 {{ g.tower.offer.layer }} 层！增幅仅在本日爬塔生效，每日 0 点重置</p>
        <div class="flex flex-col gap-2 my-2">
          <div
            v-for="(b, i) in towerOfferDefs" :key="b.id"
            class="panel !p-2 cursor-pointer"
            :class="b.tier === 3 ? 'ring-1 ring-yellow-600/60' : b.tier === 2 ? 'ring-1 ring-emerald-700/40' : ''"
            @click="g.pickTowerBuff(i)"
          >
            <div class="flex justify-between items-center">
              <b :class="b.tier === 3 ? 'gold' : b.tier === 2 ? 'jade' : ''">{{ b.n }}</b>
              <span class="chip" :class="b.tier === 3 ? 'chip-gold' : b.tier === 2 ? 'chip-jade' : ''">{{ TB_TIER_NAMES[b.tier] }}</span>
            </div>
            <div class="text-xs dim mt-0.5">{{ b.d }}</div>
          </div>
        </div>
        <div class="text-xs dim2 text-center">点选一项获得增幅；同类增幅可叠加</div>
      </template>

      <!-- 妖王殿 · 伤害榜 -->
      <template v-else-if="top.kind === 'yaoboard'">
        <div class="modal-title gold">妖 王 殿 · 伤 害 榜</div>
        <p class="text-xs dim text-center my-1">今日妖王「{{ g.yaoSpec().name }}」· 每日 0 点按排名结算发奖</p>
        <div class="panel !p-2 max-h-80 overflow-y-auto">
          <div v-for="x in g.yaoTop" :key="x.r" class="flex justify-between text-xs py-0.5 gap-2" :class="x.me ? 'gold' : ''">
            <span class="shrink-0 w-12">{{ x.r <= 3 ? ['🥇', '🥈', '🥉'][x.r - 1] : '第' + x.r }}</span>
            <span class="flex-1 truncate">{{ x.n }}<span v-if="x.me">（你）</span></span>
            <b class="shrink-0">{{ fmt(x.dmg) }}</b>
          </div>
        </div>
        <div class="text-xs dim2 text-center mt-1">奖励档位：第 1 名 / 2-3 名 / 4-10 名 / 11-30 名 / 31 名以后</div>
        <button class="btn w-full mt-2" @click="g.closeModal()">关 闭</button>
      </template>

      <!-- 死亡 -->
      <template v-else-if="top.kind === 'death'">
        <div class="modal-title red">身 死 道 消</div>
        <p class="my-3 text-center leading-relaxed">{{ d('reason') }}</p>
        <div class="panel text-center my-2">
          <p class="dim">一生修行，终入轮回。</p>
          <p>轮回之力 <b class="gold">+{{ d('points') }}</b></p>
          <p class="text-xs dim2 mt-1">轮回之力可在转世后提升初始资质与稀有灵根概率</p>
        </div>
        <button class="btn btn-gold w-full" @click="g.reincarnate()">转 世 投 胎</button>
      </template>

      <!-- 飞升 -->
      <template v-else-if="top.kind === 'ascend'">
        <div class="modal-title gold">飞 升 成 仙</div>
        <p class="my-3 leading-relaxed text-center">你历经千劫万难，终于站在了仙门之前。<br />诸般因果尽数了断，天地为你让开一条登天之路。</p>
        <p class="dim text-center text-sm mb-3">（你可以继续潜修，或散功转世，以更强的底蕴重走仙途）</p>
        <div class="flex gap-2">
          <button class="btn flex-1" @click="g.closeModal()">继续潜修</button>
          <button class="btn btn-gold flex-1" @click="g.reincarnate()">散功转世</button>
        </div>
      </template>

      <!-- 装备详情 -->
      <template v-else-if="top.kind === 'item' && itemView">
        <div class="modal-title" :class="'qc' + itemView.q">{{ itemView.name }}</div>
        <div class="flex justify-center gap-1 flex-wrap text-xs my-2">
          <span class="chip" :style="{ color: qColor(itemView.q), borderColor: qColor(itemView.q) }">{{ qName(itemView.q) }}品质</span>
          <span class="chip chip-gold">Lv.{{ itemView.level }}</span>
          <span class="chip">{{ SLOT_NAMES[itemView.slot] }}</span>
          <span class="chip">{{ '★'.repeat(itemView.stars) }}</span>
          <span v-if="itemView.rune" class="chip chip-gold">灵纹·{{ runeName }}</span>
          <span v-if="itemView.selfMined" class="chip chip-jade">自挖</span>
          <span v-if="itemView.enchanted" class="chip">已洗练</span>
          <span v-if="wornBodyName" class="chip chip-gold">{{ wornBodyName }}穿戴中</span>
        </div>
        <div class="text-center text-xs dim mb-2">
          评分 <b class="gold">{{ fmt(itemView.score) }}</b>
          <span v-if="!isWorn && slotEq"> · 穿戴「{{ slotEq.name }}」{{ fmt(slotEq.score) }} · 差值 <b :class="diff >= 0 ? 'jade' : 'red'">{{ diff >= 0 ? '+' : '' }}{{ fmt(diff) }}</b></span>
        </div>
          <div v-if="inInv" class="panel !p-2 mb-2">
          <div class="flex justify-between items-center gap-2 flex-wrap text-sm">
            <span>强化 <b class="gold">+{{ itemView.enh || 0 }}</b> <span class="text-xs dim">/ +{{ ENH_MAX }} · 词条效果 +{{ (itemView.enh || 0) * 5 }}%{{ g.enhanceDiscount > 0 ? ` · 器道折扣 -${Math.round(g.enhanceDiscount * 100)}%` : '' }}</span></span>
            <button class="btn btn-xs btn-gold" :disabled="(itemView.enh || 0) >= ENH_MAX" @click="g.enhanceItem(itemView.id)">
              {{ (itemView.enh || 0) >= ENH_MAX ? '已 满 级' : `强化 → +${(itemView.enh || 0) + 1}（灵石${fmt(enhCost.lingshi)} · 灵脉石${enhCost.lingmai}）` }}
            </button>
          </div>
        </div>
        <div v-if="cmp" class="panel !p-2 mb-3">
          <div class="text-xs dim mb-1">与当前穿戴「{{ cmp.eqName }}」（{{ g.activeBodyName }}配装）的属性对比</div>
          <div class="cmp-row cmp-head">
            <span>属性</span><span>穿戴中</span><span>本件</span><span>差值</span>
          </div>
          <div class="flex flex-col gap-1 mt-1">
            <div v-for="r in cmp.rows" :key="r.k" class="cmp-row">
              <span>{{ r.n }}</span>
              <span class="dim">{{ r.bStr }}</span>
              <span>{{ r.aStr }}</span>
              <b :class="r.d > 0 ? 'jade' : 'red'">{{ r.dStr }}</b>
            </div>
            <span v-if="!cmp.rows.length" class="dim2 text-xs">词条等效，无差异</span>
          </div>
        </div>
        <div class="panel !p-2 mb-3">
          <div class="text-xs dim mb-1">词条（{{ itemView.affixes.length }} 条）<span v-if="inInv" class="dim2"> · 点 🔒 锁定词条（锁定后洗炼消耗更高）</span></div>
          <div class="flex flex-col gap-1">
            <div v-for="(a, i) in itemView.affixes" :key="i" class="affix-row" :class="'t' + a.tier">
              <span>{{ affixName(a) }}</span>
              <span class="flex items-center gap-2">
                <b>{{ affixVal(a) }}</b>
                <button
                  v-if="inInv" class="btn btn-xs !px-1.5" :class="isLocked(i) ? 'btn-gold' : ''"
                  :title="isLocked(i) ? '已锁定（洗炼不会改变此词条）' : '锁定此词条（洗炼时保留）'"
                  @click="g.toggleLock(itemView.id, i)"
                >{{ isLocked(i) ? '🔒' : '🔓' }}</button>
              </span>
            </div>
            <span v-if="!itemView.affixes.length" class="dim2 text-xs">无词条</span>
          </div>
          <div v-if="itemView.rune" class="text-xs mt-2 gold">灵纹 · {{ runeName }}：{{ runeDesc }}</div>
          <div v-if="itemView.tags && itemView.tags.length" class="text-xs mt-1 flex items-center gap-1 flex-wrap">
            <span class="dim">铭纹：</span>
            <span
              v-for="t in itemView.tags" :key="t" class="chip"
              style="color: #c9a0ff; border-color: rgba(180, 140, 255, 0.5)"
              :title="TAG_MAP[t]?.d + '（铭纹间可共鸣）'"
            >{{ TAG_LABEL(t) }}·{{ TAG_MAP[t]?.d }}</span>
          </div>
          <div v-if="itemView.flavors.length || itemView.elements.length" class="text-xs dim mt-1">
            <span v-if="itemView.flavors.length">流派：{{ itemView.flavors.join('、') }}</span>
            <span v-if="itemView.elements.length">　五行：{{ itemView.elements.join('、') }}</span>
          </div>
        </div>
        <div class="flex gap-2 flex-wrap justify-center">
          <button v-if="inInv && !isWorn" class="btn btn-gold flex-1" @click="doEquip">装 备</button>
          <button v-if="isWorn" class="btn flex-1" @click="doUnequip">卸 下</button>
          <button v-if="inInv" class="btn btn-sm" :disabled="g.res.xilian < 3 + lockCount * 2" @click="g.reforge(itemView.id, 'value')">洗数值（{{ reforgeCostStr('value') }}·持{{ g.res.xilian }}）</button>
          <button v-if="inInv" class="btn btn-sm" :disabled="g.res.gaiming < 1 + lockCount" @click="g.reforge(itemView.id, 'type')">洗类型（{{ reforgeCostStr('type') }}·持{{ g.res.gaiming }}）</button>
          <button v-if="inInv && !isWorn" class="btn btn-sm btn-red" @click="doDiscard">丢 弃</button>
          <button class="btn btn-sm" @click="g.closeModal()">关 闭</button>
        </div>
      </template>

      <!-- 模拟充值 -->
      <template v-else-if="top.kind === 'pay' && payPack">
        <div class="modal-title gold">模 拟 充 值</div>
        <div class="text-center my-2">
          <div class="text-sm dim">{{ payPack.kind === 'month' ? '月卡 · 30 天' : payPack.kind === 'pass' ? '修行战令 · 豪华版' : `仙玉礼包 · ¥${payPack.rmb}` }}</div>
          <div v-if="(payPack.kind ?? 'xianyu') === 'xianyu'" class="gold text-xl my-1">仙玉 × {{ fmt(payFinalAmount) }}</div>
          <div v-else class="text-sm gold my-1">{{ payPack.bonus }}</div>
          <span v-if="(payPack.kind ?? 'xianyu') === 'xianyu' && (payIsFirst || payStep >= 3)" class="chip chip-red">{{ payStep >= 3 ? '本次已享首充双倍' : '首充双倍已生效' }}</span>
        </div>
        <div class="my-3 px-2">
          <template v-if="payStep < 3">
            <div class="text-center text-sm dim mb-2">{{ payStepText }}</div>
            <div class="pbar !h-2"><div class="pfill" :style="{ width: (payStep / 3) * 100 + '%' }"></div></div>
          </template>
          <div v-else class="text-center">
            <div class="gold text-lg mb-1">✔ 交 易 成 功</div>
            <div class="text-sm jade">{{ (payPack.kind ?? 'xianyu') === 'xianyu' ? `仙玉 × ${fmt(payFinalAmount)} 已到账` : payPack.kind === 'month' ? '月卡已生效' : '豪华战令已解锁' }}</div>
          </div>
        </div>
        <button v-if="payStep >= 3" class="btn btn-gold w-full" @click="g.closeModal()">收 下</button>
        <div v-else class="text-xs dim2 text-center">正在模拟支付流程，请稍候…</div>
        <div class="text-xs dim2 text-center mt-2">⚠ 单机演示：本操作不会产生任何真实扣费</div>
      </template>

      <!-- 抽卡结果 -->
      <template v-else-if="top.kind === 'gacha' && gachaView">
        <div class="modal-title gold">寻 仙 问 道 · 结 果</div>
        <div class="flex flex-col gap-1 my-2" style="max-height: 52vh; overflow-y: auto">
          <div v-for="(r, i) in gachaView.results" :key="i" class="gacha-line" :class="'gacha-r' + r.r">
            <b class="shrink-0">{{ r.n }}</b>
            <span class="text-xs dim text-right">{{ r.d }}</span>
          </div>
        </div>
        <div class="flex gap-2 flex-wrap">
          <button class="btn btn-sm flex-1" @click="g.gachaPull(gachaView.pool, 1)">{{ g.res.gachaTicket >= 1 ? '再抽（寻仙令×1）' : '再抽（30 仙玉）' }}</button>
          <button class="btn btn-sm btn-gold flex-1" @click="g.gachaPull(gachaView.pool, 10)">{{ g.res.gachaTicket >= 10 ? '十连（寻仙令×10）' : '十连（280 仙玉）' }}</button>
          <button class="btn btn-sm" @click="g.closeModal()">关 闭</button>
        </div>
        <div class="text-xs dim2 text-center mt-2">持有寻仙令 {{ g.res.gachaTicket }} · 仙玉 {{ fmt(g.res.xianyu) }}</div>
      </template>

      <!-- 仙途纪事 -->
      <template v-else-if="top.kind === 'story' && storyView">
        <div class="modal-title gold">仙 途 纪 事 · {{ storyView.n }}</div>
        <p class="my-3 leading-relaxed">{{ storyView.text }}</p>
        <div class="flex flex-col gap-2">
          <button v-for="(c, i) in storyView.choices" :key="i" class="btn w-full" @click="g.resolveStory(storyView.id, i)">{{ c.l }}</button>
        </div>
      </template>

      <!-- 切磋邀约 -->
      <template v-else-if="top.kind === 'npcduel' && duelView">
        <div class="modal-title">切 磋 之 邀</div>
        <p class="my-3 leading-relaxed">「{{ duelView.real }}」（{{ realmOf(duelView).name }} · 战力 {{ fmt(powerOf(duelView)) }}）遣弟子送来战帖：「久闻道友大名，可愿赐教几招？」</p>
        <div class="flex gap-2">
          <button class="btn btn-gold flex-1" @click="acceptDuel">应 战</button>
          <button class="btn flex-1" @click="declineDuel">婉 拒（好感 -2）</button>
        </div>
      </template>

      <!-- NPC 详情 -->
      <template v-else-if="top.kind === 'npc' && npcView">
        <div class="modal-title gold">{{ npcView.real }} <span class="text-sm dim">{{ npcView.name }}</span></div>
        <div class="flex justify-center gap-1 flex-wrap text-xs my-2">
          <span class="chip" :class="npcView.align === '魔' ? 'chip-red' : npcView.align === '正' ? 'chip-jade' : ''">{{ npcView.align }}道</span>
          <span class="chip">{{ npcView.sect }}</span>
          <span class="chip">{{ npcView.flavor }}</span>
          <span class="chip">{{ realmOf(npcView).name }}</span>
          <span class="chip chip-gold">战力 {{ fmt(powerOf(npcView)) }}</span>
        </div>
        <div class="panel !p-2 mb-2 text-xs">
          <div>好感 {{ npcView.favor }}<span v-if="npcView.hate > 0" class="red ml-2">仇怨 {{ npcView.hate }}</span>
            <span v-if="npcView.rel !== 'none'" class="chip chip-gold ml-1">{{ relName(npcView.rel) }}</span></div>
          <div class="mt-1">喜好：<span v-for="t in likes" :key="t" class="chip chip-jade mr-1">{{ t }}类</span><span class="dim2">（送对应礼物好感×2.5）</span></div>
          <div class="mt-1 dim">随身宝物：{{ belongings.join('、') }}</div>
          <div class="mt-1 dim2">今日已赠礼 {{ giftCount }}/{{ g.giftMax }} · 已指点 {{ teachCount }}/5</div>
        </div>
        <div class="panel !p-2 mb-2">
          <div class="text-xs gold mb-1">赠 礼（持有）</div>
          <div v-if="!ownedGifts.length" class="text-xs dim2">暂无礼物——游历奇遇、坊市、副本可得。</div>
          <div class="flex gap-1 flex-wrap">
            <button v-for="g2 in ownedGifts" :key="g2.id" class="btn btn-xs" :class="likes.includes(g2.type) ? 'btn-gold' : ''" @click="g.giftNpcWith(npcView.id, g2.id)">
              {{ g2.n }}×{{ g.mats[g2.id] || 0 }}{{ likes.includes(g2.type) ? ' ★' : '' }}
            </button>
          </div>
          <button class="btn btn-xs mt-1" @click="g.giftNpc(npcView.id)">灵石礼金（1000灵石）</button>
        </div>
        <div class="flex gap-1 flex-wrap justify-center">
          <button class="btn btn-sm" @click="g.duelNpc(npcView.id); g.closeModal()">切磋</button>
          <button class="btn btn-sm" @click="g.teachNpc(npcView.id)">指点</button>
          <button v-if="npcView.rel === 'lover'" class="btn btn-sm btn-gold" @click="g.shuangxiu(npcView.id)">双修</button>
          <button v-else class="btn btn-sm" @click="g.proposeNpc(npcView.id)">结为道侣</button>
          <button v-if="npcView.rel === 'none'" class="btn btn-sm" @click="g.masterNpc(npcView.id)">拜师</button>
          <button v-if="npcView.rel === 'none'" class="btn btn-sm" @click="g.recruitDisciple(npcView.id)">收徒</button>
          <button class="btn btn-sm" @click="g.closeModal()">关 闭</button>
        </div>
      </template>

      <!-- 灵兽详情 -->
      <template v-else-if="top.kind === 'beast' && beastView">
        <div class="modal-title">灵 兽 · <span :class="'qc' + beastView.q">{{ beastView.name }}</span></div>
        <div class="flex justify-center gap-1 flex-wrap text-xs my-2">
          <span class="chip">{{ BEAST_MAP[beastView.kind]?.n || beastView.kind }}</span>
          <span class="chip chip-gold">Lv.{{ beastView.level }}</span>
          <span class="chip chip-gold">{{ BEAST_STAGES[beastView.stage || 0] }}</span>
          <span class="chip" :class="beastGradeIdx >= 4 ? 'chip-gold' : beastGradeIdx >= 3 ? 'chip-jade' : ''">资质 {{ beastGradeTxt }}</span>
          <span class="chip">成长率 {{ beastView.growth ?? 1 }}</span>
          <span v-if="g.beastActive === beastView.id" class="chip chip-jade">出战中</span>
        </div>
        <div class="text-xs dim text-center mb-2">{{ BEAST_MAP[beastView.kind]?.desc }}</div>
        <div class="panel !p-2 mb-2 text-xs">
          <div class="gold mb-1">给 主 人 的 加 成（吞食同类随机提升一项）</div>
          <div class="flex flex-wrap gap-x-3 gap-y-0.5">
            <span v-for="(line, i) in beastBonusLines" :key="i" class="jade">{{ line }}</span>
          </div>
          <div class="divider my-1"></div>
          <div v-for="qk in ['atk','def','hp','spd']" :key="qk" class="flex items-center gap-2 py-0.5">
            <span class="w-16 dim">{{ qualName(qk) }}</span>
            <div class="pbar !h-1.5 flex-1"><div class="pfill" :style="{ width: (beastQual(qk)) + '%' }"></div></div>
            <span>{{ beastQual(qk) }}</span>
          </div>
          <div class="dim2 mt-1">资质均值 {{ beastAvgTxt }} → 资质等级【{{ beastGradeTxt }}】；吞食同种灵兽即可升阶并随机提升一项资质。</div>
        </div>
        <div class="panel !p-2 mb-2 text-xs">
          <div class="gold">助战技：{{ beastSkillsText }}</div>
          <div class="dim mt-0.5">经验 {{ beastView.exp }}/{{ beastNeed }}</div>
        </div>
        <div class="flex gap-1 flex-wrap justify-center">
          <button class="btn btn-sm" :class="g.beastActive === beastView.id ? '' : 'btn-gold'" @click="g.setBeast(g.beastActive === beastView.id ? null : beastView.id)">
            {{ g.beastActive === beastView.id ? '收 回' : '出 战' }}
          </button>
          <button class="btn btn-sm" @click="g.feedBeast(beastView.id)">喂养升级（兽魂×1 · 持有 {{ g.mats['shouhun'] || 0 }}）</button>
          <button v-if="(beastView.stage || 0) < 4" class="btn btn-sm" :disabled="beastView.level < ((beastView.stage || 0) + 1) * 10" @click="g.advanceBeast(beastView.id)">
            进阶（需Lv.{{ ((beastView.stage || 0) + 1) * 10 }} · 兽魂×{{ beastAdv.s }} · 灵石{{ fmt(beastAdv.l) }}）
          </button>
        </div>
        <div class="panel !p-2 mt-2">
          <div class="text-xs gold mb-1">吞 食 同 类（升阶一次 ＋ 随机提升一项资质）</div>
          <div v-if="dups.length" class="flex gap-1 flex-wrap">
            <button v-for="d in dups" :key="d.id" class="btn btn-xs btn-gold" @click="g.mergeBeast(beastView.id, d.id)">
              吞食【{{ d.name }}】Lv.{{ d.level }}（资质均 {{ dupAvg(d) }}）
            </button>
          </div>
          <div v-else class="text-xs dim2">暂无同种灵兽——孵化同种灵兽蛋（40% 血脉相承）或从万兽幽林/坊市获取后，即可在此吞食升阶。</div>
        </div>
        <button class="btn w-full mt-2" @click="g.closeModal()">关 闭</button>
      </template>

      <!-- 精怪详情 -->
      <template v-else-if="top.kind === 'fam' && famView">
        <div class="modal-title"><span :class="'fam-r' + famView.def.r">{{ famView.def.n }}</span> <span class="text-sm dim">{{ famView.rarity }}</span></div>
        <div class="flex justify-center gap-1 flex-wrap text-xs my-2">
          <span class="chip chip-gold">Lv.{{ famView.f.level }}</span>
          <span class="chip chip-gold">{{ '★'.repeat(famView.f.stars) }}</span>
          <span class="chip">加成 ×{{ famView.pct }}%</span>
          <span v-if="famView.on" class="chip chip-jade">出战中</span>
        </div>
        <p class="text-xs dim text-center mb-2">{{ famView.def.desc }}</p>
        <div class="panel !p-2 mb-2 text-xs">
          <div class="gold mb-1">出战加成（随等级/星级提升）</div>
          <div v-for="(line, i) in famView.mods" :key="i" class="dim">{{ line }}</div>
          <div class="dim2 mt-1">升星 +25%/星、升级 +8%/级；喂同种精怪升阶。</div>
        </div>
        <div class="panel !p-2 mb-2 text-xs">
          <div class="flex justify-between items-center">
            <span>同种精怪持有：<b class="gold">×{{ famView.dupes }}</b></span>
            <button class="btn btn-xs" :class="famView.dupes > 0 ? 'btn-gold' : ''" :disabled="famView.dupes <= 0" @click="g.famFeedDup(famView.f.id)">
              喂 养 升 阶（消耗同种×1）
            </button>
          </div>
          <div class="dim2 mt-1">同种来源：凝珠化形随机重复、万兽幽林掉落；已满 5★ 后喂养转化为妖珠碎片与仙玉。</div>
        </div>
        <div class="flex gap-2 justify-center">
          <button class="btn btn-sm" :class="famView.on ? '' : 'btn-gold'" @click="famView.on ? g.famUnequip(famView.f.id) : g.famEquip(famView.f.id)">{{ famView.on ? '撤 下' : '出 战' }}</button>
          <button class="btn btn-sm" :disabled="famView.f.level >= 30" @click="g.famLevelUp(famView.f.id)">{{ famView.f.level >= 30 ? '满级' : `升级（灵石 ${fmt(famView.cost)}）` }}</button>
          <button class="btn btn-sm" @click="g.closeModal()">关 闭</button>
        </div>
      </template>

      <!-- 签到月历 -->
      <template v-else-if="top.kind === 'signin'">
        <div class="modal-title">签 到 · 月 度 宝 阁</div>
        <div class="text-center text-xs dim mb-2">第 {{ nextDay }}/30 天待签 · 补签剩 {{ g.daily.makeup }} 次</div>
        <div class="flex gap-2 flex-wrap justify-center mb-2">
          <button class="btn btn-sm btn-gold" :disabled="g.daily.daySigned" @click="g.signIn()">{{ g.daily.daySigned ? '今日已签' : '签 到' }}</button>
          <button class="btn btn-sm" :disabled="g.daily.daySigned || g.daily.makeup <= 0" @click="g.makeUpSign()">补 签（200灵石）</button>
          <button class="btn btn-sm" :disabled="g.daily.giftTaken" @click="g.claimGift()">{{ g.daily.giftTaken ? '礼包已领' : '每日礼包' }}</button>
          <button class="btn btn-sm" :disabled="g.meditateUntil > 0" @click="g.meditate()">{{ g.meditateUntil > 0 ? `打坐中…${Math.ceil((g.meditateUntil - nowT) / 1000)}s` : '打坐 30 秒（双倍礼包）' }}</button>
        </div>
        <div class="grid grid-cols-5 sm:grid-cols-6 gap-1">
          <div v-for="d in MONTH_DAYS" :key="d" class="sign-cell" :class="cellCls(d)">
            <span class="sc-d">{{ d }}</span>
            <span class="sc-r">{{ rewardBrief(monthReward(d)) }}</span>
          </div>
        </div>
        <div class="text-xs dim mt-2 text-center">满 30 天重新从第 1 天开始；第 7/25/30 天有装备大礼，月末有仙玉豪礼。</div>
        <button class="btn w-full mt-2" @click="g.closeModal()">关 闭</button>
      </template>

      <!-- 福利大礼包 -->
      <template v-else-if="top.kind === 'bundle'">
        <div class="modal-title">福 利 大 礼 包</div>
        <div class="panel !p-2 mb-2">
          <div class="text-xs gold mb-1">新 手 7 日 签 到 <span class="dim2">{{ g.daily.newbieDay >= 7 ? '已完成' : `已领 ${g.daily.newbieDay}/7 · 随每日签到自动推进` }}</span></div>
          <div class="grid grid-cols-7 gap-1">
            <div v-for="d in 7" :key="d" class="sign-cell" :class="newbieCls(d)">
              <span class="sc-d">{{ d }}</span>
              <span class="sc-r">{{ rewardBrief(newbieReward(d)) }}</span>
            </div>
          </div>
        </div>
        <div class="panel !p-2">
          <div class="text-xs gold mb-1">境 界 大 礼 包 <span class="dim2">突破至新大境界即可领取</span></div>
          <div v-for="n in 10" :key="n" class="flex justify-between items-center py-1 gap-2 text-sm">
            <span class="min-w-0"><b :class="g.major >= n ? 'gold' : 'dim2'">{{ MAJOR[n] }}·礼包</b> <span class="text-xs dim ml-1">{{ rewardBrief(realmGift(n)) }}</span></span>
            <button class="btn btn-xs shrink-0" :class="g.major >= n && !g.daily.realmGifts.includes(n) ? 'btn-gold' : ''" :disabled="g.major < n || g.daily.realmGifts.includes(n)" @click="g.claimRealmGift(n)">
              {{ g.daily.realmGifts.includes(n) ? '已领' : g.major >= n ? '领 取' : '未达成' }}
            </button>
          </div>
        </div>
        <button class="btn w-full mt-2" @click="g.closeModal()">关 闭</button>
      </template>

      <!-- 今日修行 -->
      <template v-else-if="top.kind === 'daily'">
        <div class="modal-title">今 日 修 行</div>
        <div class="text-center text-sm mb-1">活跃度 <b class="gold">{{ g.daily.progress['pt'] || 0 }}</b>/100</div>
        <div class="pbar mb-2"><div class="pfill" :style="{ width: Math.min(100, g.daily.progress['pt'] || 0) + '%' }"></div></div>
        <div v-for="(t, i) in DAILY_TASKS" :key="i" class="flex justify-between items-center py-1 text-sm">
          <span>{{ t.l }} <span class="dim text-xs">（{{ Math.min(g.daily.progress[t.k] || 0, t.target) }}/{{ t.target }}）</span></span>
          <button class="btn btn-xs" :disabled="g.daily.taskClaimed[i] || (g.daily.progress[t.k] || 0) < t.target" @click="g.claimTask(i)">{{ g.daily.taskClaimed[i] ? '已领' : `+${t.pt} 活跃` }}</button>
        </div>
        <button class="btn btn-sm btn-gold w-full mt-2" :disabled="(g.daily.progress['pt'] || 0) < 100 || g.daily.chestTaken" @click="g.claimChest()">{{ g.daily.chestTaken ? '活跃宝箱已领' : '领取活跃宝箱（100 活跃度）' }}</button>
        <button class="btn w-full mt-2" @click="g.closeModal()">关 闭</button>
      </template>

      <!-- 在线福利 -->
      <template v-else-if="top.kind === 'online'">
        <div class="modal-title">在 线 福 利</div>
        <div class="text-center text-xs dim mb-2">今日挂机 {{ fmtTime(g.online.sec * 1000) }} / 120 分钟（每日重置）</div>
        <div class="flex flex-wrap gap-2 justify-center">
          <button v-for="(r, i) in ONLINE_REWARDS" :key="i" class="btn btn-sm" :class="onlineCan(i) ? 'btn-gold' : ''" :disabled="g.online.got.includes(i) || g.online.sec < r.sec" @click="g.claimOnline(i)">
            {{ g.online.got.includes(i) ? `${r.n}·已领` : onlineCan(i) ? `${r.n}·领取!` : r.n }}
          </button>
        </div>
        <button class="btn w-full mt-3" @click="g.closeModal()">关 闭</button>
      </template>

      <!-- 新手目标 -->
      <template v-else-if="top.kind === 'goals'">
        <div class="modal-title">新 手 目 标</div>
        <div class="text-center text-xs dim mb-2">{{ g.goals.done.length }}/{{ GOALS.length }} 完成 · 达成自动发放</div>
        <div v-for="gl in GOALS" :key="gl.id" class="flex justify-between items-center py-1 text-sm">
          <span :class="g.goals.done.includes(gl.id) ? 'dim2' : ''">{{ gl.n }} <span class="text-xs dim">· {{ gl.desc }}</span></span>
          <span class="text-xs shrink-0" :class="g.goals.done.includes(gl.id) ? 'jade' : 'dim2'">{{ g.goals.done.includes(gl.id) ? '✓ 已达成' : '进行中' }}</span>
        </div>
        <button class="btn w-full mt-2" @click="g.closeModal()">关 闭</button>
      </template>

      <!-- 活动日历 -->
      <template v-else-if="top.kind === 'activity'">
        <div class="modal-title">活 动 日 历</div>
        <div class="text-center text-xs dim mb-2">游戏月 = 10 天（压缩循环）</div>
        <div v-for="a in ACTIVITIES" :key="a.id" class="flex justify-between items-center py-1 text-sm" :class="isActive(a) ? 'gold' : 'dim'">
          <div><b>{{ a.n }}</b> <span class="text-xs dim ml-1">{{ a.desc }}</span></div>
          <span class="text-xs shrink-0">{{ isActive(a) ? `进行中 · 剩 ${fmtTime(endIn(a))}` : `还有 ${fmtTime(startIn(a))}` }}</span>
        </div>
        <div class="text-xs mt-2 text-center" :class="g.chaosOpen ? 'gold' : 'dim2'">混沌之门：{{ g.chaosOpen ? '已开启（去副本面板）' : '每三旬旬末开启' }}</div>
        <button class="btn w-full mt-2" @click="g.closeModal()">关 闭</button>
      </template>

      <!-- 命格 -->
      <template v-else-if="top.kind === 'traits'">
        <div class="modal-title">先 天 气 运（命 格）</div>
        <div v-for="tid in g.traits" :key="tid" class="py-1 text-sm text-center">
          <b :class="traitCls(tid)">【{{ traitDef(tid).n }}】</b>
          <span class="text-xs dim ml-1">{{ traitDef(tid).desc }}</span>
        </div>
        <div class="text-xs dim2 text-center mt-1">命格先定，天道后成。转世之后重新觉醒（共 {{ TRAITS_COUNT }} 种）。</div>
        <button v-if="xisuiKey" class="btn btn-sm btn-gold w-full mt-2" @click="g.usePill(xisuiKey)">服用洗髓丹，当场重掷命格（持有 {{ g.pills[xisuiKey] }}）</button>
        <button class="btn w-full mt-2" @click="g.closeModal()">关 闭</button>
      </template>

      <!-- 仙途纪事卷宗 -->
      <template v-else-if="top.kind === 'storybook'">
        <div class="modal-title">仙 途 纪 事</div>
        <div class="text-center text-xs dim mb-2">{{ g.story.done.length }}/{{ STORY.length }} 卷 · 主线嵌入问道长阶，隐藏章特殊触发</div>
        <div v-for="sc in STORY" :key="sc.id" class="flex justify-between items-center py-1 text-sm gap-2">
          <span class="min-w-0">
            <b :class="storyState(sc) === 'ready' ? 'gold' : 'dim2'">{{ sc.hidden && storyState(sc) !== 'ready' ? '？？？' : sc.n }}</b>
            <span class="text-xs dim ml-1">{{ storyState(sc) === 'ready' ? sc.s : storyState(sc) === 'done' ? '已完结' : sc.condText }}</span>
          </span>
          <button v-if="storyState(sc) === 'ready'" class="btn btn-xs btn-gold shrink-0" @click="g.openStory(sc.id)">阅 卷</button>
          <span v-else-if="storyState(sc) === 'done'" class="text-xs jade shrink-0">✓ 已阅</span>
          <span v-else class="text-xs dim2 shrink-0">未解锁</span>
        </div>
        <button class="btn w-full mt-2" @click="g.closeModal()">关 闭</button>
      </template>

      <!-- 设置 -->
      <template v-else-if="top.kind === 'settings'">
        <div class="modal-title">设 置</div>
        <div class="flex items-center justify-center gap-4 text-sm my-2">
          <span class="flex items-center gap-2">音效 <div class="switch" :class="{ on: g.settings.audio }" @click="toggleAudio"></div></span>
          <span class="flex items-center gap-2">音乐 <div class="switch" :class="{ on: g.settings.music }" @click="toggleMusic"></div></span>
          <span class="flex items-center gap-2">粒子 <div class="switch" :class="{ on: g.settings.fx }" @click="g.settings.fx = !g.settings.fx"></div></span>
        </div>
        <div class="flex flex-wrap gap-2 justify-center">
          <button class="btn btn-sm" @click="doExport">生成存档导出码</button>
          <button class="btn btn-sm" :disabled="!expo" @click="copyExpo">复 制</button>
          <button class="btn btn-sm btn-red" @click="doReset">重置全部存档</button>
        </div>
        <textarea v-if="expo" v-model="expo" class="w-full mt-2 text-xs p-2" rows="3" style="background: #0f0c08; border: 1px solid var(--line2); border-radius: 6px; color: var(--dim)" readonly></textarea>
        <div class="text-xs dim mt-2 mb-1">导入存档（粘贴导出码）：</div>
        <div class="flex gap-2">
          <input v-model="imp" class="btn !min-h-8 flex-1 text-xs" style="color: var(--txt); background: #1c1712" placeholder="粘贴存档码…" />
          <button class="btn btn-sm" :disabled="!imp" @click="doImport">导 入</button>
        </div>
        <div class="divider"></div>
        <div class="text-xs gold mb-1">礼 包 码</div>
        <div class="flex gap-2">
          <input v-model="codeInput" class="btn !min-h-8 flex-1 text-xs" style="color: var(--txt); background: #1c1712" placeholder="输入礼包码，如 CHANGSHENG" @keyup.enter="doRedeem" />
          <button class="btn btn-sm btn-gold" :disabled="!codeInput.trim()" @click="doRedeem">兑 换</button>
        </div>
        <button class="btn btn-xs w-full mt-1" @click="showCodes = !showCodes">{{ showCodes ? '收起礼包码一览' : '查看本版本礼包码一览（公榜）' }}</button>
        <div v-if="showCodes" class="text-xs mt-1 flex flex-col gap-0.5">
          <div v-for="c in REDEEM_CODES" :key="c.code" class="flex justify-between gap-2">
            <span class="min-w-0"><b class="gold">{{ c.code }}</b> <span class="dim">{{ c.n }}</span></span>
            <span class="shrink-0" :class="g.codesUsed.includes(c.code) ? 'jade' : 'dim2'">{{ g.codesUsed.includes(c.code) ? '✓ 已兑' : '未兑换' }}</span>
          </div>
        </div>
        <div class="text-xs dim2 mt-2 text-center">存档自动保存在浏览器本地，每 15 秒自动落盘。</div>
        <button class="btn w-full mt-2" @click="g.closeModal()">关 闭</button>
      </template>

      <!-- 玩法提要 -->
      <template v-else-if="top.kind === 'guide'">
        <div class="modal-title">玩 法 提 要</div>
        <div class="text-xs dim leading-relaxed">
          <p class="py-0.5">· 挂机涨修为，修为满可突破；大境界突破触发雷劫，需在渡劫中选择应对方式。</p>
          <p class="py-0.5">· 问道长阶（首页）是主线推进器：通关得大礼、每 10 阶永久悟道加成，特定关卡解锁仙途纪事。</p>
          <p class="py-0.5">· 灵脉石用于灵脉挖掘，产出装备与副产物；装备品质 1~16 级，携带随机词条与灵纹。</p>
          <p class="py-0.5">· 六件装备的词条组合可激活 34 种共鸣（详见修炼页「共鸣详情」），是战力核心。</p>
          <p class="py-0.5">· 灵兽提供「给主人的加成」：吞食同种升阶并随机提升一项资质；精怪喂同种升阶。</p>
          <p class="py-0.5">· 坊市摆摊/拍卖/寄售/黑市/以物易物/仙玉阁，是资源循环与变强的重要渠道。</p>
          <p class="py-0.5">· 仙玉来自签到、境界礼包、活跃与运营奖励，可在仙玉阁兑换稀缺物资。</p>
          <p class="py-0.5">· NPC 会真实成长（约 10 分钟一级）并与你竞争天骄榜；论道台需消耗论道帖。</p>
          <p class="py-0.5">· 渡劫有风险，渡劫丹/护道大阵可保平安；主动散功转世保留轮回之力与图鉴。</p>
        </div>
        <button class="btn w-full mt-2" @click="g.closeModal()">关 闭</button>
      </template>

      <!-- 兜底 -->
      <template v-else>
        <div class="modal-title">天机晦暗</div>
        <button class="btn btn-gold w-full" @click="g.closeModal()">关 闭</button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useGame, DAILY_TASKS } from '../stores/game'
import { fmt, fmtTime } from '../core/format'
import { ACTIVITIES, CYCLE_DAYS, ENCOUNTERS, ENC_NAMES, type ActivityDef } from '../data/world'
import { AFFIX_MAP, RUNE_MAP, SLOT_NAMES, equipContrib, qColor, qName } from '../data/qualities'
import { ENH_MAX, enhanceCost } from '../core/equip'
import { MAJOR } from '../data/realms'
import { GOALS, ONLINE_REWARDS } from '../data/meta'
import { MONTH_DAYS, PAY_PACKS, monthReward, newbieReward, realmGift, rewardBrief, type PayPack } from '../data/rewards'
import { STORY, STORY_MAP } from '../data/story'
import { REDEEM_CODES } from '../data/codes'
import { TRAITS, TRAIT_MAP } from '../data/traits'
import { setAudio, setMusic } from '../core/sfx'
import { BEAST_MAP, BEAST_STAGES, BEAST_STAGE_SKILLS } from '../data/items'
import { FAM_MAP, FAM_RARITY, FAMILIARS, famScale } from '../data/familiars'
import { GIFTS, npcLikes } from '../data/gifts'
import { npcPower, npcRealm } from '../core/npc'
import { modLines } from '../core/mods'
import { beastAvgQual, beastGrade, beastOwnerBonus } from '../core/beast'
import { TB_TIER_NAMES, TOWER_BUFF_MAP } from '../data/towerbuffs'
import { TAG_LABEL, TAG_MAP } from '../data/tags'
import type { AffixRoll, Beast, Equip, Npc } from '../types'

const g = useGame()
const top = computed(() => g.modals[0] as { kind: string; data?: unknown } | undefined)
// 镇妖塔增幅三选一选项
const towerOfferDefs = computed(() => ((g.tower.offer?.ids) || []).map(id => TOWER_BUFF_MAP[id]).filter((b): b is NonNullable<typeof b> => !!b))

// —— 战斗逐行播放 ——
const shown = ref(0)
let revealTimer: number | undefined
const battleDone = computed(() => !g.battle || shown.value >= g.battle.log.length)
const battleShown = computed(() => (g.battle ? g.battle.log.slice(0, shown.value) : []))
function stopReveal() { if (revealTimer) { window.clearInterval(revealTimer); revealTimer = undefined } }
function startReveal() {
  stopReveal()
  shown.value = 0
  revealTimer = window.setInterval(() => {
    if (!g.battle || top.value?.kind !== 'battle') { stopReveal(); return }
    shown.value++
    if (shown.value >= g.battle.log.length) stopReveal()
  }, 190)
}
function skipBattle() { shown.value = g.battle?.log.length || 0; stopReveal() }
watch(() => g.battle, b => { if (b && top.value?.kind === 'battle') startReveal() })
watch(top, t => { if (t?.kind === 'battle' && g.battle) startReveal(); else stopReveal() })
onUnmounted(stopReveal)

function d(field: string): unknown {
  const data = (top.value?.data || {}) as Record<string, unknown>
  return data[field]
}

const encDef = computed(() => (g.enc ? ENCOUNTERS.find(e => e.id === g.enc!.id) || null : null))
const encName = computed(() => (encDef.value ? ENC_NAMES[encDef.value.q - 1] : ''))

// —— 模拟充值（假支付流程） ——
const payPackId = computed(() => (top.value?.kind === 'pay' ? String((top.value.data as { id?: string } | undefined)?.id || '') : ''))
const payPack = computed<PayPack | null>(() => PAY_PACKS.find(p => p.id === payPackId.value) || null)
const payIsFirst = computed(() => !!payPack.value?.first && !g.shop.first.includes(payPackId.value))
const payAmount = computed(() => (payPack.value ? payPack.value.n * (payIsFirst.value ? 2 : 1) : 0))
const payFinalAmount = ref(0) // 下单金额快照（防止首充标志消费后回退显示）
const offlineDelta = computed(() => {
  if (top.value?.kind !== 'offline') return ''
  const p = d('prev') as { cult?: number; ls?: number } | undefined
  if (!p || !p.cult) return '首次闭关归来，收益已入账'
  const pctOf = (cur: number, old: number) => old > 0 ? (cur >= old ? '+' : '') + Math.round((cur / old - 1) * 100) + '%' : '—'
  return `较上次闭关：修为 ${pctOf(Number(d('cult')), p.cult)} · 灵石 ${pctOf(Number(d('ls')), p.ls ?? 0)}（战力提升带来的效率变化）`
})
const payStep = ref(0)
const payStepText = computed(() => ['正在连接支付网关…', '等待到账确认…', '交易校验中…'][Math.min(payStep.value, 2)])
let payTimer: number | undefined
function stopPayTimer() { if (payTimer) { window.clearInterval(payTimer); payTimer = undefined } }
watch(payPackId, id => {
  stopPayTimer()
  if (!id) return
  payStep.value = 0
  payFinalAmount.value = payAmount.value
  payTimer = window.setInterval(() => {
    if (top.value?.kind !== 'pay') { stopPayTimer(); return }
    payStep.value++
    if (payStep.value >= 3) { stopPayTimer(); if (payPack.value) g.completePay(payPack.value.id) }
  }, 850)
})
onUnmounted(stopPayTimer)

// —— 抽卡结果 ——
const gachaView = computed(() => {
  const t = top.value
  if (t?.kind !== 'gacha') return null
  return t.data as { results: { r: number; n: string; d: string }[]; pool: 'std' | 'lim' }
})

// —— 仙途纪事 ——
const storyView = computed(() => {
  const t = top.value
  if (t?.kind !== 'story') return null
  return STORY_MAP[String(t.data)] || null
})

// —— 切磋邀约 ——
const duelView = computed<Npc | null>(() => {
  const t = top.value
  if (t?.kind !== 'npcduel') return null
  const id = Number((t.data as { id?: number })?.id)
  return g.npcs.find(n => n.id === id) || null
})
function acceptDuel() { const n = duelView.value; g.closeModal(); if (n) g.duelNpc(n.id) }
function declineDuel() { const n = duelView.value; g.closeModal(); if (n) g.npcDeclineDuel(n.id) }

// —— NPC 详情 ——
const npcView = computed<Npc | null>(() => {
  const t = top.value
  if (t?.kind !== 'npc') return null
  const id = Number(t.data)
  return g.npcs.find(n => n.id === id) || null
})
const likes = computed(() => (npcView.value ? npcLikes(npcView.value.id) : []))
const ownedGifts = computed(() => GIFTS.filter(x => (g.mats[x.id] || 0) > 0))
const giftCount = computed(() => (npcView.value ? g.npcDaily.gift[npcView.value.id] || 0 : 0))
const teachCount = computed(() => (npcView.value ? g.npcDaily.teach[npcView.value.id] || 0 : 0))
const belongings = computed(() => {
  const n = npcView.value
  if (!n) return []
  const pool = ['青霄剑', '玄龟盾', '赤炎珠', '混天绫', '乾坤袋', '玉净瓶', '月华轮', '风灵幡', '金蛟剪', '水龙珠', '紫电锤', '星尘盘']
  const out: string[] = []
  for (let i = 0; i < 3; i++) out.push(pool[(n.id * 7 + i * 5) % pool.length])
  return [...new Set(out)]
})
function realmOf(n: Npc) { return npcRealm(n) }
function powerOf(n: Npc) { return npcPower(n) }
function relName(r: string): string {
  const m: Record<string, string> = { lover: '❤ 道侣', master: '师尊', disciple: '弟子', enemy: '仇敌', friend: '故交', rival: '对手' }
  return m[r] || r
}

// —— 灵兽详情 ——
const beastView = computed<Beast | null>(() => {
  const t = top.value
  if (t?.kind !== 'beast') return null
  const id = Number(t.data)
  return g.beasts.find(b => b.id === id) || null
})
const dups = computed(() => (beastView.value ? g.beasts.filter(b => b.kind === beastView.value!.kind && b.id !== beastView.value!.id) : []))
const beastNeed = computed(() => (beastView.value ? Math.round(10 * Math.pow(1.35, beastView.value.level - 1)) : 10))
const beastGradeTxt = computed(() => (beastView.value ? beastGrade(beastView.value).n : '凡品'))
const beastGradeIdx = computed(() => (beastView.value ? beastGrade(beastView.value).idx : 0))
const beastAvgTxt = computed(() => (beastView.value ? beastAvgQual(beastView.value) : 50))
const beastBonusLines = computed(() => (beastView.value ? beastOwnerBonus(beastView.value, g.derived.stats.beastBonus) : []))
function dupAvg(b: Beast): number { return beastAvgQual(b) }
const beastAdv = computed(() => {
  const b = beastView.value
  if (!b) return { s: 0, l: 0 }
  const stage = b.stage || 0
  return { s: 20 * (stage + 1) * (stage + 1), l: Math.round(3000 * Math.pow(1.5, g.lv) * (stage + 1)) }
})
const beastSkillsText = computed(() => {
  const b = beastView.value
  if (!b) return '无'
  const base = (BEAST_MAP[b.kind]?.procs || []).map(p => p.name)
  const unlocked = BEAST_STAGE_SKILLS.slice(0, b.stage || 0).map(p => p.name)
  return [...base, ...unlocked].join('、') || '无'
})
function qualName(k: string) { return { atk: '攻击资质', def: '防御资质', hp: '气血资质', spd: '速度资质' }[k] || k }
function beastQual(k: string): number {
  const q = beastView.value?.qual
  return q ? Math.round(q[k as 'atk' | 'def' | 'hp' | 'spd']) : 50
}

// —— 精怪详情 ——
const famView = computed(() => {
  const t = top.value
  if (t?.kind !== 'fam') return null
  const id = Number(t.data)
  const f = g.fam.list.find(x => x.id === id)
  if (!f) return null
  const def = FAM_MAP[f.fid] || FAMILIARS[0]
  const scale = famScale(f.level, f.stars)
  return {
    f, def,
    rarity: FAM_RARITY[def.r],
    pct: Math.round(scale * 100),
    on: g.fam.equipped.includes(f.id),
    dupes: g.fam.dupes[f.fid] || 0,
    cost: Math.round(400 * Math.pow(1.32, f.level) * (1 + def.r * 0.6)),
    mods: modLines(def.mods, scale),
  }
})

// —— 装备详情 ——
const itemView = computed<Equip | null>(() => (top.value?.kind === 'item' ? ((top.value.data || null) as Equip | null) : null))
// 是否穿戴于当前出战分身
const isWorn = computed(() => (itemView.value ? g.equipMap[itemView.value.slot] === itemView.value.id : false))
// 若穿在其它分身身上，显示其名（本体/阳神/阴身）
const wornBodyName = computed(() => {
  const it = itemView.value
  if (!it || isWorn.value) return ''
  const b = g.wornBodyOf(it.id)
  return b ? (b === 'main' ? '本体' : b === 'yang' ? '阳神' : '阴身') : ''
})
const inInv = computed(() => (itemView.value ? g.inventory.some(x => x.id === itemView.value!.id) : false))
const slotEq = computed<Equip | null>(() => {
  const it = itemView.value
  if (!it) return null
  const id = g.equipMap[it.slot]
  if (id == null || id === it.id) return null
  return g.inventory.find(x => x.id === id) || null
})
const diff = computed(() => (itemView.value && slotEq.value ? itemView.value.score - slotEq.value.score : 0))
const enhCost = computed(() => {
  if (!itemView.value) return { lingshi: 0, lingmai: 0 }
  const c = enhanceCost(itemView.value)
  return { lingshi: Math.max(1, Math.round(c.lingshi * (1 - g.enhanceDiscount))), lingmai: c.lingmai }
})
const lockCount = computed(() => itemView.value?.locks?.length || 0)
function isLocked(i: number) { return !!itemView.value?.locks?.includes(i) }
function reforgeCostStr(mode: 'value' | 'type'): string {
  return mode === 'value' ? `洗炼石×${3 + lockCount.value * 2}` : `改命石×${1 + lockCount.value}`
}
// —— 与当前穿戴装备的属性差异对比 ——
const CMP_ORDER = ['atk', 'def', 'hp', 'spd', 'crit', 'critDmg', 'combo', 'hit', 'dodge', 'lifesteal', 'reflect', 'armorPen', 'dmgReduce', 'shieldPow', 'qiRegen', 'cdr', 'execute', 'daoyun', 'kalpaFire', 'devour', 'reincarnate', 'stun', 'counter', 'resistStun', 'resistCrit', 'resistCombo', 'resistCounter', 'resistLifesteal', 'allP', 'atkP', 'defP', 'hpP', 'spdP', 'dmgP']
const CMP_PSEUDO: Record<string, string> = { allP: '全属性', atkP: '攻击', defP: '防御', hpP: '气血', spdP: '速度' }
const cmpPct = (k: string) => !!CMP_PSEUDO[k] || !!AFFIX_MAP[k]?.pct
const cmpName = (k: string) => (CMP_PSEUDO[k] ? CMP_PSEUDO[k] + '%' : AFFIX_MAP[k]?.n || k)
function cmpNum(k: string, v: number): string {
  if (v === 0) return '—'
  const sign = v > 0 ? '+' : '-'
  const a = Math.abs(v)
  return sign + (cmpPct(k) ? String(Math.round(a * 10) / 10) : fmt(a)) + (cmpPct(k) ? '%' : '')
}
const cmp = computed(() => {
  const it = itemView.value
  const eq = slotEq.value
  if (!it || !eq) return null
  const a = equipContrib(it)
  const b = equipContrib(eq)
  const rows = CMP_ORDER
    .filter(k => a[k] !== undefined || b[k] !== undefined)
    .map(k => {
      const av = a[k] || 0
      const bv = b[k] || 0
      const d = Math.round((av - bv) * 100) / 100
      return { k, n: cmpName(k), aStr: cmpNum(k, av), bStr: cmpNum(k, bv), d, dStr: cmpNum(k, d), changed: d !== 0 }
    })
    .filter(r => r.changed)
  return { eqName: eq.name, rows }
})
const runeName = computed(() => (itemView.value?.rune ? RUNE_MAP[itemView.value.rune]?.n || '' : ''))
const runeDesc = computed(() => (itemView.value?.rune ? RUNE_MAP[itemView.value.rune]?.desc || '' : ''))
function affixText(a: AffixRoll): string {
  const dd = AFFIX_MAP[a.k]
  return `${dd.n} +${a.v}${dd.pct ? '%' : ''}`
}
function affixName(a: AffixRoll): string {
  return AFFIX_MAP[a.k].n
}
function affixVal(a: AffixRoll): string {
  const dd = AFFIX_MAP[a.k]
  return `+${a.v}${dd.pct ? '%' : ''}`
}
function doEquip() {
  if (itemView.value) { g.equipItem(itemView.value.id); g.closeModal() }
}
function doUnequip() {
  if (itemView.value) { g.unequip(itemView.value.slot); g.closeModal() }
}
function doDiscard() {
  if (itemView.value) { g.discardOne(itemView.value.id); g.closeModal() }
}

function onMask() {
  const k = top.value?.kind
  if (k === 'text' || k === 'offline') g.closeModal()
}

// ================= 运营/设置类弹窗 =================
const TRAITS_COUNT = TRAITS.length
const nowT = ref(Date.now())
const nowTimer = window.setInterval(() => { nowT.value = Date.now() }, 1000)
onUnmounted(() => window.clearInterval(nowTimer))

const nextDay = computed(() => (g.daily.monthCount >= MONTH_DAYS ? 1 : g.daily.monthCount + 1))
function cellCls(d: number): string {
  if (g.daily.monthCount >= MONTH_DAYS) return d === 1 && !g.daily.daySigned ? 'today' : 'done'
  if (d <= g.daily.monthCount) return 'done'
  if (d === g.daily.monthCount + 1 && !g.daily.daySigned) return 'today'
  return 'future'
}
function newbieCls(d: number): string {
  return d <= g.daily.newbieDay ? 'done' : d === g.daily.newbieDay + 1 ? 'today' : 'future'
}
function cycleDay() { return (Date.now() / 86400000) % CYCLE_DAYS }
function isActive(a: ActivityDef) { const d = cycleDay(); return d >= a.s && d < a.e }
function endIn(a: ActivityDef) { return (a.e - cycleDay()) * 86400000 }
function startIn(a: ActivityDef) {
  const d = cycleDay()
  const delta = a.s > d ? a.s - d : CYCLE_DAYS - d + a.s
  return delta * 86400000
}
function onlineCan(i: number) {
  const r = ONLINE_REWARDS[i]
  return g.online.sec >= r.sec && !g.online.got.includes(i)
}
function storyState(sc: { id: string }) {
  if (g.story.done.includes(sc.id)) return 'done'
  return g.storyCtxReady(sc.id) ? 'ready' : 'locked'
}
function traitDef(id: string) { return TRAIT_MAP[id] || { n: '未知', r: 1, desc: '' } }
function traitCls(id: string) {
  const r = traitDef(id).r
  return r === 3 ? 'gold' : r === 2 ? 'jade' : 'dim'
}
const xisuiKey = computed(() => Object.keys(g.pills).find(k => k.startsWith('xisui:') && g.pills[k] > 0) || '')

function toggleMusic() {
  g.settings.music = !g.settings.music
  setMusic(g.settings.music)
}
function toggleAudio() {
  g.settings.audio = !g.settings.audio
  setAudio(g.settings.audio)
}
const expo = ref('')
const imp = ref('')
const codeInput = ref('')
const showCodes = ref(false)
function doRedeem() {
  if (g.redeemCode(codeInput.value)) codeInput.value = ''
}
function doExport() {
  expo.value = g.exportSave()
  g.toast('导出码已生成，请复制妥善保存', 'jade')
}
async function copyExpo() {
  try {
    await navigator.clipboard.writeText(expo.value)
    g.toast('已复制到剪贴板', 'jade')
  } catch {
    g.toast('复制失败，请手动选择复制', 'red')
  }
}
function doImport() {
  const ok = g.importSave(imp.value)
  g.toast(ok ? '存档导入成功！' : '存档码无效', ok ? 'jade' : 'red')
}
function doReset() {
  if (window.confirm('确定重置全部存档？此操作不可恢复（建议先导出备份）。')) {
    g.resetGame()
    g.toast('存档已重置', 'dim')
  }
}
function closeBattle() {
  g.battle = null
  g.closeModal()
}
function closeDemon() {
  g.demon = null
  g.closeModal()
}
</script>
