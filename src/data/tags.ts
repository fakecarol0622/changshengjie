// ===== 铭纹（Tag）：品质 10+ 的高品装备携带的道纹，铭纹之间可互相共鸣 =====
import { rnd, weighted } from '../core/rng'

export interface TagDef { id: string; n: string; d: string; w: number } // n 单字名 / d 释义 / w 生成权重

export const TAGS: TagDef[] = [
  { id: 'flame', n: '炎', d: '烈焰之铭，焚尽万物', w: 10 },
  { id: 'frost', n: '寒', d: '玄冰之铭，霜封千里', w: 10 },
  { id: 'thunder', n: '雷', d: '惊雷之铭，雷霆万钧', w: 10 },
  { id: 'wind', n: '风', d: '罡风之铭，御风而行', w: 10 },
  { id: 'stone', n: '岩', d: '磐岩之铭，不动如山', w: 10 },
  { id: 'shadow', n: '幽', d: '幽影之铭，形如鬼魅', w: 10 },
  { id: 'star', n: '星', d: '星辉之铭，引动周天星辰', w: 5 },
  { id: 'dragon', n: '龙', d: '烛龙之铭，龙威镇世（稀有）', w: 3 },
]

export const TAG_MAP: Record<string, TagDef> = Object.fromEntries(TAGS.map(t => [t.id, t]))
export const TAG_LABEL = (id: string) => `铭·${TAG_MAP[id]?.n || id}`

// 高品装备随品级携带铭纹：10~12 品 1 条；13~15 品 1~2 条；16 品 2 条；低品不携带
export function rollEquipTags(q: number): string[] {
  if (q < 10) return []
  const n = q >= 16 ? 2 : q >= 13 ? (rnd() < 0.35 ? 2 : 1) : 1
  const out: string[] = []
  for (let i = 0; i < n; i++) {
    const pool = TAGS.filter(t => !out.includes(t.id))
    if (!pool.length) break
    out.push(weighted(pool.map(t => ({ w: t.w, v: t.id }))))
  }
  return out
}
