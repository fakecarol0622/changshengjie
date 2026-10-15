// ===== 礼包码（单机版：每个存档每码限兑一次，兑换记录存于存档内） =====
import type { RewardItem } from './rewards'

export interface RedeemCode {
  code: string
  n: string // 礼包名
  grant: RewardItem[]
}

export const REDEEM_CODES: RedeemCode[] = [
  {
    code: 'CHANGSHENG', n: '开山礼',
    grant: [{ t: 'res', id: 'xianyu', n: 100 }, { t: 'res', id: 'gachaTicket', n: 5 }, { t: 'res', id: 'lingshi', n: 20000 }],
  },
  {
    code: 'XIANDAO666', n: '仙道六六六',
    grant: [{ t: 'res', id: 'xianyu', n: 88 }, { t: 'res', id: 'gachaTicket', n: 3 }],
  },
  {
    code: 'WENDAO888', n: '问道发发发',
    grant: [{ t: 'res', id: 'xianyu', n: 128 }, { t: 'egg', qmin: 6, qmax: 8 }],
  },
  {
    code: 'LINGMAI999', n: '宝树久久久',
    grant: [{ t: 'res', id: 'lingmai', n: 300 }, { t: 'res', id: 'lingshi', n: 50000 }],
  },
  {
    code: 'DAOYOU520', n: '道友同心',
    grant: [{ t: 'res', id: 'xianyu', n: 52 }, { t: 'mat', id: 'yaozhu', n: 15 }, { t: 'res', id: 'gachaTicket', n: 2 }],
  },
  {
    code: 'QIXIAN7', n: '奇仙缘',
    grant: [{ t: 'res', id: 'gachaTicket', n: 10 }],
  },
  {
    code: 'GAIMING3', n: '改命三石',
    grant: [{ t: 'res', id: 'gaiming', n: 3 }, { t: 'res', id: 'xilian', n: 10 }],
  },
  {
    code: 'LUNDAO5', n: '论道五帖',
    grant: [{ t: 'res', id: 'pvpTicket', n: 5 }, { t: 'res', id: 'xianyu', n: 66 }],
  },
  {
    code: 'SHOUYUE', n: '首月福利',
    grant: [{ t: 'res', id: 'xianyu', n: 300 }, { t: 'res', id: 'xilian', n: 20 }, { t: 'res', id: 'gongming', n: 20 }],
  },
  {
    code: 'XINCHUN2026', n: '新春贺岁',
    grant: [{ t: 'res', id: 'xianyu', n: 200 }, { t: 'equip', qmin: 10, qmax: 12 }, { t: 'res', id: 'gachaTicket', n: 5 }],
  },
]
