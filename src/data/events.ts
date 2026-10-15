// ===== 限时活动：与天象轮转周期绑定（游戏月=10天，四段窗口各约2.5天） =====
// 玩法：活动期间完成指定行为积攒「活动代币」→ 在活动商店兑换限时奖励
import type { RewardItem } from './rewards'

export type EvtType = 'mine' | 'dungeon' | 'pvp' | 'breakthrough' | 'meditate' | 'tower' | 'alchemy' | 'harvest' | 'gift' | 'fam'

export const EVT_TYPES: EvtType[] = ['mine', 'dungeon', 'pvp', 'breakthrough', 'meditate', 'tower', 'alchemy', 'harvest', 'gift', 'fam']

export interface EvtTask {
  id: string
  n: string
  type: EvtType
  target: number
  coins: number
}

export interface EvtSku {
  id: string
  n: string
  desc: string
  cost: number
  limit: number
  grant: RewardItem[]
}

export interface EvtDef {
  id: string
  act: string // 对应天象活动 id（tide/beast/wudao/trib）
  n: string
  icon: string
  coin: string
  desc: string
  tasks: EvtTask[]
  shop: EvtSku[]
}

export const EVENTS: EvtDef[] = [
  {
    id: 'lantern', act: 'tide', n: '宝树灯会', icon: '🏮', coin: '灯花',
    desc: '宝树潮涨之年，十二城同放祈天灯。摇落宝树、磨砺自身以集灯花，于灯楼兑换稀珍。',
    tasks: [
      { id: 'lt1', n: '摇落宝树 40 次', type: 'mine', target: 40, coins: 15 },
      { id: 'lt2', n: '通关副本 3 次（含扫荡）', type: 'dungeon', target: 3, coins: 12 },
      { id: 'lt3', n: '闭关打坐 1 次', type: 'meditate', target: 1, coins: 8 },
    ],
    shop: [
      { id: 'ls1', n: '龙髓 ×2', desc: '烛龙脉髓脂，培育加速', cost: 20, limit: 3, grant: [{ t: 'mat', id: 'longsui', n: 2 }] },
      { id: 'ls2', n: '灵露（随境界）', desc: '宝树培育所用材料，数量随主角境界提升', cost: 15, limit: 5, grant: [{ t: 'dynres', id: 'lingmai' }] },
      { id: 'ls3', n: '寻仙令 ×1', desc: '寻仙问道门票', cost: 25, limit: 2, grant: [{ t: 'res', id: 'gachaTicket', n: 1 }] },
      { id: 'ls4', n: '洗练石 ×5', desc: '词条洗练材料', cost: 18, limit: 3, grant: [{ t: 'res', id: 'xilian', n: 5 }] },
    ],
  },
  {
    id: 'beasthunt', act: 'beast', n: '万兽围猎', icon: '🐺', coin: '兽牙',
    desc: '万兽潮落，古林结界松动。猎狩妖兽积攒兽牙，于狩猎营换灵兽珍材。',
    tasks: [
      { id: 'bt1', n: '凝珠化形 1 次', type: 'fam', target: 1, coins: 14 },
      { id: 'bt2', n: '通关副本 4 次（含扫荡）', type: 'dungeon', target: 4, coins: 14 },
      { id: 'bt3', n: '赠礼结交 2 次', type: 'gift', target: 2, coins: 10 },
    ],
    shop: [
      { id: 'bs1', n: '兽魂 ×12', desc: '灵兽进阶材料', cost: 16, limit: 4, grant: [{ t: 'mat', id: 'shouhun', n: 12 }] },
      { id: 'bs2', n: '灵兽蛋（玄品~天品）', desc: '随机品质灵兽蛋', cost: 25, limit: 2, grant: [{ t: 'egg', qmin: 4, qmax: 9 }] },
      { id: 'bs3', n: '妖珠碎片 ×10', desc: '30 枚可凝珠化形', cost: 12, limit: 5, grant: [{ t: 'mat', id: 'yaozhu', n: 10 }] },
      { id: 'bs4', n: '灵液 ×8', desc: '炼丹药引', cost: 12, limit: 4, grant: [{ t: 'mat', id: 'lingye', n: 8 }] },
    ],
  },
  {
    id: 'daoassembly', act: 'wudao', n: '论道大会', icon: '⚔️', coin: '论道令',
    desc: '仙武论道之期，百家争鸣。对局论剑、破境冲关皆得论道令，可在论道堂兑彩。',
    tasks: [
      { id: 'dt1', n: '论道台对局 5 场', type: 'pvp', target: 5, coins: 15 },
      { id: 'dt2', n: '突破境界 2 次', type: 'breakthrough', target: 2, coins: 12 },
      { id: 'dt3', n: '赠礼结交 2 次', type: 'gift', target: 2, coins: 10 },
    ],
    shop: [
      { id: 'ds1', n: '论道帖 ×2', desc: '论道台入场券', cost: 16, limit: 3, grant: [{ t: 'res', id: 'pvpTicket', n: 2 }] },
      { id: 'ds2', n: '改命石 ×1', desc: '逆天改命之石', cost: 22, limit: 2, grant: [{ t: 'res', id: 'gaiming', n: 1 }] },
      { id: 'ds3', n: '仙玉 ×3', desc: '仙界通货', cost: 30, limit: 2, grant: [{ t: 'res', id: 'xianyu', n: 3 }] },
      { id: 'ds4', n: '功法残页 ×3', desc: '参悟功法之用', cost: 15, limit: 3, grant: [{ t: 'mat', id: 'gongfaPage', n: 3 }] },
    ],
  },
  {
    id: 'tribwish', act: 'trib', n: '雷渊祈愿', icon: '⚡', coin: '祈愿星',
    desc: '九天雷渊轰鸣，修士筑坛祈愿。渡劫、炼丹皆落祈愿星，可换渡劫造化。',
    tasks: [
      { id: 'tt1', n: '突破境界 4 次', type: 'breakthrough', target: 4, coins: 16 },
      { id: 'tt2', n: '炼丹出炉 3 次', type: 'alchemy', target: 3, coins: 12 },
      { id: 'tt3', n: '闭关打坐 2 次', type: 'meditate', target: 2, coins: 10 },
    ],
    shop: [
      { id: 'ts1', n: '破障丹（中品）×1', desc: '突破成功率 +12%', cost: 18, limit: 3, grant: [{ t: 'pill', id: 'podan', q: 2, n: 1 }] },
      { id: 'ts2', n: '渡劫丹 ×1', desc: '渡劫减伤', cost: 20, limit: 3, grant: [{ t: 'pill', id: 'dujie', n: 1 }] },
      { id: 'ts3', n: '太初石 ×2', desc: '开天奇石', cost: 14, limit: 4, grant: [{ t: 'mat', id: 'taichu', n: 2 }] },
      { id: 'ts4', n: '灵兽蛋（王品~仙品）', desc: '高品质灵兽蛋', cost: 26, limit: 1, grant: [{ t: 'egg', qmin: 6, qmax: 11 }] },
    ],
  },
]

export function eventFor(actId: string | undefined | null): EvtDef | null {
  if (!actId) return null
  return EVENTS.find(e => e.act === actId) || null
}
