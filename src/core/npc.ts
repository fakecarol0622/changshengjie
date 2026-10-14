// ===== NPC 模拟：成长 / 战力 / 境界 =====
import type { Npc } from '../types'
import { NPC_DEFS } from '../data/npcs'
import { MAJOR, MINOR, baseAtk, baseDef, baseHp } from '../data/realms'
import { pick, rnd } from './rng'

export function makeNpcs(): Npc[] {
  return NPC_DEFS.map((d, i) => ({
    id: i,
    real: d.real,
    name: d.n,
    sect: d.sect,
    align: d.align,
    flavor: d.flavor,
    level: d.baseLv + rnd() * 0.6,
    growth: d.growth,
    favor: 0,
    hate: 0,
    rel: 'none' as const,
    mateAt: 0,
  }))
}

export function npcRealm(n: Npc): { major: number; minor: number; name: string } {
  const lv = Math.max(0, Math.floor(n.level))
  const major = Math.min(10, Math.floor(lv / 4))
  const minor = lv % 4
  if (major === 0 && minor === 0) return { major, minor, name: '凡人' }
  return { major, minor, name: MAJOR[major] + MINOR[minor] }
}

export function npcPower(n: Npc): number {
  const lv = Math.max(0, Math.floor(n.level))
  const noise = 0.9 + ((n.id * 37) % 25) / 100 // 稳定人格化扰动 0.9~1.14
  // 传承系数：随境界成长并封顶（凡人≈2.6 → 仙人≈4.2），保证高境界 NPC 稳压低境界玩家
  const gear = 2.4 + Math.min(1.4, lv * 0.06) + ((n.id * 53) % 40) / 100
  const raw = baseAtk(lv) * 10 + baseDef(lv) * 6 + baseHp(lv) * 0.9
  return Math.round(raw * gear * noise)
}

// NPC 随时间成长（专注修炼折算）：约 10 分钟一级，高境界成长放缓，离线同样生效
export function growNpcs(npcs: Npc[], dtSec: number): void {
  const units = dtSec / 600
  for (const n of npcs) {
    const slow = 1 - Math.min(0.8, n.level / 62)
    const gain = (units * n.growth * 1.05 * slow) / (1 + n.level / 42)
    n.level = Math.min(48, n.level + gain)
  }
}

// —— 新生代天骄（突破大境界时涌现，参考鬼谷八荒：世界随你变强而新陈代谢） ——
const RIVAL_SUR = ['陆', '江', '秦', '慕容', '上官', '司徒', '南宫', '欧阳', '轩辕', '独孤', '公孙', '南宫', '黎', '楚']
const RIVAL_GIVEN = ['惊鸿', '照雪', '无涯', '拾光', '青冥', '归尘', '听雨', '斩月', '拂衣', '衔烛', '望舒', '长离', '问尘', '临渊']
const RIVAL_DAO = ['散人', '真人', '仙子', '剑客', '居士', '尊者', '上人', '道人', '公子', '老怪']
const RIVAL_SECT = ['散修', '青霄剑宗', '丹霞谷', '幽冥宗', '太虚观', '万兽山', '天工阁']
export function makeRival(lv: number, id: number): Npc {
  const real = pick(RIVAL_SUR) + pick(RIVAL_GIVEN)
  return {
    id,
    real,
    name: real.slice(-2) + pick(RIVAL_DAO),
    sect: pick(RIVAL_SECT),
    align: pick(['正', '魔', '中'] as const),
    flavor: pick(['剑修', '丹修', '魔修', '体修', '御兽', '阵修', '符修', '琴修']),
    level: Math.min(48, lv + 3 + Math.floor(rnd() * 6)),
    growth: 0.95 + rnd() * 0.2,
    favor: 0,
    hate: 0,
    rel: 'none' as const,
    mateAt: 0,
  }
}

// 随机天骄姓名（论道台对手等）
export function rivalName(): string {
  const real = pick(RIVAL_SUR) + pick(RIVAL_GIVEN)
  return real.slice(-2) + pick(RIVAL_DAO)
}
