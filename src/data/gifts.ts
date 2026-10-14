// ===== 礼物系统：送 NPC 加好感，投其所好效果翻倍 =====
export const GIFT_TYPES = ['茶', '酒', '书画', '珍宝', '香', '乐'] as const
export type GiftType = (typeof GIFT_TYPES)[number]

export interface GiftDef {
  id: string
  n: string
  type: GiftType
  desc: string
  fav: number // 基础好感
}

export const GIFTS: GiftDef[] = [
  { id: 'lingcha', n: '雨前灵茶', type: '茶', desc: '雾雨山巅采的灵茶，入口生津', fav: 12 },
  { id: 'baihua', n: '百花酿', type: '酒', desc: '以百花酿成的灵酒，醇香扑鼻', fav: 12 },
  { id: 'qinpu', n: '古琴谱', type: '乐', desc: '失传的上古琴曲谱，知音难求', fav: 12 },
  { id: 'minghua', n: '名家画轴', type: '书画', desc: '仙家真迹画轴，意境悠远', fav: 12 },
  { id: 'yupei', n: '玲珑玉佩', type: '珍宝', desc: '温润灵玉所制的随身配饰', fav: 12 },
  { id: 'xianglu', n: '沉云香炉', type: '香', desc: '燃之可静心凝神的古香炉', fav: 12 },
]

export const GIFT_MAP: Record<string, GiftDef> = Object.fromEntries(GIFTS.map(g => [g.id, g]))

// NPC 喜好（按 id 确定性生成，1~2 种）
export function npcLikes(npcId: number): GiftType[] {
  const first = GIFT_TYPES[npcId % GIFT_TYPES.length]
  const arr: GiftType[] = [first]
  if (npcId % 3 !== 0) {
    const second = GIFT_TYPES[(npcId * 5 + 2) % GIFT_TYPES.length]
    if (second !== first) arr.push(second)
  }
  return arr
}

export function giftFavor(def: GiftDef, npcId: number): { gain: number; match: boolean } {
  const match = npcLikes(npcId).includes(def.type)
  return { gain: match ? Math.round(def.fav * 2.5) : def.fav, match }
}
