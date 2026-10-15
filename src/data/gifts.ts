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
  { id: 'xueya', n: '雪芽仙毫', type: '茶', desc: '千年雪顶采的仙茶，澄澈回甘', fav: 15 },
  { id: 'wudao', n: '悟道茶', type: '茶', desc: '饮之易入定，叶脉隐有道纹', fav: 18 },
  { id: 'yunwu', n: '云雾仙芽', type: '茶', desc: '云海特产，茶中极品', fav: 22 },
  { id: 'zuixian', n: '醉仙酿', type: '酒', desc: '百年陈酿，仙人闻香亦醉', fav: 15 },
  { id: 'taiqing', n: '太清玉液', type: '酒', desc: '道门秘传的玉液琼浆', fav: 18 },
  { id: 'wangyou', n: '忘忧醴泉', type: '酒', desc: '一饮忘忧，心怀大畅', fav: 22 },
  { id: 'shanhe', n: '山河真迹', type: '书画', desc: '画圣亲笔，一卷览尽山河', fav: 15 },
  { id: 'wuzi', n: '无字天书', type: '书画', desc: '道心澄澈者可见其上字字浮现', fav: 18 },
  { id: 'luoshenfu', n: '洛神赋残卷', type: '书画', desc: '前朝大家真迹，笔意通神', fav: 22 },
  { id: 'qilinyin', n: '紫金麒麟印', type: '珍宝', desc: '紫金铸就的镇宅宝印', fav: 15 },
  { id: 'jiuqiao', n: '九窍玲珑珠', type: '珍宝', desc: '九窍生辉，藏纳灵气', fav: 18 },
  { id: 'kunwu', n: '昆吾玉璧', type: '珍宝', desc: '昆吾山巅采得的古玉璧', fav: 22 },
  { id: 'anxin', n: '安神龙涎香', type: '香', desc: '龙涎入香，安神三日', fav: 15 },
  { id: 'ningshen', n: '凝神返魂香', type: '香', desc: '古方所制，凝神定魄', fav: 18 },
  { id: 'tianxiang', n: '九天神木香', type: '香', desc: '神木心材所制，燃之通玄', fav: 22 },
  { id: 'guangling', n: '广陵散残谱', type: '乐', desc: '失传名曲的古谱残页', fav: 15 },
  { id: 'tianyin', n: '天音玉笛', type: '乐', desc: '笛声一响，百鸟来朝', fav: 18 },
  { id: 'fengming', n: '凤鸣焦尾琴', type: '乐', desc: '琴起处如凤鸣九霄', fav: 22 },
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
