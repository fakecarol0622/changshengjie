// ===== 宗门数据 =====
import type { Mods } from '../types'

export interface SectDef {
  id: string
  n: string
  path: string
  feature: string
  desc: string
  mods: Mods
}
export const SECTS: SectDef[] = [
  { id: 'qingxiao', n: '青霄剑宗', path: '正道·剑修', feature: '攻击、暴击、破甲', desc: '剑修圣地，山门如剑插云霄，弟子皆修杀伐剑道。', mods: { atkP: 8 } },
  { id: 'danxia', n: '丹霞谷', path: '正道·丹修', feature: '丹药、回复、辅助', desc: '谷中四季丹霞流转，以丹入道，济世救人。', mods: { pillBonus: 20 } },
  { id: 'tiangong', n: '天工阁', path: '中立·器修', feature: '法宝、炼器、防御', desc: '阁中机关万千，以器证道，法宝冠绝天下。', mods: { treasureBonus: 15 } },
  { id: 'wanshou', n: '万兽山', path: '中立·御兽', feature: '灵兽、召唤、持续伤害', desc: '万兽同鸣之山，驯兽为友，兽魂护道。', mods: { beastBonus: 20 } },
  { id: 'youming', n: '幽冥宗', path: '魔道·魔修', feature: '吸血、斩杀、高风险', desc: '幽冥深处宗门，修血煞之道，亦正亦邪。', mods: { lifestealAdd: 3 } },
  { id: 'taixu', n: '太虚观', path: '正道·阵修', feature: '阵法、护盾、控制', desc: '观中星斗为阵，以阵御敌，万法不侵。', mods: { dmgReduceAdd: 3 } },
]
// 新操作传 ID，旧存档及共鸣保存显示名；两种键均可解析。
export const SECT_MAP: Record<string, SectDef> = Object.fromEntries(SECTS.flatMap(s => [[s.id, s], [s.n, s]]))

export interface RankDef { n: string; contrib: number; realm: number; phase: number; tenure: number; disc: number }
// 第20批：晋升三门槛 —— 贡献 + 境界（含小境界）+ 任期（天）；宗门任务/突破后自动触发考核
// 说明：贡献收入随职位提升（任务×1+0.8×职位），境界与任期才是真正的硬门槛
export const RANKS: RankDef[] = [
  { n: '杂役弟子', contrib: 0, realm: 0, phase: 0, tenure: 0, disc: 1 },
  { n: '外门弟子', contrib: 300, realm: 0, phase: 1, tenure: 1, disc: 0.95 },
  { n: '内门弟子', contrib: 1200, realm: 1, phase: 2, tenure: 1, disc: 0.9 },
  { n: '真传弟子', contrib: 4000, realm: 2, phase: 2, tenure: 2, disc: 0.85 },
  { n: '核心弟子', contrib: 12000, realm: 3, phase: 2, tenure: 3, disc: 0.8 },
  { n: '长老', contrib: 40000, realm: 5, phase: 0, tenure: 4, disc: 0.7 },
  { n: '峰主', contrib: 150000, realm: 7, phase: 0, tenure: 5, disc: 0.6 },
  { n: '掌门', contrib: 600000, realm: 9, phase: 0, tenure: 7, disc: 0.5 },
]

// 宗门商店（贡献兑换）
export interface SectShopItem { id: string; n: string; price: number; kind: string; amount: number; minRank: number }
export const SECT_SHOP: SectShopItem[] = [
  { id: 's_lingmai', n: '灵露×30', price: 60, kind: 'lingmai', amount: 30, minRank: 0 },
  { id: 's_lingshi', n: '灵石×2000', price: 50, kind: 'lingshi', amount: 2000, minRank: 0 },
  { id: 's_xilian', n: '洗练石×5', price: 120, kind: 'xilian', amount: 5, minRank: 1 },
  { id: 's_gongming', n: '共鸣石×5', price: 120, kind: 'gongming', amount: 5, minRank: 1 },
  { id: 's_page', n: '功法残页×2', price: 200, kind: 'gongfaPage', amount: 2, minRank: 2 },
  { id: 's_frag', n: '法宝碎片×5', price: 250, kind: 'fabaoPiece', amount: 5, minRank: 2 },
  { id: 's_egg', n: '灵兽蛋（随机品质）', price: 300, kind: 'egg', amount: 1, minRank: 2 },
  { id: 's_podan', n: '破障丹（上品）', price: 400, kind: 'pill_podan', amount: 1, minRank: 3 },
  { id: 's_equip', n: '宗门专属装备（紫品以上）', price: 500, kind: 'sectEquip', amount: 1, minRank: 3 },
  { id: 's_zhibao', n: '至宝碎片×1', price: 1500, kind: 'zhibaoPiece', amount: 1, minRank: 5 },
]

// 宗门任务
export interface SectTask { n: string; desc: string; contrib: [number, number] }
export const SECT_DAILY_TASKS: SectTask[] = [
  { n: '巡逻山门', desc: '沿山门巡查一周，驱散宵小', contrib: [10, 30] },
  { n: '采集灵草', desc: '为丹房采集山间灵草', contrib: [10, 30] },
  { n: '护送物资', desc: '护送宗门物资前往坊市', contrib: [10, 30] },
  { n: '指点师弟', desc: '为新入门的师弟解惑', contrib: [10, 30] },
  { n: '炼制丹药', desc: '协助丹房炼制一炉丹药', contrib: [10, 30] },
  { n: '修复阵法', desc: '修补护山大阵的残损阵纹', contrib: [10, 30] },
]
export const SECT_WEEKLY_TASKS: SectTask[] = [
  { n: '宗门大比', desc: '登台比试，扬我宗威', contrib: [100, 300] },
  { n: '清剿魔修', desc: '荡平盘踞山下的魔修据点', contrib: [100, 300] },
  { n: '探索秘境', desc: '入宗门秘境探寻机缘', contrib: [100, 300] },
  { n: '贡献灵材', desc: '上交一份珍稀灵材', contrib: [100, 300] },
]
